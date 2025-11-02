import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, Ticket, CheckCircle, Plus, ArrowRight, Loader2 } from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего клиентов',
      value: stats.clients,
      icon: Users,
      link: '/clients',
      color: 'bg-blue-500',
      description: 'Зарегистрированные клиенты'
    },
    {
      title: 'Всего билетов',
      value: stats.tickets,
      icon: Ticket,
      link: '/tickets',
      color: 'bg-green-500',
      description: 'Выпущенные билеты'
    },
    {
      title: 'Активные билеты',
      value: stats.activeTickets,
      icon: CheckCircle,
      link: '/tickets?status=active',
      color: 'bg-purple-500',
      description: 'Текущие активные билеты'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground mt-2">
          Обзор статистики и быстрые действия
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                  <Link to={stat.link}>
                    Посмотреть все
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Быстрые действия</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/clients/new" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Добавить нового клиента</CardTitle>
                    <CardDescription>
                      Зарегистрировать нового клиента в системе
                    </CardDescription>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/tickets/new" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                    <Ticket className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>Создать билет</CardTitle>
                    <CardDescription>
                      Выпустить новый авиабилет для клиента
                    </CardDescription>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
