package org.example.pricingservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "pricing_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;
    private Double currentPrice;
    private Double optimalPrice;
    private Double expectedDemand;
    private Double expectedRevenue;
    private Double expectedProfit;
    private Double competitorPrice;

    private LocalDateTime pricingDate;
    private LocalDateTime createdAt;
    private String strategy;
    private String strategyLabel;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PricingStatus status = PricingStatus.PENDING;

    private LocalDateTime appliedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        pricingDate = LocalDateTime.now();
        if (status == null) status = PricingStatus.PENDING;
    }
}