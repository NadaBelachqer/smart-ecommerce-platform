package org.example.inventoryservice.controller;

import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.dto.request.InventoryRequestDTO;
import org.example.inventoryservice.dto.response.InventoryResponseDTO;
import org.example.inventoryservice.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {
private final InventoryService inventoryService;

@PostMapping
    public ResponseEntity<InventoryResponseDTO> create(@RequestBody InventoryRequestDTO dto) {
    return ResponseEntity.ok(inventoryService.createInventory(dto));
}

    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponseDTO> get(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getByProductId(productId));
    }

    @PutMapping("/stock")
    public ResponseEntity<InventoryResponseDTO> updateStock(@RequestParam Long productId, @RequestParam int quantity) {
        return ResponseEntity.ok(inventoryService.updateStock(productId, quantity));
    }

    @PutMapping("/reserve")
    public ResponseEntity<InventoryResponseDTO> reserveStock(@RequestParam Long productId, @RequestParam int quantity) {
        return ResponseEntity.ok(inventoryService.reserveStock(productId, quantity));
    }
}
