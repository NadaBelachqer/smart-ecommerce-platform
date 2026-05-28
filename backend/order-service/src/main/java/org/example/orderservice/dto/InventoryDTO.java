package org.example.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDTO {
    private Long id;
    private Long inventoryId;
    private Long productId;
    private Integer stock;
    private Integer stockLevel;
    private Integer reservedStock;
    private Integer availableStock;
}
