# Finny Boy Fab — launch readiness audit

> **Remediation update — October 3, 2026:** The code-level findings from this audit have been addressed in the current working tree: payment sessions are idempotently recovered, paid carts lock, status handling is fail-safe, tax is enabled, support details are runtime configuration, made-to-order checkout is an explicit launch gate, signed delayed-payment events are handled, cart/payment coordination persists atomically, transient cart failures preserve the cart, customer errors are visible, security/cache/error handling is hardened, production health reflects storage, dependencies are updated, the Dockerfile runs the release tests and declares a non-root runtime, and browser deployment checks were added. The release build now passes 44 Java tests and reports zero npm vulnerabilities; all 14 packaged-app Playwright checks pass across desktop and mobile Chromium; the packaged jar is 44 MB after raw asset pruning. A linted CloudFormation stack and immutable-image deployment script now define the supported AWS ECS/Fargate, ALB, EFS, Route 53, Secrets Manager, WAF, logging, backup, and alarm configuration.
>
> The application is **prepared for deployment with checkout disabled**, not approved to accept public orders. Owner/account/infrastructure items remain in [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md), especially returns policy, tax/account confirmation, shipping operations, claims substantiation, live Stripe rehearsal, DNS cutover, and the single-task EFS deployment. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The production profile defaults checkout off and refuses to start with it enabled unless the core launch gates are explicitly configured.
>
> The original audit below is retained as the finding record; line numbers and implementation-state statements describe the October 2 snapshot and may no longer match the remediated tree.

Audit date: October 2, 2026. Verdict: **not ready to accept public orders as-is; suitable for a controlled launch after the items below are resolved and verified.** No storefront implementation changes, account changes, real purchases, email sends, or deployments were made during this audit.

## Scope and evidence

- Reviewed the current working tree, including existing uncommitted checkout/webhook changes, catalog, cart, legal pages, deployment settings, and frontend dependencies.
- `mvn -B package` passed, including the production frontend build and all 22 existing Java tests.
- Ran the packaged application with the production profile on localhost:18080. Real Stripe and Mailchimp credentials were explicitly disabled; webhook tests used a dummy local signing secret.
- Used isolated Chrome/Playwright desktop and 390px mobile browser checks, following the webapp-testing skill. Inspected screenshots of the cart and mobile product page.
- Exercised cart operations, variants, terms acceptance, shipping calculations, forms, page routes, simulated payment-result failures, and signed local webhooks.
- Read the public domain without changing it. `https://finnyboyfab.com` served a Squarespace “Coming Soon”/under-construction page with `noindex`, not this application. HTTP redirected to HTTPS.
- Did not verify Stripe Dashboard configuration, a real Stripe-hosted test purchase, payouts, tax registrations, receipt delivery, shipping-label purchase, production infrastructure, or private business records. This is not a penetration test, complete accessibility certification, or legal opinion.

## Fix or resolve before taking public orders

### 1. Payment confirmation can incorrectly invite a second payment — high priority

Evidence: `frontend/src/pages/CheckoutSuccessPage/CheckoutSuccessPage.tsx:28` waits for creation of a replacement cart before displaying a confirmed payment. Any failure, including a failure after Stripe reports `paid`, renders “Your cart has been kept. Return to it to try again.” Both paid-plus-cart-reset-failure and verification-failure scenarios reproduced in the browser using simulated API responses.

Impact: a customer can pay successfully, see an error, and pay again. `StripeCheckoutService.java:60` creates a fresh Checkout Session on every checkout request without idempotency/session reuse; `CartService.java:76` does not mark a cart as already checked out.

Required outcome: confirmed payment must remain confirmed even if cart cleanup fails. An unknown payment state must advise checking status, not repurchasing. Add safe verification retry, a recoverable order/session reference, and deliberate protection against duplicate checkout attempts. Verify with interrupted requests, repeated clicks, and two browser tabs.

### 2. Checkout does not calculate sales tax — high priority

Evidence: `src/main/java/com/finnyboyfab/store/checkout/StripeCheckoutService.java:35` supplies product prices and shipping, but neither automatic tax nor explicit tax rates. Legal terms say applicable taxes appear during checkout; this code has no tax calculation path.

The website identifies the shop as North Carolina-based. Confirm your sales-tax registration and obligations with a qualified tax professional, then configure the appropriate collection, product tax treatment, shipping treatment, and filing process. NC's registration guidance covers sellers of tangible personal property; being a small online shop is not by itself an exemption. [NCDOR registration guidance](https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-registration/who-should-register-sales-and-use-tax)

Enabling a Dashboard setting alone is not evidence that this API-created checkout calculates tax. Verify taxable NC addresses and appropriate out-of-state cases in the actual checkout. Do not automatically collect every state's tax without establishing obligations.

### 3. Customers currently cannot submit either inquiry form — high priority

Evidence: both `/contact` and `/custom-inquiry` submissions displayed “The contact email is not configured yet.” See `frontend/src/pages/Contact/Contact.tsx:48` and `frontend/src/pages/CustomInquiry/CustomInquiry.tsx:63`.

These forms open a `mailto:` link; they do not send a message through your server. `VITE_CONTACT_EMAIL` is needed at frontend build time, and the Docker build does not currently expose a build argument for it. Setting only a runtime environment variable will not change the built JavaScript.

Required outcome: publish a working support address and verify customers can contact you about refunds, damage, privacy requests, and orders. Either clearly label the form as opening an email app, with a visible fallback address, or implement actual message delivery with abuse protection and a truthful confirmation state.

### 4. Current inventory values do not prevent overselling — high priority if stock is finite

Evidence: `src/main/java/com/finnyboyfab/store/cart/CartService.java:42` caps quantity separately for each customization line. A local API test accepted 8 Maple, 8 Walnut, and 8 Cherry-with-feet boards in one cart: **24 units against product inventory of 8**. Stock is not reserved or reduced after payment, so separate shoppers can each buy the same nominal inventory.

Required decision: are these stocked items or made-to-order products? For finite stock, enforce shared inventory atomically through payment/fulfillment. For made-to-order work, define production capacity, order limits, lead times, and a way to pause sales. A decorative stock number is not an inventory system.

### 5. The webhook is an event receiver, not a complete order workflow

Evidence: `StripeWebhookService.java:18` handles only `checkout.session.completed`. `CheckoutCompletionService.java:16` retains a small payment summary in process memory and logs it. It does not send order emails, create shipping labels, maintain a fulfillment queue, or update stock. Its duplicate protection disappears on restart. Unpaid completed sessions are skipped, and later asynchronous payment events are ignored.

For a low-volume shop, a documented manual workflow using Stripe can be sufficient; a custom order database is not automatically mandatory. Stripe explicitly describes manual fulfillment as an option for low-volume ventures. However, do not mistake the current webhook for durable automatic fulfillment. [Stripe fulfillment guidance](https://docs.stripe.com/checkout/fulfillment)

Required outcome: choose and test a process that catches every paid order even if the customer closes the browser. Verify the purchased wood, feet, quantities, customer email, shipping address, paid status, and a unique reference are accessible to the person fulfilling it. Track shipped/refunded status outside volatile server logs. If accepting delayed payment methods, implement the later success/failure events; otherwise restrict launch to supported immediate-payment methods.

### 6. Receipt promises and shipping operations are not yet verified

The success page promises an emailed receipt and order details; the app itself sends neither. Enable and verify Stripe customer receipts and merchant payment notifications, and confirm what customization details actually appear in your chosen fulfillment view. [Stripe receipt settings](https://docs.stripe.com/receipts)

Current customer shipping charges are **$12 below a $150 subtotal and free at/above $150**. Verified examples: $128 board → $140 total; $142 board → $154; $225 board → $225, all before any tax. This is a fixed pricing policy, not a live Pirate Ship quote. Shipping is represented in Stripe as an ordinary product line named “Shipping,” not native shipping options; account for that in tax and reporting changes.

You can keep fixed pricing and manually buy Pirate Ship labels. Before launch, weigh and measure packed orders; test margins for distant destinations, multi-board orders, and every region you allow. Decide whether Alaska, Hawaii, territories, PO boxes, and military addresses are supported. Publish the service/transit expectations, tracking process, and damage/lost-package process. Do not call the displayed amount an exact carrier quote.

### 7. Returns and shipping policies need real business decisions

Evidence: `frontend/src/pages/Legal/LegalPages.tsx:412` says return/refund eligibility depends on circumstances without a concrete standard. Specify the request window, item condition, return-shipping responsibility, custom-order exceptions, cancellation cutoff, damage reporting, and refund timing. These are decisions for the business, not values to invent in code. Make the policy easy to find before payment.

The current production estimate is approximately 2–3 weeks before shipment. Distinguish production time from transit time and implement a delay-notification/consent/refund process. The FTC requires a reasonable basis for shipment representations and addresses what sellers must do when delays occur; general “estimates are not guarantees” language does not replace that process. [FTC shipping-rule guide](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule)

### 8. Food-safety and comparative claims need correction or substantiation

Evidence: `frontend/src/pages/LearnMore/LearnMore.tsx:149` says science proves wood does not allow bacterial growth compared with plastic. This is an overly broad objective safety claim. The nearby FDA/glue statements should also be checked against the precise cited provisions and the actual materials, finishes, and intended use.

Use careful, supportable product and care language; retain supplier documentation and supporting evidence. Legal disclaimers do not substitute for substantiating objective advertising claims. [FTC advertising guidance](https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business)

### 9. Dependencies and production deployment need a launch hardening pass

- `pom.xml:8` uses Spring Boot 3.3.6; the running package includes Tomcat 10.1.33. Spring Boot 3.3.x ended open-source support in June 2025. Move to a currently supported, patched release and retest. [Spring support announcement](https://spring.io/blog/2025/06/19/spring-boot-3-3-13-available-now/)
- `npm audit --omit=dev` reported two moderate affected packages, `react-router` and `react-router-dom`, at 6.30.4. Upgrade and reassess advisories against actual application usage. This audit did not demonstrate an exploit; some affected features are not used here. [React Router advisory](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2)
- Confirm hosting, DNS cutover, TLS, `SITE_BASE_URL`, `APP_BASE_URL`, Stripe live keys, the production webhook endpoint/signing secret, business verification/payouts, receipt settings, and support details. The current public domain is still parked on Squarespace.
- Verify production edge security headers, rate limits, request limits, log retention, uptime/error alerts, secret management, rollback, and account MFA. Local responses lacked several browser security headers, but the future proxy/host was not audited. No application health endpoint was available at `/actuator/health`; other health-check designs are possible.
- Docker builds currently skip tests and run without an explicit non-root user. Establish a release test gate and review image/build-context hygiene.

## Additional reliability and polish work

1. **Cart loss on temporary errors:** `frontend/src/lib/cart.tsx:52` replaces a saved cart after any retrieval error, not just a missing-cart response. Browser simulation of a 503 changed the cart ID and showed an empty cart. Preserve it and offer retry on transient failures.
2. **Cart storage is volatile:** all carts live in JVM memory. Restarts lose them and multiple independent instances do not share them. Choose an intentional single-instance/recovery strategy or persistent/shared cart state. Add expiration/limits; the maps currently grow without an expiry policy. Concurrent cart mutations also need review because inner maps are not synchronized.
3. **Mutation errors are invisible:** a simulated add-to-cart 500 produced an unhandled browser error with no visible customer error. Handle add/update/remove failures with clear recovery and accessible alerts.
4. **Cache policy:** `/index.html` is publicly cacheable for one year in the production profile. Versioned JS/CSS can have long caching; HTML and unversioned changing assets need different rules to avoid stale releases.
5. **Unknown routes:** missing products have a useful 404, but `/not-a-page` exposes Spring's generic Whitelabel error page. Add a branded fallback.
6. **Unfinished copy:** remove “Customer-ready MVP catalog” on the homepage. Resolve the “The Perfect Board” reference versus available products and confirm planned-product placeholders are intentional.
7. **Privacy accuracy:** the cookie policy says one local-storage entry, but iOS install-banner dismissal uses another. Align disclosures with actual storage/providers and decide retention/deletion procedures. Do not add an unnecessary consent banner solely because local storage exists; assess actual technologies and applicable laws.
8. **Business verification:** confirm legal seller identity/DBA, applicable registrations/local permits, rights to photos/logos, product-liability coverage, and a valid business contact process. These were not verifiable from source code. If you start marketing email, verify opt-in handling, a valid postal address, and unsubscribe compliance. [FTC CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
9. **Accessibility/performance:** basic mobile layout, labeled controls, drawer Escape behavior, and focus handling were checked, not full WCAG compliance. Complete keyboard/screen-reader, contrast, real iOS/Android, zoom, and slower-network checks. Local speed is not evidence of production performance.

## What passed

| Check | Result |
|---|---|
| Production package/frontend build; existing Java tests | Pass; 22 tests, no failures |
| Wood selection and bronze-feet pricing | Walnut plus bronze feet displayed $295 |
| Quantity update and page reload | Two Maple boards correctly totaled $450 and persisted across reload |
| Fixed shipping arithmetic | Correct for all three individual catalog products |
| Terms gate | Checkout disabled before consent; direct request without consent rejected with 400 |
| Invalid customization | Both feet options together rejected with 400 |
| Webhook authentication | Locally signed event 200; invalid signature 400; repeated valid event 200 with duplicate logged |
| Main routes and images | Checked pages loaded with no broken images detected |
| Mobile basics | No horizontal overflow at 390px on checked pages; menu navigation worked |
| Search metadata | robots.txt/sitemap available; product structured data present; cart and success marked noindex |

## Minimum launch rehearsal still required

On the intended deployment in Stripe test mode, test a successful payment, decline, authentication challenge, cancellation, double click/two tabs, network interruption after payment, and a customer who never reaches the success page. Confirm webhook retries and restart behavior, inventory/capacity rules, tax, shipping, receipts, and visible customization details. Exercise a refund and the support workflow. If delayed methods remain enabled, test their eventual success and failure.

Then walk one test order through the actual manual fulfillment checklist: identify it, confirm payment/address/options, prepare the correct package, obtain a shipping quote, record tracking, notify the customer, and mark fulfillment complete without duplication. Verify production configuration separately before switching to live payments.

**Bottom line:** the storefront foundation is viable. A custom customer-account system, live carrier-rate integration, and a large admin dashboard are not prerequisites. Reliable payment recovery, tax treatment, working support, truthful policies, an explicit stock/production model, patched dependencies, and an end-to-end order workflow are prerequisites for a responsible launch.
