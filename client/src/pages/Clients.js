import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../config/api';
import './Clients.css';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    fetchClients();
  }, [page, search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;

      const response = await axios.get(`${API_URL}/clients`, { params });
      setClients(response.data.clients);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    try {
      await axios.delete(`${API_URL}/clients/${id}`);
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete client');
    }
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clients</h1>
        <Link to="/clients/new" className="btn btn-primary">
          + Add New Client
        </Link>
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="input"
          placeholder="Search by name, passport, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients found</p>
          <Link to="/clients/new" className="btn btn-primary">
            Add First Client
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Passport</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Date of Birth</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.first_name} {client.last_name}</strong>
                    </td>
                    <td>{client.passport_number}</td>
                    <td>{client.email || '-'}</td>
                    <td>{client.phone || '-'}</td>
                    <td>
                      {client.date_of_birth
                        ? format(new Date(client.date_of_birth), 'dd.MM.yyyy')
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Clients;
