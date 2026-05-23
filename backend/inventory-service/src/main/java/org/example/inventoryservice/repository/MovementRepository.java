package org.example.inventoryservice.repository;

import org.example.inventoryservice.entity.Movement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovementRepository extends JpaRepository<Movement, Long> {
    List<Movement> findByProductId(Long productId);
}