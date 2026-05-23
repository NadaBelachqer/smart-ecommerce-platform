package org.example.productservice.integration;

import org.example.productservice.client.InventoryServiceClient;
import org.example.productservice.entity.Product;
import org.example.productservice.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ProductIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ProductRepository productRepository;

    @MockBean
    private InventoryServiceClient inventoryServiceClient;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        doNothing().when(inventoryServiceClient).createInventoryForProduct(anyLong());
    }

    @Test
    void shouldGetProductById() {
        // Sauvegarder un produit
        Product product = new Product();
        product.setSku("P001");
        product.setName("Laptop");
        product.setCategory("Electronics");
        product.setSellingPrice(500.0);
        Product saved = productRepository.save(product);

        // Tester la récupération
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/products/" + saved.getId(),
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("name")).isEqualTo("Laptop");
    }

    @Test
    void shouldReturnPaginatedProducts() {
        // Sauvegarder des produits
        for (int i = 1; i <= 5; i++) {
            Product product = new Product();
            product.setSku("P00" + i);
            product.setName("Product " + i);
            product.setCategory("Electronics");
            product.setSellingPrice(100.0 * i);
            productRepository.save(product);
        }

        // Tester la pagination
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/products?page=0&size=10",
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("content")).isNotNull();
    }

    @Test
    void shouldCheckIfProductExists() {
        // Sauvegarder un produit
        Product product = new Product();
        product.setSku("P002");
        product.setName("Phone");
        product.setCategory("Electronics");
        product.setSellingPrice(300.0);
        Product saved = productRepository.save(product);

        // Tester existence
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/products/" + saved.getId() + "/exists",
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().get("exists")).isEqualTo(true);

        // Tester produit inexistant
        ResponseEntity<Map> response2 = restTemplate.getForEntity(
                "/products/999/exists",
                Map.class
        );

        assertThat(response2.getBody().get("exists")).isEqualTo(false);
    }


    @Test
    void shouldGetProductsByCategory() {
        Product product1 = new Product();
        product1.setSku("P005");
        product1.setName("TV Samsung");
        product1.setCategory("Electronics");
        product1.setSellingPrice(599.99);

        Product product2 = new Product();
        product2.setSku("P006");
        product2.setName("Java Programming");
        product2.setCategory("Books");
        product2.setSellingPrice(49.99);

        productRepository.save(product1);
        productRepository.save(product2);

        // Tester par catégorie
        ResponseEntity<List> response = restTemplate.exchange(
                "/products/category/Electronics",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List>() {}
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().size()).isEqualTo(1);
    }

    @Test
    void shouldGetFilteredProducts() {
        Product product1 = new Product();
        product1.setSku("P007");
        product1.setName("Dell Laptop");
        product1.setCategory("Electronics");
        product1.setSellingPrice(999.99);

        Product product2 = new Product();
        product2.setSku("P008");
        product2.setName("Apple Phone");
        product2.setCategory("Electronics");
        product2.setSellingPrice(699.99);

        productRepository.save(product1);
        productRepository.save(product2);

        // Tester avec filtre
        ResponseEntity<Map> response = restTemplate.getForEntity(
                "/products?category=Electronics&page=0&size=10",
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
    }
}