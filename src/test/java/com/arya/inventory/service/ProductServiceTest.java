package com.arya.inventory.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.arya.inventory.dto.LowStockProductResponse;
import com.arya.inventory.entity.Product;
import com.arya.inventory.repository.ProductRepository;
import com.arya.inventory.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private ProductService productService;

    private Product productAboveReorder;
    private Product productEqualReorder;
    private Product productBelowReorder;
    private Product productZeroStock;

    @BeforeEach
    void setUp() {
        productAboveReorder = new Product("Keyboard", "KB-001", "Electronics", new BigDecimal("49.99"), 15, 10);
        productAboveReorder.setId(1L);

        productEqualReorder = new Product("Monitor", "MON-001", "Electronics", new BigDecimal("199.99"), 10, 10);
        productEqualReorder.setId(2L);

        productBelowReorder = new Product("Wireless Mouse", "MOUSE-001", "Electronics", new BigDecimal("29.99"), 8, 10);
        productBelowReorder.setId(3L);

        productZeroStock = new Product("USB Cable", "USB-001", "Electronics", new BigDecimal("9.99"), 0, 5);
        productZeroStock.setId(4L);
    }

    @Test
    @DisplayName("Test 1: Stock greater than reorder level is filtered out by query")
    void testStockGreaterThanReorderLevelNotReturned() {
        when(productRepository.findLowStockProducts()).thenReturn(Arrays.asList(productEqualReorder, productBelowReorder));

        List<LowStockProductResponse> lowStockProducts = productService.getLowStockProducts();

        assertEquals(2, lowStockProducts.size());
        assertTrue(lowStockProducts.stream().noneMatch(p -> p.getProductId().equals(1L)));
    }

    @Test
    @DisplayName("Test 2: Stock equal to reorder level is returned")
    void testStockEqualToReorderLevelReturned() {
        when(productRepository.findLowStockProducts()).thenReturn(Collections.singletonList(productEqualReorder));

        List<LowStockProductResponse> lowStockProducts = productService.getLowStockProducts();

        assertEquals(1, lowStockProducts.size());
        assertEquals("Monitor", lowStockProducts.get(0).getProductName());
        assertEquals(10, lowStockProducts.get(0).getCurrentStock());
        assertEquals(10, lowStockProducts.get(0).getReorderLevel());
        assertEquals("LOW_STOCK", lowStockProducts.get(0).getStatus());
    }

    @Test
    @DisplayName("Test 3: Stock below reorder level is returned")
    void testStockBelowReorderLevelReturned() {
        when(productRepository.findLowStockProducts()).thenReturn(Collections.singletonList(productBelowReorder));

        List<LowStockProductResponse> lowStockProducts = productService.getLowStockProducts();

        assertEquals(1, lowStockProducts.size());
        assertEquals("Wireless Mouse", lowStockProducts.get(0).getProductName());
        assertEquals(8, lowStockProducts.get(0).getCurrentStock());
        assertEquals(10, lowStockProducts.get(0).getReorderLevel());
        assertEquals("LOW_STOCK", lowStockProducts.get(0).getStatus());
    }

    @Test
    @DisplayName("Test 4: Zero stock is returned when reorder level is zero or greater")
    void testZeroStockReturned() {
        when(productRepository.findLowStockProducts()).thenReturn(Collections.singletonList(productZeroStock));

        List<LowStockProductResponse> lowStockProducts = productService.getLowStockProducts();

        assertEquals(1, lowStockProducts.size());
        assertEquals("USB Cable", lowStockProducts.get(0).getProductName());
        assertEquals(0, lowStockProducts.get(0).getCurrentStock());
        assertEquals(5, lowStockProducts.get(0).getReorderLevel());
        assertEquals("OUT_OF_STOCK", lowStockProducts.get(0).getStatus());
    }

    @Test
    @DisplayName("Test 5: No matching products returns empty array")
    void testNoMatchingProductsReturnsEmptyList() {
        when(productRepository.findLowStockProducts()).thenReturn(Collections.emptyList());

        List<LowStockProductResponse> lowStockProducts = productService.getLowStockProducts();

        assertNotNull(lowStockProducts);
        assertTrue(lowStockProducts.isEmpty());
    }

    @Test
    @DisplayName("Test 6: Existing product CRUD operations continue working with reorderLevel")
    void testProductCrudOperations() {
        Product newProduct = new Product("Desk Lamp", "LAMP-001", "Furniture", new BigDecimal("34.99"), 20, 5);
        when(productRepository.existsBySku("LAMP-001")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(newProduct);
        when(productRepository.findById(10L)).thenReturn(Optional.of(newProduct));
        when(productRepository.findAll()).thenReturn(Collections.singletonList(newProduct));

        Product created = productService.createProduct(newProduct);
        assertNotNull(created);
        assertEquals(5, created.getReorderLevel());

        Optional<Product> fetched = productService.getProductById(10L);
        assertTrue(fetched.isPresent());
        assertEquals("Desk Lamp", fetched.get().getName());

        List<Product> all = productService.getAllProducts();
        assertEquals(1, all.size());

        newProduct.setId(10L);
        newProduct.setQty(18);
        when(productRepository.save(newProduct)).thenReturn(newProduct);
        Product updated = productService.updateProduct(newProduct);
        assertEquals(18, updated.getQty());

        productService.deleteProduct(10L);
        verify(productRepository, times(1)).deleteById(10L);
    }

    @Test
    @DisplayName("Test 7: Reorder level validation rejects negative values")
    void testReorderLevelValidationRejectsNegativeValues() {
        Product invalidProduct = new Product("Invalid Product", "INV-001", "Electronics", new BigDecimal("10.00"), 5, -5);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productService.createProduct(invalidProduct)
        );

        assertEquals("Reorder level cannot be negative", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Validation rejects negative stock quantity")
    void testStockQuantityValidationRejectsNegativeValues() {
        Product invalidStockProduct = new Product("Invalid Stock", "INV-002", "Electronics", new BigDecimal("10.00"), -2, 5);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productService.createProduct(invalidStockProduct)
        );

        assertEquals("Quantity cannot be negative", exception.getMessage());
        verify(productRepository, never()).save(any());
    }
}
