import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import './ClientForm.css';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    passport_number: '',
    phone: '',
    email: '',
    date_of_birth: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}`);
      const client = response.data;
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        passport_number: client.passport_number || '',
        phone: client.phone || '',
        email: client.email || '',
        date_of_birth: client.date_of_birth
          ? client.date_of_birth.split('T')[0]
          : ''
      });
    } catch (error) {
      toast.error('Failed to load client data');
      navigate('/clients');
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
      if (isEdit) {
        await axios.put(`${API_URL}/clients/${id}`, formData);
        toast.success('Client updated successfully');
      } else {
        await axios.post(`${API_URL}/clients`, formData);
        toast.success('Client created successfully');
      }
      navigate('/clients');
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.[0]?.msg ||
                     'Failed to save client';
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
        <h1>{isEdit ? 'Edit Client' : 'Add New Client'}</h1>
        <button onClick={() => navigate('/clients')} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">First Name *</label>
              <input
                type="text"
                name="first_name"
                className="input"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Last Name *</label>
              <input
                type="text"
                name="last_name"
                className="input"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Passport Number *</label>
            <input
              type="text"
              name="passport_number"
              className="input"
              value={formData.passport_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              className="input"
              value={formData.date_of_birth}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/clients')}
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

export default ClientForm;
