package org.example.pricingservice.dto.response;

import lombok.Data;

@Data
public class ProductResponseDTO {

    private Long id;

    private String name;
    private String sku;  // ← AJOUTER CETTE LIGNE

    private String category;

    private Double sellingPrice;
    private Double cost;

  }
