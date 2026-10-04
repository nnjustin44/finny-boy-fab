package com.finnyboyfab.store.web;

import java.net.URI;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Public, non-secret storefront settings and an explicit production launch gate. */
@Component
public class StorefrontConfiguration {
    private final String supportEmail;
    private final boolean checkoutEnabled;
    private final boolean madeToOrder;

    public StorefrontConfiguration(
            @Value("${store.support-email:}") String supportEmail,
            @Value("${store.checkout-enabled:true}") boolean checkoutEnabled,
            @Value("${store.made-to-order:false}") boolean madeToOrder,
            @Value("${store.launch-reviewed:false}") boolean launchReviewed,
            @Value("${site.base-url}") String siteUrl,
            @Value("${stripe.app-base-url}") String appUrl,
            @Value("${stripe.secret-key:}") String stripeKey,
            @Value("${stripe.webhook-secret:}") String webhookSecret,
            @Value("${stripe.automatic-tax-enabled:true}") boolean automaticTax,
            Environment environment) {
        this.supportEmail = supportEmail.trim();
        this.checkoutEnabled = checkoutEnabled && !stripeKey.isBlank();
        this.madeToOrder = madeToOrder;
        if (!this.supportEmail.isEmpty() && !this.supportEmail.matches("[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")) {
            throw new IllegalStateException("SUPPORT_EMAIL must be a single valid public email address");
        }
        boolean production = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (production && checkoutEnabled) {
            if (this.supportEmail.isBlank() || !madeToOrder) {
                throw new IllegalStateException("Before enabling production checkout, configure SUPPORT_EMAIL and confirm MADE_TO_ORDER=true. Finite-stock sales require an inventory system.");
            }
            if (!httpsOrigin(siteUrl) || !httpsOrigin(appUrl) || !siteUrl.replaceAll("/+$", "").equals(appUrl.replaceAll("/+$", ""))) {
                throw new IllegalStateException("SITE_BASE_URL and APP_BASE_URL must be the same public HTTPS origin");
            }
            if (stripeKey.isBlank() || webhookSecret.isBlank() || !automaticTax) {
                throw new IllegalStateException("Production checkout requires Stripe credentials, webhook signing secret, and automatic tax enabled");
            }
            boolean liveStripeKey = stripeKey.startsWith("sk_live_") || stripeKey.startsWith("rk_live_");
            if (liveStripeKey && !launchReviewed) {
                throw new IllegalStateException("Live Stripe checkout requires completion of LAUNCH_CHECKLIST.md and LAUNCH_REVIEWED=true");
            }
        }
    }

    private static boolean httpsOrigin(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    && uri.getQuery() == null && uri.getFragment() == null
                    && (uri.getPath().isEmpty() || "/".equals(uri.getPath()));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    public String supportEmail() { return supportEmail; }
    public boolean checkoutEnabled() { return checkoutEnabled; }
    public boolean madeToOrder() { return madeToOrder; }
}
