import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, Grid } from '@mui/material';
import { getToken, getUser, logout } from '../utils/auth';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import { Edit } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

function ProfileEdit() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const user = getUser();

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await apiGet('/api/auth/me');
        const data = res.data;
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email);
        setAvatar(data.avatar || '');
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await apiPut(`/api/users/${user.id}`, { firstName, lastName, email });
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Update failed');
      setSuccess('Profile updated successfully!');
      localStorage.setItem('user', JSON.stringify({ ...user, firstName, lastName, email }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      const res = await apiPut(`/api/users/${user.id}`, { password: newPassword, currentPassword });
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Password update failed');
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAvatarChange = async (e) => {
    if (!e.target.files[0]) return;
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('avatar', e.target.files[0]);
    try {
      const res = await apiPost('/api/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Avatar upload failed');
      setAvatar(data.avatar);
      setSuccess('Avatar updated!');
      localStorage.setItem('user', JSON.stringify({ ...user, avatar: data.avatar }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper sx={{ p: 4, minWidth: 400 }}>
        <Typography variant="h5" mb={2}>Edit Profile</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar src={avatar} sx={{ width: 80, height: 80, mb: 1 }}>
            {firstName?.[0] || email?.[0]}
          </Avatar>
          <label htmlFor="avatar-upload">
            <input
              accept="image/*"
              id="avatar-upload"
              type="file"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <Tooltip title="Upload Picture">
              <IconButton color="primary" aria-label="upload picture" component="span">
                <Edit />
              </IconButton>
            </Tooltip>
          </label>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
          </Grid>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Save Changes
          </Button>
        </form>
        <Box mt={4}>
          <Typography variant="h6" mb={1}>Change Password</Typography>
          <form onSubmit={handlePasswordChange}>
            <TextField
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <Button type="submit" variant="outlined" color="primary" fullWidth sx={{ mt: 2 }}>
              Change Password
            </Button>
          </form>
        </Box>
      </Paper>
    </Box>
  );
}

export default ProfileEdit; 