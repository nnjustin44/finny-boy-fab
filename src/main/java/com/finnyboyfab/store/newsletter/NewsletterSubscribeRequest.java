package com.finnyboyfab.store.newsletter;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record NewsletterSubscribeRequest(
        @NotBlank @Email String email,
        String firstName,
        String lastName
) {
}
