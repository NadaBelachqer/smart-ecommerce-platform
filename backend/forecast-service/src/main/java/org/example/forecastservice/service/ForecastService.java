package org.example.forecastservice.service;

import lombok.RequiredArgsConstructor;
import org.example.forecastservice.client.MlModelClient;
import org.example.forecastservice.client.ProductServiceClient;
import org.example.forecastservice.dto.request.ForecastRequestDTO;
import org.example.forecastservice.dto.response.ForecastResponseDTO;
import org.example.forecastservice.entity.ForecastHistory;
import org.example.forecastservice.repository.ForecastRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ForecastService {

    private final MlModelClient mlModelClient;
    private final ForecastRepository forecastRepository;
    private final ProductServiceClient productServiceClient;

    public ForecastResponseDTO predict(ForecastRequestDTO request) {
        try {
            if (!productServiceClient.productExists(request.getProductId())) {
                return ForecastResponseDTO.builder()
                        .message("ERROR: Produit introuvable avec l'id : " + request.getProductId())
                        .timestamp(LocalDateTime.now())
                        .build();
            }

            Double predictedSales = mlModelClient.predict(request);

            if (predictedSales == null) {
                throw new RuntimeException("Prediction is null from ML API");
            }

            Integer recommendedStock = (int) Math.ceil(predictedSales * 1.20);

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
                    .timestamp(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            e.printStackTrace();
            return ForecastResponseDTO.builder()
                    .message("ERROR: " + e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
        }
    }

    public List<ForecastHistory> history(Long productId) {
        return forecastRepository.findByProductId(productId);
    }
}
