package org.example.orderservice.model;

public enum OrderStatus {
    PENDING,      // En attente de confirmation
    CONFIRMED,    // Confirmée (stock réservé)
    PROCESSING,   // En préparation
    SHIPPED,      // Expédiée
    DELIVERED,    // Livrée
    CANCELLED,    // Annulée
    REFUNDED      // Remboursée
}