import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Boxes,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { suppliersApi } from '../api/suppliersApi';
import { transactionsApi } from '../api/transactionsApi';
import { StockStatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Add / Edit Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    price: '',
    qty: 0,
    reorderLevel: 10,
    supplierId: '',
    description: '',
  });

  // Stock In / Out Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState(null);
  const [stockType, setStockType] = useState('IN');
  const [stockDelta, setStockDelta] = useState('');
  const [stockNotes, setStockNotes] = useState('');

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, supps] = await Promise.all([
        productsApi.getAll().catch(() => []),
        suppliersApi.getAll().catch(() => []),
      ]);
      setProducts(prods || []);
      setSuppliers(supps || []);
    } catch (err) {
      error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    if (q != null) setSearchTerm(q);
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Distinct Categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const searchMatch =
        !searchTerm.trim() ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category
      const categoryMatch = selectedCategory === 'ALL' || p.category === selectedCategory;

      // Status
      let statusMatch = true;
      const q = Number(p.qty) || 0;
      const r = Number(p.reorderLevel) || 10;
      if (selectedStatus === 'OUT') statusMatch = q === 0;
      else if (selectedStatus === 'LOW') statusMatch = q > 0 && q <= r;
      else if (selectedStatus === 'HEALTHY') statusMatch = q > r;

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: categories[0] || 'Electronics',
      price: '',
      qty: 10,
      reorderLevel: 10,
      supplierId: suppliers[0]?.id ? String(suppliers[0].id) : '',
      description: '',
    });
    setProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      category: prod.category || 'Electronics',
      price: prod.price || '',
      qty: prod.qty || 0,
      reorderLevel: prod.reorderLevel ?? 10,
      supplierId: prod.supplier?.id ? String(prod.supplier.id) : '',
      description: prod.description || '',
    });
    setProductModalOpen(true);
  };

  // Submit Create / Edit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.price) {
      error('Please complete all required fields (*)');
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      price: parseFloat(formData.price),
      qty: parseInt(formData.qty, 10),
      reorderLevel: parseInt(formData.reorderLevel, 10),
      description: formData.description,
      supplier: formData.supplierId ? { id: Number(formData.supplierId) } : null,
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        success(`Product '${payload.name}' updated successfully!`);
      } else {
        await productsApi.create(payload);
        success(`Product '${payload.name}' created successfully!`);
      }
      setProductModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Open Stock Modal
  const handleOpenStock = (prod, type) => {
    setStockTargetProduct(prod);
    setStockType(type);
    setStockDelta('');
    setStockNotes('');
    setStockModalOpen(true);
  };

  // Submit Stock Adjustment
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockDelta || Number(stockDelta) <= 0) {
      error('Please enter a valid quantity');
      return;
    }

    setSaving(true);
    const parsedQty = parseInt(stockDelta, 10);
    const change = stockType === 'IN' ? parsedQty : -parsedQty;

    try {
      await productsApi.updateStock(stockTargetProduct.id, change);

      const currentUser = JSON.parse(localStorage.getItem('arya_user') || '{}');
      await transactionsApi.create({
        product: { id: stockTargetProduct.id },
        qty: parsedQty,
        type: stockType === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
        user: { id: currentUser.id || 1 },
        notes: stockNotes || `Manual stock ${stockType} on product catalog`,
      });

      success(`Updated stock for ${stockTargetProduct.name} by ${change > 0 ? `+${change}` : change}`);
      setStockModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Stock adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setSaving(true);
    try {
      await productsApi.delete(productToDelete.id);
      success(`Product '${productToDelete.name}' deleted successfully.`);
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportToCsv = () => {
    if (products.length === 0) return;
    const headers = ['ID,Name,SKU,Category,Price,Quantity,ReorderLevel,Supplier,Description'];
    const rows = products.map((p) =>
      [
        p.id,
        `"${p.name?.replace(/"/g, '""') || ''}"`,
        `"${p.sku || ''}"`,
        `"${p.category || ''}"`,
        p.price,
        p.qty,
        p.reorderLevel,
        `"${p.supplier?.name || ''}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `our_store_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Products Inventory Catalog
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {filteredProducts.length} of {products.length} inventory items
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadData} className="neu-button" title="Refresh product list">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button onClick={exportToCsv} className="neu-button" title="Export catalog as CSV">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button onClick={handleOpenCreate} className="neu-button neu-button-primary">
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            className="neu-input"
            placeholder="Search by name, SKU, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Category Filter */}
        <div style={{ width: '190px' }}>
          <select
            className="neu-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div style={{ width: '180px' }}>
          <select
            className="neu-input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="ALL">All Stock Levels</option>
            <option value="HEALTHY">Healthy Stock</option>
            <option value="LOW">Low Stock Alert</option>
            <option value="OUT">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU / Code</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Stock Level</th>
              <th>Threshold</th>
              <th>Status</th>
              <th>Supplier</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '22px' }}>
                  <div className="skeleton" style={{ height: 14, marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 14, marginBottom: 12, width: '88%' }} />
                  <div className="skeleton" style={{ height: 14, width: '72%' }} />
                </td>
              </tr>
            ) : pagedProducts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Boxes size={32} color="var(--text-muted)" />
                    <p style={{ fontSize: '14px' }}>No products match your search or filter criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-400)', fontSize: '12.5px' }}>
                      {p.sku}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{p.category}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    ${Number(p.price || 0).toFixed(2)}
                  </td>
                  <td>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: p.qty === 0 ? 'var(--danger-text)' : (p.qty <= (p.reorderLevel || 10) ? 'var(--warning-text)' : 'var(--text-primary)') }}>
                      {p.qty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> units</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {p.reorderLevel || 10}
                  </td>
                  <td>
                    <StockStatusBadge qty={p.qty} reorderLevel={p.reorderLevel} />
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: p.supplier?.name ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {p.supplier?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenStock(p, 'IN')}
                        className="neu-button neu-button-sm neu-button-success"
                        title="Stock In (+)"
                        style={{ padding: '6px 9px' }}
                      >
                        <ArrowDownLeft size={13} />
                        <span>In</span>
                      </button>

                      <button
                        onClick={() => handleOpenStock(p, 'OUT')}
                        className="neu-button neu-button-sm neu-button-danger"
                        title="Stock Out (-)"
                        style={{ padding: '6px 9px' }}
                      >
                        <ArrowUpRight size={13} />
                        <span>Out</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="neu-button neu-button-sm"
                        title="Edit product"
                        style={{ padding: '6px 9px' }}
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => {
                          setProductToDelete(p);
                          setDeleteModalOpen(true);
                        }}
                        className="neu-button neu-button-sm"
                        title="Delete product"
                        style={{ padding: '6px 9px', color: 'var(--danger-text)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredProducts.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <button className="neu-button neu-button-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Page {page} of {pageCount}</span>
          <button className="neu-button neu-button-sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product SKU'}
        subtitle="Configure inventory item attributes, pricing, reorder thresholds, and supplier."
      >
        <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Product Name *
              </label>
              <input
                type="text"
                className="neu-input"
                placeholder="e.g. Ergonomic Keyboard"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                SKU Code *
              </label>
              <input
                type="text"
                className="neu-input"
                placeholder="e.g. KB-ERG-01"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Category *
              </label>
              <input
                type="text"
                className="neu-input"
                placeholder="e.g. Electronics"
                list="category-suggestions"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <datalist id="category-suggestions">
                <option value="Electronics" />
                <option value="Furniture" />
                <option value="Office Supplies" />
                <option value="Appliances" />
                <option value="Packaging" />
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Unit Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="neu-input"
                placeholder="99.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Current Quantity *
              </label>
              <input
                type="number"
                min="0"
                className="neu-input"
                placeholder="0"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Reorder Threshold Level *
              </label>
              <input
                type="number"
                min="0"
                className="neu-input"
                placeholder="10"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Associated Supplier
            </label>
            <select
              className="neu-input"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            >
              <option value="">-- No Supplier Assigned --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contact || 'No Contact'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Description & Specifications
            </label>
            <textarea
              className="neu-input"
              placeholder="Technical specs, dimensions, material or warehouse storage notes..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="neu-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="neu-button neu-button-primary"
            >
              {saving ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`${stockType === 'IN' ? 'Stock In (Replenish)' : 'Stock Out (Issue)'}: ${stockTargetProduct?.name}`}
        subtitle={`Current available quantity: ${stockTargetProduct?.qty || 0} units.`}
      >
        <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Quantity to {stockType === 'IN' ? 'Add' : 'Deduct'} *
            </label>
            <input
              type="number"
              min="1"
              className="neu-input"
              placeholder="e.g. 20"
              value={stockDelta}
              onChange={(e) => setStockDelta(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Transaction Notes
            </label>
            <textarea
              className="neu-input"
              placeholder="PO number, dispatch order, or reason..."
              rows={2}
              value={stockNotes}
              onChange={(e) => setStockNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setStockModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`neu-button ${stockType === 'IN' ? 'neu-button-success' : 'neu-button-danger'}`}
            >
              {saving ? 'Processing...' : `Confirm Stock ${stockType}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm SKU Deletion"
        subtitle="This action permanently removes the product from the catalog."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={22} color="var(--danger-text)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong> (SKU: {productToDelete?.sku})?
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setDeleteModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={confirmDelete}
              className="neu-button neu-button-danger"
            >
              {saving ? 'Deleting...' : 'Delete SKU'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
