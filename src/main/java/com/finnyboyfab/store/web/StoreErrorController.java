package com.finnyboyfab.store.web;

import java.io.IOException;
import java.util.Map;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class StoreErrorController implements ErrorController {
    private final SpaController spa;
    public StoreErrorController(SpaController spa) { this.spa = spa; }

    @RequestMapping("/error")
    @ResponseBody
    public ResponseEntity<?> error(HttpServletRequest request) throws IOException {
        Object rawStatus = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int status = rawStatus instanceof Integer number ? number : 500;
        Object originalPath = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String path = originalPath instanceof String value ? value : "";
        if (status == 404 && !path.startsWith("/api/")
                && request.getHeader("Accept") != null && request.getHeader("Accept").contains("text/html")) {
            return spa.notFound();
        }
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("status", status, "message", status == 404 ? "Not found" : "Unable to complete this request"));
    }
}
