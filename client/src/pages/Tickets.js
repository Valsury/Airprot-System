import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../config/api';
import './Tickets.css';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    fetchTickets();
  }, [page, search, clientFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (clientFilter) params.client_id = clientFilter;

      const response = await axios.get(`${API_URL}/tickets`, { params });
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await axios.delete(`${API_URL}/tickets/${id}`);
      toast.success('Ticket deleted successfully');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      active: 'badge-success',
      cancelled: 'badge-danger',
      used: 'badge-info'
    };
    return statuses[status] || 'badge-secondary';
  };

  return (
    <div className="tickets-page">
      <div className="page-header">
        <h1>Tickets</h1>
        <Link to="/tickets/new" className="btn btn-primary">
          + Create New Ticket
        </Link>
      </div>

      <div className="filters">
        <input
          type="text"
          className="input"
          placeholder="Search by flight number, airports..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: '400px' }}
        />
        <input
          type="number"
          className="input"
          placeholder="Filter by Client ID (optional)"
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: '200px' }}
        />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <p>No tickets found</p>
          <Link to="/tickets/new" className="btn btn-primary">
            Create First Ticket
          </Link>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Client</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Seat</th>
                  <th>Class</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.flight_number}</strong>
                    </td>
                    <td>
                      {ticket.first_name} {ticket.last_name}
                      <br />
                      <small style={{ color: '#6b7280' }}>
                        {ticket.passport_number}
                      </small>
                    </td>
                    <td>
                      {ticket.departure_airport} → {ticket.arrival_airport}
                    </td>
                    <td>
                      {format(new Date(ticket.departure_date), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td>
                      {format(new Date(ticket.arrival_date), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td>{ticket.seat_number || '-'}</td>
                    <td>{ticket.ticket_class}</td>
                    <td>${parseFloat(ticket.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/tickets/${ticket.id}/edit`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(ticket.id)}
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

export default Tickets;
