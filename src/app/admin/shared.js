export const inputStyle = {
  padding: '0.6rem 0.85rem',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export const btnPrimary = {
  padding: '0.6rem 1.25rem',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)',
  transition: 'transform 0.1s, box-shadow 0.1s',
};

export const btnDanger = {
  ...btnPrimary,
  backgroundColor: '#ef4444',
  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)',
};

export const btnGhost = {
  ...btnPrimary,
  background: '#f8fafc',
  color: '#334155',
  border: '1px solid #e2e8f0',
  boxShadow: 'none',
};

export const card = {
  padding: '1.75rem',
  border: '1px solid #f1f5f9',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
  marginBottom: '1.5rem',
  transition: 'box-shadow 0.2s ease-in-out',
};

export function Alert({ msg, type = 'success' }) {
  if (!msg) return null;
  return (
    <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: type === 'error' ? '#fce8e6' : '#e6f4ea', color: type === 'error' ? '#c5221f' : '#137333' }}>
      {msg}
    </div>
  );
}
