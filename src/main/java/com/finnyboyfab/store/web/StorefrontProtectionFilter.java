package com.finnyboyfab.store.web;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Small-shop defense in depth; production still needs a trusted HTTPS proxy and edge limits. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class StorefrontProtectionFilter extends OncePerRequestFilter {
    private final StorefrontConfiguration configuration;
    private final Set<String> allowedOrigins;
    private final boolean rateLimitEnabled;
    private final Map<String, Window> windows = new HashMap<>();
    private final Clock clock = Clock.systemUTC();

    public StorefrontProtectionFilter(StorefrontConfiguration configuration,
            @Value("${site.base-url}") String siteUrl,
            @Value("${store.allowed-origins:}") String additionalOrigins,
            @Value("${store.rate-limit-enabled:true}") boolean rateLimitEnabled) {
        this.configuration = configuration;
        this.rateLimitEnabled = rateLimitEnabled;
        this.allowedOrigins = new HashSet<>();
        allowedOrigins.add(siteUrl.replaceAll("/+$", ""));
        Arrays.stream(additionalOrigins.split(",")).map(String::trim).filter(s -> !s.isBlank())
                .map(s -> s.replaceAll("/+$", "")).forEach(allowedOrigins::add);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
        response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
        if (request.isSecure()) response.setHeader("Strict-Transport-Security", "max-age=31536000");
        if (path.startsWith("/api/") || path.equals("/healthz")) response.setHeader("Cache-Control", "no-store");

        boolean api = path.startsWith("/api/");
        boolean mutation = !Set.of("GET", "HEAD", "OPTIONS").contains(request.getMethod());
        boolean webhook = path.equals("/api/webhooks/stripe");
        if (api && mutation && !webhook) {
            String origin = request.getHeader("Origin");
            String fetchSite = request.getHeader("Sec-Fetch-Site");
            if ((origin == null || !allowedOrigins.contains(origin))
                    && !"same-origin".equals(fetchSite)) {
                reject(response, 403, "This request must come from the storefront.");
                return;
            }
            if (path.matches("/api/cart/[^/]+/checkout") && !configuration.checkoutEnabled()) {
                reject(response, 503, "The shop is not accepting online orders right now. Please check back soon.");
                return;
            }
        }
        String rateCategory = path.startsWith("/api/checkout/") ? "status"
                : path.equals("/api/cart") && "POST".equals(request.getMethod()) ? "cart-create"
                : path.equals("/api/newsletter/subscribe") ? "newsletter" : "mutation";
        if (api && !webhook && (mutation || path.startsWith("/api/checkout/")) && rateLimitEnabled
                && !permit(request.getRemoteAddr(), rateCategory)) {
            response.setHeader("Retry-After", "60");
            reject(response, 429, "Too many requests. Please wait a minute and try again.");
            return;
        }
        if (api && mutation) {
            int maxBytes = webhook ? 262144 : 65536;
            if (request.getContentLengthLong() > maxBytes) {
                reject(response, 413, "Request body is too large.");
                return;
            }
            byte[] body = request.getInputStream().readNBytes(maxBytes + 1);
            if (body.length > maxBytes) {
                reject(response, 413, "Request body is too large.");
                return;
            }
            chain.doFilter(new BufferedRequest(request, body), response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private synchronized boolean permit(String remoteAddress, String category) {
        long minute = clock.millis() / 60000;
        windows.entrySet().removeIf(entry -> entry.getValue().minute != minute);
        String key = remoteAddress + ":" + category;
        // Bounded memory even when many IPs submit requests. Fail closed until next window.
        if (!windows.containsKey(key) && windows.size() >= 10000) return false;
        Window window = windows.computeIfAbsent(key, ignored -> new Window(minute));
        int limit = switch (category) {
            case "cart-create" -> 20;
            case "newsletter" -> 10;
            case "status" -> 60;
            default -> 120;
        };
        return ++window.requests <= limit;
    }

    private void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    private static final class Window {
        private final long minute;
        private int requests;
        private Window(long minute) { this.minute = minute; }
    }

    private static final class BufferedRequest extends HttpServletRequestWrapper {
        private final byte[] body;
        private BufferedRequest(HttpServletRequest request, byte[] body) { super(request); this.body = body; }
        @Override public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override public int read() { return input.read(); }
                @Override public int read(byte[] buffer, int offset, int length) { return input.read(buffer, offset, length); }
                @Override public boolean isFinished() { return input.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) { throw new UnsupportedOperationException("Synchronous JSON endpoint"); }
            };
        }
    }
}
