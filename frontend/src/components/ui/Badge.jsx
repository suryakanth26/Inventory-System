import React from 'react';
import { ShieldCheck, UserCheck, User, AlertCircle, AlertTriangle, CheckCircle, ArrowDownLeft, ArrowUpRight, RotateCcw, Sliders } from 'lucide-react';

export const RoleBadge = ({ role }) => {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'ADMIN') {
    return (
      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#4338CA', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
        <ShieldCheck size={12} />
        Admin
      </span>
    );
  }
  if (normalized === 'MANAGER') {
    return (
      <span className="badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0369A1', border: '1px solid rgba(2, 132, 199, 0.35)' }}>
        <UserCheck size={12} />
        Manager
      </span>
    );
  }
  return (
    <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#334155', border: '1px solid rgba(100, 116, 139, 0.3)' }}>
      <User size={12} />
      Staff
    </span>
  );
};

export const StockStatusBadge = ({ qty, reorderLevel }) => {
  const current = Number(qty) || 0;
  const threshold = Number(reorderLevel) || 10;

  if (current === 0) {
    return (
      <span className="badge badge-danger">
        <AlertCircle size={12} />
        Out of Stock (0)
      </span>
    );
  }
  if (current <= threshold) {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={12} />
        Low Stock ({current} / {threshold})
      </span>
    );
  }
  return (
    <span className="badge badge-success">
      <CheckCircle size={12} />
      Healthy ({current})
    </span>
  );
};

export const TransactionTypeBadge = ({ type }) => {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'STOCK_IN':
    case 'PURCHASE':
      return (
        <span className="badge badge-success">
          <ArrowDownLeft size={12} />
          {t === 'STOCK_IN' ? 'Stock In' : 'Purchase'}
        </span>
      );
    case 'STOCK_OUT':
    case 'SALE':
      return (
        <span className="badge badge-danger">
          <ArrowUpRight size={12} />
          {t === 'STOCK_OUT' ? 'Stock Out' : 'Sale'}
        </span>
      );
    case 'RETURN':
      return (
        <span className="badge badge-warning">
          <RotateCcw size={12} />
          Return
        </span>
      );
    case 'ADJUSTMENT':
    default:
      return (
        <span className="badge badge-info">
          <Sliders size={12} />
          Adjustment
        </span>
      );
  }
};
