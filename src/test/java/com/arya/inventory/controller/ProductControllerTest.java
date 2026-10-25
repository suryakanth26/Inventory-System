package com.arya.inventory.controller;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.arya.inventory.dto.LowStockProductResponse;
import com.arya.inventory.entity.Product;
import com.arya.inventory.service.ProductService;
import com.arya.inventory.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(controllers = ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private LowStockProductResponse mouseResponse;
    private LowStockProductResponse coffeeMakerResponse;

    @BeforeEach
    void setUp() {
        mouseResponse = new LowStockProductResponse(101L, "Wireless Mouse", 8, 10, "LOW_STOCK");
        coffeeMakerResponse = new LowStockProductResponse(105L, "Coffee Maker", 0, 15, "OUT_OF_STOCK");
    }

    @Test
    @DisplayName("GET /api/products/low-stock returns HTTP 200 with list of low stock products")
    void testGetLowStockProductsReturnsList() throws Exception {
        when(productService.getLowStockProducts()).thenReturn(Arrays.asList(mouseResponse, coffeeMakerResponse));

        mockMvc.perform(get("/api/products/low-stock")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].productId").value(101))
                .andExpect(jsonPath("$[0].productName").value("Wireless Mouse"))
                .andExpect(jsonPath("$[0].currentStock").value(8))
                .andExpect(jsonPath("$[0].reorderLevel").value(10))
                .andExpect(jsonPath("$[0].status").value("LOW_STOCK"))
                .andExpect(jsonPath("$[1].productId").value(105))
                .andExpect(jsonPath("$[1].productName").value("Coffee Maker"))
                .andExpect(jsonPath("$[1].currentStock").value(0))
                .andExpect(jsonPath("$[1].status").value("OUT_OF_STOCK"));
    }

    @Test
    @DisplayName("GET /api/products/low-stock returns HTTP 200 with empty array when no products match")
    void testGetLowStockProductsReturnsEmptyArray() throws Exception {
        when(productService.getLowStockProducts()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/products/low-stock")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("POST /api/products rejects product with negative reorder level")
    void testCreateProductWithNegativeReorderLevel() throws Exception {
        Product invalidProduct = new Product("Invalid Product", "INV-999", "Electronics", new BigDecimal("19.99"), 10, -5);
        when(productService.createProduct(any(Product.class)))
                .thenThrow(new IllegalArgumentException("Reorder level cannot be negative"));

        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidProduct)))
                .andExpect(status().isBadRequest());
    }
}
