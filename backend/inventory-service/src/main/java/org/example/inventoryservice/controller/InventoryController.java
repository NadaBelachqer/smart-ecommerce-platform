package org.example.inventoryservice.controller;

import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.dto.request.InventoryRequestDTO;
import org.example.inventoryservice.dto.response.InventoryResponseDTO;
import org.example.inventoryservice.enums.MovementType;
import org.example.inventoryservice.service.InventoryService;
import org.example.inventoryservice.service.MovementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final MovementService movementService;

    @PostMapping
    public ResponseEntity<InventoryResponseDTO> create(
            @RequestBody InventoryRequestDTO dto) {

        return ResponseEntity.ok(
                inventoryService.createInventory(dto)
        );
    }

    @GetMapping("/{productId}")
    public ResponseEntity<InventoryResponseDTO> get(
            @PathVariable Long productId) {

        return ResponseEntity.ok(
                inventoryService.getByProductId(productId)
        );
    }

    @PutMapping("/stock")
    public ResponseEntity<InventoryResponseDTO> updateStock(
            @RequestParam Long productId,
            @RequestParam int quantity) {

        movementService.log(productId, MovementType.IN, quantity);

        return ResponseEntity.ok(
                inventoryService.updateStock(productId, quantity)
        );
    }

    @PutMapping("/reserve")
    public ResponseEntity<InventoryResponseDTO> reserveStock(
            @RequestParam Long productId,
            @RequestParam int quantity) {

        movementService.log(productId, MovementType.RESERVE, quantity);

        return ResponseEntity.ok(
                inventoryService.reserveStock(productId, quantity)
        );
    }
}