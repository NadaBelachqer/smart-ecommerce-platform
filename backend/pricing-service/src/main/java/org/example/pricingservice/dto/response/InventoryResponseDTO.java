package org.example.pricingservice.dto.response;


import lombok.Data;

@Data
public class InventoryResponseDTO {
    private Long productId;
    private Integer stockLevel;
}
