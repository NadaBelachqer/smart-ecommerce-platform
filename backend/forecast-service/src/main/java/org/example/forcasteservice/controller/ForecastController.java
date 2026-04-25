package org.example.forecastservice.controller;

import lombok.RequiredArgsConstructor;
import org.example.forecastservice.dto.request.ForecastRequestDTO;
import org.example.forecastservice.dto.response.ForecastResponseDTO;
import org.example.forecastservice.service.ForecastService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;

    @PostMapping("/predict")
    public ResponseEntity<ForecastResponseDTO> predict(
            @RequestBody ForecastRequestDTO request) {

        return ResponseEntity.ok(
                forecastService.predict(request)
        );
    }
}