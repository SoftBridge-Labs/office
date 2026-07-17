'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/app/components/TopNav';
import AppDisabled from '@/app/components/AppDisabled';
import { api } from '@/lib/api';
import styles from '../page.module.css';

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: '8px',
  background: '#ffffff',
  fontSize: '0.875rem',
  color: 'var(--text-main, #1a1a1a)',
  outline: 'none',
  marginBottom: '0.75rem'
};

export default function TasksPage() {
  const [userProfile, setUserProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [appDisabled, setAppDisabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('general');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      if (res.success) {
        setTasks(res.data || []);
      } else if (res.status === 403 || res.message?.toLowerCase().includes('disabled')) {
        setAppDisabled(true);
      }
    } catch (e) {
      if (e.message?.toLowerCase().includes('disabled') || e.status === 403) {
        setAppDisabled(true);
      } else {
        console.error(e);
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createTask({
        title, description, priority, dueDate, projectId, status: 'todo', assignees: []
      });
      if (res.success) {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setShowAddForm(false);
        loadTasks();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const moveTaskStatus = async (task, newStatus) => {
    try {
      const res = await api.updateTask(task._id, { ...task, status: newStatus });
      if (res.success) {
        loadTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { id: 'todo', label: 'To Do', color: '#3b82f6' },
    { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'completed', label: 'Completed', color: '#10b981' }
  ];

  if (appDisabled) {
    return (
      <div className={styles.container}>
        <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
        <AppDisabled appName="Tasks" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      
      <main className={styles.mainPanel}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Sprint Tasks Board</h2>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={styles.actionBadge}
            style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
          >
            {showAddForm ? 'Cancel' : '+ New Task'}
          </button>
        </header>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1.2rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              fontSize: '0.95rem',
              outline: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
            onFocus={e => e.target.style.boxShadow = '0 4px 20px rgba(233, 30, 99, 0.15)'}
            onBlur={e => e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.03)'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: showAddForm ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
          
          {/* Kanban Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'start' }}>
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id && (!searchQuery || (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))));
              return (
                <div key={col.id} className="task-column" style={{ background: 'linear-gradient(145deg, #f8f9fa, #f1f5f9)', borderRadius: '20px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.7)', minHeight: '400px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid rgba(0,0,0,0.03)' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.color, boxShadow: `0 0 10px ${col.color}80` }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>{col.label} <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>({colTasks.length})</span></h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {colTasks.map(task => (
                      <div key={task._id} className="task-card" style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            padding: '4px 8px', 
                            borderRadius: '8px',
                            letterSpacing: '0.05em',
                            background: task.priority === 'high' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : task.priority === 'medium' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                            color: task.priority === 'high' ? '#991b1b' : task.priority === 'medium' ? '#b45309' : '#166534',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                          }}>
                            {task.priority}
                          </span>
                          
                          <button onClick={() => handleDeleteTask(task._id)} className="delete-btn" style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', transition: 'all 0.2s', opacity: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                          </button>
                        </div>

                        <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '0.75rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{task.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
                        
                        {task.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: '#3b82f6' }}>calendar_today</span>
                            <span style={{ fontWeight: 600 }}>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}

                        {/* Status Mover Quick Actions */}
                        <div className="task-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                          {col.id !== 'todo' && (
                            <button onClick={() => moveTaskStatus(task, col.id === 'completed' ? 'in_progress' : 'todo')} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = '#e2e8f0'} onMouseLeave={e => e.target.style.background = '#f1f5f9'}>
                              ◀ Move
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button onClick={() => moveTaskStatus(task, col.id === 'todo' ? 'in_progress' : 'completed')} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = '#e2e8f0'} onMouseLeave={e => e.target.style.background = '#f1f5f9'}>
                              Move ▶
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Task Sidebar */}
          {showAddForm && (
            <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(16px)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.6)', height: 'fit-content', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>✨ New Task</h3>
                <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleCreateTask}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569' }}>TITLE *</label>
                <input style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} type="text" placeholder="e.g. Implement Docs Router" value={title} onChange={e => setTitle(e.target.value)} required />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569', marginTop: '1rem' }}>DESCRIPTION</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }} rows="4" placeholder="Describe the work..." value={description} onChange={e => setDescription(e.target.value)} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569' }}>PRIORITY</label>
                    <select style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1' }} value={priority} onChange={e => setPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#475569' }}>DUE DATE</label>
                    <input style={{ ...inputStyle, background: 'rgba(255,255,255,0.9)', border: '1px solid #cbd5e1' }} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>

                <button className="submit-btn" type="submit" style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #E91E63, #ec4899)', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', marginTop: '1.5rem', boxShadow: '0 4px 14px rgba(233, 30, 99, 0.4)', transition: 'all 0.2s' }}>
                  Create Task
                </button>
              </form>
            </div>
          )}

        </div>
        
        <style>{`
          .task-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
            border-color: rgba(233, 30, 99, 0.3) !important;
          }
          .task-card:hover .delete-btn {
            opacity: 1 !important;
          }
          .delete-btn:hover {
            background: #ef4444 !important;
            color: #ffffff !important;
          }
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(233, 30, 99, 0.6) !important;
          }
          .submit-btn:active {
            transform: translateY(0);
          }
        `}</style>
      </main>
    </div>
  );
}
