package org.example.pricingservice.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class PricingRequestDTO {

    @JsonProperty("productId")  // ← FORCER LE MAPPING
    private Long productId;




}