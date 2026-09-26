export const inputStyle = {
  padding: '0.6rem 0.85rem',
  border: '1px solid #d8e2de',
  borderRadius: '7px',
  fontSize: '0.9rem',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export const btnPrimary = {
  padding: '0.6rem 1.25rem',
  backgroundColor: '#287c68',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  boxShadow: '0 2px 4px rgba(40, 124, 104, 0.15)',
  transition: 'transform 0.1s, box-shadow 0.1s',
};

export const btnDanger = {
  ...btnPrimary,
  backgroundColor: '#bd5d52',
  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)',
};

export const btnGhost = {
  ...btnPrimary,
  background: '#f8fbf9',
  color: '#52635d',
  border: '1px solid #d8e2de',
  boxShadow: 'none',
};

export const card = {
  padding: '1.75rem',
  border: '1px solid #d8e2de',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  boxShadow: '0 6px 18px rgba(23, 33, 31, 0.04)',
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
