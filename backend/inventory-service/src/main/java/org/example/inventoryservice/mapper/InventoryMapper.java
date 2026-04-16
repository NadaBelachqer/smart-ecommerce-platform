package org.example.inventoryservice.mapper;

import lombok.Data;
import org.example.inventoryservice.dto.request.InventoryRequestDTO;
import org.example.inventoryservice.dto.response.InventoryResponseDTO;
import org.example.inventoryservice.entity.Inventory;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {

    public InventoryResponseDTO toDTO(Inventory inventory) {
        return InventoryResponseDTO.builder()
                .inventoryId(inventory.getInventoryId())
                .productId(inventory.getProductId())
                .stockLevel(inventory.getStockLevel())
                .reorderThreshold(inventory.getReorderThreshold())
                .reservedStock(inventory.getReservedStock())
                .inStock(inventory.getStockLevel()>0)
                .lowStock(inventory.getStockLevel()<=inventory.getReorderThreshold())
                .build();

}

public Inventory toEntity(InventoryRequestDTO dto){
    return Inventory.builder()
            .productId(dto.getProductId())
            .stockLevel(dto.getStockLevel())
            .reservedStock(dto.getReservedStock())
            .reorderThreshold(dto.getReorderThreshold())
            .build();


}
}
