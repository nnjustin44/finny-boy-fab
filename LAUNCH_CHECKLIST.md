# Production Launch Checklist

`CHECKOUT_ENABLED` must remain `false` until every blocking item below is complete. Only then set `LAUNCH_REVIEWED=true` and enable checkout. The production application refuses to start with checkout enabled unless its core launch settings are present.

## Business decisions — blocking

- [x] Publish the approved policy direction: returns requested within 14 days after delivery require no reason; every board has a one-year deformation warranty covering workmanship/construction and wood movement; placing a board in a dishwasher voids that warranty.
- [ ] Before enabling checkout, decide who pays return shipping, whether original shipping is refunded, the refund-processing target after receipt, and whether a covered warranty claim is repaired, replaced, refunded, or resolved at the shop's option. Add those choices to the published terms.
- [ ] Confirm the made-to-order model and production capacity. This release deliberately requires `MADE_TO_ORDER=true`; finite-stock sales require a shared inventory system first.
- [ ] Confirm the 2–3 week production estimate, supported destinations, PO box/APO/FPO policy, delay-notice owner, and damage/lost-package process.
- [ ] Confirm the fixed shipping charge remains viable using packed weights and distant destinations.
- [ ] Have the tax setup and nexus/registration decisions reviewed by the appropriate business/tax professional.
- [ ] Retain support for all objective product, food-contact, finish, and care claims.

## Accounts and operations — blocking

- [ ] Configure `SUPPORT_EMAIL=finnyboyfab@gmail.com` and test that it can receive order, privacy, refund, and damage requests.
- [ ] Finish Stripe business verification, payout configuration, live-mode MFA, least-privilege staff access, receipts, refund emails, and merchant notifications.
- [ ] Register with North Carolina (and any other jurisdiction where the business is required to collect), add each active registration in Stripe Tax, and validate taxable/non-taxable test addresses. Keep `STRIPE_AUTOMATIC_TAX_ENABLED=true`; follow [the tax setup guide](docs/TAX_SETUP.md).
- [ ] Register the production webhook at `https://finnyboyfab.com/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.
- [ ] Create the access-controlled order log and assign a primary and backup fulfillment operator using [the manual procedure](docs/MANUAL_FULFILLMENT.md).
- [ ] Exercise one refund and one delay/cancellation workflow in test mode.
- [ ] If newsletter signup will launch, configure double opt-in, postal address, unsubscribe behavior, and set `NEWSLETTER_ENABLED=true`; otherwise leave it disabled.

## Infrastructure — blocking

- [ ] Follow [the deployment runbook](docs/DEPLOYMENT.md): one ECS/Fargate task, encrypted EFS access point mounted at `/var/lib/finnyboyfab`, non-overlapping deployment settings, secrets manager, HTTPS load balancer, logs, alarms, and rollback.
- [ ] Confirm the persistent store survives task replacement and that a second task fails closed on the file lock.
- [ ] Set the load-balancer health check to `/healthz` and verify unhealthy storage returns 503.
- [ ] Configure an automated encrypted EFS backup and complete a restore rehearsal.
- [ ] Build an immutable image from the reviewed commit and record its digest. Do not deploy an unreviewed mutable tag.
- [ ] Confirm `https://finnyboyfab.com`, DNS, certificate, redirects, security headers, `robots.txt`, and `sitemap.xml` on the deployed image.
- [ ] Confirm alarms for unhealthy tasks, 5xx responses, and missing webhook/order review; confirm log retention and an on-call recipient.

## Release verification — blocking

- [ ] Run `mvn -B clean package`; all Java tests, the frontend production build, and `npm audit` must pass.
- [ ] Run the Playwright suite from `frontend/` with `npm run test:e2e` against the packaged application.
- [ ] In the intended deployment with Stripe test keys, rehearse success, decline, authentication challenge, cancel, double click/two tabs, browser close before return, network interruption after payment, webhook retry, and task restart.
- [ ] Confirm a paid cart cannot be edited or paid twice and an unknown payment state never tells the customer to repurchase.
- [ ] Confirm product, quantity, wood, feet, customer email, shipping address, tax, shipping, total, Session ID, and PaymentIntent are visible to fulfillment.
- [ ] Walk one test order through the full manual fulfillment procedure, tracking notification, reconciliation, and refund.
- [ ] Check keyboard-only use, screen-reader announcements, 200% zoom, current iOS/Android browsers, slow network behavior, and all public routes.

## Enablement and rollback

- [ ] Take and verify a final store backup.
- [ ] Set production values from the runbook, including `LAUNCH_REVIEWED=true`, `MADE_TO_ORDER=true`, and `CHECKOUT_ENABLED=true`.
- [ ] Place one low-value live order, fulfill/refund it as planned, and inspect webhook delivery and logs.
- [ ] Monitor the first orders individually. To stop sales, set `CHECKOUT_ENABLED=false` and deploy using the non-overlapping single-task procedure; Stripe remains the payment source of truth.

Record approver, date, reviewed commit, image digest, task-definition revision, webhook endpoint, backup/restore evidence, and rehearsal order references in the private release record. Never put secrets or customer data in this repository.
