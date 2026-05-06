package org.example.forecastservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ForecastResponseDTO {

    private Long productId;
    private Double predictedSales;
    private Integer recommendedStock;
    private String message;
}