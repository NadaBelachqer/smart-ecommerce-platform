package org.example.apigateway.config;

import org.springframework.context.annotation.Configuration;

/**
 * CORS is configured globally in application.properties via
 * spring.cloud.gateway.globalcors — do not add a CorsWebFilter bean here,
 * as having both causes duplicate CORS headers and blocks browser requests.
 */
@Configuration
public class CorsConfig {
}
