<?php

namespace Tests\Feature;

use App\Models\CareSchedule;
use App\Models\Plant;
use App\Models\User;
use App\Services\TranslationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlantCareTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->setEnv('OPENROUTER_API_KEY', 'test-openrouter');
        // Canary: if any code still used the Gemini key it would call Google and fail the tests
        $this->setEnv('GEMINI_API_KEY', 'must-not-be-used');
        Http::preventStrayRequests();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function setEnv(string $key, string $value): void
    {
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    private function makePlant(array $attributes = [], array $schedule = []): Plant
    {
        $plant = Plant::create(array_merge([
            'user_id' => $this->user->id,
            'name' => 'Snake Plant',
            'scientific_name' => 'Dracaena trifasciata',
            'image_url' => '/storage/plants/test.jpg',
            'api_data' => ['name' => 'Snake Plant', 'scientific_name' => 'Dracaena trifasciata'],
            'added_at' => now(),
        ], $attributes));

        CareSchedule::create(array_merge([
            'plant_id' => $plant->id,
            'watering_interval_days' => 7,
            'next_watering_date' => Carbon::now()->addDays(7),
        ], $schedule));

        return $plant;
    }

    private function openRouterText(string $text): array
    {
        return ['choices' => [['message' => ['content' => $text]]]];
    }

    // ── schedules ──────────────────────────────────────────────────────────────

    public function test_watering_records_now_as_last_watered_not_the_next_date(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/water")->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertTrue($schedule->last_watered_date->lte(now()->addMinute()), 'last_watered_date must be ~now');
        $this->assertTrue($schedule->last_watered_date->gte(now()->subMinute()));
        $this->assertEqualsWithDelta(7, now()->diffInDays($schedule->next_watering_date, false), 1);
    }

    public function test_fertilizing_records_now_as_last_fertilized_and_schedules_next(): void
    {
        $plant = $this->makePlant([], ['fertilizing_interval_days' => 21]);

        $this->putJson("/api/plants/{$plant->id}/fertilize")->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertTrue($schedule->last_fertilized_date->lte(now()->addMinute()));
        $this->assertTrue($schedule->last_fertilized_date->gte(now()->subMinute()));
        $this->assertEqualsWithDelta(21, now()->diffInDays($schedule->next_fertilizing_date, false), 1);
    }

    public function test_updating_two_intervals_does_not_stack_the_dates(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/schedule", [
            'watering_interval_days' => 5,
            'fertilizing_interval_days' => 30,
        ])->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertEqualsWithDelta(5, now()->diffInDays($schedule->next_watering_date, false), 1);
        $this->assertEqualsWithDelta(30, now()->diffInDays($schedule->next_fertilizing_date, false), 1);
    }

    public function test_changing_the_watering_interval_counts_from_the_last_watering(): void
    {
        $plant = $this->makePlant([], [
            'last_watered_date' => Carbon::now()->subDays(3),
            'next_watering_date' => Carbon::now()->addDays(4),
        ]);

        // "My plant is in my room, it needs water every 10 days, not 7"
        $this->putJson("/api/plants/{$plant->id}/schedule", ['watering_interval_days' => 10])->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertSame(10, $schedule->watering_interval_days);
        $this->assertEqualsWithDelta(7, now()->diffInDays($schedule->next_watering_date, false), 1);
    }

    public function test_shortening_the_interval_below_the_days_since_last_watering_makes_it_overdue(): void
    {
        $plant = $this->makePlant([], ['last_watered_date' => Carbon::now()->subDays(6)]);

        $this->putJson("/api/plants/{$plant->id}/schedule", ['watering_interval_days' => 2])->assertOk();

        $this->assertTrue($plant->careSchedule()->first()->next_watering_date->isPast());
    }

    public function test_the_user_can_pick_the_exact_next_day_for_each_task(): void
    {
        $plant = $this->makePlant([], ['last_watered_date' => Carbon::now()->subDays(3)]);
        $day = Carbon::now()->addDays(5)->toDateString();
        $tillDay = Carbon::now()->addDays(40)->toDateString();

        $this->putJson("/api/plants/{$plant->id}/schedule", [
            'watering_interval_days' => 10,
            'next_watering_date' => $day,
            'next_fertilizing_date' => $day,
            'next_tilling_date' => $tillDay,
        ])->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertSame(10, $schedule->watering_interval_days);
        // the chosen day wins over last_watered + interval (which would be 7 days out)
        $this->assertSame($day, $schedule->next_watering_date->toDateString());
        $this->assertSame($day, $schedule->next_fertilizing_date->toDateString());
        $this->assertSame($tillDay, $schedule->next_tilling_date->toDateString());
    }

    public function test_next_day_must_be_a_real_date_and_not_in_the_past(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/schedule", ['next_watering_date' => '2020-01-01'])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['next_watering_date' => 'soon'])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['next_watering_date' => Carbon::now()->toDateString()])->assertOk();
    }

    public function test_last_watered_before_installing_the_app_moves_the_next_day(): void
    {
        $plant = $this->makePlant(); // interval 7, nothing recorded yet
        $last = Carbon::now()->subDays(5)->toDateString();

        $this->putJson("/api/plants/{$plant->id}/schedule", ['last_watered_date' => $last])->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertSame($last, $schedule->last_watered_date->toDateString());
        // watered 5 days ago, every 7 days => due in 2 days (not 7 from today)
        $this->assertSame(Carbon::now()->addDays(2)->toDateString(), $schedule->next_watering_date->toDateString());
    }

    public function test_last_done_and_interval_combine_and_an_explicit_next_day_still_wins(): void
    {
        $plant = $this->makePlant();
        $last = Carbon::now()->subDays(3)->toDateString();

        $this->putJson("/api/plants/{$plant->id}/schedule", [
            'last_fertilized_date' => $last,
            'fertilizing_interval_days' => 14,
            'last_tilled_date' => $last,
            'next_tilling_date' => Carbon::now()->addDays(60)->toDateString(),
        ])->assertOk();

        $schedule = $plant->careSchedule()->first();
        $this->assertSame(Carbon::now()->addDays(11)->toDateString(), $schedule->next_fertilizing_date->toDateString());
        $this->assertSame(Carbon::now()->addDays(60)->toDateString(), $schedule->next_tilling_date->toDateString());
        $this->assertSame($last, $schedule->last_tilled_date->toDateString());
    }

    public function test_last_done_dates_must_be_real_recent_and_not_in_the_future(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/schedule", ['last_watered_date' => Carbon::now()->addDays(5)->toDateString()])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['last_watered_date' => Carbon::now()->subYears(3)->toDateString()])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['last_watered_date' => 'yesterday-ish'])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['last_watered_date' => Carbon::now()->toDateString()])->assertOk();
    }

    public function test_schedule_intervals_are_validated(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/schedule", ['watering_interval_days' => 0])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['watering_interval_days' => 91])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/schedule", ['watering_interval_days' => 90])->assertOk();
    }

    public function test_environment_is_saved_and_can_be_cleared(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/environment", ['light_level' => 'low', 'humidity_level' => 'high'])
            ->assertOk()
            ->assertJsonPath('plant.light_level', 'low')
            ->assertJsonPath('plant.humidity_level', 'high');
        $this->assertNotNull($plant->fresh()->environment_updated_at);

        // only the sent field changes
        $this->putJson("/api/plants/{$plant->id}/environment", ['light_level' => null])->assertOk();
        $fresh = $plant->fresh();
        $this->assertNull($fresh->light_level);
        $this->assertSame('high', $fresh->humidity_level);
    }

    public function test_environment_rejects_unknown_levels_and_other_users_plants(): void
    {
        $plant = $this->makePlant();

        $this->putJson("/api/plants/{$plant->id}/environment", ['light_level' => 'blinding'])->assertStatus(422);
        $this->putJson("/api/plants/{$plant->id}/environment", ['humidity_level' => 'soaked'])->assertStatus(422);

        Sanctum::actingAs(User::factory()->create());
        $this->putJson("/api/plants/{$plant->id}/environment", ['light_level' => 'low'])->assertStatus(404);
    }

    public function test_environment_needs_are_looked_up_once_and_cached(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText(
                '{"light_min":"bright","light_max":"direct","humidity_min":"low","humidity_max":"low","light_tip":"Give it a sunny south window.","light_tip_ar":"ضعها في نافذة جنوبية مشمسة.","humidity_tip":"Dry air is fine.","humidity_tip_ar":"الهواء الجاف مناسب."}'
            )),
        ]);
        $plant = $this->makePlant(['name' => 'Aloe Vera']);

        $response = $this->postJson("/api/plants/{$plant->id}/environment-needs")->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertFalse($response->json('cached'));
        $this->assertSame('bright', $response->json('data.light_min'));
        $this->assertSame('direct', $response->json('data.light_max'));
        $this->assertSame('low', $response->json('data.humidity_max'));
        $this->assertSame('الهواء الجاف مناسب.', $response->json('data.humidity_tip_ar'));
        $this->assertSame('bright', $plant->fresh()->environment_needs['light_min']);

        Http::fake(['openrouter.ai/*' => Http::response([], 500)]);
        $again = $this->postJson("/api/plants/{$plant->id}/environment-needs")->assertOk();
        $this->assertTrue($again->json('cached'));
    }

    public function test_environment_needs_fix_swapped_ranges_and_(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText(
                '{"light_min":"direct","light_max":"medium","humidity_min":"HIGH ","humidity_max":"medium","light_tip":"x","humidity_tip":"y"}'
            )),
        ]);
        $plant = $this->makePlant();
        $data = $this->postJson("/api/plants/{$plant->id}/environment-needs")->assertOk()->json('data');
        $this->assertSame('medium', $data['light_min']);
        $this->assertSame('direct', $data['light_max']);
        $this->assertSame('medium', $data['humidity_min']);
        $this->assertSame('high', $data['humidity_max']);

    }

    public function test_environment_needs_with_an_unknown_level_are_not_saved(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText('{"light_min":"blinding","light_max":"direct","humidity_min":"low","humidity_max":"low"}'))]);
        $plant = $this->makePlant();

        $this->postJson("/api/plants/{$plant->id}/environment-needs")->assertStatus(502)->assertJsonPath('success', false);
        $this->assertNull($plant->fresh()->environment_needs);
    }

    public function test_listing_plants_backfills_a_fertilizing_schedule_like_watering(): void
    {
        $plant = $this->makePlant();
        $this->assertNull($plant->careSchedule()->first()->next_fertilizing_date);

        $response = $this->getJson('/api/plants')->assertOk();

        $next = $response->json('0.care_schedule.next_fertilizing_date');
        $this->assertNotNull($next);
        $this->assertTrue(Carbon::parse($next)->isFuture());
    }

    // ── identification cross-check (PlantController::resolveIdentificationConfidence) ──────────
    // PlantNet uses raw cURL (not Laravel's Http client), so it can't be Http::fake()'d — these
    // test the pure decision logic directly via reflection instead, same approach as the
    // ReverifyLowConfidencePlants command's own tested-by-inspection design.

    private function resolveIdentificationConfidence(array $primary, ?array $secondOpinion): array
    {
        $controller = app(\App\Http\Controllers\API\PlantController::class);
        $method = new \ReflectionMethod($controller, 'resolveIdentificationConfidence');
        $method->setAccessible(true);
        return $method->invoke($controller, $primary, $secondOpinion);
    }

    public function test_cross_check_agreement_raises_confidence_past_the_uncertain_threshold(): void
    {
        $primary = ['name' => 'Pothos', 'scientific_name' => 'Epipremnum aureum', 'confidence' => 0.45, 'raw_data' => []];
        $secondOpinion = ['name' => 'Golden Pothos', 'scientific_name' => 'Epipremnum pinnatum', 'confidence' => 0.8];

        $result = $this->resolveIdentificationConfidence($primary, $secondOpinion);

        $this->assertGreaterThanOrEqual(0.5, $result['confidence'], 'must clear the app-wide "uncertain identification" warning bar');
        $this->assertTrue($result['raw_data']['cross_checked']);
    }

    public function test_cross_check_disagreement_forces_confidence_below_the_uncertain_threshold(): void
    {
        // Real production case: a pothos-like plant identified as Philodendron hederaceum var
        // kirkbridei — the second opinion (correctly) disagrees.
        $primary = ['name' => 'Philodendron Hederaceum Var Kirkbridei', 'scientific_name' => 'Philodendron hederaceum var kirkbridei', 'confidence' => 0.45, 'raw_data' => []];
        $secondOpinion = ['name' => 'Golden Pothos', 'scientific_name' => 'Epipremnum aureum', 'confidence' => 0.85];

        $result = $this->resolveIdentificationConfidence($primary, $secondOpinion);

        $this->assertLessThan(0.5, $result['confidence'], 'must trip the app-wide "uncertain identification" warning');
        $this->assertTrue($result['raw_data']['cross_check_disagreement']);
        // Disagreement must not silently swap in the second opinion as if it were confirmed fact.
        $this->assertSame('Philodendron hederaceum var kirkbridei', $result['scientific_name']);
    }

    public function test_cross_check_treats_same_genus_different_species_as_agreement(): void
    {
        $primary = ['name' => 'Snake Plant', 'scientific_name' => 'Dracaena hyacinthoides', 'confidence' => 0.5, 'raw_data' => []];
        $secondOpinion = ['name' => 'Snake Plant', 'scientific_name' => 'Dracaena trifasciata', 'confidence' => 0.9];

        $result = $this->resolveIdentificationConfidence($primary, $secondOpinion);

        $this->assertGreaterThanOrEqual(0.5, $result['confidence']);
        $this->assertTrue($result['raw_data']['cross_checked']);
    }

    public function test_missing_second_opinion_leaves_primary_result_untouched(): void
    {
        $primary = ['name' => 'Snake Plant', 'scientific_name' => 'Dracaena trifasciata', 'confidence' => 0.55, 'raw_data' => []];

        $result = $this->resolveIdentificationConfidence($primary, null);

        $this->assertSame(0.55, $result['confidence']);
        $this->assertArrayNotHasKey('cross_checked', $result['raw_data']);
    }

    // ── names ─────────────────────────────────────────────────────────────────

    public function test_scientific_name_is_replaced_with_english_and_arabic_common_names(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response(
                $this->openRouterText('{"en":"fiddle leaf fig","ar":"تين كمان"}')
            ),
        ]);
        $plant = $this->makePlant([
            'name' => 'Ficus lyrata',
            'scientific_name' => 'Ficus lyrata',
            'api_data' => ['name' => 'Ficus lyrata', 'scientific_name' => 'Ficus lyrata'],
        ]);

        $response = $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Fiddle Leaf Fig', $response->json('name'));
        $this->assertSame('Fiddle Leaf Fig', $response->json('api_data.name'));
        $this->assertSame('تين كمان', $response->json('api_data.name_ar'));
        $this->assertSame('Ficus lyrata', $response->json('scientific_name'));
        $this->assertSame('Fiddle Leaf Fig', $plant->fresh()->name);
    }

    public function test_arabic_text_stored_in_the_english_name_is_moved_to_name_ar(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText('Aloe Vera')),
        ]);
        $plant = $this->makePlant([
            'name' => 'الصبار',
            'scientific_name' => null,
            'api_data' => ['name' => 'الصبار'],
        ]);

        $response = $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Aloe Vera', $response->json('name'));
        $this->assertSame('الصبار', $response->json('api_data.name_ar'));
    }

    public function test_missing_arabic_name_is_backfilled_without_touching_a_good_english_name(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText('سنسفيريا')),
        ]);
        $plant = $this->makePlant();

        $response = $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Snake Plant', $response->json('name'));
        $this->assertSame('سنسفيريا', $response->json('api_data.name_ar'));
    }

    public function test_name_resolution_never_calls_google_even_if_a_gemini_key_is_set(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText('{"en":"Peace Lily","ar":"زنبق السلام"}'))]);
        $plant = $this->makePlant([
            'name' => 'Spathiphyllum wallisii',
            'scientific_name' => 'Spathiphyllum wallisii',
            'api_data' => ['name' => 'Spathiphyllum wallisii'],
        ]);

        $response = $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Peace Lily', $response->json('name'));
        $this->assertSame('زنبق السلام', $response->json('api_data.name_ar'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'generativelanguage.googleapis.com'));
        Http::assertSent(fn ($request) => str_contains($request->url(), 'openrouter.ai'));
    }

    public function test_plant_details_come_from_openrouter_without_any_gemini_key(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText(
            "Sure! Here it is:\n```json\n{\"description\":\"A tropical vine\",\"watering\":\"Weekly\",\"care_tips\":\"Bright light\"}\n```"
        ))]);

        $details = app(\App\Services\GeminiService::class)->getPlantDetails('Pothos', 'en');

        $this->assertSame('A tropical vine', $details['description']);
        $this->assertSame('Weekly', $details['watering']);
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'generativelanguage.googleapis.com'));
    }

    public function test_bilingual_details_and_diseases_use_openrouter_and_survive_a_rate_limited_model(): void
    {
        Http::fake(['openrouter.ai/*' => Http::sequence()
            ->push([], 429) // first model rate limited -> next model
            ->push($this->openRouterText('{"diseases":[{"name":"Root rot"}],"nutrition":{"fertilizer_type":"NPK"}}'))
            ->push($this->openRouterText('{"diseases":[{"name":"تعفن الجذور"}],"nutrition":{"fertilizer_type":"NPK"}}')),
        ]);

        $both = app(\App\Services\GeminiService::class)->getBilingualDiseasesAndNutrition('Pothos');

        $this->assertSame('Root rot', $both['en']['diseases'][0]['name']);
        $this->assertSame('تعفن الجذور', $both['ar']['diseases'][0]['name']);
    }

    public function test_service_returns_null_instead_of_throwing_when_openrouter_is_down(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response('boom', 500)]);

        $this->assertNull(app(\App\Services\GeminiService::class)->getPlantDetails('Pothos', 'ar'));
    }

    public function test_failed_identification_is_an_error_not_a_generic_common_houseplant(): void
    {
        // Regression guard for the removed fallback: with everything failing the app must get
        // identification_failed (503), never a saved "Common Houseplant".
        Storage::fake('public');
        Http::fake(['*' => Http::response([], 500)]);
        $before = Plant::count();

        $this->postJson('/api/plants', ['image' => \Illuminate\Http\UploadedFile::fake()->image('p.jpg')])
            ->assertStatus(503)->assertJsonPath('error', 'identification_failed');

        $this->assertSame($before, Plant::count());
    }

    public function test_adding_a_plant_validates_the_optional_last_watered_date(): void
    {
        Storage::fake('public');
        Http::fake(['*' => Http::response([], 500)]);
        $image = fn () => \Illuminate\Http\UploadedFile::fake()->image('p.jpg');

        // rejected before any identification work is done
        $this->postJson('/api/plants', ['image' => $image(), 'last_watered_date' => Carbon::now()->addDays(9)->toDateString()])
            ->assertStatus(422)->assertJsonValidationErrors('last_watered_date');
        $this->postJson('/api/plants', ['image' => $image(), 'last_watered_date' => 'last tuesday'])
            ->assertStatus(422)->assertJsonValidationErrors('last_watered_date');

        // a valid past day (or no day at all) passes validation and proceeds to identification
        $this->postJson('/api/plants', ['image' => $image(), 'last_watered_date' => Carbon::now()->subDays(4)->toDateString()])
            ->assertStatus(503)->assertJsonPath('error', 'identification_failed');
        $this->postJson('/api/plants', ['image' => $image()])
            ->assertStatus(503)->assertJsonPath('error', 'identification_failed');
    }

    public function test_ai_name_that_belongs_to_a_lookalike_species_is_rejected(): void
    {
        // Real production case: "Lepechinia meyenii" was renamed "Maca" (that is Lepidium meyenii)
        \App\Models\PlantEncyclopedia::create([
            'slug' => 'peruvian-ginseng', 'name' => 'Peruvian-ginseng', 'scientific_name' => 'Lepidium meyenii',
            'common_names' => ['maca', 'Peruvian-ginseng'],
        ]);
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText('{"en":"Maca","ar":"ماكا"}')),
        ]);
        $plant = $this->makePlant([
            'name' => 'Lepechinia meyenii',
            'scientific_name' => 'Lepechinia meyenii',
            'api_data' => ['name' => 'Lepechinia meyenii', 'scientific_name' => 'Lepechinia meyenii'],
        ]);

        $response = $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Lepechinia meyenii', $response->json('name'), 'wrong common name must not replace the Latin name');
    }

    public function test_encyclopedia_fallback_takes_only_the_first_name_of_a_multi_name_string(): void
    {
        // Real production data: the encyclopedia stores "Pothos, Scindapsus Doré, Liane Du Diable, ..." as one name
        \App\Models\PlantEncyclopedia::create([
            'slug' => 'pothos', 'name' => 'Pothos, Scindapsus Doré, Liane Du Diable, Arum Grimpant',
            'scientific_name' => 'Epipremnum aureum',
        ]);
        Http::fake(['*' => Http::response([], 500)]); // AI unavailable -> fallback path
        $plant = $this->makePlant([
            'name' => 'Epipremnum aureum', 'scientific_name' => 'Epipremnum aureum',
            'api_data' => ['name' => 'Epipremnum aureum'],
        ]);

        $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Pothos', $plant->fresh()->name);
    }

    public function test_foreign_script_or_accented_names_are_never_used_as_english_names(): void
    {
        foreach (['កំពីងពួយគោក ឬផ្កាតាំងយូ', 'Vågbladskalatea'] as $i => $junk) {
            \App\Models\PlantEncyclopedia::create([
                'slug' => "junk-$i", 'name' => $junk, 'scientific_name' => "Genus junk$i",
            ]);
            Http::fake(['*' => Http::response([], 500)]);
            $plant = $this->makePlant([
                'name' => "Genus junk$i", 'scientific_name' => "Genus junk$i",
                'api_data' => ['name' => "Genus junk$i"],
            ]);

            $this->getJson("/api/plants/{$plant->id}")->assertOk();

            $this->assertSame("Genus junk$i", $plant->fresh()->name, "'$junk' must not replace the Latin name");
        }
    }

    public function test_english_name_casing_keeps_hyphenated_words_lowercase(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText('{"en":"bird-of-paradise","ar":"عصفور الجنة"}')),
        ]);
        $plant = $this->makePlant([
            'name' => 'Strelitzia reginae', 'scientific_name' => 'Strelitzia reginae',
            'api_data' => ['name' => 'Strelitzia reginae'],
        ]);

        $this->getJson("/api/plants/{$plant->id}")->assertOk();

        $this->assertSame('Bird-of-paradise', $plant->fresh()->name);
    }

    public function test_arabic_response_does_not_machine_translate_name_fields(): void
    {
        $data = ['name' => 'Cactus', 'name_ar' => 'صبار', 'common_names' => ['Cactus'], 'scientific_name' => 'Cactaceae'];

        $out = app(TranslationService::class)->translatePlantData($data, 'ar');

        $this->assertSame($data, $out);
    }

    // ── health check & treatment ──────────────────────────────────────────────

    public function test_health_check_parses_fenced_json_and_drops_null_notes(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('plants/test.jpg', 'fake-image');
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText(
                "Here is the analysis:\n```json\n{\"health_status\":\"sick\",\"health_notes_en\":\"Brown leaf spots\",\"health_notes_ar\":\"null\"}\n```"
            )),
        ]);
        $plant = $this->makePlant();

        $response = $this->postJson("/api/plants/{$plant->id}/check-health", ['language' => 'ar'])->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertSame('sick', $response->json('health_status'));
        $notes = json_decode($response->json('health_notes'), true);
        $this->assertSame('Brown leaf spots', $notes['en']);
        $this->assertSame('Brown leaf spots', $notes['ar'], 'a "null" Arabic note falls back to English');
    }

    public function test_healthy_plant_stores_no_notes_instead_of_json_with_two_nulls(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('plants/test.jpg', 'fake-image');
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText(
            '{"health_status":"healthy","health_notes_en":null,"health_notes_ar":"null"}'
        ))]);
        $plant = $this->makePlant();

        $response = $this->postJson("/api/plants/{$plant->id}/check-health")->assertOk();

        $this->assertSame('healthy', $response->json('health_status'));
        $this->assertNull($response->json('health_notes'), 'no raw {"en":null,"ar":null} for the website to print');
        $this->assertNull($plant->fresh()->health_notes);
    }

    public function test_health_check_reports_failure_when_the_model_answer_is_unusable(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('plants/test.jpg', 'fake-image');
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText('{"health_status":"sic'))]);
        $plant = $this->makePlant();

        $this->postJson("/api/plants/{$plant->id}/check-health")->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_treatment_tips_are_returned_and_cached_per_plant(): void
    {
        $payload = [
            'cause_en' => 'Overwatering', 'cause_ar' => 'الإفراط في الري',
            'treatment_en' => ['Stop watering', 'Repot'], 'treatment_ar' => ['أوقفي الري', 'أعيدي الزراعة'],
        ];
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText(json_encode($payload, JSON_UNESCAPED_UNICODE)))]);

        $first = $this->postJson('/api/plants/disease-treatment', [
            'disease' => 'Yellow leaves', 'plant_name' => 'Snake Plant', 'language' => 'en',
        ])->assertOk();
        $this->assertTrue($first->json('success'));
        $this->assertSame(['Stop watering', 'Repot'], $first->json('data.treatment_en'));

        $second = $this->postJson('/api/plants/disease-treatment', [
            'disease' => 'Yellow leaves', 'plant_name' => 'Snake Plant', 'language' => 'ar',
        ])->assertOk();
        $this->assertTrue($second->json('cached'));

        // Same disease text on a different plant must not reuse the first plant's advice
        $other = $this->postJson('/api/plants/disease-treatment', [
            'disease' => 'Yellow leaves', 'plant_name' => 'Rose', 'language' => 'en',
        ])->assertOk();
        $this->assertFalse($other->json('cached'));
    }

    public function test_truncated_treatment_answer_is_an_error_not_a_blank_card(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText('{"cause_en":"Overwat'))]);

        $this->postJson('/api/plants/disease-treatment', [
            'disease' => 'Yellow leaves', 'plant_name' => 'Snake Plant',
        ])->assertStatus(502)->assertJsonPath('success', false);
    }

    // ── fertilizer tips & tricks ──────────────────────────────────────────────

    public function test_fertilizer_info_includes_bilingual_tips_and_replaces_old_cache_without_tips(): void
    {
        $payload = [
            'tips_en' => ['Feed monthly in spring'], 'tips_ar' => ['سمّدي شهرياً في الربيع'],
            'avoid_en' => ['Fertilizing dry soil'], 'avoid_ar' => ['التسميد على تربة جافة'],
            'name' => 'NPK 20-20-20', 'name_ar' => 'سماد NPK 20-20-20',
        ];
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText(json_encode($payload, JSON_UNESCAPED_UNICODE)))]);
        // Old cached record: has name_ar but no tips
        $plant = $this->makePlant(['fertilizer_info' => json_encode(['name' => 'Old', 'name_ar' => 'قديم'])]);

        $response = $this->postJson("/api/plants/{$plant->id}/fertilizer-info")->assertOk();

        $this->assertFalse($response->json('cached'));
        $this->assertSame(['Feed monthly in spring'], $response->json('data.tips_en'));
        $this->assertSame(['التسميد على تربة جافة'], $response->json('data.avoid_ar'));

        // Now cached with tips → no second model call
        Http::fake(['openrouter.ai/*' => Http::response([], 500)]);
        $again = $this->postJson("/api/plants/{$plant->id}/fertilizer-info")->assertOk();
        $this->assertTrue($again->json('cached'));
    }

    // ── plant meaning (free-tier only) ────────────────────────────────────────

    public function test_plant_meaning_calls_only_the_free_model_and_then_caches_it(): void
    {
        Http::fake([
            'openrouter.ai/*' => Http::response($this->openRouterText(
                '{"meaning":"Symbolizes protection and resilience.","meaning_ar":"يرمز إلى الحماية والصمود.","occasions":"Housewarmings","occasions_ar":"الانتقال لمنزل جديد"}'
            )),
        ]);
        $plant = $this->makePlant();

        $response = $this->postJson("/api/plants/{$plant->id}/meaning")->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertFalse($response->json('cached'));
        $this->assertSame('Symbolizes protection and resilience.', $response->json('data.meaning'));
        $this->assertSame('يرمز إلى الحماية والصمود.', $response->json('data.meaning_ar'));
        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'openrouter.ai') && $request['model'] === 'google/gemma-4-31b-it:free';
        });

        // Second request is served from the cached column, no new HTTP call
        Http::fake(['openrouter.ai/*' => Http::response([], 500)]);
        $again = $this->postJson("/api/plants/{$plant->id}/meaning")->assertOk();
        $this->assertTrue($again->json('cached'));
    }

    public function test_plant_meaning_falls_back_to_a_paid_model_when_the_free_tier_is_rate_limited(): void
    {
        Http::fake(['openrouter.ai/*' => Http::sequence()
            ->push([], 429) // free tier rate limited
            ->push($this->openRouterText(
                '{"meaning":"Symbolizes protection and resilience.","meaning_ar":"يرمز إلى الحماية والصمود.","occasions":"Housewarmings","occasions_ar":"الانتقال لمنزل جديد"}'
            )),
        ]);
        $plant = $this->makePlant();

        $response = $this->postJson("/api/plants/{$plant->id}/meaning")->assertOk();

        $this->assertTrue($response->json('success'));
        $this->assertSame('Symbolizes protection and resilience.', $response->json('data.meaning'));
        Http::assertSentCount(2);
        Http::assertSent(fn ($request) => $request['model'] === 'google/gemma-4-31b-it:free');
        Http::assertSent(fn ($request) => $request['model'] === 'google/gemini-2.5-flash');
    }

    public function test_plant_meaning_reports_failure_when_the_free_tier_and_every_paid_model_fail(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response([], 429)]); // rate limited everywhere
        $plant = $this->makePlant();

        $response = $this->postJson("/api/plants/{$plant->id}/meaning");

        $response->assertStatus(502)->assertJsonPath('success', false);
        $this->assertNull($plant->fresh()->meaning_info);
    }

    public function test_plant_meaning_reports_failure_instead_of_caching_unparseable_text(): void
    {
        Http::fake(['openrouter.ai/*' => Http::response($this->openRouterText('Sorry, I cannot help with that.'))]);
        $plant = $this->makePlant();

        $this->postJson("/api/plants/{$plant->id}/meaning")
            ->assertStatus(502)->assertJsonPath('success', false);
        $this->assertNull($plant->fresh()->meaning_info);
    }
}
