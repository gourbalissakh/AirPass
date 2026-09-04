<?php

namespace App\Providers;

use App\Services\Dcs\DcsGateway;
use App\Services\Dcs\DcsLocal;
use Illuminate\Support\ServiceProvider;

/**
 * Point unique où l'on choisit l'implémentation de la passerelle DCS.
 *
 * Le jour où Air Burkina ouvre l'accès à son système de réservation, seule
 * cette liaison change (§8.2 du cahier des charges).
 */
class AirPassServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(DcsGateway::class, DcsLocal::class);
    }

    public function boot(): void
    {
        \Carbon\CarbonImmutable::setLocale('fr');
        \Illuminate\Support\Carbon::setLocale('fr');
    }
}
