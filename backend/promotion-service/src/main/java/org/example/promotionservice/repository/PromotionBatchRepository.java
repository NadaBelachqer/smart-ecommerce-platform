package org.example.promotionservice.repository;

import org.example.promotionservice.entity.PromotionBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PromotionBatchRepository extends JpaRepository<PromotionBatch, Long> {
    Optional<PromotionBatch> findTopByOrderByCreatedAtDesc();
}
