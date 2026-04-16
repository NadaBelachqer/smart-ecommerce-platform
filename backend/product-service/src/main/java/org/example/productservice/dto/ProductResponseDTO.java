package org.example.productservice.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ProductResponseDTO {
    private Long id;
    private String sku;
    private String name;
    private String category;
    private String description;
    private Double sellingPrice;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}