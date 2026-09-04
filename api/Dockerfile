# API Envol — Laravel servi par le serveur intégré de PHP.
FROM php:8.4-cli-alpine

RUN apk add --no-cache libzip-dev icu-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql zip intl bcmath opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Les dépendances sont installées avant le code : la couche est réutilisée
# tant que composer.lock ne change pas.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize \
    && cp -n .env.example .env || true

EXPOSE 8000

# Attend la base, applique les migrations et les données de démonstration,
# puis démarre l'API.
CMD php artisan key:generate --force \
    && php artisan migrate --force --seed \
    && php artisan serve --host=0.0.0.0 --port=8000
