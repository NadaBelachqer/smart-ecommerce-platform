package org.example.promotionservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "promotion_batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private BatchStatus batchStatus;

    private Integer totalSuggestions;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        if (batchStatus == null) batchStatus = BatchStatus.PENDING;
    }

    public enum BatchStatus {
        PENDING, VALIDATED, REJECTED
    }
}
