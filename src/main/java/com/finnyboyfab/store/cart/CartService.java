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

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CartService {

    private static final int FREE_SHIPPING_THRESHOLD_CENTS = 15000;
    private static final int FLAT_SHIPPING_CENTS = 1200;
    private static final int RUBBER_FEET_CENTS = 1000;
    private static final int INITIALS_ENGRAVING_CENTS = 1000;

    private final ProductRepository productRepository;
    private final Map<String, Map<String, CartLineItem>> carts = new ConcurrentHashMap<>();
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
        Map<String, CartLineItem> cart = ensureCart(cartId);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        CartLineItem requestedLine = toLineItem(product, request);
        CartLineItem existingLine = cart.get(requestedLine.id());
        int existingQuantity = existingLine == null ? 0 : existingLine.quantity();
        int nextQuantity = Math.min(product.inventory(), existingQuantity + request.quantity());
        cart.put(requestedLine.id(), requestedLine.withQuantity(nextQuantity));
        return toResponse(cartId);
    }

    public CartResponse updateItem(String cartId, String lineId, int quantity) {
        Map<String, CartLineItem> cart = ensureCart(cartId);
        if (quantity <= 0) {
            cart.remove(lineId);
            return toResponse(cartId);
        }

        CartLineItem line = cart.get(lineId);
        if (line == null) {
            throw new ResponseStatusException(NOT_FOUND, "Cart line not found");
        }
        Product product = productRepository.findById(line.productId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        cart.put(lineId, line.withQuantity(Math.min(product.inventory(), quantity)));
        return toResponse(cartId);
    }

    public CartResponse removeItem(String cartId, String lineId) {
        ensureCart(cartId).remove(lineId);
        return toResponse(cartId);
    }

    public CheckoutResponse checkout(String cartId) {
        CartResponse cart = getCart(cartId);
        String orderNumber = "FBF-" + (100000 + random.nextInt(900000));
        carts.remove(cartId);
        return new CheckoutResponse(orderNumber, cart);
    }

    private Map<String, CartLineItem> ensureCart(String cartId) {
        Map<String, CartLineItem> cart = carts.get(cartId);
        if (cart == null) {
            throw new ResponseStatusException(NOT_FOUND, "Cart not found");
        }
        return cart;
    }

    private CartLineItem toLineItem(Product product, CartItemRequest request) {
        String initials = sanitizeInitials(request.initials());
        if (request.initialsEngraving() && initials.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Initials are required for engraving");
        }

        String selectedWood = selectedWood(product, request.selectedWood());
        String baseId = product.id() + ":" + selectedWood.toLowerCase();

        String lineId = baseId;
        if (request.rubberFeet()) {
            lineId += ":rubber-feet";
        }
        if (request.initialsEngraving()) {
            lineId += ":initials:" + initials;
        }
        if (!request.rubberFeet() && !request.initialsEngraving()) {
            lineId += ":standard";
        }

        return new CartLineItem(
                lineId,
                product.id(),
                request.quantity(),
                selectedWood,
                request.rubberFeet(),
                request.initialsEngraving(),
                request.initialsEngraving() ? initials : "");
    }

    private String selectedWood(Product product, String requestedWood) {
        if (product.woodOptions().isEmpty()) {
            return "";
        }

        if (requestedWood == null || requestedWood.isBlank()) {
            return product.woodOptions().get(0);
        }

        return product.woodOptions().stream()
                .filter(option -> option.equalsIgnoreCase(requestedWood.trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Selected wood is not available for this product"));
    }

    private String sanitizeInitials(String initials) {
        if (initials == null) {
            return "";
        }
        String normalizedInitials = initials.trim().toUpperCase().replaceAll("[^A-Z]", "");
        if (normalizedInitials.length() > 3) {
            return normalizedInitials.substring(0, 3);
        }
        return normalizedInitials;
    }

    private CartResponse toResponse(String cartId) {
        Map<String, CartLineItem> cart = ensureCart(cartId);
        var lines = cart.values().stream()
                .map(line -> productRepository.findById(line.productId())
                        .map(product -> {
                            int addOnCents = addOnPriceCents(line);
                            return new CartLineResponse(
                                    line.id(),
                                    product,
                                    line.quantity(),
                                    line.selectedWood(),
                                    line.rubberFeet(),
                                    line.initialsEngraving(),
                                    line.initials(),
                                    addOnCents * line.quantity(),
                                    (product.priceCents() + addOnCents) * line.quantity()
                            );
                        })
                        .orElse(null))
                .filter(line -> line != null)
                .toList();
        int subtotal = lines.stream().mapToInt(CartLineResponse::lineTotalCents).sum();
        int itemCount = lines.stream().mapToInt(CartLineResponse::quantity).sum();
        int shipping = subtotal == 0 || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
        return new CartResponse(cartId, lines, itemCount, subtotal, shipping, subtotal + shipping);
    }

    private int addOnPriceCents(CartLineItem line) {
        int addOnCents = 0;
        if (line.rubberFeet()) {
            addOnCents += RUBBER_FEET_CENTS;
        }
        if (line.initialsEngraving()) {
            addOnCents += INITIALS_ENGRAVING_CENTS;
        }
        return addOnCents;
    }
}
