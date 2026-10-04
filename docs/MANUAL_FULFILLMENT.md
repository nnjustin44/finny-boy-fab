# Manual Order Fulfillment Checklist

This is a manual operating procedure using Stripe Dashboard records and Pirate Ship. It assumes no application-to-Stripe or application-to-Pirate Ship fulfillment integration. Keep customer/order records in an access-controlled business location; never put passwords, API keys, webhook secrets, card data, or other credentials in this checklist or its order log.

The current application durably records a small payment-coordination summary, but it does not provide a fulfillment queue. Treat the Stripe Dashboard as the payment source of truth, and maintain the separate order log below. Do not fulfill from a browser success page, email notification alone, or an unverified cart.

## 1. Prepare before taking orders

- [ ] Confirm the Stripe account is in the intended mode (test for rehearsal; live only when launch is authorized) and that Dashboard access is limited to the people doing fulfillment.
- [ ] In Stripe Dashboard settings, confirm successful-payment and refund customer emails are enabled if the business intends Stripe to send them. Send a test where practical and verify the customer email and displayed business information.
- [ ] Confirm the Stripe public business details show the approved legal business name, support address, support email, and privacy-policy URL required for receipts. Do not assume a storefront receipt promise is fulfilled until settings and delivery have been checked.
- [ ] Confirm that the selected payment/Checkout details expose the information the fulfiller needs: paid status, customer email, ship-to address, product, quantity, wood, feet/options, amount, and unique Stripe references. If a required field is missing or ambiguous, stop and resolve the order through the configured customer-contact route before making a label.
- [ ] Set an access-controlled order-log location and identify a backup operator. Keep only information needed to fulfill, support, refund, and reconcile orders; do not copy full payment-card details.
- [ ] Confirm the published production estimate, destination coverage, fixed shipping prices, package weights/dimensions, and who monitors delay notices and disputes.
- [ ] Rehearse one test order from successful payment through a voided test label or other safe test-mode practice, and verify a refund workflow before live sales.

Stripe references: [receipts and customer email settings](https://docs.stripe.com/receipts), [Dashboard search](https://docs.stripe.com/dashboard/search).

## 2. Daily payment review and order log

At least once each business day on which orders may arrive:

1. Open the correct Stripe account and mode. Review recent payments and identify each completed order.
2. Fulfill only an order whose Stripe record confirms that payment succeeded and is not canceled or fully refunded. Pending, processing, failed, canceled, and unpaid sessions are **not** fulfillment-ready. For a delayed payment method, wait for Stripe to show successful payment.
3. Open the successful payment and its related Checkout Session details. Compare its line items, quantity, customer email, shipping address, customer selections, and total. Check any order or Session metadata present. Do not infer a wood or hardware option from a product photo, default, or customer memory.
4. If payment status, address, item, quantity, or customization does not match or is unavailable, place the order on **HOLD**. Do not buy postage or begin production until the discrepancy is resolved and recorded.
5. Add one row to the order log before fulfillment. Use the Stripe Checkout Session ID as the primary order reference and record the PaymentIntent/charge ID when available. Stripe IDs, rather than a customer name, are the unique matching key.

Suggested order-log fields:

| Field | What to record |
| --- | --- |
| Stripe Checkout Session ID | Primary unique reference |
| PaymentIntent ID / charge ID | Related Stripe payment reference, when available |
| Paid timestamp and amount | As shown in Stripe |
| Customer email | For order communication |
| Product, quantity, wood, feet/options | Exact paid configuration |
| Ship-to address | Exact verified address from the paid order |
| Fulfillment status | `HOLD`, `PAID—READY`, `IN PRODUCTION`, `LABEL PURCHASED`, `SHIPPED`, `CANCELED`, `REFUNDED`, or `DISPUTE` |
| Pirate Ship shipment/label reference | Internal shipment reference; do not store credentials |
| Carrier, tracking number, ship date | Exactly as shown on the purchased label/receipt |
| Refund status/reference | Amount, reason, Stripe refund ID/status, and date if refunded |
| Notes and operator | Concise resolution history and initials/name |

Keep payment state and fulfillment state separate. A paid order can still be on hold, in production, or not yet shipped.

## 3. Confirm order and prepare the package

- [ ] Verify the order is still paid and has not been canceled, refunded, or put into a dispute hold since the daily review.
- [ ] Confirm the exact paid board, quantity, wood, feet/options, and address against the Stripe order detail and order log.
- [ ] Check the board and included parts against that configuration. Record any discrepancy and pause if it does not match.
- [ ] Pack the order, then measure and weigh the actual packed parcel. Use those values for the manual Pirate Ship quote; do not describe the storefront's fixed shipping charge as an exact carrier quote.
- [ ] Confirm the destination is within the shop's current service area and that the chosen service matches any delivery representation made to the customer. If the destination is unsupported or the cost/service differs materially, pause and contact the customer before shipment.

## 4. Buy the label in Pirate Ship and record tracking

- [ ] Create the shipment manually in Pirate Ship using the verified recipient address and actual packed weight/dimensions.
- [ ] Review the address, carrier, service, label price, and tracking number before purchase.
- [ ] After purchase, save the label receipt or shipment record in the controlled order folder. Add the Pirate Ship reference, carrier, tracking number, ship date, and final carrier charge to the order log.
- [ ] Mark the order `SHIPPED` only after the parcel is handed to the carrier or accepted at a drop-off point. Keep the acceptance receipt when one is available.
- [ ] Send the customer the tracking information through the configured customer-contact or shipping-notification channel. Record the date and channel. Do not state an arrival date unless supported by the carrier and applicable customer promise.
- [ ] Reconcile the final carrier charge against the order's collected shipping amount and note any margin issue for the owner.

Stripe's dispute guidance identifies carrier, ship date, delivery date, tracking number, and tracking status as relevant shipment evidence: [Stripe dispute evidence guide](https://docs.stripe.com/disputes/visual-evidence).

## 5. Production delays, customer consent, and refunds

- [ ] Review open paid orders against the production/shipment estimate at least each business day. Escalate any order that may miss the stated shipment time early enough to give the customer meaningful notice.
- [ ] If the shop cannot ship within the promised time, promptly send the required delay-option notice using a working channel. Include a definite revised shipment date if one can reasonably be provided; otherwise say the date is unknown and provide the reason. Offer the choice to accept the delay or cancel for a full, prompt refund.
- [ ] As an operating practice, obtain and save the customer's explicit response before extending a delayed order. Do not treat silence as agreement in this checklist. Apply the FTC's specific notice, timing, cancellation, and refund requirements; later delay notices have additional rules and cannot rely on silence.
- [ ] If the customer cancels, does not consent where required, the shop cannot meet a revised date, or the item cannot be shipped, cancel the order and promptly issue the required full refund. Include the full amount tendered for unshipped merchandise as required, including applicable shipping/handling charges.
- [ ] In Stripe Dashboard, confirm the original payment, issue the refund to the original payment method, choose an accurate reason, and record the Stripe refund reference and resulting status. Do not mark `REFUNDED` until Stripe shows the refund was submitted/succeeded as applicable; investigate pending or failed refunds and keep the customer informed.
- [ ] If a refund is pending or fails, follow its Stripe status and resolve it. Stripe notes that a refund can remain pending due to insufficient available balance or fail; a failed refund may require another way to pay the customer.
- [ ] Record the notice, the customer's response, cancellation, refund amount, and dates in the order log. A refund does not delete the original order/payment record.

The FTC guide explains the shipment representation, delay-notice, consent/cancellation, and prompt-refund requirements. Its timing rules are fact-dependent; the guide says a required refund is generally due within seven working days after the right to refund vests for payment methods such as third-party credit cards: [FTC Business Guide](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule). Stripe's Dashboard supports payment refunds and shows refund status: [Stripe refunds](https://docs.stripe.com/refunds).

## 6. Customer-initiated refund, damage, or incorrect item

- [ ] Match the request to the Stripe Session/payment ID and check the approved customer-facing policy version shown for that order. Do not apply an unapproved draft return policy.
- [ ] For a no-questions return, compare the request date with the carrier-recorded delivery date. Accept a request made within 14 calendar days without requiring a reason, provide the approved return instructions, and record the request and return tracking.
- [ ] For a one-year deformation warranty claim, compare the request date with delivery, collect photographs and the order reference, and determine whether the deformation is attributable to workmanship/construction or wood movement. Ask whether the board was placed in a dishwasher because that voids this limited warranty; record the response and resolution.
- [ ] Record what the customer reports, relevant photos, item/options, package condition, delivery/tracking status, and the resolution agreed.
- [ ] For damage or an incorrect configuration, compare the report with the paid order and packing record; decide whether to replace, refund, or take another action under the approved policy and applicable law.
- [ ] If refunding, use the original Stripe payment in Dashboard, select the accurate reason, and record the amount, Stripe refund ID/status, and date. Confirm any refund notice settings and message the customer through the working support route.
- [ ] If the customer returns an item, record return tracking and receipt/inspection outcome before resolving the refund under the approved policy.

Stripe's Dashboard refund instructions: [Stripe refunds](https://docs.stripe.com/refunds). Stripe states refunds can only go to the original payment method and can have pending or failed statuses; do not promise a bank-posting date controlled by the issuer.

## 7. Daily reconciliation and dispute review

- [ ] Compare successful payments in Stripe for the review period against the order log. Every successful payment must have one matching Session/payment reference and a clear next status.
- [ ] Check Stripe for refunded, partially refunded, disputed, and pending transactions. Reconcile each to the log; investigate missing rows, duplicate rows, unexplained amount differences, and orders with no status movement.
- [ ] Check the Stripe Dashboard for new disputes and response deadlines. Assign an owner immediately; do not let a dispute wait for the next routine review.
- [ ] Gather the paid order details and the contemporaneous record: policy version shown at purchase, customer messages, order confirmation/receipt, Session/payment ID, verified address, label/shipping receipt, tracking history, delivery status, and any refund details. Submit only accurate, relevant evidence through the Dashboard by its displayed deadline.
- [ ] Record the dispute ID, reason, response deadline, assigned person, evidence submitted, and outcome in the order log. If a refund is pending when a dispute arrives, check Stripe's guidance before issuing another refund to avoid a duplicate reimbursement.

Stripe references: [Dashboard search](https://docs.stripe.com/dashboard/search), [sample dispute evidence](https://docs.stripe.com/disputes/visual-evidence), and [refund handling](https://docs.stripe.com/refunds).

## 8. Close-out and access

- [ ] Confirm every paid order has a next action or terminal status, every shipped order has tracking recorded, and every canceled/refunded order has the corresponding Stripe reference.
- [ ] Keep the order log and supporting records in the approved access-controlled business location and follow the business's retention policy. Restrict access to staff who need it.
- [ ] Never record full card numbers, CVCs, passwords, Stripe API keys, webhook signing secrets, Pirate Ship credentials, or recovery codes in order notes, this file, or the fulfillment log.
