package org.example.inventoryservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InventoryResponseDTO {
    private Long inventoryId;
    private Long productId;

    private Integer stockLevel;
    private Integer reorderThreshold;
    private Integer reservedStock;
    //(pour UI&ML)
    private Boolean inStock;
    private Boolean lowStock;
    private String alertType;
}
