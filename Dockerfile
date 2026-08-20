# AlgoViz — PHP + Apache (mirrors production: .htaccess rewrite → index.php)
FROM php:8.3-apache

# .htaccess needs mod_rewrite; it also uses mod_expires for asset caching
RUN a2enmod rewrite expires

# Let .htaccess take effect inside the document root
RUN printf '%s\n' \
    '<Directory /var/www/html>' \
    '  Options -Indexes +FollowSymLinks' \
    '  AllowOverride All' \
    '  Require all granted' \
    '</Directory>' \
    > /etc/apache2/conf-available/algoviz.conf \
 && a2enconf algoviz

# Silence the "could not reliably determine server's fully qualified domain name" notice
RUN printf 'ServerName localhost\n' > /etc/apache2/conf-available/servername.conf \
 && a2enconf servername

COPY . /var/www/html/

EXPOSE 80
