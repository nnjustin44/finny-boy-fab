package com.finnyboyfab.store.checkout;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StripeWebhookControllerTests {

    private StripeWebhookService stripeWebhookService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        stripeWebhookService = mock(StripeWebhookService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new StripeWebhookController(stripeWebhookService))
                .build();
    }

    @Test
    void forwardsRawPayloadAndSignature() throws Exception {
        String payload = "{\"id\":\"evt_123\"}";

        mockMvc.perform(post("/api/webhooks/stripe")
                        .contentType("application/json")
                        .header("Stripe-Signature", "t=123,v1=signature")
                        .content(payload))
                .andExpect(status().isOk());

        verify(stripeWebhookService).process(payload, "t=123,v1=signature");
    }
}
