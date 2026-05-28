package org.example.orderservice.config;

import org.springframework.context.annotation.Configuration;

// CORS is handled exclusively by the API Gateway.
// Do NOT add CORS mappings here — it causes duplicate Access-Control-Allow-Origin headers.
@Configuration
public class WebConfig {
}