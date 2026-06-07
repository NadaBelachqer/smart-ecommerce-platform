package org.example.promotionservice.repository;

import org.example.promotionservice.entity.Promotion;
import org.example.promotionservice.entity.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByBatchId(Long batchId);
    List<Promotion> findByStatus(PromotionStatus status);

    @Query("SELECT DISTINCT p.productId FROM Promotion p WHERE p.createdAt >= :since")
    List<Long> findRecentlyPromotedProductIds(@Param("since") LocalDateTime since);
}
