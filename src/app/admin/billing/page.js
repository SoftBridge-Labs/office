'use client';

import { useState, useEffect } from 'react';
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

const formatINR = (value) => `₹${Math.abs(Number(value) || 0).toLocaleString('en-IN')}`;

export default function BillingPage() {
  const [status, setStatus] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [seatCount, setSeatCount] = useState(1);
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [switching, setSwitching] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const wId = typeof window !== 'undefined' ? localStorage.getItem('sb_workspace_id') || 'default' : 'default';
    const localPlan = typeof window !== 'undefined' ? localStorage.getItem(`sb_billing_plan_${wId}`) : null;
    const localBal = typeof window !== 'undefined' ? localStorage.getItem(`sb_billing_balance_${wId}`) : null;

    api.admin.getBillingStatus().then(res => {
      if (res && res.success && res.data) {
        const data = { ...res.data };
        if (localPlan) {
          data.currentPlan = localPlan;
        }
        if (localBal !== null && !isNaN(Number(localBal))) {
          // Keep local balance if user performed balance deductions
          const parsed = Number(localBal);
          if (parsed < Number(data.availableBalance)) {
            data.availableBalance = parsed;
          }
        }
        setStatus(data);
        setSelectedPlan(data.currentPlan && data.currentPlan !== 'free' ? data.currentPlan : 'monthly');
        setSeatCount(data.activeSeats || 1);
      }
    }).catch(console.error);

    api.admin.getBillingCreditHistory().then(res => {
      if (res && res.success && res.usage) setCreditHistory(res.usage);
    }).catch(console.error);
  }, []);

  const monthlyRate = status?.monthlyPricePerSeat || status?.pricePerSeat || 499;
  const yearlyRate = status?.yearlyPricePerSeat || 4999;
  const activeSeats = status?.activeSeats || 1;
  const availableBal = Number(status?.availableBalance) || 0;

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      pricePerSeat: 0,
      priceLabel: '₹0',
      periodLabel: '/forever',
      description: 'For growing teams getting started.',
      features: [
        '1 active booking link',
        '2 teams / departments',
        '10 free user seats',
        'Ping 5MB upload limit',
        '15-day Ping chat history',
        'Standard workspace access',
      ],
      badge: null,
      themeColor: '#64748b',
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      pricePerSeat: monthlyRate,
      priceLabel: `₹${monthlyRate}`,
      periodLabel: '/seat/mo',
      description: 'Billed monthly per active user.',
      features: [
        'Unlimited booking links',
        'Unlimited teams & departments',
        'Unlimited seats',
        'Full 100MB Ping file uploads',
        'Unlimited chat history',
        'Premium workspace access',
      ],
      badge: null,
      themeColor: '#2563eb',
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      pricePerSeat: yearlyRate,
      priceLabel: `₹${yearlyRate}`,
      periodLabel: '/seat/yr',
      description: 'Billed annually per active user.',
      features: [
        'All Monthly Plan benefits',
        '2 months free discount',
        'Priority onboarding & support',
        'Dedicated audit reports',
      ],
      badge: 'SAVE ~16%',
      themeColor: '#16a34a',
    },
  ];

  // Rate per seat for the currently selected plan in the top-up section
  const selectedPlanRate = selectedPlan === 'yearly' ? yearlyRate : monthlyRate;

  // Plan Switching logic:
  // user selects plan > check current balance > show error if balance insufficient and ask to top up required balance else set plan
  const handleSwitchPlan = async (targetPlanId) => {
    if (!status) return;
    setMsg({ text: '', type: 'success' });
    setSelectedPlan(targetPlanId);

    const currentPlan = (status.currentPlan || 'free').toLowerCase();
    const targetPlan = targetPlanId.toLowerCase();

    if (currentPlan === targetPlan) {
      setMsg({
        text: `Your workspace is currently operating on the ${targetPlan.toUpperCase()} Plan.`,
        type: 'success',
      });
      return;
    }

    const planObj = plans.find(p => p.id === targetPlan);
    const requiredPerSeat = planObj?.pricePerSeat || 0;
    const requiredTotal = requiredPerSeat * activeSeats;

    // Check balance
    if (availableBal < requiredTotal) {
      const deficit = requiredTotal - availableBal;
      setMsg({
        text: `Insufficient balance: Your available balance is ${formatINR(availableBal)}, but ${formatINR(requiredTotal)} is required to activate the ${planObj.name} for ${activeSeats} seat(s) (${activeSeats} × ${formatINR(requiredPerSeat)}). Please top up the deficit of ${formatINR(deficit)} below.`,
        type: 'error',
      });

      // Automatically adjust seat count and focus top up section
      const seatsToCover = Math.max(1, Math.ceil(deficit / (requiredPerSeat || 1)));
      setSeatCount(seatsToCover);
      const topUpEl = document.getElementById('add-balance-section');
      if (topUpEl) {
        topUpEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Balance is sufficient! Set plan
    setSwitching(true);
    try {
      await api.admin.switchPlan({
        plan: targetPlan,
        seats: activeSeats,
        amount: requiredTotal,
      });

      const newBal = targetPlan === 'free' ? availableBal : availableBal - requiredTotal;
      const wId = typeof window !== 'undefined' ? localStorage.getItem('sb_workspace_id') || 'default' : 'default';

      if (typeof window !== 'undefined') {
        localStorage.setItem(`sb_billing_plan_${wId}`, targetPlan);
        localStorage.setItem(`sb_billing_balance_${wId}`, String(newBal));
      }

      setStatus(prev => ({
        ...prev,
        currentPlan: targetPlan,
        availableBalance: newBal,
      }));

      if (requiredTotal > 0) {
        setCreditHistory(prev => [
          {
            id: 'sub-' + Date.now(),
            created_at: new Date().toISOString(),
            credit_amount: requiredTotal,
            type: `${targetPlan.toUpperCase()} Plan subscription (${activeSeats} seats)`,
          },
          ...(prev || []),
        ]);
      }

      setMsg({
        text: `Plan successfully switched to ${planObj.name}! ${requiredTotal > 0 ? `${formatINR(requiredTotal)} was deducted from your available balance.` : ''} Your workspace features are updated.`,
        type: 'success',
      });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to switch plan', type: 'error' });
    } finally {
      setSwitching(false);
    }
  };

  // Add Balance & Credits:
  // check selected plan and open razorpay as per it
  const handleAddBalanceRazorpay = async () => {
    if (!status) return;
    setMsg({ text: '', type: 'success' });

    const seats = parseInt(seatCount, 10);
    if (!seats || seats <= 0) {
      return setMsg({ text: 'Please enter a valid number of seats (at least 1).', type: 'error' });
    }

    const rate = selectedPlanRate;
    const amount = seats * rate;

    setPaying(true);
    setMsg({ text: `Preparing payment order for ${selectedPlan.toUpperCase()} Plan (${formatINR(amount)})...`, type: 'success' });

    try {
      const orderRes = await api.admin.createBalanceOrder({
        amount,
        plan: selectedPlan,
        seats,
      });
      if (!orderRes.success && !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to create payment order');
      }

      const order = orderRes.order || { id: 'order_' + Date.now(), amount: amount * 100, currency: 'INR' };
      const key = (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_RAZORPAY_KEY_ID) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'SoftBridge Workspace',
        description: `Credit Top-up for ${selectedPlan.toUpperCase()} Plan (${seats} seat${seats > 1 ? 's' : ''})`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const vRes = await api.admin.verifyBalancePayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
              plan: selectedPlan,
            });

            if (vRes.success !== false) {
              const newBal = (Number(status.availableBalance) || 0) + amount;
              const wId = typeof window !== 'undefined' ? localStorage.getItem('sb_workspace_id') || 'default' : 'default';
              if (typeof window !== 'undefined') {
                localStorage.setItem(`sb_billing_balance_${wId}`, String(newBal));
              }

              setStatus(prev => ({ ...prev, availableBalance: newBal }));
              setMsg({
                text: `Payment successful! Added ${formatINR(amount)} to available balance. You can now activate your desired plan.`,
                type: 'success',
              });
            } else {
              setMsg({ text: 'Payment verification failed.', type: 'error' });
            }
          } catch (e) {
            setMsg({ text: e.message || 'Verification failed', type: 'error' });
          }
        },
        theme: { color: selectedPlan === 'yearly' ? '#16a34a' : '#1a73e8' },
      };

      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error('Failed to load Razorpay payment gateway');

      new window.Razorpay(options).open();
    } catch (e) {
      setMsg({ text: e.message || 'Payment initiation failed', type: 'error' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Billing & Subscriptions</h1>
      <p style={{ color: '#5f6368', marginBottom: '2rem' }}>Manage your workspace balance and active seats.</p>

      {status ? (
        <div style={{ ...card, padding: '2rem' }}>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {/* Active Seats */}
            <div style={{ padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#5f6368', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Seats</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#202124' }}>
                {activeSeats} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/ {status.currentPlan === 'free' ? '10 max (Free)' : 'unlimited'}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#5f6368', marginTop: '0.35rem' }}>
                {status.currentPlan === 'free'
                  ? 'Free Plan includes up to 10 user seats at ₹0'
                  : `${formatINR(status.currentPlan === 'yearly' ? yearlyRate : monthlyRate)}/${status.currentPlan === 'yearly' ? 'yr' : 'mo'} per seat (Total: ${formatINR(activeSeats * (status.currentPlan === 'yearly' ? yearlyRate : monthlyRate))})`}
              </p>
            </div>

            {/* Available Balance */}
            <div style={{ padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.85rem', color: '#2563eb', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>Available Balance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: availableBal > 0 ? '#1e40af' : '#dc2626' }}>
                {formatINR(availableBal)}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#3b82f6', marginTop: '0.35rem' }}>
                {availableBal >= monthlyRate * activeSeats
                  ? `Sufficient to cover ${Math.floor(availableBal / (monthlyRate * activeSeats))} month(s) of Monthly Plan (${activeSeats} seats)`
                  : 'Top up required to unlock paid plan activation'}
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert msg={msg.text} type={msg.type} />
          </div>

          {/* Subscription Plans Section */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Subscription Plans</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Select a plan to inspect details and switch your workspace plan using your available balance.
                </p>
              </div>
              <span style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontWeight: 700,
                backgroundColor: status.currentPlan === 'free' ? '#f1f5f9' : '#dcfce7',
                color: status.currentPlan === 'free' ? '#475569' : '#166534',
                border: '1px solid #cbd5e1'
              }}>
                CURRENT PLAN: {(status.currentPlan || 'free').toUpperCase()}
              </span>
            </div>

            {/* Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {plans.map((p) => {
                const isCurrent = (status.currentPlan || 'free').toLowerCase() === p.id;
                const isSelected = selectedPlan === p.id;
                const costForActiveSeats = p.pricePerSeat * activeSeats;
                const hasEnoughBalance = availableBal >= costForActiveSeats;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      padding: '1.6rem',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      border: isSelected ? `2.5px solid ${p.themeColor}` : (isCurrent ? '2px solid #94a3b8' : '1px solid #e2e8f0'),
                      backgroundColor: isSelected ? (p.id === 'yearly' ? '#f0fdf4' : (p.id === 'monthly' ? '#eff6ff' : '#f8fafc')) : '#ffffff',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 8px 20px rgba(37, 99, 235, 0.1)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Header Badges */}
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '0.4rem' }}>
                      {p.badge && (
                        <span style={{ fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '8px', fontWeight: 700 }}>
                          {p.badge}
                        </span>
                      )}
                      {isCurrent && (
                        <span style={{ fontSize: '0.68rem', backgroundColor: '#e2e8f0', color: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '8px', fontWeight: 700 }}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>{p.name}</h4>
                        {isSelected && !isCurrent && (
                          <span style={{ fontSize: '0.68rem', backgroundColor: p.themeColor, color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '6px', fontWeight: 600 }}>
                            SELECTED
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.6rem 0 0.2rem 0', color: p.themeColor }}>
                        {p.priceLabel}
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{p.periodLabel}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem' }}>
                        {p.id === 'free' ? 'Free for up to 10 team members' : `Total: ${formatINR(costForActiveSeats)} for ${activeSeats} active seat(s)`}
                      </div>

                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.83rem', color: '#475569' }}>{p.description}</p>

                      <ul style={{ margin: '0 0 1.5rem 0', paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.7 }}>
                        {p.features.map((feat, idx) => (
                          <li key={idx}>{feat}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Switch / Activate Action */}
                    <div>
                      {isCurrent ? (
                        <div style={{
                          padding: '0.65rem',
                          textAlign: 'center',
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}>
                          Current Plan
                        </div>
                      ) : (
                        <button
                          disabled={switching}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchPlan(p.id);
                          }}
                          style={{
                            ...btnPrimary,
                            width: '100%',
                            padding: '0.7rem',
                            backgroundColor: hasEnoughBalance ? p.themeColor : '#f59e0b',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          {switching ? 'Updating...' : (hasEnoughBalance ? `Switch to ${p.name}` : `Switch to ${p.name} (Top Up Needed)`)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Balance & Credits Section */}
          <div id="add-balance-section" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Add Balance & Credits</h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Secured by Razorpay • Instant Wallet Credit
              </span>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Credits are used to automatically pay for active seats and switch plans. Choose the plan tier you want to top up credits for:
            </p>

            {/* Plan selector pills for top-up */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: selectedPlan === 'monthly' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: selectedPlan === 'monthly' ? '#eff6ff' : '#ffffff',
                  color: selectedPlan === 'monthly' ? '#1d4ed8' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Monthly Tier ({formatINR(monthlyRate)}/seat)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: selectedPlan === 'yearly' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  backgroundColor: selectedPlan === 'yearly' ? '#f0fdf4' : '#ffffff',
                  color: selectedPlan === 'yearly' ? '#15803d' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Yearly Tier ({formatINR(yearlyRate)}/seat) <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>16% OFF</span>
              </button>
            </div>

            {/* Top-up Form */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              maxWidth: '540px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Number of Seats
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    value={seatCount}
                    onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ ...inputStyle, width: '130px', fontSize: '1.1rem', textAlign: 'center', backgroundColor: '#fff' }}
                  />
                  <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.9rem' }}>
                    Seat(s) × {formatINR(selectedPlanRate)} ({selectedPlan.toUpperCase()} rate)
                  </span>
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.2rem',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Total Top-up Amount:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
                  {formatINR(seatCount * selectedPlanRate)}
                </span>
              </div>

              {/* Top Up Button */}
              <button
                disabled={paying}
                onClick={handleAddBalanceRazorpay}
                style={{
                  ...btnPrimary,
                  padding: '0.85rem 1.75rem',
                  fontSize: '1rem',
                  backgroundColor: selectedPlan === 'yearly' ? '#16a34a' : '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {paying ? 'Opening Razorpay Gateway...' : `Add ${formatINR(seatCount * selectedPlanRate)} Balance for ${selectedPlan.toUpperCase()} Plan`}
              </button>
            </div>
          </div>

          {/* Credit Activity Table */}
          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Recent Credit Activity</h3>
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
                    {creditHistory.map((entry, idx) => (
                      <tr key={entry.id || idx} style={{ borderBottom: '1px solid #eaeaea' }}>
                        <td style={{ padding: '0.75rem 1rem', color: '#202124', fontSize: '0.9rem' }}>
                          {entry.created_at || entry.createdAt
                            ? new Date(entry.created_at || entry.createdAt).toLocaleString()
                            : 'Recent'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#d93025', fontSize: '0.9rem', fontWeight: 600 }}>
                          -{formatINR(entry.credit_amount || entry.amount)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#5f6368', fontSize: '0.9rem' }}>
                          {entry.type || 'Credit debit'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#5f6368', fontSize: '0.9rem', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                No recent credit deductions.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading billing data…</p>
      )}
    </div>
  );
}
