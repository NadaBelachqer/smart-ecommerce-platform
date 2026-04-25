package org.example.forecastservice.repository;

import org.example.forecastservice.entity.ForecastHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForecastRepository extends JpaRepository<ForecastHistory, Long> {

    List<ForecastHistory> findByProductId(Long productId);
}