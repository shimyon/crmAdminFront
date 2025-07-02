import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, TablePagination, TableSortLabel, Checkbox, Toolbar
} from '@mui/material';
import { Add, Edit, Delete, Settings } from '@mui/icons-material';
import { getToken, getUser } from '../utils/auth';
import Menu from '@mui/material/Menu';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

const statusOptions = ['active', 'inactive', 'cancelled'];

function exportToCSV(data, filename) {
  const csvRows = [];
  const headers = ['User', 'Plan', 'Status', 'Start Date', 'End Date'];
  csvRows.push(headers.join(','));
  for (const sub of data) {
    csvRows.push([
      '"' + (sub.user?.name || sub.user || '').replace(/"/g, '""') + '"',
      '"' + sub.plan.replace(/"/g, '""') + '"',
      '"' + sub.status.replace(/"/g, '""') + '"',
      '"' + (sub.startDate ? sub.startDate.slice(0, 10) : '') + '"',
      '"' + (sub.endDate ? sub.endDate.slice(0, 10) : '') + '"',
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

function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', mobileNo: '', email: '', plan: '' });
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('plan');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const defaultColumns = [
    { id: 'firstName', label: 'First Name', visible: true },
    { id: 'lastName', label: 'Last Name', visible: true },
    { id: 'mobileNo', label: 'Mobile No', visible: true },
    { id: 'email', label: 'Email', visible: true },
    { id: 'plan', label: 'Plan', visible: true },
    { id: 'startDate', label: 'Start Date', visible: true },
    { id: 'endDate', label: 'End Date', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ];
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('subscriptionsTableColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchSubs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet('/api/subscriptions');
      setSubs(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchPlans = async () => {
    try {
      const res = await apiGet('/api/subscription-plans');
      setPlans(res.data);
    } catch {}
  };
  useEffect(() => { fetchSubs(); fetchPlans(); }, []);

  const handleOpenDialog = (sub = null) => {
    setEditSub(sub);
    setForm(sub ? {
      firstName: sub.firstName,
      lastName: sub.lastName,
      mobileNo: sub.mobileNo,
      email: sub.email,
      plan: sub.plan?._id || sub.plan,
    } : { firstName: '', lastName: '', mobileNo: '', email: '', plan: '' });
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
      if (editSub) {
        // For simplicity, only allow create for now (edit logic can be added similarly)
        setError('Editing subscriptions is not supported with the new schema.');
        return;
      } else {
        res = await apiPost('/api/subscriptions', form);
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Create failed');
        setSuccess('Subscription created');
      }
      handleCloseDialog();
      fetchSubs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this subscription?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/api/subscriptions/${id}`);
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Delete failed');
      setSuccess('Subscription deleted');
      fetchSubs();
    } catch (err) {
      setError(err.message);
    }
  };

  // Sorting logic
  function sortComparator(a, b) {
    let valA = a[orderBy];
    let valB = b[orderBy];
    if (orderBy === 'startDate' || orderBy === 'endDate') {
      valA = valA || '';
      valB = valB || '';
    } else {
      valA = valA?.toLowerCase?.() || '';
      valB = valB?.toLowerCase?.() || '';
    }
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  }

  // Filtered and sorted subscriptions
  const filteredSubs = subs.filter(sub => {
    const matchesSearch = sub.plan?.name.toLowerCase().includes(search?.toLowerCase());
    return matchesSearch;
  }).sort(sortComparator);
  // Paginated subscriptions
  const paginatedSubs = filteredSubs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected subscriptions?')) return;
    setError('');
    setSuccess('');
    try {
      for (const id of selected) {
        await apiDelete(`/api/subscriptions/${id}`);
      }
      setSuccess('Selected subscriptions deleted');
      setSelected([]);
      fetchSubs();
    } catch (err) {
      setError('Bulk delete failed');
    }
  };

  const isSelected = id => selected.indexOf(id) !== -1;
  const handleSelectAllClick = e => {
    if (e.target.checked) {
      const newSelected = paginatedSubs.map(s => s._id);
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
    localStorage.setItem('subscriptionsTableColumns', JSON.stringify(newCols));
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Subscriptions</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={() => exportToCSV(subs, 'subscriptions.csv')}>
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
      {isAdmin && (
        <Button variant="contained" startIcon={<Add />} sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
          Add Subscription
        </Button>
      )}
      {isAdmin && selected.length > 0 && (
        <Toolbar sx={{ bgcolor: 'rgba(0,0,0,0.04)', mb: 1 }}>
          <Typography sx={{ flex: 1 }}>{selected.length} selected</Typography>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>Delete Selected</Button>
        </Toolbar>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {isAdmin && columns.find(c => c.id === 'firstName' && c.visible) && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < paginatedSubs.length}
                    checked={paginatedSubs.length > 0 && selected.length === paginatedSubs.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all subscriptions' }}
                  />
                </TableCell>
              )}
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
              {columns.find(c => c.id === 'mobileNo' && c.visible) && (
                <TableCell sortDirection={orderBy === 'mobileNo' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'mobileNo'}
                    direction={orderBy === 'mobileNo' ? order : 'asc'}
                    onClick={() => handleSort('mobileNo')}
                  >
                    Mobile No
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
              {columns.find(c => c.id === 'plan' && c.visible) && (
                <TableCell sortDirection={orderBy === 'plan' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'plan'}
                    direction={orderBy === 'plan' ? order : 'asc'}
                    onClick={() => handleSort('plan')}
                  >
                    Plan
                  </TableSortLabel>
                </TableCell>
              )}
              {columns.find(c => c.id === 'startDate' && c.visible) && (
                <TableCell sortDirection={orderBy === 'startDate' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'startDate'}
                    direction={orderBy === 'startDate' ? order : 'asc'}
                    onClick={() => handleSort('startDate')}
                  >
                    Start Date
                  </TableSortLabel>
                </TableCell>
              )}
              {columns.find(c => c.id === 'endDate' && c.visible) && (
                <TableCell sortDirection={orderBy === 'endDate' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'endDate'}
                    direction={orderBy === 'endDate' ? order : 'asc'}
                    onClick={() => handleSort('endDate')}
                  >
                    End Date
                  </TableSortLabel>
                </TableCell>
              )}
              {isAdmin && columns.find(c => c.id === 'actions' && c.visible) && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSubs.map(sub => {
              const isItemSelected = isSelected(sub._id);
              return (
                <TableRow
                  key={sub._id}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  onClick={e => handleClick(e, sub._id)}
                  selected={isItemSelected}
                >
                  {isAdmin && columns.find(c => c.id === 'firstName' && c.visible) && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={e => handleClick(e, sub._id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.find(c => c.id === 'firstName' && c.visible) && <TableCell>{sub.firstName}</TableCell>}
                  {columns.find(c => c.id === 'lastName' && c.visible) && <TableCell>{sub.lastName}</TableCell>}
                  {columns.find(c => c.id === 'mobileNo' && c.visible) && <TableCell>{sub.mobileNo}</TableCell>}
                  {columns.find(c => c.id === 'email' && c.visible) && <TableCell>{sub.email}</TableCell>}
                  {columns.find(c => c.id === 'plan' && c.visible) && <TableCell>{sub.plan?.name || ''}</TableCell>}
                  {columns.find(c => c.id === 'startDate' && c.visible) && <TableCell>{sub.startDate ? sub.startDate.slice(0, 10) : ''}</TableCell>}
                  {columns.find(c => c.id === 'endDate' && c.visible) && <TableCell>{sub.endDate ? sub.endDate.slice(0, 10) : ''}</TableCell>}
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton onClick={e => { e.stopPropagation(); handleOpenDialog(sub); }}><Edit /></IconButton>
                      <IconButton onClick={e => { e.stopPropagation(); handleDelete(sub._id); }}><Delete /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredSubs.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editSub ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {isAdmin && (
              <TextField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
            )}
            <TextField
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Mobile No"
              name="mobileNo"
              value={form.mobileNo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Plan"
              name="plan"
              select
              value={form.plan}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              {plans.map(p => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editSub ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default Subscriptions; 