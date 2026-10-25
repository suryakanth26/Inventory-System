import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, 
  AlertTriangle, 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { productsApi } from '../api/productsApi';
import { transactionsApi } from '../api/transactionsApi';
import { StatCard } from '../components/ui/StatCard';
import { StockStatusBadge, TransactionTypeBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Stock Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState('IN'); // 'IN' or 'OUT'
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsData, transData, lowStockData] = await Promise.all([
        productsApi.getAll().catch(() => []),
        transactionsApi.getAll().catch(() => []),
        productsApi.getLowStock().catch(() => []),
      ]);

      setProducts(prodsData || []);
      setTransactions((transData || []).reverse());
      setLowStockProducts(lowStockData || []);
    } catch (err) {
      error('Failed to load dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Metrics
  const totalSkus = products.length;
  const totalQuantity = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
  }, [products]);

  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);
  }, [products]);

  const lowStockCount = lowStockProducts.length;

  // Chart Data: Stock Distribution
  const stockDistributionData = useMemo(() => {
    let outOfStock = 0;
    let lowStock = 0;
    let healthy = 0;

    products.forEach((p) => {
      const q = Number(p.qty) || 0;
      const r = Number(p.reorderLevel) || 10;
      if (q === 0) outOfStock++;
      else if (q <= r) lowStock++;
      else healthy++;
    });

    return [
      { name: 'Healthy', value: healthy, color: '#0f766e' },
      { name: 'Low Stock', value: lowStock, color: '#d4a017' },
      { name: 'Depleted', value: outOfStock, color: '#be123c' },
    ].filter((item) => item.value > 0);
  }, [products]);

  // Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      const val = (Number(p.qty) || 0) * (Number(p.price) || 0);
      map[cat] = (map[cat] || 0) + val;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [products]);

  // Handle Quick Stock In / Stock Out
  const openStockModal = (type, preselectedId = '') => {
    setAdjustType(type);
    setSelectedProductId(preselectedId ? String(preselectedId) : (products[0]?.id ? String(products[0].id) : ''));
    setAdjustQty('');
    setAdjustNotes('');
    setAdjustModalOpen(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !adjustQty || Number(adjustQty) <= 0) {
      error('Please select a product and enter a valid quantity');
      return;
    }

    setSubmittingAdjust(true);
    const parsedQty = parseInt(adjustQty, 10);
    const delta = adjustType === 'IN' ? parsedQty : -parsedQty;

    try {
      // 1. Update stock on product
      await productsApi.updateStock(selectedProductId, delta);

      // 2. Record transaction ledger entry
      const selectedProd = products.find((p) => String(p.id) === String(selectedProductId));
      const currentUser = JSON.parse(localStorage.getItem('arya_user') || '{}');
      
      await transactionsApi.create({
        product: { id: selectedProductId },
        qty: parsedQty,
        type: adjustType === 'IN' ? 'STOCK_IN' : 'STOCK_OUT',
        user: { id: currentUser.id || 1 },
        notes: adjustNotes || `Quick Stock ${adjustType} via Dashboard`,
      });

      success(`Successfully ${adjustType === 'IN' ? 'added' : 'deducted'} ${parsedQty} units of ${selectedProd?.name || 'product'}`);
      setAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || err.response?.data || 'Failed to update stock');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="page-head">
        <div>
          <h2>Operations overview</h2>
          <p>Live catalog health, valuation, and stock movement</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchData}
            className="neu-button"
            title="Refresh dashboard data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => openStockModal('IN')}
            className="neu-button neu-button-success"
          >
            <ArrowDownLeft size={16} />
            <span>Stock In</span>
          </button>

          <button
            onClick={() => openStockModal('OUT')}
            className="neu-button neu-button-danger"
          >
            <ArrowUpRight size={16} />
            <span>Stock Out</span>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="neu-button neu-button-primary"
          >
            <Plus size={16} />
            <span>New SKU</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading && (
        <div className="skeleton-grid" aria-hidden="true">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      )}
      <div
        style={{
          display: loading ? 'none' : 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        <StatCard
          title="Total products"
          value={totalSkus}
          subtitle="Distinct SKUs in the catalog"
          icon={Boxes}
          color="cyan"
          badgeText="Catalog"
          badgeType="info"
          featured
        />

        <div className="liquid-blob hero-stat">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Available stock</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 750, letterSpacing: '-0.03em', marginTop: 8 }}>
            {totalQuantity.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Units on hand across the catalog</span>
        </div>

        <StatCard
          title="Inventory Valuation"
          value={`$${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Total asset value at current pricing"
          icon={DollarSign}
          color="emerald"
          badgeText="Asset Balance"
          badgeType="success"
        />

        <StatCard
          title="Low Stock Criticals"
          value={lowStockCount}
          subtitle="SKUs at or below safety reorder level"
          icon={AlertTriangle}
          color={lowStockCount > 0 ? 'amber' : 'cyan'}
          badgeText={lowStockCount > 0 ? 'Action Needed' : 'Nominal'}
          badgeType={lowStockCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Stock Health Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Stock Health Distribution</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Healthy vs Low-Stock vs Depleted SKUs</p>
            </div>
            <span className="badge badge-info">{products.length} Products</span>
          </div>

          <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'center' }}>
            {stockDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: 'rgba(226, 232, 240, 0.9)',
                      borderRadius: '10px',
                      color: '#0F172A',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
                No product distribution data available.
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {stockDistributionData.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Asset Valuation Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Capital Allocation by Category</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total valuation in USD ($)</p>
            </div>
            <span className="badge badge-success">Live Valuation</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.4)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={11} 
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} 
                    tickLine={false} 
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Valuation']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: 'rgba(226, 232, 240, 0.9)',
                      borderRadius: '10px',
                      color: '#0F172A',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="value" fill="#7b6cc8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No category data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Section: Low Stock Triage & Recent Transactions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Critical Low Stock Triage Table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#F59E0B" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Critical Stock Alert Queue</h3>
            </div>
            <button
              onClick={() => navigate('/low-stock')}
              className="neu-button neu-button-sm"
              style={{ fontSize: '12px' }}
            >
              <span>View All</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock / Reorder</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      All items are currently above configured safety thresholds.
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.slice(0, 5).map((item) => (
                    <tr key={item.productId || item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName || item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: #{item.productId || item.id}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: item.currentStock === 0 ? 'var(--danger-text)' : 'var(--warning-text)' }}>
                          {item.currentStock ?? item.qty}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {' '}/ {item.reorderLevel}
                        </span>
                      </td>
                      <td>
                        <StockStatusBadge qty={item.currentStock ?? item.qty} reorderLevel={item.reorderLevel} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openStockModal('IN', item.productId || item.id)}
                          className="neu-button neu-button-sm neu-button-success"
                        >
                          Replenish
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Recent Movement Feed</h3>
            <button
              onClick={() => navigate('/transactions')}
              className="neu-button neu-button-sm"
              style={{ fontSize: '12px' }}
            >
              <span>Ledger</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Type</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No stock movement transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {t.product?.name || `Product #${t.product?.id || ''}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{t.qty}</span>
                      </td>
                      <td>
                        <TransactionTypeBadge type={t.type} />
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={adjustType === 'IN' ? 'Stock In (Replenish Inventory)' : 'Stock Out (Issue / Deduct Units)'}
        subtitle="Record quantity adjustment and automatically append an auditable ledger transaction."
      >
        <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Select Product *
            </label>
            <select
              className="neu-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              <option value="">-- Choose Product SKU --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current Stock: {p.qty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Adjustment Quantity *
            </label>
            <input
              type="number"
              min="1"
              className="neu-input"
              placeholder="e.g. 25"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Operation Notes / Reference
            </label>
            <textarea
              className="neu-input"
              placeholder="Purchase invoice, sales order, or stocktaking reason..."
              rows={3}
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="neu-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdjust}
              className={`neu-button ${adjustType === 'IN' ? 'neu-button-success' : 'neu-button-danger'}`}
            >
              {submittingAdjust ? 'Processing...' : `Confirm Stock ${adjustType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
