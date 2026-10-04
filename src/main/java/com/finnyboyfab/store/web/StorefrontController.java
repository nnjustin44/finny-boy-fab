package com.finnyboyfab.store.web;

import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finnyboyfab.store.persistence.LocalStore;

@RestController
public class StorefrontController {
    private final StorefrontConfiguration configuration;
    private final LocalStore store;

    public StorefrontController(StorefrontConfiguration configuration,
            LocalStore store) {
        this.configuration = configuration;
        this.store = store;
    }

    @GetMapping("/api/storefront")
    public ResponseEntity<PublicSettings> settings() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new PublicSettings(
                configuration.supportEmail(), configuration.checkoutEnabled(), configuration.madeToOrder()));
    }

    /** Deliberately exposes no keys, filesystem paths, or order information. */
    @GetMapping("/healthz")
    public ResponseEntity<Map<String, String>> health() {
        boolean healthy = store.healthy();
        return ResponseEntity.status(healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .cacheControl(CacheControl.noStore())
                .body(Map.of("status", healthy ? "UP" : "DOWN"));
    }

    public record PublicSettings(String supportEmail, boolean checkoutEnabled, boolean madeToOrder) {}
}
