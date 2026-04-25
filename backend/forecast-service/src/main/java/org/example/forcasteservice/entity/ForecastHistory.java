package org.example.forecastservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "forecast_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private Double predictedSales;

    private Integer recommendedStock;

    private LocalDateTime predictionDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        predictionDate = LocalDateTime.now();
    }
}