package org.example.productservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@Data
public class ProductRequestDTO {

    private String sku;

    @NotBlank(message = "Le nom est requis")
    private String name;

    private String category;

    private String description;

    @NotNull(message = "Le prix de vente est requis")
    @Positive(message = "Le prix doit être positif")
    private Double sellingPrice;

    private Double cost;

    private LocalDate expirationDate;

    private String imageUrl;
    private MultipartFile imageFile;
}