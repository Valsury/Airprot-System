import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import './TicketForm.css';

const TicketForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    flight_number: '',
    departure_airport: '',
    arrival_airport: '',
    departure_date: '',
    arrival_date: '',
    seat_number: '',
    ticket_class: 'economy',
    price: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchClients();
    if (isEdit) {
      fetchTicket();
    } else {
      setLoadingData(false);
    }
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients?limit=1000`);
      setClients(response.data.clients);
    } catch (error) {
      toast.error('Failed to load clients');
    }
  };

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets/${id}`);
      const ticket = response.data;
      setFormData({
        client_id: ticket.client_id || '',
        flight_number: ticket.flight_number || '',
        departure_airport: ticket.departure_airport || '',
        arrival_airport: ticket.arrival_airport || '',
        departure_date: ticket.departure_date
          ? new Date(ticket.departure_date).toISOString().slice(0, 16)
          : '',
        arrival_date: ticket.arrival_date
          ? new Date(ticket.arrival_date).toISOString().slice(0, 16)
          : '',
        seat_number: ticket.seat_number || '',
        ticket_class: ticket.ticket_class || 'economy',
        price: ticket.price || '',
        status: ticket.status || 'active'
      });
    } catch (error) {
      toast.error('Failed to load ticket data');
      navigate('/tickets');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        price: parseFloat(formData.price),
        departure_date: new Date(formData.departure_date).toISOString(),
        arrival_date: new Date(formData.arrival_date).toISOString()
      };

      if (isEdit) {
        await axios.put(`${API_URL}/tickets/${id}`, submitData);
        toast.success('Ticket updated successfully');
      } else {
        await axios.post(`${API_URL}/tickets`, submitData);
        toast.success('Ticket created successfully');
      }
      navigate('/tickets');
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.[0]?.msg ||
                     'Failed to save ticket';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h1>{isEdit ? 'Edit Ticket' : 'Create New Ticket'}</h1>
        <button onClick={() => navigate('/tickets')} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Client *</label>
            <select
              name="client_id"
              className="input"
              value={formData.client_id}
              onChange={handleChange}
              required
              disabled={isEdit}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} - {client.passport_number}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Flight Number *</label>
            <input
              type="text"
              name="flight_number"
              className="input"
              value={formData.flight_number}
              onChange={handleChange}
              required
              placeholder="e.g., AA1234"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Departure Airport *</label>
              <input
                type="text"
                name="departure_airport"
                className="input"
                value={formData.departure_airport}
                onChange={handleChange}
                required
                placeholder="e.g., JFK"
              />
            </div>
            <div className="form-group">
              <label className="label">Arrival Airport *</label>
              <input
                type="text"
                name="arrival_airport"
                className="input"
                value={formData.arrival_airport}
                onChange={handleChange}
                required
                placeholder="e.g., LAX"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Departure Date & Time *</label>
              <input
                type="datetime-local"
                name="departure_date"
                className="input"
                value={formData.departure_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Arrival Date & Time *</label>
              <input
                type="datetime-local"
                name="arrival_date"
                className="input"
                value={formData.arrival_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Seat Number</label>
              <input
                type="text"
                name="seat_number"
                className="input"
                value={formData.seat_number}
                onChange={handleChange}
                placeholder="e.g., 12A"
              />
            </div>
            <div className="form-group">
              <label className="label">Ticket Class *</label>
              <select
                name="ticket_class"
                className="input"
                value={formData.ticket_class}
                onChange={handleChange}
                required
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Price (USD) *</label>
              <input
                type="number"
                name="price"
                className="input"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="label">Status *</label>
              <select
                name="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Ticket' : 'Create Ticket'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
