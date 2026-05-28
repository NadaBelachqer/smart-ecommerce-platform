package org.example.orderservice.service;

import org.example.orderservice.dto.OrderRequestDTO;
import org.example.orderservice.dto.OrderResponseDTO;
import org.example.orderservice.model.OrderStatus;

import java.util.List;

public interface OrderService {

    /**
     * Create a new order
     */
    OrderResponseDTO createOrder(Long userId, OrderRequestDTO request);

    /**
     * Get order by ID (admin - no ownership check)
     */
    OrderResponseDTO getOrderById(Long orderId);

    /**
     * Get order by ID for a specific user (ownership enforced)
     */
    OrderResponseDTO getOrderByIdForUser(Long orderId, Long userId);

    /**
     * Get all orders for a specific user
     */
    List<OrderResponseDTO> getOrdersByUserId(Long userId);

    /**
     * Get all orders (admin only)
     */
    List<OrderResponseDTO> getAllOrders();

    /**
     * Update order status (admin only)
     */
    OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status);

    /**
     * Cancel an order
     */
    OrderResponseDTO cancelOrder(Long orderId, Long userId, boolean isAdmin);

    /**
     * Get orders by status
     */
    List<OrderResponseDTO> getOrdersByStatus(OrderStatus status);

    /**
     * Get orders by user ID and status
     */
    List<OrderResponseDTO> getOrdersByUserIdAndStatus(Long userId, OrderStatus status);
}