package org.example.inventoryservice.service;

import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.entity.Alert;
import org.example.inventoryservice.entity.Inventory;
import org.example.inventoryservice.enums.AlertType;
import org.example.inventoryservice.repository.AlertRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    public void check(Inventory inventory) {

        if (inventory.getStockLevel() == 0) {

            Alert alert = Alert.builder()
                    .productId(inventory.getProductId())
                    .alertType(AlertType.OUT_OF_STOCK.name())
                    .status("OPEN")
                    .thresholdValue(0)
                    .build();

            alertRepository.save(alert);

        } else if (inventory.getStockLevel() <= inventory.getReorderThreshold()) {

            Alert alert = Alert.builder()
                    .productId(inventory.getProductId())
                    .alertType(AlertType.LOW_STOCK.name())
                    .status("OPEN")
                    .thresholdValue(inventory.getReorderThreshold())
                    .build();

            alertRepository.save(alert);
        }
    }
}