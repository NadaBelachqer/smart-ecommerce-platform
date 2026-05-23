package org.example.inventoryservice.controller;

import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.entity.Movement;
import org.example.inventoryservice.repository.MovementRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementRepository movementRepository;

    @GetMapping
    public ResponseEntity<List<Movement>> getAll() {
        return ResponseEntity.ok(movementRepository.findAll());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Movement>> getByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(movementRepository.findByProductId(productId));
    }
}