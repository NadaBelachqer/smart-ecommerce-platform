package org.example.orderservice.controller;

import org.example.orderservice.dto.ApiResponseDTO;
import org.example.orderservice.dto.OrderRequestDTO;
import org.example.orderservice.dto.OrderResponseDTO;
import org.example.orderservice.model.OrderStatus;
import org.example.orderservice.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    // Extrait et valide le token Bearer + X-User-Id
    private Long resolveUserId(HttpServletRequest httpRequest,
                               @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new org.example.orderservice.exception.OrderException("Authorization token is required");
        }
        if (userId == null) {
            throw new org.example.orderservice.exception.OrderException("X-User-Id header is required");
        }
        return userId;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<OrderResponseDTO>> createOrder(
            HttpServletRequest httpRequest,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody OrderRequestDTO request) {
        Long actualUserId = resolveUserId(httpRequest, userId);
        log.info("POST /api/orders - Create order for user: {}", actualUserId);
        OrderResponseDTO order = orderService.createOrder(actualUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponseDTO.success(order, "Order created successfully"));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponseDTO<List<OrderResponseDTO>>> getMyOrders(
            HttpServletRequest httpRequest,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Long actualUserId = resolveUserId(httpRequest, userId);
        log.info("GET /api/orders/my-orders - Get orders for user: {}", actualUserId);
        List<OrderResponseDTO> orders = orderService.getOrdersByUserId(actualUserId);
        if (orders.isEmpty()) {
            return ResponseEntity.ok(ApiResponseDTO.success(orders, "You have no orders yet"));
        }
        return ResponseEntity.ok(ApiResponseDTO.success(orders, "Orders retrieved successfully"));
    }


    // Client : vérifie que la commande lui appartient. Admin : accès libre via /admin/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<OrderResponseDTO>> getOrderById(
            HttpServletRequest httpRequest,
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Long actualUserId = resolveUserId(httpRequest, userId);
        log.info("GET /api/orders/{} - Get order by ID for user: {}", id, actualUserId);
        OrderResponseDTO order = orderService.getOrderByIdForUser(id, actualUserId);
        return ResponseEntity.ok(ApiResponseDTO.success(order, "Order retrieved successfully"));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponseDTO<OrderResponseDTO>> cancelOrder(
            HttpServletRequest httpRequest,
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        Long actualUserId = resolveUserId(httpRequest, userId);
        log.info("PUT /api/orders/{}/cancel - Cancel order by user: {}", id, actualUserId);
        OrderResponseDTO order = orderService.cancelOrder(id, actualUserId, false);
        return ResponseEntity.ok(ApiResponseDTO.success(order, "Order cancelled successfully"));
    }

    // ── ADMIN ──────────────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    public ResponseEntity<ApiResponseDTO<List<OrderResponseDTO>>> getAllOrders(
            HttpServletRequest httpRequest) {
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new org.example.orderservice.exception.OrderException("Authorization token is required");
        }
        log.info("GET /api/orders/admin/all - Get all orders (admin)");
        List<OrderResponseDTO> orders = orderService.getAllOrders();
        String msg = orders.isEmpty() ? "No orders found" : "All orders retrieved successfully";
        return ResponseEntity.ok(ApiResponseDTO.success(orders, msg));
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<ApiResponseDTO<OrderResponseDTO>> getOrderByIdAdmin(
            HttpServletRequest httpRequest,
            @PathVariable Long id) {
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new org.example.orderservice.exception.OrderException("Authorization token is required");
        }
        log.info("GET /api/orders/admin/{} - Admin get order by ID", id);
        OrderResponseDTO order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponseDTO.success(order, "Order retrieved successfully"));
    }

    @PutMapping("/admin/{id}/status")
    public ResponseEntity<ApiResponseDTO<OrderResponseDTO>> updateOrderStatus(
            HttpServletRequest httpRequest,
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new org.example.orderservice.exception.OrderException("Authorization token is required");
        }
        log.info("PUT /api/orders/admin/{}/status - Update order status to: {}", id, status);
        OrderResponseDTO order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponseDTO.success(order, "Order status updated successfully"));
    }

    @DeleteMapping("/admin/{id}/cancel")
    public ResponseEntity<ApiResponseDTO<OrderResponseDTO>> adminCancelOrder(
            HttpServletRequest httpRequest,
            @PathVariable Long id) {
        String auth = httpRequest.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new org.example.orderservice.exception.OrderException("Authorization token is required");
        }
        log.info("DELETE /api/orders/admin/{}/cancel - Admin cancel order", id);
        OrderResponseDTO order = orderService.cancelOrder(id, null, true);
        return ResponseEntity.ok(ApiResponseDTO.success(order, "Order cancelled by admin successfully"));
    }
}
