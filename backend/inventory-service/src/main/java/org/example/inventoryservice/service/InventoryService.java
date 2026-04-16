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
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;
    private final ProductServiceClient productServiceClient;

    public List<InventoryResponseDTO> getAllInventories(){
        return inventoryRepository.findAll().stream().map(inventoryMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponseDTO createInventory(InventoryRequestDTO request){
     /*   if(!productServiceClient.productExists(request.getProductId())){
            throw new ProductNotFoundException("Produit avec ID"+ request.getProductId()+"n'existe pas");
        }*/

        if(inventoryRepository.findByProductId(request.getProductId()).isPresent()){
            throw new RuntimeException("Inventaire existe déja pour ce produit");
        }
        Inventory inventory=inventoryMapper.toEntity(request);
        Inventory saved=inventoryRepository.save(inventory);
        return inventoryMapper.toDTO(saved);
    }

    public InventoryResponseDTO getByProductId(Long productId) {
        if (!productServiceClient.productExists(productId)) {
            throw new ProductNotFoundException("Produit avec ID " + productId + " n'existe pas");
        }
        Inventory inventory = inventoryRepository.findByProductId(productId).orElseThrow(() -> new InventoryNotFoundException("Inventory not found"));
    return inventoryMapper.toDTO(inventory);
    }


    public InventoryResponseDTO updateStock(Long productId,int quantity){
        if(!productServiceClient.productExists(productId)){
            throw new ProductNotFoundException("Produit avec ID " + productId + " n'existe pas");
        }
        Inventory inventory=inventoryRepository.findByProductId(productId).orElseThrow(()->new InventoryNotFoundException("Inventory not found"));
        inventory.setStockLevel(quantity);
        Inventory updated=inventoryRepository.save(inventory);
        return  inventoryMapper.toDTO(updated);
    }

    public InventoryResponseDTO reserveStock(Long productId,int quantity){
        if (!productServiceClient.productExists(productId)) {
            throw new ProductNotFoundException("Produit avec ID " + productId + " n'existe pas");
        }
        Inventory inventory = inventoryRepository.findByProductId(productId).orElseThrow(() -> new InventoryNotFoundException("Inventory not found"));
        inventory.setStockLevel(inventory.getStockLevel()-quantity);
        inventory.setReservedStock(inventory.getReservedStock()+quantity);
        Inventory updated=inventoryRepository.save(inventory);
        return inventoryMapper.toDTO(updated);
    }
}
