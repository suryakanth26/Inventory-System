package com.arya.inventory.dto;

import com.arya.inventory.entity.Product;

public class LowStockProductResponse {

    private Long productId;
    private String productName;
    private Integer currentStock;
    private Integer reorderLevel;
    private String status;

    public LowStockProductResponse() {}

    public LowStockProductResponse(Long productId, String productName, Integer currentStock, Integer reorderLevel, String status) {
        this.productId = productId;
        this.productName = productName;
        this.currentStock = currentStock;
        this.reorderLevel = reorderLevel;
        this.status = status;
    }

    public static LowStockProductResponse fromProduct(Product product) {
        if (product == null) {
            return null;
        }
        String status = (product.getQty() != null && product.getQty() == 0) ? "OUT_OF_STOCK" : "LOW_STOCK";
        return new LowStockProductResponse(
            product.getId(),
            product.getName(),
            product.getQty(),
            product.getReorderLevel(),
            status
        );
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public Integer getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
