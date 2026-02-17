<?php

use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\IsSuperAdmin;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'is_super_admin' => IsSuperAdmin::class,
            'is_admin'       => IsAdmin::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions): void {

        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {

            if ($request->is('api/*') || $request->expectsJson()) {

                // 422 Validation
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'message' => $e->getMessage(),
                        'errors' => $e->errors(),
                    ], 422);
                }

                // 401 Unauthenticated
                if ($e instanceof AuthenticationException) {
                    return response()->json([
                        'message' => 'Unauthenticated',
                    ], 401);
                }

                // 403/404/429/... Http exceptions
                if ($e instanceof HttpExceptionInterface) {
                    $status = $e->getStatusCode();

                    $message = $e->getMessage() ?: match ($status) {
                        403 => 'Forbidden',
                        404 => 'Not Found',
                        429 => 'Too Many Requests',
                        default => 'Request failed',
                    };

                    return response()->json([
                        'message' => $message,
                    ], $status);
                }

                // 500+ا
                \Log::error('API Exception', [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'user_id' => optional($request->user())->id,
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                ]);

                $message = config('app.debug')
                    ? ($e->getMessage() ?: 'Server error')
                    : 'Server error';

                return response()->json([
                    'message' => $message,
                ], 500);
            }

            return null;
        });

    })->create();
