package com.finnyboyfab.store.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
            "/",
            "/home",
            "/shop",
            "/about",
            "/learn",
            "/cart",
            "/checkout/success",
            "/products/{slug}"
    })
    public String app() {
        return "forward:/index.html";
    }
}
