package org.example.inventoryservice.dto.request;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InventoryRequestDTO {

    @NotNull(message = "Product ID est obligatoire")
    private Long productId;
    @Min(value = 0, message = "Stock ne peut pas être négatif")
    private Integer stockLevel;
    @Min(value = 0, message = "Seuil ne peut pas être négatif")
    private Integer reorderThreshold;
    @Min(value = 0, message = "Stock réservé ne peut pas être négatif")
    private Integer reservedStock;
}