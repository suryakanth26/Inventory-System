import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, RefreshCw, Boxes } from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { useToast } from '../components/ui/Toast';

export const Categories = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setProducts((await productsApi.getAll()) || []);
    } catch {
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const key = p.category || 'Uncategorized';
      if (!map[key]) {
        map[key] = { name: key, count: 0, units: 0, value: 0, low: 0 };
      }
      const qty = Number(p.qty) || 0;
      const reorder = Number(p.reorderLevel) || 10;
      map[key].count += 1;
      map[key].units += qty;
      map[key].value += qty * (Number(p.price) || 0);
      if (qty <= reorder) map[key].low += 1;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-head">
        <div>
          <h2>Categories</h2>
          <p>Product groupings derived from the live catalog</p>
        </div>
        <button onClick={load} className="neu-button">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="skeleton-grid" aria-hidden="true">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
        {groups.map((g) => (
          <button
            key={g.name}
            className="glass-card"
            onClick={() => navigate(`/products?category=${encodeURIComponent(g.name)}`)}
            style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-luminous)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Layers size={18} />
              <h3 style={{ fontSize: '16px' }}>{g.name}</h3>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 750, fontFamily: 'var(--font-display)' }}>{g.count}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '4px' }}>
              {g.units.toLocaleString()} units · ${g.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            {g.low > 0 && (
              <span className="badge badge-warning" style={{ marginTop: '12px' }}>
                {g.low} low-stock SKUs
              </span>
            )}
          </button>
        ))}
      </div>

      {groups.length === 0 && !loading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Boxes size={32} style={{ margin: '0 auto 8px' }} />
          No categories yet. Add products to populate this view.
        </div>
      )}
    </div>
  );
};
