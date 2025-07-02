import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Chip, TablePagination, TableSortLabel, Checkbox, Toolbar
} from '@mui/material';
import { Add, Edit, Delete, Settings } from '@mui/icons-material';
import { getToken } from '../utils/auth';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState({ Name: '', permissions: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);

  const defaultColumns = [
    { id: 'name', label: 'Name', visible: true },
    { id: 'permissions', label: 'Permissions', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ];
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('rolesTableColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [anchorEl, setAnchorEl] = useState(null);

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

  useEffect(() => { fetchRoles(); }, []);

  const handleOpenDialog = (role = null) => {
    setEditRole(role);
    setForm(role ? { Name: role.Name, permissions: role.permissions.join(', ') } : { Name: '', permissions: '' });
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
      if (editRole) {
        res = await apiPut(`/api/roles/${editRole._id}`, { Name: form.Name, permissions: form.permissions.split(',').map(p => p.trim()) });
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Update failed');
        setSuccess('Role updated');
      } else {
        res = await apiPost('/api/roles', { Name: form.Name, permissions: form.permissions.split(',').map(p => p.trim()) });
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Create failed');
        setSuccess('Role created');
      }
      handleCloseDialog();
      fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this role?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/api/roles/${id}`);
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Delete failed');
      setSuccess('Role deleted');
      fetchRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Sorting logic
  function sortComparator(a, b) {
    const valA = a[orderBy]?.toLowerCase?.() || '';
    const valB = b[orderBy]?.toLowerCase?.() || '';
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  }

  // Filtered and sorted roles
  const filteredRoles = roles.filter(role => role.Name.toLowerCase().includes(search.toLowerCase())).sort(sortComparator);
  // Paginated roles
  const paginatedRoles = filteredRoles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  function exportToCSV(data, filename) {
    const csvRows = [];
    const headers = ['Name', 'Permissions'];
    csvRows.push(headers.join(','));
    for (const role of data) {
      csvRows.push([
        '"' + role.Name.replace(/"/g, '""') + '"',
        '"' + role.permissions.join('; ').replace(/"/g, '""') + '"',
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

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected roles?')) return;
    setError('');
    setSuccess('');
    try {
      for (const id of selected) {
        await apiDelete(`/api/roles/${id}`);
      }
      setSuccess('Selected roles deleted');
      setSelected([]);
      fetchRoles();
    } catch (err) {
      setError('Bulk delete failed');
    }
  };

  const isSelected = id => selected.indexOf(id) !== -1;
  const handleSelectAllClick = e => {
    if (e.target.checked) {
      const newSelected = paginatedRoles.map(r => r._id);
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

  const handleColumnsClick = (e) => setAnchorEl(e.currentTarget);
  const handleColumnsClose = () => setAnchorEl(null);
  const handleColumnToggle = (id) => {
    const newCols = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    setColumns(newCols);
    localStorage.setItem('rolesTableColumns', JSON.stringify(newCols));
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Roles</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={() => exportToCSV(filteredRoles, 'roles.csv')}>
          Export CSV
        </Button>
        <IconButton onClick={handleColumnsClick} title="Customize columns"><Settings /></IconButton>
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
      <Button variant="contained" startIcon={<Add />} sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
        Add Role
      </Button>
      {selected.length > 0 && (
        <Toolbar sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }}>
          <Typography sx={{ flex: 1 }}>{selected.length} selected</Typography>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>Delete Selected</Button>
        </Toolbar>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.find(c => c.id === 'name' && c.visible) && <TableCell>Name</TableCell>}
              {columns.find(c => c.id === 'permissions' && c.visible) && <TableCell>Permissions</TableCell>}
              {columns.find(c => c.id === 'actions' && c.visible) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRoles.map(role => (
              <TableRow key={role._id}>
                {columns.find(c => c.id === 'name' && c.visible) && <TableCell>{role.Name}</TableCell>}
                {columns.find(c => c.id === 'permissions' && c.visible) && <TableCell>{role.permissions.join(', ')}</TableCell>}
                {columns.find(c => c.id === 'actions' && c.visible) && (
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(role)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(role._id)}><Delete /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredRoles.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Name"
              name="Name"
              value={form.Name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Permissions (comma separated)"
              name="permissions"
              value={form.permissions}
              onChange={handleChange}
              fullWidth
              margin="normal"
              helperText="e.g. manage_users, view_reports"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editRole ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Roles; 