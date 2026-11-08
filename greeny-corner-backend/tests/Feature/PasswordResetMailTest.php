<?php

namespace Tests\Feature;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Regression guard for a real production incident (2026-09-23): the live `api/` deployment was
 * missing resources/views/emails entirely, so every password-reset email failed with
 * "View [emails.password-reset] not found." and the user just saw "Failed to send email."
 * This test only catches the symptom in a local/CI run where the view file exists; it cannot
 * catch a future deploy that forgets to copy resources/ again — that's a deploy-checklist issue,
 * not something a code-level test can guarantee.
 */
class PasswordResetMailTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_mailable_renders_without_a_missing_view_error(): void
    {
        $user = User::factory()->create();

        // ->render() forces Laravel to actually resolve and compile the Blade view — a missing
        // or renamed template throws here, exactly like it did in production.
        $html = (new PasswordResetMail($user, '123456', 'https://greenycorner.ae/reset-password?token=123456'))->render();

        $this->assertStringContainsString('123456', $html);
    }

    public function test_forgot_password_endpoint_sends_the_mailable_and_succeeds(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'friend@example.com']);

        $response = $this->postJson('/api/forgot-password', ['email' => 'friend@example.com']);

        $response->assertOk();
        Mail::assertSent(PasswordResetMail::class, fn ($mail) => $mail->hasTo($user->email));
    }
}
