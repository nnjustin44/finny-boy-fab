# Finny Boy Fab Store

MVP monolithic online store for handcrafted cutting boards.

## Stack

- Java 17 + Spring Boot API
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

For a one-command local launch:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here APP_BASE_URL=http://localhost:8080 mvn spring-boot:run
```

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

Before fulfilling production orders, add a signed `checkout.session.completed` webhook and persist
the order. The return page verifies what the customer sees, but Stripe webhooks must be the source
of truth for fulfillment.

## Build One Deployable

```bash
mvn package
java -jar target/finnyboyfab-store-0.0.1-SNAPSHOT.jar
```

Then open `http://localhost:8080`.

## AWS Deployment Shape

The included `Dockerfile` builds the React app and Spring Boot backend into one container.
Deploy that container once to AWS App Runner, ECS Fargate, Elastic Beanstalk Docker, or any
service that can run a single HTTP container with the `PORT` environment variable.

## MVP Notes

- Product catalog is in-memory in `ProductRepository`.
- Cart storage is in-memory and keyed by a browser-local cart id.
- Checkout creates a Stripe-hosted payment session using server-calculated prices.
- Cart and product data are in memory. Taxes, persistent orders, and webhook-driven fulfillment
  remain production requirements.
