package com.finnyboyfab.store.newsletter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MailchimpService {

    private final String apiKey;
    private final String audienceId;
    private final RestClient.Builder restClientBuilder;

    @Autowired
    public MailchimpService(
            @Value("${mailchimp.api-key:${MAILCHIMP_API_KEY:}}") String apiKey,
            @Value("${mailchimp.audience-id:${MAILCHIMP_AUDIENCE_ID:}}") String audienceId
    ) {
        this(apiKey, audienceId, RestClient.builder());
    }

    MailchimpService(String apiKey, String audienceId, RestClient.Builder restClientBuilder) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.audienceId = audienceId == null ? "" : audienceId.trim();
        this.restClientBuilder = restClientBuilder;
    }

    public NewsletterSubscribeResponse subscribe(NewsletterSubscribeRequest request) {
        ensureConfigured();

        String email = normalizeEmail(request.email());
        String subscriberHash = subscriberHash(email);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email_address", email);
        body.put("status_if_new", "subscribed");

        Map<String, String> mergeFields = mergeFields(request);
        if (!mergeFields.isEmpty()) {
            body.put("merge_fields", mergeFields);
        }

        try {
            mailchimpClient()
                    .put()
                    .uri("/lists/{audienceId}/members/{subscriberHash}", audienceId, subscriberHash)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            return new NewsletterSubscribeResponse("subscribed");
        } catch (RestClientResponseException ex) {
            throw mailchimpFailure(ex);
        }
    }

    private RestClient mailchimpClient() {
        String serverPrefix = serverPrefix(apiKey);
        String token = Base64.getEncoder()
                .encodeToString(("anystring:" + apiKey).getBytes(StandardCharsets.UTF_8));
        return restClientBuilder
                .baseUrl("https://" + serverPrefix + ".api.mailchimp.com/3.0")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + token)
                .build();
    }

    private void ensureConfigured() {
        if (apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "MAILCHIMP_API_KEY is not configured");
        }
        if (audienceId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "MAILCHIMP_AUDIENCE_ID is not configured");
        }
        serverPrefix(apiKey);
    }

    private ResponseStatusException mailchimpFailure(RestClientResponseException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == HttpStatus.BAD_REQUEST) {
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mailchimp rejected the subscription request");
        }
        if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.FORBIDDEN || status == HttpStatus.NOT_FOUND) {
            return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Mailchimp is not configured correctly");
        }
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Mailchimp subscription failed");
    }

    private Map<String, String> mergeFields(NewsletterSubscribeRequest request) {
        Map<String, String> mergeFields = new LinkedHashMap<>();
        if (request.firstName() != null && !request.firstName().isBlank()) {
            mergeFields.put("FNAME", request.firstName().trim());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            mergeFields.put("LNAME", request.lastName().trim());
        }
        return mergeFields;
    }

    static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    static String subscriberHash(String email) {
        try {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            byte[] digest = md5.digest(normalizeEmail(email).getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte value : digest) {
                hash.append(String.format("%02x", value));
            }
            return hash.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("MD5 digest is unavailable", ex);
        }
    }

    static String serverPrefix(String apiKey) {
        int separator = apiKey.lastIndexOf('-');
        if (separator < 0 || separator == apiKey.length() - 1) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "MAILCHIMP_API_KEY must include a data center suffix"
            );
        }
        return apiKey.substring(separator + 1);
    }
}
