package org.example.orderservice.service;

import org.example.orderservice.client.InventoryServiceClient;
import org.example.orderservice.client.ProductServiceClient;
import org.example.orderservice.dto.*;
import org.example.orderservice.exception.OrderException;
import org.example.orderservice.model.Order;
import org.example.orderservice.model.OrderItem;
import org.example.orderservice.model.OrderStatus;
import org.example.orderservice.repository.OrderItemRepository;
import org.example.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductServiceClient productServiceClient;
    private final InventoryServiceClient inventoryServiceClient;

    @Override
    public OrderResponseDTO createOrder(Long userId, OrderRequestDTO request) {
        log.info("Creating order for user: {}", userId);

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new OrderException("Order must contain at least one item");
        }

        // 1. Vérifier le stock pour tous les produits avant de commencer
        for (OrderRequestDTO.OrderItemRequestDTO item : request.getItems()) {
            checkInventoryAvailability(item.getProductId(), item.getQuantity());
        }

        // 2. Récupérer les détails produits et calculer le total
        double totalAmount = 0.0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderRequestDTO.OrderItemRequestDTO itemRequest : request.getItems()) {
            ProductDTO product = productServiceClient.getProductById(itemRequest.getProductId());

            if (product == null) {
                throw new OrderException("Product not found with ID: " + itemRequest.getProductId());
            }

            Double unitPrice = product.getSellingPrice() != null ? product.getSellingPrice() : product.getPrice();
            if (unitPrice == null) {
                throw new OrderException("Product price not found for ID: " + itemRequest.getProductId());
            }

            double subtotal = unitPrice * itemRequest.getQuantity();
            totalAmount += subtotal;

            orderItems.add(OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build());
        }

        // 3. Créer la commande
        Order order = Order.builder()
                .userId(userId)
                .orderNumber(generateOrderNumber())
                .totalAmount(totalAmount)
                .status(OrderStatus.CONFIRMED)
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .build();

        Order savedOrder = orderRepository.save(order);

        // 4. Associer les items
        for (OrderItem item : orderItems) {
            item.setOrder(savedOrder);
            orderItemRepository.save(item);
        }
        savedOrder.setItems(orderItems);

        // 5. Réserver le stock (inventory-service fait stockLevel -= quantity)
        for (OrderRequestDTO.OrderItemRequestDTO itemRequest : request.getItems()) {
            try {
                inventoryServiceClient.reserveStock(itemRequest.getProductId(), itemRequest.getQuantity());
                log.info("Reserved {} units of product {}", itemRequest.getQuantity(), itemRequest.getProductId());
            } catch (Exception e) {
                log.error("Failed to reserve stock for product {}: {}", itemRequest.getProductId(), e.getMessage());
                throw new OrderException("Failed to reserve stock for product: " + itemRequest.getProductId());
            }
        }

        log.info("Order created: ID={}, Number={}", savedOrder.getId(), savedOrder.getOrderNumber());
        return convertToDTO(savedOrder);
    }

    @Override
    public OrderResponseDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderException("Order not found with ID: " + orderId));
        return convertToDTO(order);
    }

    @Override
    public OrderResponseDTO getOrderByIdForUser(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderException("Order not found with ID: " + orderId));
        if (!order.getUserId().equals(userId)) {
            throw new OrderException("You are not authorized to view this order");
        }
        return convertToDTO(order);
    }

    @Override
    public List<OrderResponseDTO> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public OrderResponseDTO updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderException("Order not found with ID: " + orderId));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new OrderException("Cannot update status of a cancelled order");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new OrderException("Cannot update status of a delivered order");
        }
        if (status == OrderStatus.SHIPPED && order.getStatus() != OrderStatus.CONFIRMED
                && order.getStatus() != OrderStatus.PROCESSING) {
            throw new OrderException("Order must be confirmed or processing before shipping");
        }
        if (status == OrderStatus.DELIVERED && order.getStatus() != OrderStatus.SHIPPED) {
            throw new OrderException("Order must be shipped before delivery");
        }

        order.setStatus(status);
        return convertToDTO(orderRepository.save(order));
    }

    @Override
    public OrderResponseDTO cancelOrder(Long orderId, Long userId, boolean isAdmin) {
        log.info("Cancelling order {} by user {} (admin={})", orderId, userId, isAdmin);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderException("Order not found with ID: " + orderId));

        if (!isAdmin && !order.getUserId().equals(userId)) {
            throw new OrderException("You are not authorized to cancel this order");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new OrderException("Order is already cancelled");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new OrderException("Cannot cancel a delivered order");
        }

        // Libérer le stock uniquement si la commande n'a pas encore été expédiée
        // (si expédiée, le stock physique est parti — on annule la commande mais on ne retouche pas l'inventaire)
        boolean canRestoreStock = order.getStatus() != OrderStatus.SHIPPED;

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelled = orderRepository.save(order);

        if (canRestoreStock) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                try {
                    // Remettre le stock : updateStock ajoute la quantité à stockLevel
                    inventoryServiceClient.updateStock(item.getProductId(), item.getQuantity());
                    log.info("Restored {} units of product {} after cancellation", item.getQuantity(), item.getProductId());
                } catch (Exception e) {
                    // On log l'erreur mais on ne bloque pas l'annulation
                    log.error("Failed to restore stock for product {} after cancellation: {}", item.getProductId(), e.getMessage());
                }
            }
        } else {
            // Commande déjà expédiée : annulation administrative, stock non restauré automatiquement
            log.warn("Order {} was SHIPPED — stock NOT restored automatically. Manual inventory adjustment may be needed.", orderId);
        }

        return convertToDTO(cancelled);
    }

    @Override
    public List<OrderResponseDTO> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponseDTO> getOrdersByUserIdAndStatus(Long userId, OrderStatus status) {
        return orderRepository.findByUserIdAndStatus(userId, status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Vérifie la disponibilité du stock.
     * inventory-service.reserveStock fait : stockLevel -= quantity
     * Donc stockLevel représente déjà le stock disponible réel — pas besoin de soustraire reservedStock.
     */
    private void checkInventoryAvailability(Long productId, Integer requestedQuantity) {
        try {
            InventoryDTO inventory = inventoryServiceClient.getInventoryByProductId(productId);

            if (inventory == null) {
                throw new OrderException("Inventory not found for product ID: " + productId);
            }

            Integer availableStock = inventory.getStockLevel() != null
                    ? inventory.getStockLevel()
                    : inventory.getStock();

            if (availableStock == null) {
                throw new OrderException("Stock level unavailable for product ID: " + productId);
            }

            if (availableStock < requestedQuantity) {
                throw new OrderException(
                        String.format("Insufficient stock for product %d. Available: %d, Requested: %d",
                                productId, availableStock, requestedQuantity)
                );
            }

            log.info("Stock check OK for product {}: available={}, requested={}", productId, availableStock, requestedQuantity);

        } catch (OrderException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error checking inventory for product {}: {}", productId, e.getMessage());
            throw new OrderException("Failed to check inventory for product " + productId + ": " + e.getMessage());
        }
    }

    private String generateOrderNumber() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String rand = String.valueOf((int) (Math.random() * 10000));
        String number = "ORD-" + ts + "-" + rand;
        return orderRepository.existsByOrderNumber(number) ? generateOrderNumber() : number;
    }

    private OrderResponseDTO convertToDTO(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            order.setItems(orderItemRepository.findByOrderId(order.getId()));
        }

        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponseDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .items(itemDTOs)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
