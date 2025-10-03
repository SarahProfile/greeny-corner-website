<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\FirebaseService;

class MigrateUsersToFirebase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:migrate-to-firebase {--dry-run : Show what would be migrated without actually doing it}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing Laravel users to Firebase Authentication';

    protected FirebaseService $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        parent::__construct();
        $this->firebaseService = $firebaseService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE - No actual migration will occur');
            $this->line('');
        }

        // Get all users with email addresses (Firebase requires email)
        $users = User::whereNotNull('email')->get();
        
        if ($users->isEmpty()) {
            $this->warn('No users found with email addresses to migrate.');
            return;
        }

        $this->info("Found {$users->count()} users to migrate to Firebase:");
        $this->line('');

        $migrated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($users as $user) {
            $this->line("Processing: {$user->name} ({$user->email})");
            
            if ($isDryRun) {
                $this->info("  → Would migrate user to Firebase");
                $migrated++;
                continue;
            }

            // Check if user already exists in Firebase
            $existingFirebaseUser = $this->firebaseService->getUserByEmail($user->email);
            
            if ($existingFirebaseUser) {
                $this->comment("  → Already exists in Firebase, updating firebase_uid in database");
                $user->update(['firebase_uid' => $existingFirebaseUser->uid]);
                $skipped++;
                continue;
            }

            // Create user in Firebase with temporary password
            $temporaryPassword = 'temp123456'; // User will need to reset password
            $firebaseUid = $this->firebaseService->createUser([
                'email' => $user->email,
                'name' => $user->name,
                'password' => $temporaryPassword
            ]);

            if ($firebaseUid) {
                // Update Laravel user with Firebase UID
                $user->update(['firebase_uid' => $firebaseUid]);
                $this->info("  ✅ Successfully migrated (Firebase UID: {$firebaseUid})");
                $migrated++;
            } else {
                $this->error("  ❌ Failed to create Firebase user");
                $errors++;
            }
        }

        $this->line('');
        $this->info('Migration Summary:');
        $this->table(
            ['Status', 'Count'],
            [
                ['Migrated', $migrated],
                ['Skipped (already exists)', $skipped],
                ['Errors', $errors],
            ]
        );

        if (!$isDryRun && $migrated > 0) {
            $this->line('');
            $this->warn('⚠️  IMPORTANT:');
            $this->warn('   Migrated users have temporary passwords (temp123456)');
            $this->warn('   They will need to use the "Forgot Password" feature to set new passwords');
            $this->warn('   The Firebase password reset emails will be sent from Firebase, not Laravel');
        }

        return $errors === 0 ? 0 : 1;
    }
}
