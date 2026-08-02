<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\JWTService;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class JwtAuthenticate
{
    protected JWTService $jwtService;

    public function __construct(JWTService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $header = $request->header('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Authorization Bearer token required'], 401);
        }

        $token = substr($header, 7);
        $payload = $this->jwtService->validateToken($token);

        if (!$payload) {
            return response()->json(['message' => 'Token is invalid or has expired'], 401);
        }

        $user = User::find($payload['sub']);
        if (!$user) {
            return response()->json(['message' => 'User associated with token not found'], 401);
        }

        // Authenticate the user for the current request lifecycle
        Auth::login($user);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
