import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  RefreshCw, 
  Calendar, 
  Tag, 
  Layers, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { transactionsApi } from '../api/transactionsApi';
import { productsApi } from '../api/productsApi';
import { TransactionTypeBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Transaction Modal
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    qty: '',
    type: 'STOCK_IN',
    batchNumber: '',
    lotNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [trans, prods] = await Promise.all([
        transactionsApi.getAll().catch(() => []),
        productsApi.getAll().catch(() => []),
      ]);
      setTransactions((trans || []).reverse());
      setProducts(prods || []);
    } catch (err) {
      error('Failed to load transaction movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const typeMatch = selectedType === 'ALL' || t.type === selectedType;
      const term = searchTerm.toLowerCase().trim();
      const searchMatch =
        !term ||
        t.product?.name?.toLowerCase().includes(term) ||
        t.product?.sku?.toLowerCase().includes(term) ||
        t.batchNumber?.toLowerCase().includes(term) ||
        t.lotNumber?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term) ||
        t.user?.username?.toLowerCase().includes(term);

      return typeMatch && searchMatch;
    });
  }, [transactions, selectedType, searchTerm]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      productId: products[0]?.id ? String(products[0].id) : '',
      qty: 1,
      type: 'STOCK_IN',
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      lotNumber: `LOT-A1`,
      manufacturingDate: new Date().toISOString().slice(0, 10),
      expiryDate: '',
      notes: '',
    });
    setTransactionModalOpen(true);
  };

  // Submit Transaction
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.qty || Number(formData.qty) <= 0) {
      error('Please select a product and enter a valid positive quantity');
      return;
    }

    setSaving(true);
    const parsedQty = parseInt(formData.qty, 10);
    const currentUser = JSON.parse(localStorage.getItem('arya_user') || '{}');

    // In Spring Boot: Transaction entity fields:
    // product, qty, type, user, notes, batchNumber, lotNumber, manufacturingDate, expiryDate
    const payload = {
      product: { id: Number(formData.productId) },
      qty: parsedQty,
      type: formData.type,
      user: { id: currentUser.id || 1 },
      notes: formData.notes,
      batchNumber: formData.batchNumber || null,
      lotNumber: formData.lotNumber || null,
      manufacturingDate: formData.manufacturingDate ? `${formData.manufacturingDate}T00:00:00` : null,
      expiryDate: formData.expiryDate ? `${formData.expiryDate}T00:00:00` : null,
    };

    try {
      // 1. Post transaction
      await transactionsApi.create(payload);

      // 2. Adjust product quantity according to movement type
      let delta = 0;
      if (['STOCK_IN', 'PURCHASE', 'RETURN'].includes(formData.type)) {
        delta = parsedQty;
      } else if (['STOCK_OUT', 'SALE'].includes(formData.type)) {
        delta = -parsedQty;
      }
      if (delta !== 0) {
        await productsApi.updateStock(formData.productId, delta).catch(() => {});
      }

      success(`Recorded ${formData.type} movement for ${parsedQty} units!`);
      setTransactionModalOpen(false);
      loadData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to record movement');
    } finally {
      setSaving(false);
    }
  };

  // Export CSV
  const exportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['ID,Product,SKU,Quantity,Type,Date,User,BatchNumber,LotNumber,Notes'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.product?.name || ''}"`,
      `"${t.product?.sku || ''}"`,
      t.qty,
      t.type,
      t.date,
      `"${t.user?.username || ''}"`,
      `"${t.batchNumber || ''}"`,
      `"${t.lotNumber || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Inventory Movement & Audit Ledger
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Immutable historical record of inbound stock, dispatches, batch lots, and adjustments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadData} className="neu-button" title="Refresh ledger">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Sync Ledger</span>
          </button>

          <button onClick={exportCsv} className="neu-button" title="Export transactions ledger to CSV">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button onClick={handleOpenCreate} className="neu-button neu-button-primary">
            <Plus size={16} />
            <span>Record Movement</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            className="neu-input"
            placeholder="Search by product, SKU, batch code, lot, or user memo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ width: '210px' }}>
          <select
            className="neu-input"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="ALL">All Movement Types</option>
            <option value="STOCK_IN">Stock In (+)</option>
            <option value="STOCK_OUT">Stock Out (-)</option>
            <option value="PURCHASE">Vendor Purchase (+)</option>
            <option value="SALE">Sales Dispatch (-)</option>
            <option value="RETURN">Customer Return (+)</option>
            <option value="ADJUSTMENT">Stock Adjustment</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product SKU</th>
              <th>Movement Type</th>
              <th>Units</th>
              <th>Batch / Lot</th>
              <th>Date & Time</th>
              <th>Recorded By</th>
              <th>Notes & Context</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <ArrowLeftRight size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                  <p>No transaction ledger entries match the criteria.</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      #{t.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.product?.name || `Product #${t.product?.id || 'N/A'}`}
                    </div>
                    {t.product?.sku && (
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)' }}>
                        {t.product.sku}
                      </span>
                    )}
                  </td>
                  <td>
                    <TransactionTypeBadge type={t.type} />
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: ['STOCK_IN', 'PURCHASE', 'RETURN'].includes(t.type)
                          ? 'var(--success-text)'
                          : 'var(--danger-text)',
                      }}
                    >
                      {['STOCK_IN', 'PURCHASE', 'RETURN'].includes(t.type) ? `+${t.qty}` : `-${t.qty}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {t.batchNumber ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          B: {t.batchNumber}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Batch</span>
                      )}
                      {t.lotNumber && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          L: {t.lotNumber}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} color="var(--text-muted)" />
                      <span>{t.date ? new Date(t.date).toLocaleString() : 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {t.user?.username || 'System'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {t.notes || '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Movement Modal */}
      <Modal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        title="Record Inventory Movement"
        subtitle="Log an inbound receipt, dispatch, or audit adjustment to update warehouse stock."
      >
        <form onSubmit={handleTransactionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Select Product SKU *
            </label>
            <select
              className="neu-input"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.qty}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Movement Type *
              </label>
              <select
                className="neu-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="STOCK_IN">Stock In (Receipt)</option>
                <option value="STOCK_OUT">Stock Out (Issue)</option>
                <option value="PURCHASE">Vendor Purchase</option>
                <option value="SALE">Customer Sale</option>
                <option value="RETURN">Return Inward</option>
                <option value="ADJUSTMENT">Audit Adjustment</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Quantity Units *
              </label>
              <input
                type="number"
                min="1"
                className="neu-input"
                placeholder="e.g. 50"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Batch Number
              </label>
              <input
                type="text"
                className="neu-input"
                placeholder="e.g. BATCH-2024-X"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Lot Number
              </label>
              <input
                type="text"
                className="neu-input"
                placeholder="e.g. LOT-42"
                value={formData.lotNumber}
                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Manufacturing Date
              </label>
              <input
                type="date"
                className="neu-input"
                value={formData.manufacturingDate}
                onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Expiry Date
              </label>
              <input
                type="date"
                className="neu-input"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Movement Reason & Reference Notes
            </label>
            <textarea
              className="neu-input"
              placeholder="PO, customer invoice, damage write-off reason, or physical recount details..."
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setTransactionModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="neu-button neu-button-primary">
              {saving ? 'Logging Movement...' : 'Post Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
