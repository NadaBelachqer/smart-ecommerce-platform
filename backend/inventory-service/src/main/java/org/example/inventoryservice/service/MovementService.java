package org.example.inventoryservice.service;

import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.entity.Movement;
import org.example.inventoryservice.enums.MovementType;
import org.example.inventoryservice.repository.MovementRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MovementService {

    private final MovementRepository movementRepository;

    public void log(Long productId, MovementType type, Integer quantity) {

        Movement movement = Movement.builder()
                .productId(productId)
                .movementType(type)
                .quantity(quantity)
                .build();

        movementRepository.save(movement);
    }
}