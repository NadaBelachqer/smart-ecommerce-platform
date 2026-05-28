package org.example.productservice.service;

import org.example.productservice.client.InventoryServiceClient;
import org.example.productservice.dto.ProductRequestDTO;
import org.example.productservice.dto.ProductResponseDTO;
import org.example.productservice.entity.Product;
import org.example.productservice.mapper.ProductMapper;
import org.example.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.example.productservice.util.CsvProductParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ImageStorageService imageStorageService;
    private final InventoryServiceClient inventoryServiceClient;


    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    public List<ProductResponseDTO> getAllProducts() {
        return productRepository.findAll().stream().map(productMapper::toResponseDTO).collect(Collectors.toList());
    }

    public Page<ProductResponseDTO> getProductsPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Product> productPage = productRepository.findAll(pageable);
        return productPage.map(productMapper::toResponseDTO);
    }

    public ProductResponseDTO getProductById(Long id) {
        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Produit non trouvé"));
        return productMapper.toResponseDTO(product);
    }

    public List<ProductResponseDTO> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream().map(productMapper::toResponseDTO).collect(Collectors.toList());
    }

    public List<ProductResponseDTO> searchProducts(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllProducts();
        }
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(productMapper::toResponseDTO)
                .collect(Collectors.toList());
    }



    @Transactional
    public ProductResponseDTO createProduct(ProductRequestDTO request) throws IOException {
        if (request.getSku() != null && productRepository.findBySku(request.getSku()).isPresent()) {
            throw new RuntimeException("Un produit avec ce SKU existe déjà");
        }
        Product product = productMapper.toEntity(request);
        product = productRepository.save(product);

        inventoryServiceClient.createInventoryForProduct(product.getId());
        MultipartFile imageFile = request.getImageFile();
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = imageStorageService.saveImage(imageFile, product.getId());
            product.setImageUrl(imageUrl);
            product = productRepository.save(product);
        }

        return productMapper.toResponseDTO(product);
    }

    @Transactional
    public void importProductsFromCsv(MultipartFile file) throws IOException {
        List<Product> products = CsvProductParser.parse(file);
        for (Product product : products) {
            if (product.getSku() != null && productRepository.findBySku(product.getSku()).isPresent()) {
                continue;
            }
            Product savedProduct = productRepository.save(product);
            inventoryServiceClient.createInventoryForProduct(savedProduct.getId());
        }
    }

    @Transactional
    public ProductResponseDTO updateProduct(Long id, ProductRequestDTO request) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (request.getSku() != null && !request.getSku().equals(product.getSku()) && productRepository.findBySku(request.getSku()).isPresent()) {
            throw new RuntimeException("Un autre produit avec ce SKU existe déjà");
        }

        String oldImageUrl = product.getImageUrl();
        productMapper.updateEntity(request, product);

        MultipartFile imageFile = request.getImageFile();
        if (imageFile != null && !imageFile.isEmpty()) {
            if (oldImageUrl != null) {
                imageStorageService.deleteImage(oldImageUrl);
            }
            String imageUrl = imageStorageService.saveImage(imageFile, product.getId());
            product.setImageUrl(imageUrl);
        }

        product = productRepository.save(product);
        return productMapper.toResponseDTO(product);
    }

    @Transactional
    public void deleteProduct(Long id) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        if (product.getImageUrl() != null) {
            imageStorageService.deleteImage(product.getImageUrl());
        }
        productRepository.deleteById(id);
    }


    public Page<ProductResponseDTO> getFilteredProducts(
            int page,
            int size,
            String keyword,
            String category
    ) {

        Pageable pageable = PageRequest.of(page, size);

        boolean hasKeyword = keyword != null && !keyword.isBlank();
        boolean hasCategory = category != null && !category.isBlank();

        Page<Product> products;

        if (!hasKeyword && !hasCategory) {
            products = productRepository.findAll(pageable);
        }

        else if (hasKeyword && hasCategory) {
            products = productRepository
                    .findByNameContainingIgnoreCaseAndCategory(keyword, category, pageable);
        }

        else if (hasKeyword) {
            products = productRepository
                    .findByNameContainingIgnoreCase(keyword, pageable);
        }

        else {
            products = productRepository
                    .findByCategory(category, pageable);
        }

        return products.map(productMapper::toResponseDTO);
    }


}