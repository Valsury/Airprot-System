import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Loader2, ArrowLeft, Ticket, Save } from 'lucide-react';

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
      toast.error('Не удалось загрузить клиентов');
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
      toast.error('Не удалось загрузить данные билета');
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
        toast.success('Билет успешно обновлен');
      } else {
        await axios.post(`${API_URL}/tickets`, submitData);
        toast.success('Билет успешно создан');
      }
      navigate('/tickets');
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.[0]?.msg ||
                     'Не удалось сохранить билет';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {isEdit ? 'Редактировать билет' : 'Создать новый билет'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEdit ? 'Обновите информацию о билете' : 'Выпустите новый авиабилет для клиента'}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Информация о билете
          </CardTitle>
          <CardDescription>
            Заполните форму для {isEdit ? 'обновления' : 'создания'} билета
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client_id">Клиент *</Label>
              <Select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                disabled={isEdit || loading}
              >
                <option value="">Выберите клиента</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name} - {client.passport_number}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight_number">Номер рейса *</Label>
              <Input
                id="flight_number"
                name="flight_number"
                placeholder="Например: SU1234"
                value={formData.flight_number}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departure_airport">Аэропорт вылета *</Label>
                <Input
                  id="departure_airport"
                  name="departure_airport"
                  placeholder="Например: Шереметьево (Москва)"
                  value={formData.departure_airport}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_airport">Аэропорт прилета *</Label>
                <Input
                  id="arrival_airport"
                  name="arrival_airport"
                  placeholder="Например: Пулково (Санкт-Петербург)"
                  value={formData.arrival_airport}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departure_date">Дата и время вылета *</Label>
                <Input
                  id="departure_date"
                  name="departure_date"
                  type="datetime-local"
                  value={formData.departure_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_date">Дата и время прилета *</Label>
                <Input
                  id="arrival_date"
                  name="arrival_date"
                  type="datetime-local"
                  value={formData.arrival_date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seat_number">Номер места</Label>
                <Input
                  id="seat_number"
                  name="seat_number"
                  placeholder="Например: 12A"
                  value={formData.seat_number}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_class">Класс обслуживания *</Label>
                <Select
                  id="ticket_class"
                  name="ticket_class"
                  value={formData.ticket_class}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="economy">Эконом</option>
                  <option value="business">Бизнес</option>
                  <option value="first">Первый класс</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (₽) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Статус *</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="active">Активный</option>
                  <option value="cancelled">Отменен</option>
                  <option value="used">Использован</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tickets')}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEdit ? 'Сохранить изменения' : 'Создать билет'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketForm;
