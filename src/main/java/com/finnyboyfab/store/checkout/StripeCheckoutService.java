package com.finnyboyfab.store.checkout;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.finnyboyfab.store.cart.CartLineResponse;
import com.finnyboyfab.store.cart.CartResponse;
import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

@Service
public class StripeCheckoutService {

    private final StripeClient stripeClient;
    private final String appBaseUrl;

    public StripeCheckoutService(
            @Value("${stripe.secret-key:}") String secretKey,
            @Value("${stripe.app-base-url:http://localhost:8080}") String appBaseUrl
    ) {
        this.stripeClient = secretKey.isBlank() ? null : new StripeClient(secretKey);
        this.appBaseUrl = appBaseUrl.replaceAll("/+$", "");
    }

    public CheckoutSessionResponse createSession(CartResponse cart) {
        SessionCreateParams.Builder params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setClientReferenceId(cart.id())
                .putMetadata("cart_id", cart.id())
                .setSuccessUrl(appBaseUrl + "/checkout/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(appBaseUrl + "/cart")
                .setShippingAddressCollection(
                        SessionCreateParams.ShippingAddressCollection.builder()
                                .addAllowedCountry(SessionCreateParams.ShippingAddressCollection.AllowedCountry.US)
                                .build())
                .setPhoneNumberCollection(
                        SessionCreateParams.PhoneNumberCollection.builder()
                                .setEnabled(true)
                                .build());

        cart.items().forEach(line -> params.addLineItem(toStripeLineItem(line)));
        if (cart.estimatedShippingCents() > 0) {
            params.addLineItem(shippingLineItem(cart.estimatedShippingCents()));
        }

        try {
            Session session = requireClient().v1().checkout().sessions().create(params.build());
            if (session.getUrl() == null || session.getUrl().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe did not return a checkout URL");
            }
            return new CheckoutSessionResponse(session.getId(), session.getUrl());
        } catch (StripeException exception) {
            throw stripeFailure("Unable to start Stripe Checkout", exception);
        }
    }

    public CheckoutStatusResponse getSessionStatus(String sessionId) {
        try {
            Session session = requireClient().v1().checkout().sessions().retrieve(sessionId);
            return new CheckoutStatusResponse(session.getId(), session.getStatus(), session.getPaymentStatus());
        } catch (StripeException exception) {
            throw stripeFailure("Unable to verify Stripe Checkout", exception);
        }
    }

    private SessionCreateParams.LineItem toStripeLineItem(CartLineResponse line) {
        long unitAmount = line.lineTotalCents() / line.quantity();
        SessionCreateParams.LineItem.PriceData.ProductData.Builder productData =
                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(line.product().name());
        String description = customizationDescription(line);
        if (!description.isBlank()) {
            productData.setDescription(description);
        }

        return SessionCreateParams.LineItem.builder()
                .setQuantity((long) line.quantity())
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency("usd")
                        .setUnitAmount(unitAmount)
                        .setProductData(productData.build())
                        .build())
                .build();
    }

    private SessionCreateParams.LineItem shippingLineItem(int shippingCents) {
        return SessionCreateParams.LineItem.builder()
                .setQuantity(1L)
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency("usd")
                        .setUnitAmount((long) shippingCents)
                        .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                .setName("Shipping")
                                .build())
                        .build())
                .build();
    }

    private String customizationDescription(CartLineResponse line) {
        List<String> details = new ArrayList<>();
        if (!line.selectedWood().isBlank()) {
            details.add("Wood: " + line.selectedWood());
        }
        if (line.rubberFeet()) {
            details.add("Rubber feet");
        }
        if (line.initialsEngraving()) {
            details.add("Initials engraving: " + line.initials());
        }
        return String.join(" | ", details);
    }

    private StripeClient requireClient() {
        if (stripeClient == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe is not configured. Set the STRIPE_SECRET_KEY environment variable.");
        }
        return stripeClient;
    }

    private ResponseStatusException stripeFailure(String message, StripeException exception) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message, exception);
    }
}
