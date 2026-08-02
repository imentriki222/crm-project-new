<?php

namespace App\Services;

use App\Models\User;

class JWTService
{
    protected string $secret;
    protected int $ttl;

    public function __construct()
    {
        $this->secret = env('JWT_SECRET', 'secret_32_characters_for_jwt_auth_crm_marketing_automation');
        $this->ttl = 3600 * 24; // Token valid for 24 hours
    }

    /**
     * Generate a new JWT token for a user.
     */
    public function generateToken(User $user): string
    {
        $header = json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT'
        ]);

        $payload = json_encode([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'iat' => time(),
            'exp' => time() + $this->ttl
        ]);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Validate a JWT token and return its payload if valid, or null.
     */
    public function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($header, $payload, $signature) = $parts;

        // Re-generate signature and verify
        $expectedSignature = hash_hmac('sha256', $header . "." . $payload, $this->secret, true);
        $base64UrlExpectedSignature = $this->base64UrlEncode($expectedSignature);

        if (!hash_equals($base64UrlExpectedSignature, $signature)) {
            return null;
        }

        $decodedPayload = json_decode($this->base64UrlDecode($payload), true);
        if (!$decodedPayload) {
            return null;
        }

        // Check expiration
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return null;
        }

        return $decodedPayload;
    }

    protected function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    protected function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
