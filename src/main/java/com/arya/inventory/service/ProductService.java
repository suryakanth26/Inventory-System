package com.arya.inventory.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.arya.inventory.dto.LowStockProductResponse;
import com.arya.inventory.entity.Product;
import com.arya.inventory.repository.ProductRepository;
import com.arya.inventory.repository.SupplierRepository;

@Service
public class ProductService {
    
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    
    @Autowired
    public ProductService(ProductRepository productRepository, SupplierRepository supplierRepository) {
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
    }
    
    public Product createProduct(Product product) {
        validateProduct(product);
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("Product with SKU " + product.getSku() + " already exists");
        }
        return productRepository.save(product);
    }
    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }
    
    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }
    
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }
    
    public List<Product> searchProductsByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }
    
    public List<LowStockProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(LowStockProductResponse::fromProduct)
                .collect(Collectors.toList());
    }
    
    public List<Product> getLowStockProducts(Integer threshold) {
        if (threshold == null) {
            return productRepository.findLowStockProducts();
        }
        return productRepository.findLowStockProductsByThreshold(threshold);
    }
    
    public List<Product> getProductsBySupplier(Long supplierId) {
        return productRepository.findBySupplierId(supplierId);
    }
    
    public Product updateProduct(Product product) {
        if (product.getId() == null) {
            throw new RuntimeException("Product ID is required for update");
        }
        validateProduct(product);
        return productRepository.save(product);
    }
    
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
    
    public Product updateStock(Long productId, Integer quantityChange) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        int newQuantity = product.getQty() + quantityChange;
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock. Current stock: " + product.getQty());
        }
        
        product.setQty(newQuantity);
        return productRepository.save(product);
    }
    
    public boolean existsBySku(String sku) {
        return productRepository.existsBySku(sku);
    }

    private void validateProduct(Product product) {
        if (product.getReorderLevel() != null && product.getReorderLevel() < 0) {
            throw new IllegalArgumentException("Reorder level cannot be negative");
        }
        if (product.getQty() != null && product.getQty() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
    }
}
