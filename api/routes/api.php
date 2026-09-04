<?php

use App\Http\Controllers\Api\Admin\ChangementVolController;
use App\Http\Controllers\Api\Admin\TableauBordController;
use App\Http\Controllers\Api\Admin\UtilisateurController;
use App\Http\Controllers\Api\Admin\VolController as AdminVolController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EnregistrementController;
use App\Http\Controllers\Api\GuichetController;
use App\Http\Controllers\Api\RechercheVolController;
use App\Http\Controllers\Api\VolController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API AirPass
|--------------------------------------------------------------------------
| Les routes sont regroupées comme les modules du cahier des charges :
| 6.1 comptes · 6.2 recherche · 6.3-6.6 enregistrement · 6.7 suivi de vol
| 6.8 guichet · 6.9 back-office.
*/

// --- 6.1 Comptes & authentification ----------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('inscription', [AuthController::class, 'inscription']);
    Route::post('connexion', [AuthController::class, 'connexion']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('deconnexion', [AuthController::class, 'deconnexion']);
        Route::get('moi', [AuthController::class, 'moi']);
    });
});

// --- 6.2 Recherche de vol (mode invité, EF-1.3) ----------------------------
Route::post('recherche-vol', RechercheVolController::class);

// --- 6.7 Suivi de vol ------------------------------------------------------
Route::get('vols/{numero}/statut', [VolController::class, 'statut']);

// --- 6.3 à 6.6 Parcours d'enregistrement -----------------------------------
// Le dossier est adressé par son jeton (qr_jeton) : pas de compte requis.
Route::post('enregistrement/demarrer', [EnregistrementController::class, 'demarrer']);

Route::prefix('enregistrement/{enregistrement:qr_jeton}')->group(function () {
    Route::get('/', [EnregistrementController::class, 'afficher']);
    Route::patch('informations', [EnregistrementController::class, 'informations']);
    Route::post('bagages', [EnregistrementController::class, 'bagages']);
    Route::get('cabine', [EnregistrementController::class, 'cabine']);
    Route::post('siege', [EnregistrementController::class, 'choisirSiege']);
    Route::post('finaliser', [EnregistrementController::class, 'finaliser']);
    Route::delete('/', [EnregistrementController::class, 'annuler']);
});

// --- 6.8 Vue guichet (agents et administrateurs) ---------------------------
Route::middleware(['auth:sanctum', 'role:agent,admin'])
    ->prefix('guichet')
    ->group(function () {
        Route::get('recherche', [GuichetController::class, 'recherche']);
        Route::post('enregistrer', [GuichetController::class, 'enregistrerAuComptoir']);
        Route::get('{reference}', [GuichetController::class, 'dossier']);
        Route::post('{reference}/bagage', [GuichetController::class, 'peserBagage']);
        Route::post('{reference}/siege', [GuichetController::class, 'changerSiege']);
        Route::post('{reference}/embarquer', [GuichetController::class, 'embarquer']);
    });

// --- 6.9 Back-office administrateur ----------------------------------------
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('tableau-de-bord', TableauBordController::class);

        Route::get('types-appareil', [AdminVolController::class, 'typesAppareil']);
        Route::get('vols', [AdminVolController::class, 'index']);
        Route::post('vols', [AdminVolController::class, 'store']);
        Route::patch('vols/{vol}', [AdminVolController::class, 'update']);
        Route::post('vols/{vol}/publier', [AdminVolController::class, 'publier']);
        Route::post('vols/{vol}/changement', [ChangementVolController::class, 'store']);

        Route::get('utilisateurs', [UtilisateurController::class, 'index']);
        Route::post('utilisateurs', [UtilisateurController::class, 'store']);
        Route::patch('utilisateurs/{utilisateur}', [UtilisateurController::class, 'update']);
    });
