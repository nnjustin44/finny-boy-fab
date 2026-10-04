# Sales Tax Setup and Order Calculation

The storefront delegates order-level calculation to Stripe Tax. Do not hardcode one percentage: the applicable rate and shipping treatment can depend on the delivery address and the jurisdictions where the business is registered to collect.

## What the application sends

- Automatic tax is enabled on every Checkout Session.
- Stripe Checkout collects a United States shipping address.
- Every board is classified as Stripe tax code `txcd_99999999` (General — Tangible Goods) with tax added exclusively at checkout.
- The fixed shipping option is classified as `txcd_92010001` (Shipping) with tax added exclusively when the destination rules make it taxable.

Conceptually:

```text
taxable merchandise = sum of taxable board line amounts
taxable shipping    = shipping charge when taxable for the destination
tax                 = jurisdiction rates applied to those taxable amounts
order total         = merchandise + shipping + tax
```

Stripe performs the jurisdiction lookup, calculation, and rounding after the customer enters the shipping address. The application continues to calculate product and shipping prices; Stripe adds the tax amount.

## Required Stripe and government setup

1. Determine where Finny Boy Fab is legally required to collect. Because the shop operates in North Carolina, confirm North Carolina registration before collecting there. Review other states as sales create physical or economic nexus; do not add a registration merely because Stripe can calculate a rate.
2. Complete the relevant government registration before collecting tax.
3. In Stripe Dashboard, open **Tax → Registrations** and add the active registration for North Carolina and each other approved jurisdiction. A Stripe registration tells Stripe where to collect; it does not itself register the business with the government.
4. In **Tax settings**, enter the shop's complete North Carolina origin/head-office address and confirm the default tax behavior is compatible with the application's tax-exclusive prices.
5. Keep `STRIPE_AUTOMATIC_TAX_ENABLED=true`. The production launch gate refuses checkout when it is false.
6. Decide who files each return and remits the collected amount. Stripe calculation/reporting does not by itself complete the tax return or remit the money unless a separate filing service is engaged.

North Carolina generally taxes tangible personal property at the state rate plus applicable local/transit rates. Shipped sales are generally sourced to where the purchaser receives the item, and delivery charges connected with taxable goods can also be taxable. Use current NCDOR rules and rates rather than maintaining a rate table in this repository.

## Test-mode rehearsal

Before launch, create separate test checkouts for:

- an address in the shop's North Carolina county;
- North Carolina addresses in counties with different combined rates;
- an address in a state where there is no active collection obligation/registration;
- free shipping and the $12 fixed-shipping case;
- a refund of a taxed test order.

For each test, save the Checkout Session reference in the private release record and confirm:

- the board is classified as tangible goods;
- the shipping line has the Shipping tax code;
- the delivery address drives the jurisdiction shown by Stripe;
- the tax amount and taxable shipping treatment match the expected Stripe/NCDOR result;
- the receipt shows subtotal, shipping, tax, and total separately; and
- the Stripe Tax transaction/report contains the completed sale and the test refund is reflected correctly.

References: [Stripe Tax registrations](https://docs.stripe.com/api/tax/registrations), [Stripe general tangible-goods tax code](https://docs.stripe.com/api/tax_codes), [Stripe shipping tax code](https://docs.stripe.com/api/shipping_rates), [NCDOR taxable items](https://www.ncdor.gov/taxes-forms/sales-and-use-tax/taxable-items), [NCDOR sourcing guidance](https://www.ncdor.gov/sutb-2026pdf/open), and [NCDOR current rates](https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-rates).
