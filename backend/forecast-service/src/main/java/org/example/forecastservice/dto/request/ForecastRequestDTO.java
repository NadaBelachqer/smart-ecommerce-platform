package org.example.forecastservice.dto.request;

import lombok.Data;

@Data
public class ForecastRequestDTO {

    private Long productId;
    private Integer month;
    private Integer dayOfWeek;
    private Integer promo;
    private Integer stockLevel;
    private Double price;
    private Double discount;
    private Integer unitsSold;
    private Integer unitsOrdered;
}