package org.example.forecastservice.service;

import lombok.RequiredArgsConstructor;
import org.example.forecastservice.client.MlModelClient;
import org.example.forecastservice.dto.request.ForecastRequestDTO;
import org.example.forecastservice.dto.response.ForecastResponseDTO;
import org.example.forecastservice.entity.ForecastHistory;
import org.example.forecastservice.repository.ForecastRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final ForecastRepository forecastRepository;
    private final MlModelClient mlModelClient;

    public ForecastResponseDTO predict(ForecastRequestDTO request) {

        double predictedSales =
                mlModelClient.predict(
                        request.getProductId(),
                        request.getDays()
                );

        int recommendedStock = (int) predictedSales + 30;

        ForecastHistory history = ForecastHistory.builder()
                .productId(request.getProductId())
                .predictedSales(predictedSales)
                .recommendedStock(recommendedStock)
                .build();

        forecastRepository.save(history);

        return ForecastResponseDTO.builder()
                .productId(request.getProductId())
                .predictedSales(predictedSales)
                .recommendedStock(recommendedStock)
                .message("Prediction success")
                .build();
    }
}