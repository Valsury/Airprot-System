import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { API_URL } from '../config/api';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Edit, Trash2, Loader2, Ticket, Plane } from 'lucide-react';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flightFilter, setFlightFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    fetchTickets();
  }, [page, search, flightFilter, dateFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (flightFilter) params.flight_number = flightFilter;
      if (dateFilter) params.date = dateFilter;

      const response = await axios.get(`${API_URL}/tickets`, { params });
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Не удалось загрузить билеты');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот билет?')) return;

    try {
      await axios.delete(`${API_URL}/tickets/${id}`);
      toast.success('Билет успешно удален');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Не удалось удалить билет');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { variant: 'success', label: 'Активный' },
      cancelled: { variant: 'destructive', label: 'Отменен' },
      used: { variant: 'info', label: 'Использован' }
    };
    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Билеты</h1>
          <p className="text-muted-foreground mt-2">
            Управление авиабилетами
          </p>
        </div>
        <Button asChild>
          <Link to="/tickets/new">
            <Plus className="h-4 w-4 mr-2" />
            Создать билет
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по аэропортам..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="relative max-w-xs">
              <Input
                placeholder="Фильтр по номеру рейса"
                value={flightFilter}
                onChange={(e) => {
                  setFlightFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="relative max-w-xs">
              <Input
                type="date"
                placeholder="Фильтр по дате"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Билеты не найдены</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Попробуйте изменить параметры поиска' : 'Начните с создания первого билета'}
              </p>
              <Button asChild>
                <Link to="/tickets/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать первый билет
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Рейс</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Маршрут</TableHead>
                      <TableHead>Вылет</TableHead>
                      <TableHead>Прилет</TableHead>
                      <TableHead>Место</TableHead>
                      <TableHead>Класс</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4 text-primary" />
                            {ticket.flight_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {ticket.first_name} {ticket.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {ticket.passport_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{ticket.departure_airport}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm font-medium">{ticket.arrival_airport}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(ticket.departure_date), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(ticket.arrival_date), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{ticket.seat_number || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.ticket_class}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(ticket.price).toFixed(2)} ₽
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ticket.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/tickets/${ticket.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Изменить
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(ticket.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Удалить
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Страница {page} из {pagination.totalPages} (всего: {pagination.total})
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tickets;
