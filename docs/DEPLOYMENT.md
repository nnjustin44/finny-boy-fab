# Deployment Runbook — AWS ECS/Fargate + EFS

This release uses a durable local snapshot with an exclusive process lock. Deploy exactly **one** application task and mount persistent storage. It is not a horizontally scalable architecture. ECS/App Runner deployments that overlap two containers against the same data directory are unsupported.

## Supported production shape

- One ECS service on Fargate with `desiredCount=1`.
- An Application Load Balancer terminates HTTPS and forwards to container port 8080.
- An encrypted EFS file system and access point are mounted at `/var/lib/finnyboyfab`.
- The EFS access point uses POSIX uid/gid `10001`, matching the non-root image user.
- A private container registry holds an immutable image digest.
- Secrets come from AWS Secrets Manager or SSM Parameter Store, not the image or task-definition plaintext.
- CloudWatch receives application logs and alarms.

The application atomically persists carts, checkout attempts, and payment-completion coordination to `store-state.json`. Stripe Dashboard plus the controlled order log remain the fulfillment source of truth.

## Build and publish

```bash
mvn -B clean package
docker build --pull -t finnyboyfab:<commit-sha> .
docker inspect --format='{{.Config.User}}' finnyboyfab:<commit-sha>
```

The Maven build runs frontend compilation, dependency audit, and Java tests. The image build runs that gate again and must report user `10001:10001`. Push the image, then deploy its digest rather than a mutable tag.

The repository now includes a production CloudFormation stack and immutable-image deployment script. Follow [`infra/aws/README.md`](../infra/aws/README.md) for prerequisites and commands. The script intentionally deploys checkout disabled unless it is explicitly enabled.

## Task and service settings

Configure the task with:

- Fargate Linux, port 8080, read-only root filesystem if the selected Java runtime permits it.
- EFS volume mounted read/write at `/var/lib/finnyboyfab` using transit encryption and IAM authorization.
- `STORE_DATA_DIR=/var/lib/finnyboyfab`.
- Container health check or ALB health check: `GET /healthz`, success code 200.
- Graceful stop timeout long enough for Spring shutdown; send SIGTERM and allow at least 30 seconds.
- CloudWatch logs with an explicit retention period and no debug request/body logging.

Because the store holds an exclusive lock, deployment tasks must not overlap. Configure the ECS rolling deployment with:

- desired count `1`
- minimum healthy percent `0`
- maximum percent `100`
- deployment circuit breaker and rollback enabled

This intentionally creates a short maintenance window: ECS stops the old task before starting the replacement. A default 100/200 rolling deployment starts a second task first; the replacement would correctly refuse to start because the store is locked. Never raise desired count above one for this release.

## Environment and secrets

Required before checkout can be enabled:

| Name | Source | Value/meaning |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | environment | `prod` |
| `SITE_BASE_URL` | environment | `https://finnyboyfab.com` |
| `APP_BASE_URL` | environment | Same HTTPS origin as `SITE_BASE_URL` |
| `SUPPORT_EMAIL` | environment | `finnyboyfab@gmail.com` |
| `STORE_DATA_DIR` | environment | `/var/lib/finnyboyfab` |
| `STRIPE_SECRET_KEY` | secret | Test key for rehearsal; live key only at launch |
| `STRIPE_WEBHOOK_SECRET` | secret | Signing secret for this exact endpoint/mode |
| `STRIPE_AUTOMATIC_TAX_ENABLED` | environment | `true` |
| `MADE_TO_ORDER` | environment | `true` after owner approval |
| `LAUNCH_REVIEWED` | environment | `true` only after `LAUNCH_CHECKLIST.md` is signed off |
| `CHECKOUT_ENABLED` | environment | `false` until final launch, then `true` |

Optional controls: `CART_TTL_DAYS` (default 30), `EMPTY_CART_TTL_MINUTES` (60), `MAX_CARTS` (5000), and `MAX_COMPLETIONS` (10000). Newsletter signup remains off unless `NEWSLETTER_ENABLED=true`, `MAILCHIMP_API_KEY`, and `MAILCHIMP_AUDIENCE_ID` are deliberately configured.

## First deployment and verification

1. Deploy with Stripe test credentials and `CHECKOUT_ENABLED=false`.
2. Verify `/healthz`, `/api/storefront`, public pages, headers, images, `robots.txt`, `sitemap.xml`, and a branded 404 through the public HTTPS origin.
3. Temporarily enable test checkout only after the non-payment checklist items are complete. Test Stripe keys may use `LAUNCH_REVIEWED=false`; live Stripe keys are rejected until it is `true`. Execute the full test-mode rehearsal in `LAUNCH_CHECKLIST.md`.
4. Replace the task and confirm the cart/payment snapshot is retained on EFS.
5. Confirm a deliberately concurrent second task fails startup with the data-directory lock rather than serving divergent state.
6. Return checkout to disabled, install live Stripe secrets and the live webhook endpoint, then perform the final checklist approval.
7. Enable checkout and place the controlled live order.

## Backup and restore

Use AWS Backup for encrypted EFS snapshots on a documented schedule. Before each release, take an on-demand recovery point. For a restore rehearsal:

1. Disable checkout and stop the ECS service so no writer holds the store.
2. Restore the EFS recovery point to an isolated file system/access point.
3. Start one test task against the restored path using non-live credentials and verify health and expected records.
4. Stop the test task. Record evidence in the private release record; do not copy customer data into tickets or this repository.

Never edit `store-state.json` while the application is running.

## Rollback and emergency stop

- To stop new sales, deploy with `CHECKOUT_ENABLED=false`. Do not delete Stripe Sessions or the EFS volume.
- Roll back to the prior known-good **image digest** using the same stop-before-start service settings.
- Do not restore an older data snapshot merely to roll back code; doing so can lose payment coordination created after that snapshot.
- If `/healthz` reports 503 or persistence errors appear, leave checkout disabled, stop the writer, preserve the EFS state, and reconcile all recent payments in Stripe before recovery.
- After any outage, compare Stripe successful payments to the private order log and durable completion records before reopening checkout.

AWS references: [EFS volumes in ECS task definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specify-efs-config.html), [ECS rolling deployment controls](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-ecs.html), and [deployment circuit breaker/rollback](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/update-service-parameters.html).
