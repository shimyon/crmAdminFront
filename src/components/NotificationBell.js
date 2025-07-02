import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'warning':
      return <WarningIcon color="warning" fontSize="small" />;
    case 'error':
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <InfoIcon color="info" fontSize="small" />;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when opening
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    handleClose();
  };

  const handleDeleteNotification = (event, notificationId) => {
    event.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleClearAllRead = () => {
    deleteAllRead();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 2 }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {notifications.length > 0 && (
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={handleClearAllRead}
                disabled={!notifications.some(n => n.read)}
              >
                Clear Read
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <MenuItem
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  display: 'block',
                  py: 1.5,
                  px: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            color: notification.read ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {notification.message}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notification.createdAt)}
                          </Typography>
                          <Chip
                            label={notification.type}
                            size="small"
                            color={getNotificationColor(notification.type)}
                            sx={{ ml: 1, height: 16 }}
                          />
                        </Box>
                      }
                    />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteNotification(e, notification._id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>

        {notifications.length > 10 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Showing 10 of {notifications.length} notifications
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 