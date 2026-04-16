package org.example.apigateway.filter;

import org.example.apigateway.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {

        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        System.out.println(" Path: " + path);


        if (path.contains("/api/auth/login") || path.contains("/api/auth/register")) {
            System.out.println("✅ Route publique (auth)");
            return chain.filter(exchange);
        }

        if (path.startsWith("/api/products") && !path.contains("/admin")) {
            System.out.println("✅ Route publique (catalogue produits)");
            return chain.filter(exchange);
        }
        // ✅ 🔥 AJOUT IMPORTANT (IMAGES)
        if (path.startsWith("/uploads/")) {
            System.out.println("🖼️ Route publique (images)");
            return chain.filter(exchange);
        }

        System.out.println("🔒 Route protégée: " + path);

        String authHeader = request.getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println(" Token manquant");
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            System.out.println("Token invalide");
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        System.out.println("Token valide");

        String email = jwtUtil.extractEmail(token);
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Email", email)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -1;
    }
}