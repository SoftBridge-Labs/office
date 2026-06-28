'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
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
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className={styles.container}>
      <Sidebar userProfile={userProfile} isLoggedOut={!userProfile} />
      
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

        <div style={{ display: 'grid', gridTemplateColumns: showAddForm ? '1.2fr 1fr' : '1fr', gap: '2rem' }}>
          
          {/* Kanban Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'start' }}>
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} style={{ background: '#f5f5f3', borderRadius: '16px', padding: '1rem', border: '1px solid var(--border-subtle)', minHeight: '400px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{col.label} ({colTasks.length})</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {colTasks.map(task => (
                      <div key={task._id} style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            padding: '1px 6px', 
                            borderRadius: '4px',
                            background: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#dcfce7',
                            color: task.priority === 'high' ? '#b91c1c' : task.priority === 'medium' ? '#d97706' : '#15803d'
                          }}>
                            {task.priority}
                          </span>
                          
                          <button onClick={() => handleDeleteTask(task._id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                          </button>
                        </div>

                        <h4 style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{task.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-gray)', marginBottom: '0.75rem' }}>{task.description}</p>
                        
                        {task.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>calendar_today</span>
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Status Mover Quick Actions */}
                        <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                          {col.id !== 'todo' && (
                            <button onClick={() => moveTaskStatus(task, col.id === 'completed' ? 'in_progress' : 'todo')} style={{ flex: 1, padding: '2px', fontSize: '0.7rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              ◀ Move Left
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button onClick={() => moveTaskStatus(task, col.id === 'todo' ? 'in_progress' : 'completed')} style={{ flex: 1, padding: '2px', fontSize: '0.7rem', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                              Move Right ▶
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
            <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-subtle)', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>New Task</h3>
              
              <form onSubmit={handleCreateTask}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Title *</label>
                <input style={inputStyle} type="text" placeholder="e.g. Implement Docs Router" value={title} onChange={e => setTitle(e.target.value)} required />

                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows="3" placeholder="Describe the work..." value={description} onChange={e => setDescription(e.target.value)} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Priority</label>
                    <select style={inputStyle} value={priority} onChange={e => setPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Due Date</label>
                    <input style={inputStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '0.65rem', background: 'var(--text-main)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  Save Task
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
