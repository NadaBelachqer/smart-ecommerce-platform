package org.example.inventoryservice.entity;

import jakarta.persistence.*;
import jdk.jshell.execution.Util;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@NoArgsConstructor
@Data
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;

    @Column(unique = true, nullable = false)
    private Long productId;

    private Integer stockLevel;

    private Integer reorderThreshold;

    private Integer reservedStock;


    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate(){
        createdAt= LocalDateTime.now();
        updatedAt=LocalDateTime.now();
    }

    @PreUpdate
    private  void onUpdate(){
        updatedAt=LocalDateTime.now();
    }

}