FROM php:8.2-apache
RUN docker-php-ext-install mysqli && a2enmod rewrite
COPY nigeriagadgetmart /var/www/html/nigeriagadgetmart
COPY index.php /var/www/html/index.php
