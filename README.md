# Finny Boy Fab Store

MVP monolithic online store for handcrafted cutting boards.

## Stack

- Java 17 + Spring Boot API
- React + TypeScript + Vite storefront
- Maven builds the frontend and copies it into the Spring Boot jar
- Single deployable artifact for AWS

## Local Development

Run the backend:

```bash
mvn spring-boot:run
```

Run the frontend separately during UI work:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080`.

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
- Checkout returns a mock order number. Payment, taxes, shipping rates, and persistence are
  the next production integrations.
