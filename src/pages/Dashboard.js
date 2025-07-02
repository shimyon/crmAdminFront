import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Alert, List, ListItem, ListItemText } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';
import { getToken } from '../utils/auth';
import { apiGet } from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function Dashboard() {
  const [stats, setStats] = useState({ users: 0, subscriptions: 0, tickets: 0 });
  const [notifications, setNotifications] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [subsByStatus, setSubsByStatus] = useState([]);
  const [ticketsByStatus, setTicketsByStatus] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      setError('');
      try {
        const [usersRes, subsRes, ticketsRes, notifRes] = await Promise.all([
          apiGet('/api/users'),
          apiGet('/api/subscriptions'),
          apiGet('/api/support'),
          apiGet('/api/notifications'),
        ]);
        if ([usersRes, subsRes, ticketsRes, notifRes].some(res => !res.status || res.status >= 400)) throw new Error('Failed to fetch dashboard data');
        const users = usersRes.data;
        const subs = subsRes.data;
        const tickets = ticketsRes.data;
        const notifs = notifRes.data;
        setStats({ users: users.length, subscriptions: subs.length, tickets: tickets.length });
        setNotifications(notifs.slice(0, 5));
        // Users by role
        const roleCounts = users.reduce((acc, u) => {
          acc[u.role] = (acc[u.role] || 0) + 1;
          return acc;
        }, {});
        setUsersByRole(Object.entries(roleCounts).map(([role, value]) => ({ name: role, value })));
        // Subscriptions by status
        const subStatusCounts = subs.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        setSubsByStatus(Object.entries(subStatusCounts).map(([status, value]) => ({ name: status, value })));
        // Tickets by status
        const ticketStatusCounts = tickets.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {});
        setTicketsByStatus(Object.entries(ticketStatusCounts).map(([status, value]) => ({ name: status, value })));
      } catch (err) {
        setError(err.message);
      }
    }
    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Dashboard</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Users</Typography>
              <Typography variant="h3">{stats.users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Subscriptions</Typography>
              <Typography variant="h3">{stats.subscriptions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Support Tickets</Typography>
              <Typography variant="h3">{stats.tickets}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3} mb={12}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={2}>Users by Role</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={usersByRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {usersByRole.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={2}>Subscriptions by Status</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={subsByStatus}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" mb={2}>Tickets by Status</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ticketsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {ticketsByStatus.map((entry, idx) => (
                      <Cell key={`cell-tick-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Latest Notifications</Typography>
          {notifications.length === 0 ? (
            <Typography>No notifications.</Typography>
          ) : (
            <List>
              {notifications.map((notif) => (
                <ListItem key={notif._id} disablePadding>
                  <ListItemText
                    primary={notif.message}
                    secondary={new Date(notif.createdAt).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard; 