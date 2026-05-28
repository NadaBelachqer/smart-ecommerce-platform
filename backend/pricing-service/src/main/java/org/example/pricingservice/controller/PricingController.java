package org.example.pricingservice.controller;

import lombok.RequiredArgsConstructor;
import org.example.pricingservice.dto.request.PricingRequestDTO;
import org.example.pricingservice.dto.response.PricingResponseDTO;
import org.example.pricingservice.entity.PricingHistory;
import org.example.pricingservice.service.PricingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pricing")
@RequiredArgsConstructor

public class PricingController {

    private final PricingService pricingService;

    @PostMapping("/optimize")
    public ResponseEntity<PricingResponseDTO> optimize(
            @RequestBody PricingRequestDTO request) {

        // 🔍 AJOUTER CE LOG
        System.out.println("=== DEBUG ===");
        System.out.println("Request received: " + request);
        System.out.println("ProductId: " + (request != null ? request.getProductId() : "null"));
        System.out.println("=============");

        return ResponseEntity.ok(pricingService.optimize(request));
    }

    @GetMapping("/history/{productId}")
    public ResponseEntity<List<PricingHistory>> history(@PathVariable Long productId) {
        return ResponseEntity.ok(pricingService.history(productId));
    }
}