package org.example.forecastservice.service;

import lombok.RequiredArgsConstructor;
import org.example.forecastservice.client.MlModelClient;
import org.example.forecastservice.dto.request.ForecastRequestDTO;
import org.example.forecastservice.dto.response.ForecastResponseDTO;
import org.example.forecastservice.entity.ForecastHistory;
import org.example.forecastservice.repository.ForecastRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final MlModelClient mlModelClient;
    private final ForecastRepository forecastRepository;

    // Prediction + Save History
   public ForecastResponseDTO predict(ForecastRequestDTO request) {

    try {
        Double predictedSales = mlModelClient.predict(request);

        if (predictedSales == null) {
            throw new RuntimeException("Prediction is null from ML API");
        }

        Integer recommendedStock =
                (int) Math.ceil(predictedSales * 1.20);

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
                .message("Forecast generated successfully")
                .build();

    } catch (Exception e) {
        e.printStackTrace();

        return ForecastResponseDTO.builder()
                .message("ERROR: " + e.getMessage())
                .build();
    }
}
    // Get history by productId
    public List<ForecastHistory> history(Long productId) {
        return forecastRepository.findByProductId(productId);
    }
}