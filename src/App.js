import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Box, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, AppBar, Typography } from '@mui/material';
import Dashboard from '@mui/icons-material/Dashboard';
import Subscriptions from '@mui/icons-material/Subscriptions';
import SupportAgent from '@mui/icons-material/SupportAgent';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Assignment from '@mui/icons-material/Assignment';
import Notifications from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileEdit from './pages/ProfileEdit';
import { isLoggedIn, logout, getUser } from './utils/auth';
import DashboardPage from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import SubscriptionsPage from './pages/Subscriptions';
import Support from './pages/Support';
import SubscriptionPlans from './pages/SubscriptionPlans';
import AuditLogs from './pages/AuditLogs';
import NotificationManagement from './pages/NotificationManagement';
import { useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Brightness4 from '@mui/icons-material/Brightness4';
import Brightness7 from '@mui/icons-material/Brightness7';
import { apiGet, apiPost } from './utils/api';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationBell from './components/NotificationBell';
import ModuleMaster from './pages/ModuleMaster';
import { LoaderProvider, useLoader } from './contexts/LoaderContext';
import Loader from './components/Loader';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Users', icon: <AccountCircle />, path: '/users', admin: true },
  { text: 'Roles', icon: <Assignment />, path: '/roles', admin: true },
  { text: 'Subscription', icon: <Subscriptions />, path: '/subscription' },
  { text: 'Support', icon: <SupportAgent />, path: '/support' },
  { text: 'Profile Edit', icon: <AccountCircle />, path: '/profile' },
  { text: 'Subscription Plan', icon: <Assignment />, path: '/subscription-plan' },
  { text: 'Audit Logs', icon: <Assignment />, path: '/audit-logs', admin: true },
  { text: 'Notifications', icon: <Notifications />, path: '/notifications', admin: true },
  { text: 'Module Master', icon: <Assignment />, path: '/module-master', admin: true },
];

function Subscription() {
  return <Typography variant="h4">Subscription</Typography>;
}
function SubscriptionPlan() {
  return <Typography variant="h4">Subscription Plan</Typography>;
}

function PrivateRoute({ children }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppLayout({ children, toggleTheme, mode }) {
  const location = useLocation();
  if (location.pathname === '/login' || location.pathname === '/register') {
    return children;
  }
  const user = getUser();
  return (
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Admin Panel
            </Typography>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            {isLoggedIn() && <NotificationBell />}
            {isLoggedIn() && (
              <Typography
                variant="body2"
                sx={{ cursor: 'pointer' }}
                onClick={() => { logout(); window.location.href = '/login'; }}
              >
                Logout
              </Typography>
            )}
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ p: 2, borderBottom: '1px solid #eee', textAlign: 'center' }}>
            <Avatar src={user?.avatar} sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}>
              {user?.name?.[0] || user?.email?.[0] || <AccountCircle />}
            </Avatar>
            <Typography variant="subtitle1">{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
          </Box>
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.filter(item => !item.admin || user?.role === 'admin').map((item) => (
                <ListItem button key={item.text} component={Link} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function AppContent({ toggleTheme, mode }) {
  const { loading } = useLoader();
  return (
    <>
      {loading && <Loader />}
      <Router>
        <AppLayout toggleTheme={toggleTheme} mode={mode}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <PrivateRoute>
                  <SubscriptionsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/support"
              element={
                <PrivateRoute>
                  <Support />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfileEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/subscription-plan"
              element={
                <PrivateRoute>
                  <SubscriptionPlans />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <Users />
                </PrivateRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <PrivateRoute>
                  <Roles />
                </PrivateRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <PrivateRoute>
                  <AuditLogs />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <NotificationManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/module-master"
              element={
                <PrivateRoute>
                  <ModuleMaster />
                </PrivateRoute>
              }
            />
          </Routes>
        </AppLayout>
      </Router>
    </>
  );
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };
  return (
    <ThemeProvider theme={theme}>
      <LoaderProvider>
        <NotificationProvider>
          <AppContent toggleTheme={toggleTheme} mode={mode} />
        </NotificationProvider>
      </LoaderProvider>
    </ThemeProvider>
  );
}

export default App;
