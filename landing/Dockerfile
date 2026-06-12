FROM caddy:2-alpine

# Railway injects PORT at runtime; default for local runs
ENV PORT=8080

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html /srv/index.html

EXPOSE 8080
