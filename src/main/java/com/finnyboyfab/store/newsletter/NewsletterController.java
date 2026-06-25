package com.finnyboyfab.store.newsletter;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {

    private final MailchimpService mailchimpService;

    public NewsletterController(MailchimpService mailchimpService) {
        this.mailchimpService = mailchimpService;
    }

    @PostMapping("/subscribe")
    public NewsletterSubscribeResponse subscribe(@Valid @RequestBody NewsletterSubscribeRequest request) {
        return mailchimpService.subscribe(request);
    }
}
