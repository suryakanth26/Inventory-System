import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  ArrowDownLeft, 
  RefreshCw, 
  CheckCircle2, 
  TrendingDown, 
  PackageCheck,
  ShieldCheck
} from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { transactionsApi } from '../api/transactionsApi';
import { StockStatusBadge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const LowStockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replenish Modal
  const [replenishModalOpen, setReplenishModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [replenishQty, setReplenishQty] = useState('');
  const [replenishNotes, setReplenishNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { success, error } = useToast();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getLowStock();
      setAlerts(data || []);
    } catch (err) {
      error('Failed to load low stock alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Compute KPI telemetry
  const totalAlerts = alerts.length;
  const depletedCount = useMemo(() => {
    return alerts.filter((a) => (a.currentStock ?? a.qty) === 0).length;
  }, [alerts]);

  const warningCount = totalAlerts - depletedCount;

  const totalDeficitUnits = useMemo(() => {
    return alerts.reduce((acc, a) => {
      const current = a.currentStock ?? a.qty ?? 0;
      const target = a.reorderLevel ?? 10;
      const deficit = target - current;
      return acc + (deficit > 0 ? deficit : 0);
    }, 0);
  }, [alerts]);

  const handleOpenReplenish = (item) => {
    const current = item.currentStock ?? item.qty ?? 0;
    const target = item.reorderLevel ?? 10;
    const recommended = Math.max(target - current + 10, 10);

    setSelectedItem(item);
    setReplenishQty(String(recommended));
    setReplenishNotes(`Replenishment batch to exceed reorder threshold (${target})`);
    setReplenishModalOpen(true);
  };

  const handleReplenishSubmit = async (e) => {
    e.preventDefault();
    if (!replenishQty || Number(replenishQty) <= 0) {
      error('Please enter a valid quantity to replenish');
      return;
    }

    setSaving(true);
    const id = selectedItem.productId || selectedItem.id;
    const qtyToAdd = parseInt(replenishQty, 10);

    try {
      await productsApi.updateStock(id, qtyToAdd);

      const currentUser = JSON.parse(localStorage.getItem('arya_user') || '{}');
      await transactionsApi.create({
        product: { id },
        qty: qtyToAdd,
        type: 'STOCK_IN',
        user: { id: currentUser.id || 1 },
        notes: replenishNotes || `Low stock alert resolved: added ${qtyToAdd} units`,
      });

      success(`Successfully added ${qtyToAdd} units to '${selectedItem.productName || selectedItem.name}'!`);
      setReplenishModalOpen(false);
      fetchAlerts();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to replenish stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={24} color="#F59E0B" />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Low Stock & Depletion Alerts
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Active inventory triggers where available stock has dropped at or below safety reorder levels
          </p>
        </div>

        <button onClick={fetchAlerts} className="neu-button" title="Refresh low-stock alerts">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Re-Evaluate Thresholds</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '20px',
        }}
      >
        <StatCard
          title="Total Alert SKUs"
          value={totalAlerts}
          subtitle="Items requiring immediate review"
          icon={AlertTriangle}
          color="amber"
          badgeText="Active Queue"
          badgeType="warning"
        />

        <StatCard
          title="Completely Depleted (0 Stock)"
          value={depletedCount}
          subtitle="Out of stock - zero units in warehouse"
          icon={AlertOctagon}
          color="rose"
          badgeText="Critical"
          badgeType="danger"
        />

        <StatCard
          title="Low Stock Buffer Warning"
          value={warningCount}
          subtitle="Remaining stock is at or below threshold"
          icon={TrendingDown}
          color="amber"
          badgeText="Depleting"
          badgeType="warning"
        />

        <StatCard
          title="Cumulative Deficit"
          value={`${totalDeficitUnits.toLocaleString()} units`}
          subtitle="Required units to reach minimum levels"
          icon={PackageCheck}
          color="indigo"
          badgeText="Target Units"
          badgeType="info"
        />
      </div>

      {/* Alerts Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID / SKU</th>
              <th>Product Name</th>
              <th>Current Stock</th>
              <th>Reorder Threshold</th>
              <th>Deficit to Threshold</th>
              <th>Severity Status</th>
              <th style={{ textAlign: 'right' }}>Replenish Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={36} color="var(--success-text)" />
                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      All Inventory Levels Optimal
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      No products are currently at or below their configured reorder thresholds.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((item) => {
                const id = item.productId || item.id;
                const name = item.productName || item.name;
                const current = item.currentStock ?? item.qty ?? 0;
                const threshold = item.reorderLevel ?? 10;
                const deficit = Math.max(threshold - current, 0);

                return (
                  <tr key={id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-400)' }}>
                        #{id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                        {name}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: current === 0 ? 'var(--danger-text)' : 'var(--warning-text)',
                        }}
                      >
                        {current}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> units</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{threshold} units</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--danger-text)' }}>
                        -{deficit} units
                      </span>
                    </td>
                    <td>
                      <StockStatusBadge qty={current} reorderLevel={threshold} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenReplenish(item)}
                        className="neu-button neu-button-sm neu-button-success"
                      >
                        <ArrowDownLeft size={14} />
                        <span>Restock Now</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Replenish Modal */}
      <Modal
        isOpen={replenishModalOpen}
        onClose={() => setReplenishModalOpen(false)}
        title={`Restock: ${selectedItem?.productName || selectedItem?.name}`}
        subtitle={`Current stock is ${selectedItem?.currentStock ?? selectedItem?.qty ?? 0}. Threshold is ${selectedItem?.reorderLevel ?? 10}.`}
      >
        <form onSubmit={handleReplenishSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Quantity to Inbound *
            </label>
            <input
              type="number"
              min="1"
              className="neu-input"
              value={replenishQty}
              onChange={(e) => setReplenishQty(e.target.value)}
              required
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Recommended: At least {Math.max((selectedItem?.reorderLevel || 10) - (selectedItem?.currentStock ?? selectedItem?.qty ?? 0) + 5, 10)} units.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Replenishment Memo / PO Reference
            </label>
            <textarea
              className="neu-input"
              rows={2}
              value={replenishNotes}
              onChange={(e) => setReplenishNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setReplenishModalOpen(false)} className="neu-button">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="neu-button neu-button-success"
            >
              {saving ? 'Processing Inbound...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
