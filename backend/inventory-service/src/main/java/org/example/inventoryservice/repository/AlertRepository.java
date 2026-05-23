package org.example.inventoryservice.repository;

import org.example.inventoryservice.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByProductId(Long productId);
}