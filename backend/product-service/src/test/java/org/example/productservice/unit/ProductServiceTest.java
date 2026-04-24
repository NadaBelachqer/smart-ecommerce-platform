package org.example.productservice.unit;

import org.example.productservice.client.InventoryServiceClient;
import org.example.productservice.dto.ProductRequestDTO;
import org.example.productservice.dto.ProductResponseDTO;
import org.example.productservice.entity.Product;
import org.example.productservice.mapper.ProductMapper;
import org.example.productservice.repository.ProductRepository;
import org.example.productservice.service.ImageStorageService;
import org.example.productservice.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ImageStorageService imageStorageService;

    @Mock
    private InventoryServiceClient inventoryServiceClient;

    @InjectMocks
    private ProductService productService;

    private Product product;
    private ProductResponseDTO responseDTO;
    private ProductRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setSku("SKU001");
        product.setName("Test Product");
        product.setSellingPrice(99.99);

        responseDTO = ProductResponseDTO.builder()
                .id(1L)
                .sku("SKU001")
                .name("Test Product")
                .sellingPrice(99.99)
                .build();

        requestDTO = new ProductRequestDTO();
        requestDTO.setSku("SKU001");
        requestDTO.setName("Test Product");
        requestDTO.setSellingPrice(99.99);
    }

    @Test
    void testGetAllProducts() {
        when(productRepository.findAll()).thenReturn(List.of(product));
        when(productMapper.toResponseDTO(product)).thenReturn(responseDTO);

        List<ProductResponseDTO> result = productService.getAllProducts();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Product");
    }

    @Test
    void testGetProductById_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productMapper.toResponseDTO(product)).thenReturn(responseDTO);

        ProductResponseDTO result = productService.getProductById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void testGetProductById_NotFound() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Produit non trouvé");
    }

    @Test
    void testCreateProduct_Success() throws Exception {
        when(productRepository.findBySku("SKU001")).thenReturn(Optional.empty());
        when(productMapper.toEntity(requestDTO)).thenReturn(product);
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponseDTO(product)).thenReturn(responseDTO);
        doNothing().when(inventoryServiceClient).createInventoryForProduct(1L);

        ProductResponseDTO result = productService.createProduct(requestDTO);

        assertThat(result).isNotNull();
        verify(inventoryServiceClient).createInventoryForProduct(1L);
    }

    @Test
    void testCreateProduct_DuplicateSku() {
        when(productRepository.findBySku("SKU001")).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.createProduct(requestDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("SKU existe déjà");
    }

    @Test
    void testDeleteProduct() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        productService.deleteProduct(1L);

        verify(productRepository).deleteById(1L);
    }

    @Test
    void testSearchProducts() {
        when(productRepository.findByNameContainingIgnoreCase("Test")).thenReturn(List.of(product));
        when(productMapper.toResponseDTO(product)).thenReturn(responseDTO);

        List<ProductResponseDTO> result = productService.searchProducts("Test");

        assertThat(result).hasSize(1);
    }
}