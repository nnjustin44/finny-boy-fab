package com.finnyboyfab.store.cart;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.finnyboyfab.store.catalog.Product;
import com.finnyboyfab.store.catalog.ProductRepository;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CartService {

    private static final int FREE_SHIPPING_THRESHOLD_CENTS = 15000;
    private static final int FLAT_SHIPPING_CENTS = 1200;

    private final ProductRepository productRepository;
    private final Map<String, Map<String, Integer>> carts = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public CartService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public CartResponse createCart() {
        String cartId = UUID.randomUUID().toString();
        carts.put(cartId, new LinkedHashMap<>());
        return toResponse(cartId);
    }

    public CartResponse getCart(String cartId) {
        ensureCart(cartId);
        return toResponse(cartId);
    }

    public CartResponse addItem(String cartId, CartItemRequest request) {
        Map<String, Integer> cart = ensureCart(cartId);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        int nextQuantity = Math.min(product.inventory(), cart.getOrDefault(product.id(), 0) + request.quantity());
        cart.put(product.id(), nextQuantity);
        return toResponse(cartId);
    }

    public CartResponse updateItem(String cartId, String productId, int quantity) {
        Map<String, Integer> cart = ensureCart(cartId);
        if (quantity <= 0) {
            cart.remove(productId);
            return toResponse(cartId);
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        cart.put(productId, Math.min(product.inventory(), quantity));
        return toResponse(cartId);
    }

    public CartResponse removeItem(String cartId, String productId) {
        ensureCart(cartId).remove(productId);
        return toResponse(cartId);
    }

    public CheckoutResponse checkout(String cartId) {
        CartResponse cart = getCart(cartId);
        String orderNumber = "FBF-" + (100000 + random.nextInt(900000));
        carts.remove(cartId);
        return new CheckoutResponse(orderNumber, cart);
    }

    private Map<String, Integer> ensureCart(String cartId) {
        Map<String, Integer> cart = carts.get(cartId);
        if (cart == null) {
            throw new ResponseStatusException(NOT_FOUND, "Cart not found");
        }
        return cart;
    }

    private CartResponse toResponse(String cartId) {
        Map<String, Integer> cart = ensureCart(cartId);
        var lines = cart.entrySet().stream()
                .map(entry -> productRepository.findById(entry.getKey())
                        .map(product -> new CartLineResponse(product, entry.getValue(), product.priceCents() * entry.getValue()))
                        .orElse(null))
                .filter(line -> line != null)
                .toList();
        int subtotal = lines.stream().mapToInt(CartLineResponse::lineTotalCents).sum();
        int itemCount = lines.stream().mapToInt(CartLineResponse::quantity).sum();
        int shipping = subtotal == 0 || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
        return new CartResponse(cartId, lines, itemCount, subtotal, shipping, subtotal + shipping);
    }
}
