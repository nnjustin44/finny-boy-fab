package com.finnyboyfab.store.checkout;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final StripeCheckoutService stripeCheckoutService;

    public CheckoutController(StripeCheckoutService stripeCheckoutService) {
        this.stripeCheckoutService = stripeCheckoutService;
    }

    @GetMapping("/sessions/{sessionId}")
    public CheckoutStatusResponse getSession(@PathVariable String sessionId) {
        return stripeCheckoutService.getSessionStatus(sessionId);
    }
}
