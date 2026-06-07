package org.example.promotionservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;
    private String productName;
    private String category;

    @Column(nullable = false)
    private Double suggestedDiscount;

    private Double currentPrice;
    private Double promotionalPrice;

    private LocalDate suggestedDate;
    private String reason;

    @Enumerated(EnumType.STRING)
    private PromotionStatus status;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = PromotionStatus.PENDING;
    }
}
