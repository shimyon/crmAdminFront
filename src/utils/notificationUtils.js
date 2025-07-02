import { apiPost } from './api';

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Create a notification for the current user
export const createNotification = async (message, type = NOTIFICATION_TYPES.INFO) => {
  try {
    const response = await apiPost('/api/notifications', {
      message,
      type,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create a notification for a specific user (admin only)
export const createNotificationForUser = async (userId, message, type = NOTIFICATION_TYPES.INFO) => {
  try {
    const response = await apiPost('/api/notifications', {
      user: userId,
      message,
      type,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating notification for user:', error);
    throw error;
  }
};

// Create success notification
export const createSuccessNotification = async (message) => {
  return createNotification(message, NOTIFICATION_TYPES.SUCCESS);
};

// Create error notification
export const createErrorNotification = async (message) => {
  return createNotification(message, NOTIFICATION_TYPES.ERROR);
};

// Create warning notification
export const createWarningNotification = async (message) => {
  return createNotification(message, NOTIFICATION_TYPES.WARNING);
};

// Create info notification
export const createInfoNotification = async (message) => {
  return createNotification(message, NOTIFICATION_TYPES.INFO);
};

// Notification templates for common actions
export const NOTIFICATION_TEMPLATES = {
  USER_CREATED: (firstName, lastName) => `User "${firstName} ${lastName}" has been created successfully.`,
  USER_UPDATED: (firstName, lastName) => `User "${firstName} ${lastName}" has been updated successfully.`,
  USER_DELETED: (firstName, lastName) => `User "${firstName} ${lastName}" has been deleted.`,
  ROLE_CREATED: (roleName) => `Role "${roleName}" has been created successfully.`,
  ROLE_UPDATED: (roleName) => `Role "${roleName}" has been updated successfully.`,
  ROLE_DELETED: (roleName) => `Role "${roleName}" has been deleted.`,
  SUBSCRIPTION_CREATED: (planName) => `Subscription to "${planName}" has been created successfully.`,
  SUBSCRIPTION_EXPIRED: (planName) => `Your subscription to "${planName}" has expired.`,
  SUPPORT_TICKET_CREATED: (ticketId) => `Support ticket #${ticketId} has been created.`,
  SUPPORT_TICKET_UPDATED: (ticketId) => `Support ticket #${ticketId} has been updated.`,
  SUPPORT_TICKET_RESOLVED: (ticketId) => `Support ticket #${ticketId} has been resolved.`,
  LOGIN_SUCCESS: () => `Welcome back! You have successfully logged in.`,
  LOGIN_FAILED: () => `Login failed. Please check your credentials.`,
  PASSWORD_CHANGED: () => `Your password has been changed successfully.`,
  PROFILE_UPDATED: () => `Your profile has been updated successfully.`,
  SYSTEM_MAINTENANCE: () => `System maintenance is scheduled. Please save your work.`,
  BACKUP_COMPLETED: () => `System backup has been completed successfully.`,
  ERROR_OCCURRED: (action) => `An error occurred while ${action}. Please try again.`,
};

// Helper function to create notifications using templates
export const createTemplateNotification = async (template, ...args) => {
  const message = template(...args);
  return createNotification(message, NOTIFICATION_TYPES.INFO);
};

// Helper function to create success notifications using templates
export const createTemplateSuccessNotification = async (template, ...args) => {
  const message = template(...args);
  return createNotification(message, NOTIFICATION_TYPES.SUCCESS);
};

// Helper function to create error notifications using templates
export const createTemplateErrorNotification = async (template, ...args) => {
  const message = template(...args);
  return createNotification(message, NOTIFICATION_TYPES.ERROR);
};

// Helper function to create warning notifications using templates
export const createTemplateWarningNotification = async (template, ...args) => {
  const message = template(...args);
  return createNotification(message, NOTIFICATION_TYPES.WARNING);
}; 