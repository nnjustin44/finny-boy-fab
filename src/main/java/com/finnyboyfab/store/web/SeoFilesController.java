package com.finnyboyfab.store.web;

import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.HtmlUtils;

import com.finnyboyfab.store.catalog.Product;
import com.finnyboyfab.store.catalog.ProductRepository;

@Controller
public class SeoFilesController {

    private final ProductRepository productRepository;
    private final String siteBaseUrl;

    public SeoFilesController(
            ProductRepository productRepository,
            @Value("${site.base-url}") String siteBaseUrl
    ) {
        this.productRepository = productRepository;
        this.siteBaseUrl = siteBaseUrl.replaceAll("/+$", "");
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    @ResponseBody
    public ResponseEntity<String> robots() {
        String body = """
                User-agent: *
                Allow: /

                Sitemap: %s/sitemap.xml
                """.formatted(siteBaseUrl);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(body);
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @ResponseBody
    public ResponseEntity<String> sitemap() {
        StringBuilder xml = new StringBuilder("""
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
                """);

        addPage(xml, "/", "1.0", "weekly");
        addPage(xml, "/shop", "0.9", "weekly");
        addPage(xml, "/learn", "0.7", "monthly");
        addPage(xml, "/about", "0.6", "monthly");
        addPage(xml, "/custom-inquiry", "0.6", "monthly");
        addPage(xml, "/contact", "0.5", "monthly");
        productRepository.findAll().forEach(product -> addProduct(xml, product));
        xml.append("</urlset>\n");

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(xml.toString());
    }

    private void addPage(StringBuilder xml, String path, String priority, String changeFrequency) {
        xml.append("  <url>\n")
                .append("    <loc>").append(xml(absoluteUrl(path))).append("</loc>\n")
                .append("    <changefreq>").append(changeFrequency).append("</changefreq>\n")
                .append("    <priority>").append(priority).append("</priority>\n")
                .append("  </url>\n");
    }

    private void addProduct(StringBuilder xml, Product product) {
        xml.append("  <url>\n")
                .append("    <loc>").append(xml(absoluteUrl("/products/" + product.slug()))).append("</loc>\n")
                .append("    <changefreq>weekly</changefreq>\n")
                .append("    <priority>0.8</priority>\n");

        Set<String> images = new LinkedHashSet<>();
        images.add(product.imageUrl());
        images.addAll(product.imageUrls());
        images.forEach(image -> xml.append("    <image:image>\n")
                .append("      <image:loc>").append(xml(absoluteUrl(image))).append("</image:loc>\n")
                .append("      <image:title>").append(xml(product.name())).append("</image:title>\n")
                .append("    </image:image>\n"));
        xml.append("  </url>\n");
    }

    private String absoluteUrl(String path) {
        return siteBaseUrl + (path.startsWith("/") ? path : "/" + path);
    }

    private String xml(String value) {
        return HtmlUtils.htmlEscape(value);
    }
}
