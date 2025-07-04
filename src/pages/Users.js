import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, TablePagination, TableSortLabel, Checkbox, Toolbar, Grid
} from '@mui/material';
import { Add, Edit, Delete, Settings } from '@mui/icons-material';
import { getToken, getUser, hasPermission } from '../utils/auth';
import Menu from '@mui/material/Menu';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import Tooltip from '@mui/material/Tooltip';

function exportToCSV(data, filename) {
  const csvRows = [];
  const headers = ['First Name', 'Last Name', 'Email', 'Role'];
  csvRows.push(headers.join(','));
  for (const user of data) {
    csvRows.push([
      '"' + (user.firstName || '').replace(/"/g, '""') + '"',
      '"' + (user.lastName || '').replace(/"/g, '""') + '"',
      '"' + user.email.replace(/"/g, '""') + '"',
      '"' + (user.role?.Name || '').replace(/"/g, '""') + '"',
    ].join(','));
  }
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const defaultColumns = [
  { id: 'firstName', label: 'First Name', visible: true },
  { id: 'lastName', label: 'Last Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'role', label: 'Role', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: '' });
  const currentUser = getUser();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('firstName');
  const [order, setOrder] = useState('asc');
  const [roles, setRoles] = useState(['admin', 'user']);
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('usersTableColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet('/api/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet('/api/roles');
      setRoles(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchUsers();fetchRoles(); }, []);

  const handleOpenDialog = (user = null) => {
    setEditUser(user);
    setForm(user ? { 
      firstName: user.firstName || '', 
      lastName: user.lastName || '', 
      email: user.email, 
      role: user.role?._id || user.role || ''
    } : { firstName: '', lastName: '', email: '', role: '' });
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let res, data;
      if (editUser) {
        res = await apiPut(`/api/users/${editUser._id}`, { 
          firstName: form.firstName, 
          lastName: form.lastName, 
          email: form.email, 
          role: form.role
        });
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Update failed');
        setSuccess('User updated');
      } else {
        res = await apiPost('/api/users', form);
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Create failed');
        setSuccess(data.message || 'User created');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this user?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/api/users/${id}`);
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Delete failed');
      setSuccess('User deleted');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? user.role?.Name === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Paginated users
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected users?')) return;
    setError('');
    setSuccess('');
    try {
      for (const id of selected) {
        if (id === currentUser.id) continue;
        await apiDelete(`/api/users/${id}`);
      }
      setSuccess('Selected users deleted');
      setSelected([]);
      fetchUsers();
    } catch (err) {
      setError('Bulk delete failed');
    }
  };

  const isSelected = id => selected.indexOf(id) !== -1;
  const handleSelectAllClick = e => {
    if (e.target.checked) {
      const newSelected = paginatedUsers.map(u => u._id).filter(id => id !== currentUser.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };
  const handleClick = (e, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleSort = property => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleColumnsClick = (e) => setAnchorEl(e.currentTarget);
  const handleColumnsClose = () => setAnchorEl(null);
  const handleColumnToggle = (id) => {
    const newCols = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    setColumns(newCols);
    localStorage.setItem('usersTableColumns', JSON.stringify(newCols));
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Users</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <TextField
          label="Role"
          select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {roles.map(r => <MenuItem key={r._id || r} value={r.Name || r}>{r.Name || r}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={() => exportToCSV(filteredUsers, 'users.csv')}>
          Export CSV
        </Button>
        <Tooltip title="Customize columns">
          <IconButton onClick={handleColumnsClick}><Settings /></IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleColumnsClose}>
          {columns.map(col => (
            <MenuItem key={col.id} onClick={() => handleColumnToggle(col.id)}>
              <Checkbox checked={col.visible} />
              {col.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {hasPermission('manage_users') && (
        <Button variant="contained" startIcon={<Add />} sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
          Add User
        </Button>
      )}
      {hasPermission('manage_users') && selected.length > 0 && (
        <Toolbar sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }}>
          <Typography sx={{ flex: 1 }}>{selected.length} selected</Typography>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>Delete Selected</Button>
        </Toolbar>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < paginatedUsers.length}
                  checked={paginatedUsers.length > 0 && selected.length === paginatedUsers.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all users' }}
                />
              </TableCell>
              {columns.find(c => c.id === 'firstName' && c.visible) && (
                <TableCell sortDirection={orderBy === 'firstName' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'firstName'}
                    direction={orderBy === 'firstName' ? order : 'asc'}
                    onClick={() => handleSort('firstName')}
                  >
                    First Name
                  </TableSortLabel>
                </TableCell>
              )}
              {columns.find(c => c.id === 'lastName' && c.visible) && (
                <TableCell sortDirection={orderBy === 'lastName' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'lastName'}
                    direction={orderBy === 'lastName' ? order : 'asc'}
                    onClick={() => handleSort('lastName')}
                  >
                    Last Name
                  </TableSortLabel>
                </TableCell>
              )}
              {columns.find(c => c.id === 'email' && c.visible) && (
                <TableCell sortDirection={orderBy === 'email' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'email'}
                    direction={orderBy === 'email' ? order : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
              )}
              {columns.find(c => c.id === 'role' && c.visible) && (
                <TableCell sortDirection={orderBy === 'role' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'role'}
                    direction={orderBy === 'role' ? order : 'asc'}
                    onClick={() => handleSort('role')}
                  >
                    Role
                  </TableSortLabel>
                </TableCell>
              )}
              {columns.find(c => c.id === 'actions' && c.visible) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map(user => {
              const isItemSelected = isSelected(user._id);
              return (
                <TableRow
                  key={user._id}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  onClick={e => handleClick(e, user._id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      disabled={user._id === currentUser.id}
                      onChange={e => handleClick(e, user._id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </TableCell>
                  {columns.find(c => c.id === 'firstName' && c.visible) && <TableCell>{user.firstName}</TableCell>}
                  {columns.find(c => c.id === 'lastName' && c.visible) && <TableCell>{user.lastName}</TableCell>}
                  {columns.find(c => c.id === 'email' && c.visible) && <TableCell>{user.email}</TableCell>}
                  {columns.find(c => c.id === 'role' && c.visible) && <TableCell>{user.role?.Name}</TableCell>}
                  {columns.find(c => c.id === 'actions' && c.visible) && (
                    <TableCell align="right">
                      {hasPermission('manage_users') && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleOpenDialog(user)}><Edit /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDelete(user._id)} disabled={user._id === currentUser.id}><Delete /></IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  required
                />
              </Grid>
            </Grid>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Role"
              name="role"
              select
              value={form.role}
              onChange={handleChange}
              fullWidth
              margin="normal"
            >
              {roles.map(r => <MenuItem key={r._id || r} value={r._id || r}>{r.Name || r}</MenuItem>)}
            </TextField>
            {editUser && (
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
                helperText="Leave blank to keep current password"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editUser ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Users; 