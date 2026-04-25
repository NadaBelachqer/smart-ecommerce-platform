package org.example.inventoryservice.mapper;

import org.example.inventoryservice.dto.request.InventoryRequestDTO;
import org.example.inventoryservice.dto.response.InventoryResponseDTO;
import org.example.inventoryservice.entity.Inventory;
import org.example.inventoryservice.enums.AlertType;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {

    public InventoryResponseDTO toDTO(Inventory inventory) {

        String alertType = null;

        if (inventory.getStockLevel() == 0) {
            alertType = AlertType.OUT_OF_STOCK.name();
        } else if (inventory.getStockLevel() <= inventory.getReorderThreshold()) {
            alertType = AlertType.LOW_STOCK.name();
        }

        return InventoryResponseDTO.builder()
                .inventoryId(inventory.getInventoryId())
                .productId(inventory.getProductId())
                .stockLevel(inventory.getStockLevel())
                .reorderThreshold(inventory.getReorderThreshold())
                .reservedStock(inventory.getReservedStock())
                .inStock(inventory.getStockLevel() > 0)
                .lowStock(inventory.getStockLevel() <= inventory.getReorderThreshold())
                .alertType(alertType)
                .build();
    }

    public Inventory toEntity(InventoryRequestDTO dto) {
        return Inventory.builder()
                .productId(dto.getProductId())
                .stockLevel(dto.getStockLevel())
                .reservedStock(dto.getReservedStock())
                .reorderThreshold(dto.getReorderThreshold())
                .build();
    }
}