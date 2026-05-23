package org.example.inventoryservice.entity;
import org.example.inventoryservice.enums.MovementType;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long movementId;

    private Long productId;

    @Enumerated(EnumType.STRING)
    private MovementType movementType;

    private Integer quantity;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }
}