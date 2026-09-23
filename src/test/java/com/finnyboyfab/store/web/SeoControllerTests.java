package com.finnyboyfab.store.web;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "site.base-url=https://www.finnyboyfab.test")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SeoControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void homeIncludesCanonicalSocialAndOrganizationMetadata() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html"))
                .andExpect(content().string(containsString(
                        "<title>Handcrafted Cutting Boards | Finny Boy Fab</title>")))
                .andExpect(content().string(containsString(
                        "<link rel=\"canonical\" href=\"https://www.finnyboyfab.test/\" />")))
                .andExpect(content().string(containsString(
                        "<meta property=\"og:image\" content=\"https://www.finnyboyfab.test/images/optimized/hero-boards.jpg\" />")))
                .andExpect(content().string(containsString("\"@type\":\"Organization\"")))
                .andExpect(content().string(containsString("\"@type\":\"WebSite\"")))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-cache")));
    }

    @Test
    void homeAliasPointsToTheRootCanonical() throws Exception {
        mockMvc.perform(get("/home"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(
                        "<link rel=\"canonical\" href=\"https://www.finnyboyfab.test/\" />")));
    }

    @Test
    void productIncludesProductOfferAndBreadcrumbDataInInitialHtml() throws Exception {
        mockMvc.perform(get("/products/maple-walnut-serving-board"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(
                        "<title>Live Edge Maple Serving Board | Finny Boy Fab</title>")))
                .andExpect(content().string(containsString("<meta property=\"og:type\" content=\"product\" />")))
                .andExpect(content().string(containsString("\"@type\":\"Product\"")))
                .andExpect(content().string(containsString("\"@type\":\"Offer\"")))
                .andExpect(content().string(containsString("\"price\":\"128.00\"")))
                .andExpect(content().string(containsString("\"@type\":\"BreadcrumbList\"")))
                .andExpect(content().string(containsString(
                        "https://www.finnyboyfab.test/images/optimized/products/maple-walnut-serving-board/maple-walnut-server.jpg")));
    }

    @Test
    void privateAndMissingPagesAreNotIndexable() throws Exception {
        mockMvc.perform(get("/cart"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(
                        "<meta name=\"robots\" content=\"noindex, follow\" />")));

        mockMvc.perform(get("/products/not-a-product"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString(
                        "<title>Product Not Found | Finny Boy Fab</title>")))
                .andExpect(content().string(containsString(
                        "<meta name=\"robots\" content=\"noindex, follow\" />")));
    }

    @Test
    void robotsAndSitemapExposeOnlyCrawlableStorefrontUrls() throws Exception {
        mockMvc.perform(get("/robots.txt"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/plain"))
                .andExpect(content().string(containsString("Allow: /")))
                .andExpect(content().string(containsString(
                        "Sitemap: https://www.finnyboyfab.test/sitemap.xml")));

        mockMvc.perform(get("/sitemap.xml"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/xml"))
                .andExpect(content().string(containsString(
                        "<loc>https://www.finnyboyfab.test/products/generic-end-grain-cutting-board</loc>")))
                .andExpect(content().string(containsString("<image:image>")))
                .andExpect(content().string(not(containsString("/cart"))))
                .andExpect(content().string(not(containsString("/checkout/success"))));
    }
}
