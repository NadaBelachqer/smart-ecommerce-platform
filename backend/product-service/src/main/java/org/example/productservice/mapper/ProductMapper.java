package org.example.productservice.mapper;

import org.example.productservice.dto.ProductRequestDTO;
import org.example.productservice.dto.ProductResponseDTO;
import org.example.productservice.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponseDTO toResponseDTO(Product product) {
        if (product == null) {
            return null;
        }
        return ProductResponseDTO.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .category(product.getCategory())
                .description(product.getDescription())
                .sellingPrice(product.getSellingPrice())
                .imageUrl(product.getImageUrl())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public Product toEntity(ProductRequestDTO request) {
        if (request == null) {
            return null;
        }

        return Product.builder()
                .sku(request.getSku())
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .sellingPrice(request.getSellingPrice())
                .imageUrl(request.getImageUrl())
                .build();
    }

    public void updateEntity(ProductRequestDTO request, Product product) {
        if (request == null || product == null) {
            return;
        }

        if (request.getSku() != null) {
            product.setSku(request.getSku());
        }
        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getCategory() != null) {
            product.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getSellingPrice() != null) {
            product.setSellingPrice(request.getSellingPrice());
        }
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
    }
}