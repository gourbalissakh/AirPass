<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

abstract class ApiController extends Controller
{
    /** Réponse d'erreur métier, en français, destinée à l'affichage. */
    protected function erreur(string $message, int $code = 422): JsonResponse
    {
        return response()->json(['message' => $message], $code);
    }
}
