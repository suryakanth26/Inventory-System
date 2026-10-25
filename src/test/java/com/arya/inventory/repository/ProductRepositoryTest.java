package com.arya.inventory.repository;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import com.arya.inventory.entity.Product;

@DataJpaTest
class ProductRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void testFindLowStockProductsQuery() {
        Product highStock = new Product("High Stock Product", "SKU-001", "Cat1", new BigDecimal("10.00"), 50, 10);
        Product equalStock = new Product("Equal Stock Product", "SKU-002", "Cat1", new BigDecimal("10.00"), 10, 10);
        Product lowStock = new Product("Low Stock Product", "SKU-003", "Cat1", new BigDecimal("10.00"), 3, 10);
        Product zeroStock = new Product("Zero Stock Product", "SKU-004", "Cat1", new BigDecimal("10.00"), 0, 5);

        entityManager.persist(highStock);
        entityManager.persist(equalStock);
        entityManager.persist(lowStock);
        entityManager.persist(zeroStock);
        entityManager.flush();

        List<Product> lowStockProducts = productRepository.findLowStockProducts();

        assertEquals(3, lowStockProducts.size());
        assertTrue(lowStockProducts.stream().anyMatch(p -> p.getSku().equals("SKU-002")));
        assertTrue(lowStockProducts.stream().anyMatch(p -> p.getSku().equals("SKU-003")));
        assertTrue(lowStockProducts.stream().anyMatch(p -> p.getSku().equals("SKU-004")));
        assertTrue(lowStockProducts.stream().noneMatch(p -> p.getSku().equals("SKU-001")));
    }
}
