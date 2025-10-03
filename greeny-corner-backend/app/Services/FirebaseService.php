<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
use Kreait\Firebase\Auth;

class FirebaseService
{
    private Auth $auth;

    public function __construct()
    {
        $credentialsPath = config('services.firebase.credentials_path');
        
        if (!$credentialsPath) {
            throw new \Exception('Firebase credentials path not configured');
        }

        $fullPath = storage_path($credentialsPath);
        
        if (!file_exists($fullPath)) {
            throw new \Exception("Firebase credentials file not found at: {$fullPath}");
        }

        $factory = (new Factory)
            ->withServiceAccount($fullPath)
            ->withProjectId(config('services.firebase.project_id'));
        
        $this->auth = $factory->createAuth();
    }

    public function createUser(array $userData): ?string
    {
        try {
            $userProperties = [
                'email' => $userData['email'],
                'displayName' => $userData['name'],
                'password' => $userData['password'], // Temporary password
                'emailVerified' => false,
            ];

            $createdUser = $this->auth->createUser($userProperties);
            
            return $createdUser->uid;
        } catch (\Exception $e) {
            \Log::error('Firebase user creation failed: ' . $e->getMessage());
            return null;
        }
    }

    public function getUserByEmail(string $email): ?object
    {
        try {
            return $this->auth->getUserByEmail($email);
        } catch (\Exception $e) {
            return null;
        }
    }

    public function updateUser(string $uid, array $userData): bool
    {
        try {
            $this->auth->updateUser($uid, $userData);
            return true;
        } catch (\Exception $e) {
            \Log::error('Firebase user update failed: ' . $e->getMessage());
            return false;
        }
    }

    public function deleteUser(string $uid): bool
    {
        try {
            $this->auth->deleteUser($uid);
            return true;
        } catch (\Exception $e) {
            \Log::error('Firebase user deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    public function verifyIdToken(string $idToken)
    {
        try {
            return $this->auth->verifyIdToken($idToken);
        } catch (\Exception $e) {
            \Log::error('Firebase token verification failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function createCustomToken(string $uid, array $claims = []): string
    {
        try {
            return $this->auth->createCustomToken($uid, $claims);
        } catch (\Exception $e) {
            \Log::error('Firebase custom token creation failed: ' . $e->getMessage());
            throw $e;
        }
    }
}