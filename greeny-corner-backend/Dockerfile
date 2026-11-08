# Production image for the Greeny Corner API (Laravel 12). Serves HTTP on :8080 (nginx + php-fpm).
FROM serversideup/php:8.4-fpm-nginx

WORKDIR /var/www/html

# Dependencies first so this layer caches until composer files change.
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY --chown=www-data:www-data . .
RUN composer dump-autoload --optimize --no-dev --no-scripts --no-interaction \
 && mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && ln -sfn ../storage/app/public public/storage
