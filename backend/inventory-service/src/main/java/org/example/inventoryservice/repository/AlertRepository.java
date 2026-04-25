package org.example.inventoryservice.repository;

import org.example.inventoryservice.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, Long> {
}