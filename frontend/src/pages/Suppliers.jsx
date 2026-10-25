import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  UserCheck, 
  Boxes,
  AlertCircle
} from 'lucide-react';
import { suppliersApi } from '../api/suppliersApi';
import { productsApi } from '../api/productsApi';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    history: '',
  });

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [supps, prods] = await Promise.all([
        suppliersApi.getAll().catch(() => []),
        productsApi.getAll().catch(() => []),
      ]);
      setSuppliers(supps || []);
      setProducts(prods || []);
    } catch (err) {
      error('Failed to load supplier records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute products supplied per supplier
  const supplierProductCount = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (p.supplier?.id) {
        map[p.supplier.id] = (map[p.supplier.id] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.contact?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.toLowerCase().includes(term) ||
        s.address?.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      history: '',
    });
    setSupplierModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      history: supplier.history || '',
    });
    setSupplierModalOpen(true);
  };

  // Submit Supplier Create/Edit
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) {
      error('Supplier name and contact person are required');
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData);
        success(`Supplier '${formData.name}' updated!`);
      } else {
        await suppliersApi.create(formData);
        success(`Supplier '${formData.name}' added to directory!`);
      }
      setSupplierModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    setSaving(true);
    try {
      await suppliersApi.delete(supplierToDelete.id);
      success(`Supplier '${supplierToDelete.name}' removed from directory.`);
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to delete supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Vendor & Supplier Directory
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage commercial supply chain partners, contact personnel, and procurement accounts
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadData} className="neu-button" title="Refresh suppliers">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button onClick={handleOpenCreate} className="neu-button neu-button-primary">
            <Plus size={16} />
            <span>Register Vendor</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="neu-input"
            placeholder="Search suppliers by vendor name, representative, email, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredSuppliers.map((supplier) => {
          const productCount = supplierProductCount[supplier.id] || 0;
          return (
            <div key={supplier.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-400)',
                      boxShadow: 'var(--shadow-neu-raised)',
                      flexShrink: 0,
                    }}
                  >
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{supplier.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                      <UserCheck size={13} color="var(--text-muted)" />
                      <span>{supplier.contact}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleOpenEdit(supplier)}
                    className="neu-button neu-button-sm neu-button-icon"
                    title="Edit supplier"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setSupplierToDelete(supplier);
                      setDeleteModalOpen(true);
                    }}
                    className="neu-button neu-button-sm neu-button-icon"
                    title="Delete supplier"
                    style={{ color: 'var(--danger-text)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Vendor Contact Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255, 255, 255, 0.28)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.45)' }}>
                {supplier.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <Mail size={13} color="var(--primary-400)" />
                    <a href={`mailto:${supplier.email}`} style={{ color: 'var(--primary-400)', textDecoration: 'none' }}>
                      {supplier.email}
                    </a>
                  </div>
                )}

                {supplier.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <Phone size={13} color="var(--accent-cyan)" />
                    <span>{supplier.phone}</span>
                  </div>
                )}

                {supplier.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <MapPin size={13} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.3 }}>{supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Boxes size={14} color="var(--primary-400)" />
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Supplies <strong>{productCount}</strong> catalog {productCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <span className="badge badge-info" style={{ fontSize: '11px' }}>
                  ID #{supplier.id}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Truck size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: '15px' }}>No suppliers found.</p>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Vendor'}
        subtitle="Manage supplier identity, primary sales/procurement representative, and delivery coordinates."
      >
        <form onSubmit={handleSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Vendor / Company Name *
            </label>
            <input
              type="text"
              className="neu-input"
              placeholder="e.g. Apex Industrial Components Ltd"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Primary Contact Person *
            </label>
            <input
              type="text"
              className="neu-input"
              placeholder="e.g. Alex Morgan - Sales Director"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Corporate Email
              </label>
              <input
                type="email"
                className="neu-input"
                placeholder="procurement@apex.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Direct Phone
              </label>
              <input
                type="tel"
                className="neu-input"
                placeholder="+1 (555) 019-2834"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Physical Warehouse / Office Address
            </label>
            <textarea
              className="neu-input"
              placeholder="Street address, city, state, zip..."
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Commercial Agreement Notes & Delivery Terms
            </label>
            <textarea
              className="neu-input"
              placeholder="Payment terms (NET 30), typical lead times, quality certifications..."
              rows={2}
              value={formData.history}
              onChange={(e) => setFormData({ ...formData, history: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setSupplierModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="neu-button neu-button-primary">
              {saving ? 'Saving...' : (editingSupplier ? 'Update Vendor' : 'Save Vendor')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Vendor Deletion"
        subtitle="This action will remove the supplier record from the system."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={22} color="var(--danger-text)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
              Are you sure you want to remove <strong>{supplierToDelete?.name}</strong>?
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
              {saving ? 'Deleting...' : 'Delete Supplier'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
