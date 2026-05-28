package org.example.inventoryservice.controller;

import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.entity.Alert;
import org.example.inventoryservice.repository.AlertRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertRepository alertRepository;

    @GetMapping
    public ResponseEntity<List<Alert>> getAll() {
        return ResponseEntity.ok(alertRepository.findAll());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Alert>> getByProduct(@PathVariable Long productId) {

        List<Alert> list = alertRepository.findAll()
                .stream()
                .filter(a -> a.getProductId().equals(productId))
                .toList();

        return ResponseEntity.ok(list);
    }
}