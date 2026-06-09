package org.example.pricingservice.repository;

import org.example.pricingservice.entity.PricingHistory;
import org.example.pricingservice.entity.PricingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PricingRepository
        extends JpaRepository<PricingHistory, Long> {

    List<PricingHistory> findByProductId(Long productId);

    List<PricingHistory> findByStatus(PricingStatus status);
}