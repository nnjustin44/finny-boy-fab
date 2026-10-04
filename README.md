# Finny Boy Fab Store

MVP monolithic online store for handcrafted cutting boards.

## Stack

- Java 17 + Spring Boot 4.1 API
- React + TypeScript + Vite storefront
- Maven builds the frontend and copies it into the Spring Boot jar
- Single deployable artifact for AWS

## Local Development

The application uses the `local` profile by default. Run the backend:

```bash
export STRIPE_SECRET_KEY=sk_test_your_key_here
mvn spring-boot:run
```

Run the frontend separately during UI work:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080`.

When using the separate Vite server, start the backend with the browser return URL set to Vite:

```bash
export STRIPE_SECRET_KEY=sk_test_your_key_here
export APP_BASE_URL=http://localhost:5173
mvn spring-boot:run
```

## Stripe Checkout

The Stripe secret key belongs in the `STRIPE_SECRET_KEY` environment variable. Get a test-mode
secret key from the Stripe Dashboard under **Developers > API keys**. Do not put an `sk_` key in
React, `frontend/`, or a committed properties file.

For a local Stripe test-mode checkout, use the local profile and explicitly enable checkout:

```bash
SPRING_PROFILES_ACTIVE=local \
CHECKOUT_ENABLED=true \
MADE_TO_ORDER=true \
STRIPE_SECRET_KEY=sk_test_your_key_here \
SITE_BASE_URL=http://localhost:8080 \
APP_BASE_URL=http://localhost:8080 \
mvn spring-boot:run
```

Then add a board, agree to the terms in the cart, and choose **Checkout securely**. The app creates
a test Checkout Session and redirects the browser to Stripe's hosted card-entry page. AWS is not
involved in this local flow. Keep `SPRING_PROFILES_ACTIVE=local`; the production profile correctly
requires public HTTPS URLs when checkout is enabled.

The backend reads the secret through the Spring configuration files:

```properties
stripe.secret-key=${STRIPE_SECRET_KEY:}
```

Use a Stripe test key until the checkout flow has been verified. A production deployment should
store `STRIPE_SECRET_KEY` in the hosting platform's secret manager. The production profile defaults
Stripe return URLs to `https://finnyboyfab.com`; `APP_BASE_URL` remains available as an override.
Stripe-hosted Checkout does not require a publishable key in this frontend.

## Environment Profiles

Spring Boot loads shared settings from `application.properties` and environment-specific settings
from these profile files:

- `local` (default): `http://localhost:${PORT}` URLs (`8080` by default) and disabled
  static-asset caching. When Vite runs separately, set `APP_BASE_URL=http://localhost:5173`.
- `test`: stable localhost URLs with browser caching disabled.
- `prod`: `https://finnyboyfab.com`, proxy-aware request handling, and long-lived asset caching.

Run a particular profile with `SPRING_PROFILES_ACTIVE`, for example:

```bash
SPRING_PROFILES_ACTIVE=prod java -jar target/finnyboyfab-store-0.0.1-SNAPSHOT.jar
```

The Docker image activates `prod` automatically. Hosting environments may still override
`SPRING_PROFILES_ACTIVE`, `SITE_BASE_URL`, `APP_BASE_URL`, and `PORT` when needed.

## Search Engine Metadata

The production profile uses `https://finnyboyfab.com` for canonical URLs, Open Graph metadata,
JSON-LD product data, `robots.txt`, and `sitemap.xml`. `SITE_BASE_URL` can override that value for
preview deployments:

```bash
export SITE_BASE_URL=https://preview.example.com
```

After deployment, submit `https://finnyboyfab.com/sitemap.xml` in Google Search Console. Product
pages include `Product`, `Offer`, and breadcrumb structured data in their initial HTML response.

The app accepts signed Checkout events at `POST /api/webhooks/stripe`. Configure the endpoint for
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`checkout.session.async_payment_failed`, and supply its signing secret separately from the API key:

```bash
export STRIPE_WEBHOOK_SECRET=whsec_your_endpoint_secret
```

For local webhook testing, install and authenticate the Stripe CLI, then run:

```bash
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to localhost:8080/api/webhooks/stripe
```

Use the `whsec_...` signing secret printed by `stripe listen` as `STRIPE_WEBHOOK_SECRET`. The handler
verifies the raw request body and `Stripe-Signature` header before recording paid sessions, and it
deduplicates retries by Checkout Session id.

Cart state, checkout-attempt coordination, and a bounded payment-completion summary are stored in an
atomic local snapshot. This protects payment recovery across process restarts but is not an order
management or fulfillment queue. The browser return page is only a customer-facing status view;
Stripe and the signed webhook are the payment source of truth. Follow
[`docs/MANUAL_FULFILLMENT.md`](docs/MANUAL_FULFILLMENT.md) for fulfillment.

## Build One Deployable

```bash
mvn -B clean package
java -jar target/finnyboyfab-store-0.0.1-SNAPSHOT.jar
```

Then open `http://localhost:8080`.

Browser deployment checks can be run after packaging:

```bash
cd frontend
npx playwright install chromium # once per machine/CI image
npm run test:e2e
```

To use an existing Chrome installation instead, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable.

## Production Deployment

The included `Dockerfile` builds and tests the React app and Spring Boot backend, then runs the jar
as a non-root user. This release supports one ECS/Fargate task with an encrypted EFS volume mounted
at `/var/lib/finnyboyfab`. It must use a stop-before-start deployment because the data store holds
an exclusive lock. App Runner and horizontally scaled/overlapping deployments are not supported.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for infrastructure, secrets, health checks, backup,
and rollback. Checkout defaults off in the production profile and the application refuses an
incomplete enabled-checkout configuration. Complete [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md)
before setting `LAUNCH_REVIEWED=true` and `CHECKOUT_ENABLED=true`.

For AWS, [`infra/aws/production.yaml`](infra/aws/production.yaml) and
[`scripts/deploy-aws.sh`](scripts/deploy-aws.sh) provision and release the supported single-task
ECS/Fargate + encrypted EFS architecture. Start with the test-mode procedure in
[`infra/aws/README.md`](infra/aws/README.md); do not install live Stripe secrets until rehearsal is complete.

## Run with Docker Compose

Docker Compose provides a one-command, checkout-disabled local deployment with a persistent named
volume, read-only root filesystem, dropped Linux capabilities, graceful shutdown, and a `/healthz`
container probe:

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
docker compose logs -f storefront
```

Open `http://localhost:8080`. Stop the container without deleting its cart/payment volume:

```bash
docker compose down
```

`docker compose down -v` also deletes the persistent store and should only be used when intentionally
discarding local test data. Do not use Compose as the production scaling model; production remains the
single-task ECS/Fargate + EFS design in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## MVP Notes

- The product catalog is code-defined in `ProductRepository`; products are treated as made to order.
- Cart and payment-coordination state use a bounded durable snapshot keyed by a browser-local cart id.
- Checkout creates a Stripe-hosted payment session with server-calculated prices and Stripe automatic tax.
- The service intentionally supports one writer/replica. Stripe Dashboard and the controlled order log
  remain the manual fulfillment system.
