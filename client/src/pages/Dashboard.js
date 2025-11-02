import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    clients: 0,
    tickets: 0,
    activeTickets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, ticketsRes] = await Promise.all([
        axios.get(`${API_URL}/clients?limit=1`),
        axios.get(`${API_URL}/tickets?limit=1`)
      ]);

      const tickets = ticketsRes.data.tickets || [];
      const activeTickets = tickets.filter(t => t.status === 'active').length;

      setStats({
        clients: clientsRes.data.pagination?.total || 0,
        tickets: ticketsRes.data.pagination?.total || 0,
        activeTickets
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Clients</h3>
            <p className="stat-number">{stats.clients}</p>
          </div>
          <Link to="/clients" className="stat-link">View all →</Link>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>Total Tickets</h3>
            <p className="stat-number">{stats.tickets}</p>
          </div>
          <Link to="/tickets" className="stat-link">View all →</Link>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>Active Tickets</h3>
            <p className="stat-number">{stats.activeTickets}</p>
          </div>
          <Link to="/tickets?status=active" className="stat-link">View active →</Link>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/clients/new" className="action-card">
            <span className="action-icon">➕</span>
            <h3>Add New Client</h3>
            <p>Register a new client</p>
          </Link>
          <Link to="/tickets/new" className="action-card">
            <span className="action-icon">🎫</span>
            <h3>Create Ticket</h3>
            <p>Issue a new flight ticket</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
