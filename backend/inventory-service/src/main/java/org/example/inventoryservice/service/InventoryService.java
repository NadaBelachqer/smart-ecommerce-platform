package org.example.inventoryservice.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.inventoryservice.client.ProductServiceClient;
import org.example.inventoryservice.dto.request.InventoryRequestDTO;
import org.example.inventoryservice.dto.response.InventoryResponseDTO;
import org.example.inventoryservice.entity.Inventory;
import org.example.inventoryservice.exception.InventoryNotFoundException;
import org.example.inventoryservice.exception.ProductNotFoundException;
import org.example.inventoryservice.mapper.InventoryMapper;
import org.example.inventoryservice.repository.InventoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;
    private final ProductServiceClient productServiceClient;

    public List<InventoryResponseDTO> getAllInventories() {
        return inventoryRepository.findAll()
                .stream()
                .map(inventoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponseDTO createInventory(InventoryRequestDTO request) {

        if (!productServiceClient.productExists(request.getProductId())) {
            throw new ProductNotFoundException("Produit introuvable avec l'id : " + request.getProductId());
        }

        if (inventoryRepository.findByProductId(request.getProductId()).isPresent()) {
            throw new RuntimeException("Un inventaire existe déjà pour ce produit");
        }

        Inventory inventory = inventoryMapper.toEntity(request);

        if (inventory.getReservedStock() == null) {
            inventory.setReservedStock(0);
        }

        if (inventory.getStockLevel() == null) {
            inventory.setStockLevel(0);
        }

        Inventory saved = inventoryRepository.save(inventory);

        return inventoryMapper.toDTO(saved);
    }

    public InventoryResponseDTO getByProductId(Long productId) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException("Inventory not found"));

        return inventoryMapper.toDTO(inventory);
    }

    public InventoryResponseDTO updateStock(Long productId, int quantity) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException("Inventory not found"));

        inventory.setStockLevel(inventory.getStockLevel() + quantity);

        Inventory updated = inventoryRepository.save(inventory);

        return inventoryMapper.toDTO(updated);
    }

    public InventoryResponseDTO reserveStock(Long productId, int quantity) {

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException("Inventory not found"));

        int reserved = inventory.getReservedStock() == null ? 0 : inventory.getReservedStock();
        int stock = inventory.getStockLevel();

        if (stock < quantity) {
            throw new RuntimeException("Stock insuffisant");
        }

        inventory.setStockLevel(stock - quantity);
        inventory.setReservedStock(reserved + quantity);

        Inventory updated = inventoryRepository.save(inventory);

        return inventoryMapper.toDTO(updated);
    }
}
