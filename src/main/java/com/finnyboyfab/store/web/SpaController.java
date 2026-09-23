package com.finnyboyfab.store.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.HtmlUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finnyboyfab.store.catalog.Product;
import com.finnyboyfab.store.catalog.ProductRepository;

@Controller
public class SpaController {

    private static final String SEO_START = "<!-- SEO_META_START -->";
    private static final String SEO_END = "<!-- SEO_META_END -->";
    private static final String INDEX_ROBOTS =
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    private static final String NO_INDEX_ROBOTS = "noindex, follow";

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;
    private final String siteBaseUrl;

    public SpaController(
            ProductRepository productRepository,
            ObjectMapper objectMapper,
            @Value("${site.base-url}") String siteBaseUrl
    ) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
        this.siteBaseUrl = siteBaseUrl.replaceAll("/+$", "");
    }

    @GetMapping({
            "/",
            "/home",
            "/shop",
            "/about",
            "/learn",
            "/contact",
            "/custom-inquiry",
            "/cart",
            "/privacy",
            "/cookies",
            "/terms",
            "/checkout/success",
            "/products/{slug}"
    })
    @ResponseBody
    public ResponseEntity<String> app(HttpServletRequest request) throws IOException {
        String path = request.getRequestURI();
        Product product = productForPath(path);
        PageMetadata metadata = metadataFor(path, product);
        HttpStatus status = path.startsWith("/products/") && product == null
                ? HttpStatus.NOT_FOUND
                : HttpStatus.OK;

        return ResponseEntity.status(status)
                .contentType(MediaType.TEXT_HTML)
                .cacheControl(CacheControl.noCache())
                .body(renderIndex(metadata, product));
    }

    private Product productForPath(String path) {
        if (!path.startsWith("/products/")) {
            return null;
        }
        String slug = path.substring("/products/".length());
        return productRepository.findBySlug(slug).orElse(null);
    }

    private PageMetadata metadataFor(String path, Product product) {
        if (path.startsWith("/products/")) {
            if (product == null) {
                return new PageMetadata(
                        "Product Not Found | Finny Boy Fab",
                        "The requested Finny Boy Fab product could not be found.",
                        path,
                        "/images/optimized/hero-boards.jpg",
                        false,
                        "website");
            }
            return new PageMetadata(
                    product.name() + " | Finny Boy Fab",
                    product.description() + " " + product.wood() + ". " + product.dimensions() + ".",
                    path,
                    product.imageUrl(),
                    true,
                    "product");
        }

        return switch (path) {
            case "/", "/home" -> new PageMetadata(
                    "Handcrafted Cutting Boards | Finny Boy Fab",
                    "Shop handcrafted hardwood cutting boards and serving boards, made in North Carolina by veteran-owned Finny Boy Fab.",
                    "/",
                    "/images/optimized/hero-boards.jpg",
                    true,
                    "website");
            case "/shop" -> new PageMetadata(
                    "Shop Hardwood Cutting Boards | Finny Boy Fab",
                    "Shop small-batch end-grain cutting boards, charcuterie boards, and serving boards handcrafted from premium hardwoods.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    true,
                    "website");
            case "/about" -> new PageMetadata(
                    "Our Story | Veteran-Owned Finny Boy Fab",
                    "Meet the family behind Finny Boy Fab, a veteran-owned North Carolina shop making nontoxic hardwood boards by hand.",
                    path,
                    "/images/optimized/family-pic.jpg",
                    true,
                    "website");
            case "/learn" -> new PageMetadata(
                    "Hardwood Cutting Board Care Guide | Finny Boy Fab",
                    "Learn how to choose, wash, dry, and maintain hardwood cutting boards, plus the differences between end grain and edge grain.",
                    path,
                    "/images/wood-grain.webp",
                    true,
                    "website");
            case "/contact" -> new PageMetadata(
                    "Contact Finny Boy Fab",
                    "Contact Finny Boy Fab with questions about handcrafted cutting boards, existing orders, care, or product availability.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    true,
                    "website");
            case "/custom-inquiry" -> new PageMetadata(
                    "Custom Cutting Board Inquiry | Finny Boy Fab",
                    "Request a one-of-a-kind hardwood cutting board, serving board, or custom woodworking project from Finny Boy Fab.",
                    path,
                    "/images/optimized/products/end-grain-cutting-board/walnut-end-grain.jpg",
                    true,
                    "website");
            case "/cart" -> new PageMetadata(
                    "Your Cart | Finny Boy Fab",
                    "Review the handcrafted boards in your Finny Boy Fab shopping cart.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    false,
                    "website");
            case "/checkout/success" -> new PageMetadata(
                    "Order Status | Finny Boy Fab",
                    "Review the status of your Finny Boy Fab order.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    false,
                    "website");
            case "/privacy" -> new PageMetadata(
                    "Privacy Policy | Finny Boy Fab",
                    "Learn how Finny Boy Fab collects, uses, shares, and protects personal information.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    true,
                    "website");
            case "/cookies" -> new PageMetadata(
                    "Cookie Policy | Finny Boy Fab",
                    "Learn how the Finny Boy Fab storefront uses essential browser storage and third-party services.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    true,
                    "website");
            case "/terms" -> new PageMetadata(
                    "Terms of Use | Finny Boy Fab",
                    "Read the terms governing use of the Finny Boy Fab storefront and purchases made through it.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    true,
                    "website");
            default -> new PageMetadata(
                    "Page Not Found | Finny Boy Fab",
                    "The requested page could not be found.",
                    path,
                    "/images/optimized/hero-boards.jpg",
                    false,
                    "website");
        };
    }

    private String renderIndex(PageMetadata metadata, Product product) throws IOException {
        String template = new ClassPathResource("static/index.html")
                .getContentAsString(StandardCharsets.UTF_8);
        int start = template.indexOf(SEO_START);
        int end = template.indexOf(SEO_END);
        if (start < 0 || end < start) {
            throw new IllegalStateException("SEO metadata markers are missing from the frontend index");
        }

        String seo = SEO_START + "\n" + seoMarkup(metadata, product) + "\n    " + SEO_END;
        String rendered = template.substring(0, start) + seo + template.substring(end + SEO_END.length());
        int titleStart = rendered.indexOf("<title>");
        int titleEnd = rendered.indexOf("</title>", titleStart);
        if (titleStart < 0 || titleEnd < titleStart) {
            throw new IllegalStateException("The frontend index is missing a title element");
        }
        return rendered.substring(0, titleStart)
                + "<title>" + html(metadata.title()) + "</title>"
                + rendered.substring(titleEnd + "</title>".length());
    }

    private String seoMarkup(PageMetadata metadata, Product product) throws JsonProcessingException {
        String title = html(metadata.title());
        String description = html(metadata.description());
        String canonical = html(absoluteUrl(metadata.canonicalPath()));
        String image = html(absoluteUrl(metadata.imagePath()));
        String robots = metadata.indexable() ? INDEX_ROBOTS : NO_INDEX_ROBOTS;

        StringBuilder markup = new StringBuilder()
                .append("    <meta name=\"description\" content=\"").append(description).append("\" />\n")
                .append("    <meta name=\"robots\" content=\"").append(robots).append("\" />\n")
                .append("    <meta name=\"googlebot\" content=\"").append(robots).append("\" />\n")
                .append("    <meta name=\"theme-color\" content=\"#193046\" />\n")
                .append("    <link rel=\"canonical\" href=\"").append(canonical).append("\" />\n")
                .append("    <meta property=\"og:site_name\" content=\"Finny Boy Fab\" />\n")
                .append("    <meta property=\"og:locale\" content=\"en_US\" />\n")
                .append("    <meta property=\"og:type\" content=\"").append(metadata.openGraphType()).append("\" />\n")
                .append("    <meta property=\"og:title\" content=\"").append(title).append("\" />\n")
                .append("    <meta property=\"og:description\" content=\"").append(description).append("\" />\n")
                .append("    <meta property=\"og:url\" content=\"").append(canonical).append("\" />\n")
                .append("    <meta property=\"og:image\" content=\"").append(image).append("\" />\n")
                .append("    <meta property=\"og:image:alt\" content=\"")
                .append(html(product == null ? "Handcrafted hardwood boards by Finny Boy Fab" : product.name()))
                .append("\" />\n")
                .append("    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n")
                .append("    <meta name=\"twitter:title\" content=\"").append(title).append("\" />\n")
                .append("    <meta name=\"twitter:description\" content=\"").append(description).append("\" />\n")
                .append("    <meta name=\"twitter:image\" content=\"").append(image).append("\" />\n");

        if (product != null) {
            markup.append("    <meta property=\"product:price:amount\" content=\"")
                    .append(money(product.priceCents())).append("\" />\n")
                    .append("    <meta property=\"product:price:currency\" content=\"USD\" />\n");
        }

        String json = objectMapper.writeValueAsString(structuredData(metadata, product))
                .replace("</", "<\\/");
        return markup.append("    <script id=\"seo-structured-data\" type=\"application/ld+json\">")
                .append(json)
                .append("</script>")
                .toString();
    }

    private Map<String, Object> structuredData(PageMetadata metadata, Product product) {
        List<Object> graph = new ArrayList<>();
        graph.add(organization());

        if (product != null) {
            graph.add(breadcrumbs(product));
            graph.add(productData(product));
        } else if (metadata.canonicalPath().equals("/")) {
            graph.add(Map.of(
                    "@type", "WebSite",
                    "@id", siteBaseUrl + "/#website",
                    "url", siteBaseUrl + "/",
                    "name", "Finny Boy Fab",
                    "description", metadata.description(),
                    "publisher", Map.of("@id", siteBaseUrl + "/#organization"),
                    "inLanguage", "en-US"));
        } else {
            graph.add(Map.of(
                    "@type", "WebPage",
                    "@id", absoluteUrl(metadata.canonicalPath()) + "#webpage",
                    "url", absoluteUrl(metadata.canonicalPath()),
                    "name", metadata.title(),
                    "description", metadata.description(),
                    "isPartOf", Map.of("@id", siteBaseUrl + "/#website"),
                    "inLanguage", "en-US"));
        }

        return Map.of("@context", "https://schema.org", "@graph", graph);
    }

    private Map<String, Object> organization() {
        Map<String, Object> organization = new LinkedHashMap<>();
        organization.put("@type", "Organization");
        organization.put("@id", siteBaseUrl + "/#organization");
        organization.put("name", "Finny Boy Fab");
        organization.put("alternateName", "Finny Boy Fabrications");
        organization.put("url", siteBaseUrl + "/");
        organization.put("logo", absoluteUrl("/images/optimized/primary-logo-main.png"));
        organization.put("description",
                "Veteran-owned North Carolina maker of handcrafted hardwood cutting boards and serving boards.");
        return organization;
    }

    private Map<String, Object> breadcrumbs(Product product) {
        return Map.of(
                "@type", "BreadcrumbList",
                "itemListElement", List.of(
                        breadcrumb(1, "Home", "/"),
                        breadcrumb(2, "Shop", "/shop"),
                        breadcrumb(3, product.name(), "/products/" + product.slug())));
    }

    private Map<String, Object> breadcrumb(int position, String name, String path) {
        return Map.of(
                "@type", "ListItem",
                "position", position,
                "name", name,
                "item", absoluteUrl(path));
    }

    private Map<String, Object> productData(Product product) {
        String productUrl = absoluteUrl("/products/" + product.slug());
        List<String> images = new ArrayList<>();
        images.add(absoluteUrl(product.imageUrl()));
        product.imageUrls().stream()
                .filter(image -> !image.equals(product.imageUrl()))
                .map(this::absoluteUrl)
                .forEach(images::add);

        Map<String, Object> offer = new LinkedHashMap<>();
        offer.put("@type", "Offer");
        offer.put("url", productUrl);
        offer.put("priceCurrency", "USD");
        offer.put("price", money(product.priceCents()));
        offer.put("availability", product.inventory() > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock");
        offer.put("itemCondition", "https://schema.org/NewCondition");
        offer.put("seller", Map.of("@id", siteBaseUrl + "/#organization"));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("@type", "Product");
        data.put("@id", productUrl + "#product");
        data.put("name", product.name());
        data.put("description", product.description() + " " + product.story());
        data.put("image", images);
        data.put("sku", product.id());
        data.put("brand", Map.of("@type", "Brand", "name", "Finny Boy Fab"));
        data.put("material", product.wood());
        data.put("size", product.dimensions());
        data.put("category", "Cutting Boards & Serving Boards");
        data.put("offers", offer);
        return data;
    }

    private String absoluteUrl(String path) {
        return siteBaseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    private String money(int cents) {
        return String.format(java.util.Locale.US, "%.2f", cents / 100.0);
    }

    private String html(String value) {
        return HtmlUtils.htmlEscape(value);
    }

    private record PageMetadata(
            String title,
            String description,
            String canonicalPath,
            String imagePath,
            boolean indexable,
            String openGraphType
    ) {
    }
}
