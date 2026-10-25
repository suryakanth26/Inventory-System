import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { transactionsApi } from '../api/transactionsApi';
import { useToast } from '../components/ui/Toast';
import { StatCard } from '../components/ui/StatCard';
import { Boxes, DollarSign, ArrowLeftRight, AlertTriangle } from 'lucide-react';

export const Reports = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [prods, trans, alerts] = await Promise.all([
        productsApi.getAll().catch(() => []),
        transactionsApi.getAll().catch(() => []),
        productsApi.getLowStock().catch(() => []),
      ]);
      setProducts(prods || []);
      setTransactions(trans || []);
      setLowStock(alerts || []);
    } catch {
      error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const valuation = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.qty) || 0) * (Number(p.price) || 0), 0),
    [products]
  );

  const categoryData = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      map[cat] = (map[cat] || 0) + (Number(p.qty) || 0) * (Number(p.price) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [products]);

  const typeData = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      map[t.type || 'OTHER'] = (map[t.type || 'OTHER'] || 0) + 1;
    });
    const colors = ['#6ec4e8', '#7b6cc8', '#d98aa8', '#0f766e', '#b45309', '#4a465c'];
    return Object.entries(map).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [transactions]);

  const tooltipStyle = {
    backgroundColor: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(255,255,255,0.7)',
    borderRadius: '12px',
    color: '#1c1a28',
    fontSize: '12px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-head">
        <div>
          <h2>Reports</h2>
          <p>Inventory value, movement mix, and replenishment pressure from live records</p>
        </div>
        <button onClick={load} className="neu-button">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="SKUs" value={products.length} icon={Boxes} color="cyan" subtitle="Active catalog items" />
        <StatCard title="Inventory value" value={`$${valuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={DollarSign} color="emerald" subtitle="Units × unit price" />
        <StatCard title="Movements" value={transactions.length} icon={ArrowLeftRight} color="indigo" subtitle="Ledger entries" />
        <StatCard title="Alerts" value={lowStock.length} icon={AlertTriangle} color="amber" subtitle="At or below reorder" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Value by category</h3>
          <div style={{ height: 260 }}>
            {categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(160,150,190,0.25)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#7b6cc8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No category data.</p>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Movement types</h3>
          <div style={{ height: 260 }}>
            {typeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" innerRadius={52} outerRadius={84} paddingAngle={4}>
                    {typeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="rgba(255,255,255,0.6)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No movement data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
