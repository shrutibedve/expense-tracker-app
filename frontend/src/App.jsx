import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer
} from 'recharts';
import { LayoutDashboard, Plus, Trash2, Search, Filter, FileDown, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/expenses';
const REPORT_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api/report';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [toast, setToast] = useState('');
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split('T')[0],
    Category: 'Food',
    Amount: '',
    Description: '',
    Type: 'Expense'
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.Amount) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, Amount: parseFloat(formData.Amount) })
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, Amount: '', Description: '' }));
        await fetchExpenses(); // await so state updates after data is fresh
        showToast('Transaction saved!');
      }
    } catch (err) { console.error("Add failed:", err); }
  };

  const handleDelete = async (actualIndex) => {
    try {
      const res = await fetch(`${API_URL}/${actualIndex}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchExpenses(); // await so UI reflects deletion
        showToast('Transaction deleted!');
      }
    } catch (err) { console.error("Delete failed:", err); }
  };

  const downloadPDF = () => {
    window.open(REPORT_URL, '_blank');
  };

  // Filtering Logic — keep track of REAL index in `expenses` for delete
  const filteredExpenses = expenses
    .map((exp, realIndex) => ({ ...exp, realIndex })) // attach real index
    .filter(exp => {
      const matchesSearch = (exp.Description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterCategory === 'All' || exp.Category === filterCategory;
      return matchesSearch && matchesFilter;
    });

  const totals = filteredExpenses.reduce((acc, curr) => {
    const amt = parseFloat(curr.Amount) || 0;
    if (curr.Type === 'Income') acc.income += amt;
    else acc.expense += amt;
    return acc;
  }, { income: 0, expense: 0 });

  const categoryData = filteredExpenses
    .filter(e => e.Type === 'Expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.Category);
      const amt = parseFloat(curr.Amount) || 0;
      if (existing) existing.value += amt;
      else acc.push({ name: curr.Category, value: amt });
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
  const CATEGORIES = ['Food', 'Transport', 'Rent', 'Entertainment', 'Salary', 'Electronics', 'Health', 'Other'];

  return (
    <div className="dashboard-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          background: '#22c55e', color: 'white', padding: '0.75rem 1.5rem',
          borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LayoutDashboard size={32} color="#6366f1" />
          <h1>ExpenseX Platform</h1>
        </div>
        <button onClick={downloadPDF} className="card" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          cursor: 'pointer', border: 'none', color: 'white', background: 'var(--bg-card)'
        }}>
          <FileDown size={18} color="#6366f1" /> Download PDF
        </button>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="label">Total Income</div>
          <div className="value" style={{ color: '#22c55e' }}>
            &#8377;{totals.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card kpi-card">
          <div className="label">Total Expenses</div>
          <div className="value" style={{ color: '#ef4444' }}>
            &#8377;{totals.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card kpi-card">
          <div className="label">Net Balance</div>
          <div className="value" style={{ color: totals.income - totals.expense >= 0 ? '#22c55e' : '#ef4444' }}>
            &#8377;{(totals.income - totals.expense).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* ADD FORM */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Add New Transaction
          </h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="date"
                value={formData.Date}
                onChange={e => setFormData(p => ({ ...p, Date: e.target.value }))}
                style={inputStyle}
                required
              />
              <select
                value={formData.Category}
                onChange={e => setFormData(p => ({ ...p, Category: e.target.value }))}
                style={inputStyle}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="number"
                placeholder="Amount (&#8377;)"
                value={formData.Amount}
                onChange={e => setFormData(p => ({ ...p, Amount: e.target.value }))}
                style={inputStyle}
                min="0"
                step="0.01"
                required
              />
              <select
                value={formData.Type}
                onChange={e => setFormData(p => ({ ...p, Type: e.target.value }))}
                style={inputStyle}
              >
                <option>Expense</option>
                <option>Income</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.Description}
              onChange={e => setFormData(p => ({ ...p, Description: e.target.value }))}
              style={inputStyle}
            />
            <button type="submit" style={btnStyle}>Save Entry</button>
          </form>
        </div>

        {/* PIE CHART */}
        <div className="card">
          <h3>Spending Breakdown</h3>
          <div style={{ height: '300px' }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={4}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No expense data yet. Add some transactions!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search descriptions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#94a3b8" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={inputStyle}>
            <option>All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          {filteredExpenses.length} of {expenses.length} records
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="card">
        <h3>Transactions</h3>
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          {filteredExpenses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              No transactions found. Add one using the form above!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.realIndex} style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{exp.Date}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                        {exp.Category}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{exp.Description || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: exp.Type === 'Income' ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                      {exp.Type === 'Income' ? '+' : '-'}&#8377;{parseFloat(exp.Amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(exp.realIndex)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                        title="Delete transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  outline: 'none',
  width: '100%'
};

const btnStyle = {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: 'white',
  padding: '0.85rem',
  border: 'none',
  borderRadius: '0.5rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'opacity 0.2s'
};

export default App;
