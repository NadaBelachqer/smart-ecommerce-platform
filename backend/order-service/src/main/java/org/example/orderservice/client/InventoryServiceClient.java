package org.example.orderservice.client;

import org.example.orderservice.dto.InventoryCheckResponseDTO;
import org.example.orderservice.dto.InventoryDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "inventory-service", url = "${services.inventory.url}")
public interface InventoryServiceClient {

    @GetMapping("/inventory/{productId}")
    InventoryDTO getInventoryByProductId(@PathVariable("productId") Long productId);

    @PutMapping("/inventory/reserve")
    InventoryDTO reserveStock(
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") Integer quantity
    );

    @PutMapping("/inventory/stock")
    InventoryDTO updateStock(
            @RequestParam("productId") Long productId,
            @RequestParam("quantity") Integer quantity
    );
}
