# Landing

Marketing landing page — a single self-contained `index.html` (no build step,
no dependencies). Served by Caddy via the `Dockerfile`.

## Railway

Deployed as the `landing` service. The service must have
**Settings → Root Directory = `landing`** so Railway builds this folder's
Dockerfile instead of the app.

## Local preview

```sh
python3 -m http.server 4173 --directory landing
# or
docker build -t landing landing/ && docker run -p 8080:8080 landing
```

## Before launch

Search `index.html` for `placeholder` / `[Product]` comments: product name,
demo-booking link, sales contact, testimonials/stats, footer URLs, OG image,
canonical URL, app domain in the hero mockup.
