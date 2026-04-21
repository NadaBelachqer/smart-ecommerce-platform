package org.example.productservice.controller;

import org.example.productservice.dto.ProductRequestDTO;
import org.example.productservice.dto.ProductResponseDTO;
import org.example.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;


    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(
                productService.getFilteredProducts(page, size, keyword, category)
        );
    }

    @PostMapping(value = "/admin/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> importProductsFromCsv(@RequestPart("file") MultipartFile file) throws IOException {
        productService.importProductsFromCsv(file);
        return ResponseEntity.ok("Import CSV réussi");
    }

   /* @GetMapping
    public ResponseEntity<List<ProductResponseDTO>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }*/


    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Map<String, Object>> checkProductExists(@PathVariable Long id) {
        boolean exists = productService.existsById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("productId", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductResponseDTO>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponseDTO>> searchProducts(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }

    /*@GetMapping("/admin/list")
    public ResponseEntity<List<ProductResponseDTO>> getAllProductsAdmin() {
        return ResponseEntity.ok(productService.getAllProducts());
    }
*/


    @GetMapping("/admin/list")
    public ResponseEntity<Page<ProductResponseDTO>> getProductsAdminPaginated(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(productService.getProductsPaginated(page, size)
        );
    }

    @PostMapping(value = "/admin/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDTO> createProduct(@RequestPart("product") @Valid ProductRequestDTO request, @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        request.setImageFile(image);
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping(value = "/admin/update/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable Long id, @RequestPart("product") @Valid ProductRequestDTO request, @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {
        request.setImageFile(image);
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/admin/delete/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) throws IOException {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}