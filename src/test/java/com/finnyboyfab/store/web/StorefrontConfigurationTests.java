package com.finnyboyfab.store.web;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StorefrontConfigurationTests {
    private final Environment production = productionEnvironment();

    @Test
    void testModeCheckoutCanBeRehearsedBeforeFinalLiveApproval() {
        StorefrontConfiguration configuration = configuration("sk_test_example", false);
        assertThat(configuration.checkoutEnabled()).isTrue();
    }

    @Test
    void liveModeCheckoutRequiresFinalApproval() {
        assertThatThrownBy(() -> configuration("sk_live_example", false))
                .hasMessageContaining("LAUNCH_REVIEWED=true");
    }

    @Test
    void missingStripeKeyIsNotAdvertisedAsAvailableOutsideProduction() {
        Environment local = mock(Environment.class);
        when(local.getActiveProfiles()).thenReturn(new String[] {"local"});
        StorefrontConfiguration configuration = new StorefrontConfiguration(
                "finnyboyfab@gmail.com", true, true, false,
                "http://localhost:8080", "http://localhost:8080", "", "", true, local);
        assertThat(configuration.checkoutEnabled()).isFalse();
    }

    private StorefrontConfiguration configuration(String stripeKey, boolean launchReviewed) {
        return new StorefrontConfiguration(
                "finnyboyfab@gmail.com", true, true, launchReviewed,
                "https://finnyboyfab.com", "https://finnyboyfab.com",
                stripeKey, "whsec_example", true, production);
    }

    private static Environment productionEnvironment() {
        Environment environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
        return environment;
    }
}
