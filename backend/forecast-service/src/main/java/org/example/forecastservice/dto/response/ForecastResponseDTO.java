package org.example.forecastservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ForecastResponseDTO {

    private Long productId;
    private Double predictedSales;
    private Integer recommendedStock;
    private String message;
    private LocalDateTime timestamp;
}
