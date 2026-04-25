package org.example.inventoryservice.repository;

import org.example.inventoryservice.entity.Movement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovementRepository extends JpaRepository<Movement, Long> {
}