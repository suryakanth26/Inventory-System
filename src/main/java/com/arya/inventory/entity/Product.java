package com.arya.inventory.entity;

import java.math.BigDecimal;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "products")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Product name is required")
    @Column(nullable = false)
    private String name;
    
    @NotBlank(message = "SKU is required")
    @Column(unique = true, nullable = false)
    private String sku;
    
    @NotBlank(message = "Category is required")
    @Column(nullable = false)
    private String category;
    
    @NotNull(message = "Price is required")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @NotNull(message = "Quantity is required")
    @PositiveOrZero(message = "Quantity must be positive or zero")
    @Column(nullable = false)
    private Integer qty;
    
    @NotNull(message = "Reorder level is required")
    @PositiveOrZero(message = "Reorder level must be positive or zero")
    @Column(name = "reorder_level", nullable = false)
    private Integer reorderLevel = 10;
    
    @Column(length = 1000)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> transactions;
    
    // Constructors
    public Product() {}
    
    public Product(String name, String sku, String category, BigDecimal price, Integer qty) {
        this(name, sku, category, price, qty, 10);
    }
    
    public Product(String name, String sku, String category, BigDecimal price, Integer qty, Integer reorderLevel) {
        this.name = name;
        this.sku = sku;
        this.category = category;
        this.price = price;
        this.qty = qty;
        this.reorderLevel = reorderLevel != null ? reorderLevel : 10;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getSku() {
        return sku;
    }
    
    public void setSku(String sku) {
        this.sku = sku;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    
    public Integer getQty() {
        return qty;
    }
    
    public void setQty(Integer qty) {
        this.qty = qty;
    }
    
    public Integer getReorderLevel() {
        return reorderLevel;
    }
    
    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Supplier getSupplier() {
        return supplier;
    }
    
    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }
    
    public List<Transaction> getTransactions() {
        return transactions;
    }
    
    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }
}
