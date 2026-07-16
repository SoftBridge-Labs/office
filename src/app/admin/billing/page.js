'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { inputStyle, btnPrimary, btnDanger, btnGhost, card, Alert } from '../shared';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BillingPage() {
  const [status, setStatus] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: 'success' });

  useEffect(() => {
    api.admin.getBillingStatus().then(res => { if (res.success) setStatus(res.data); }).catch(console.error);
    api.admin.getBillingCreditHistory().then(res => { if (res.success) setCreditHistory(res.usage); }).catch(console.error);
  }, []);

  const handleRazorpay = async () => {
    setMsg({ text: '', type: 'success' });
    try {
      const orderRes = await api.admin.createOneTimeOrder({ currency: 'INR' });
      if (!orderRes.order) throw new Error(orderRes.message || 'Failed to create order');
      const order = orderRes.order;

      const key = (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_RAZORPAY_KEY_ID) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'SoftBridge Workspace',
        description: `Workspace subscription – ${status?.activeSeats || 1} seat(s)`,
        order_id: order.id,
        handler: async (response) => {
          const vRes = await api.admin.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setMsg({ text: vRes.success ? '✅ Payment successful!' : '❌ Verification failed.', type: vRes.success ? 'success' : 'error' });
        },
        prefill: {},
        theme: { color: '#1a73e8' },
      };

      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error('Failed to load payment gateway');
      
      new window.Razorpay(options).open();
    } catch (e) {
      setMsg({ text: e.message, type: 'error' });
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Billing & Subscriptions</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Manage your workspace balance and active seats.</p>

      {status ? (
        <div style={{ ...card, padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: '#5f6368', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Seats</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#202124' }}>{status.activeSeats}</div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#5f6368', marginTop: '0.25rem' }}>₹{status.pricePerSeat}/month per seat (Total: ₹{status.activeSeats * status.pricePerSeat}/month)</p>
            </div>
            
            <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.85rem', color: '#2563eb', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Available Balance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: status.availableBalance > 0 ? '#1e40af' : '#dc2626' }}>
                ₹{status.availableBalance}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#3b82f6', marginTop: '0.25rem' }}>
                {status.availableBalance > 0 ? `Covers ~${Math.floor(status.availableBalance / status.pricePerSeat)} seats` : 'Top up required to unlock operations'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Subscription Plan</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: status.currentPlan === 'monthly' ? '#eff6ff' : '#fff' }} onClick={() => setMsg({ text: 'You are currently on the Monthly plan (or it is selected).', type: 'success' })}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Monthly Plan</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', color: '#2563eb' }}>₹199<span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/seat/mo</span></div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Billed monthly per active user.</p>
              </div>
              <div style={{ flex: 1, padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', backgroundColor: status.currentPlan === 'yearly' ? '#eff6ff' : '#fff' }} onClick={async () => {
                try {
                  const res = await api.admin.createOneTimeOrder({ currency: 'INR', plan: 'yearly' });
                  if (!res.order) throw new Error(res.message);
                  const options = {
                    key: (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_RAZORPAY_KEY_ID) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: res.order.amount,
                    currency: 'INR',
                    name: 'SoftBridge Workspace',
                    description: `Yearly Subscription (${status.activeSeats} seats)`,
                    order_id: res.order.id,
                    handler: async (response) => {
                      const vRes = await api.admin.verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        plan: 'yearly'
                      });
                      if (vRes.success) window.location.reload();
                    }
                  };
                  const isLoaded = await loadRazorpay();
                  if (!isLoaded) throw new Error('Failed to load payment gateway');
                  new window.Razorpay(options).open();
                } catch (e) { setMsg({ text: e.message, type: 'error' }); }
              }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Yearly Plan <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '12px', verticalAlign: 'middle', marginLeft: '0.5rem' }}>SAVE ~16%</span></h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0', color: '#2563eb' }}>₹1999<span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/seat/yr</span></div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Billed annually per active user.</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add Balance & Credits</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Credits are used to automatically cover auto-deductions for active seats, and also to pay for extra Meet usage (₹10 per hour overage) if you exceed your tier limits.</p>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <input 
                type="number" 
                min="1" 
                defaultValue="1"
                id="seatAmount"
                style={{ ...inputStyle, width: '120px', fontSize: '1.1rem', textAlign: 'center' }} 
              />
              <span style={{ color: '#475569', fontWeight: 500 }}>Seats (₹{status.pricePerSeat} each)</span>
            </div>

            <button onClick={async () => {
              const seats = parseInt(document.getElementById('seatAmount').value, 10);
              if (!seats || seats <= 0) return setMsg({ text: 'Enter a valid number of seats.', type: 'error' });
              
              setMsg({ text: 'Initiating payment...', type: 'success' });
              try {
                const amount = seats * status.pricePerSeat;
                const orderRes = await api.admin.createBalanceOrder({ amount });
                if (!orderRes.success) throw new Error(orderRes.message);
                
                const options = {
                  key: (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_RAZORPAY_KEY_ID) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                  amount: orderRes.order.amount,
                  currency: 'INR',
                  name: 'SoftBridge Workspace',
                  description: `Credit Top-up (${seats} seats)`,
                  order_id: orderRes.order.id,
                  handler: async (response) => {
                    const vRes = await api.admin.verifyBalancePayment({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      amount
                    });
                    setMsg({ text: vRes.success ? '✅ Balance added! Operations unlocked.' : '❌ Verification failed.', type: vRes.success ? 'success' : 'error' });
                  },
                  theme: { color: '#1a73e8' },
                };
                
                const isLoaded = await loadRazorpay();
                if (!isLoaded) throw new Error('Failed to load payment gateway');
                
                new window.Razorpay(options).open();
              } catch (e) {
                setMsg({ text: e.message, type: 'error' });
              }
            }} style={{ ...btnPrimary, padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Add Balance securely
            </button>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Credit Activity</h3>
            {creditHistory && creditHistory.length > 0 ? (
              <div style={{ overflowX: 'auto', border: '1px solid #eaeaea', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#5f6368', fontWeight: 600, fontSize: '0.9rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#5f6368', fontWeight: 600, fontSize: '0.9rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#5f6368', fontWeight: 600, fontSize: '0.9rem' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditHistory.map(entry => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#202124', fontSize: '0.9rem' }}>
                          {new Date(entry.created_at || entry.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#d93025', fontSize: '0.9rem', fontWeight: 500 }}>
                          {entry.credit_amount}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#5f6368', fontSize: '0.9rem' }}>
                          {entry.credit_amount > -199 ? 'Meet Add-on (Hourly overage)' : 'Seat Deduction'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#5f6368', fontSize: '0.9rem', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>No recent credit deductions.</p>
            )}
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <Alert msg={msg.text} type={msg.type} />
          </div>
        </div>
      ) : <p>Loading billing data…</p>}
    </div>
  );
}
