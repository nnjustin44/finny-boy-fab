package com.finnyboyfab.store.newsletter;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MailchimpServiceTests {

    @Test
    void derivesServerPrefixFromApiKey() {
        assertThat(MailchimpService.serverPrefix("abc123-us1")).isEqualTo("us1");
    }

    @Test
    void rejectsApiKeyWithoutServerPrefix() {
        assertThatThrownBy(() -> MailchimpService.serverPrefix("abc123"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("MAILCHIMP_API_KEY must include a data center suffix");
    }

    @Test
    void normalizesEmailBeforeSubscriberHash() {
        assertThat(MailchimpService.normalizeEmail(" User@Example.COM "))
                .isEqualTo("user@example.com");
        assertThat(MailchimpService.subscriberHash(" User@Example.COM "))
                .isEqualTo(MailchimpService.subscriberHash("user@example.com"));
    }
}
