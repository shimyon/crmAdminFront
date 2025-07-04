import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Chip, TablePagination, TableSortLabel, Checkbox, Toolbar
} from '@mui/material';
import { Add, Edit, Delete, Settings, History } from '@mui/icons-material';
import { getToken, getUser } from '../utils/auth';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';

function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', duration: '', modules: [], user: '', status: 'active' });
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [historyDialog, setHistoryDialog] = useState({ open: false, planId: null, history: [], loading: false });

  const defaultColumns = [
    { id: 'name', label: 'Name', visible: true },
    { id: 'price', label: 'Price', visible: true },
    { id: 'duration', label: 'Duration', visible: true },
    { id: 'modules', label: 'modules', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'actions', label: 'Actions', visible: true },
  ];
  const durationList = [
    { val: 1, name: "1 Month" },
    { val: 3, name: "3 Month" },
    { val: 6, name: "6 Month" },
    { val: 12, name: "12 Month" },
  ];
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('plansTableColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const handleColumnsClick = (e) => setAnchorEl(e.currentTarget);
  const handleColumnsClose = () => setAnchorEl(null);
  const handleColumnToggle = (id) => {
    const newCols = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    setColumns(newCols);
    localStorage.setItem('plansTableColumns', JSON.stringify(newCols));
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet('/api/subscription-plans');
      setPlans(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    // Fetch modules for multi-select
    apiGet('/api/module-master?page=1&limit=1000&search=').then(res => {
      setModules(res.data.data || []);
    });
    // Fetch users for user column
    apiGet('/api/users').then(res => {
      setUsers(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (!columns.find(col => col.id === 'user')) {
      setColumns(cols => [
        ...cols.slice(0, 1),
        { id: 'user', label: 'User', visible: true },
        ...cols.slice(1)
      ]);
    }
    // eslint-disable-next-line
  }, []);

  const handleOpenDialog = (plan = null) => {
    setEditPlan(plan);
    setForm(plan ? {
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      modules: plan.modules.map(x => x._id),
      user: plan.user || '',
      status: plan.status || 'active',
    } : { name: '', price: '', duration: '', modules: [], user: '', status: 'active' });
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };
  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleModuleChange = e => {
    setForm({ ...form, modules: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let res, data;
      const payload = {
        name: form.name,
        price: Number(form.price),
        duration: Number(form.duration),
        modules: form.modules,
        user: form.user,
        status: form.status
      };
      if (editPlan) {
        res = await apiPut(`/api/subscription-plans/${editPlan._id}`, payload);
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Update failed');
        setSuccess('Plan updated');
      } else {
        res = await apiPost('/api/subscription-plans', payload);
        data = res.data;
        if (!res.status || res.status >= 400) throw new Error(data.message || 'Create failed');
        setSuccess('Plan created');
      }
      handleCloseDialog();
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this plan?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await apiDelete(`/api/subscription-plans/${id}`);
      const data = res.data;
      if (!res.status || res.status >= 400) throw new Error(data.message || 'Delete failed');
      setSuccess('Plan deleted');
      fetchPlans();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowHistory = async (planId) => {
    setHistoryDialog({ open: true, planId, history: [], loading: true });
    try {
      const res = await apiGet(`/api/subscription-plans/${planId}/history`);
      var data = res.data.map((val, id) => {
        val.data.modulesCount = val.data.modules.length;
        val.data.modules = val.data.modules.map((m) => {
          return m.Name;
        }).join();
        return val;
      })
      setHistoryDialog({ open: true, planId, history: data, loading: false });
    } catch (err) {
      console.log("Error", err);
      setHistoryDialog({ open: true, planId, history: [], loading: false });
    }
  };

  const handleCloseHistory = () => setHistoryDialog({ open: false, planId: null, history: [], loading: false });

  // Sorting logic
  function sortComparator(a, b) {
    let valA = a[orderBy];
    let valB = b[orderBy];
    if (orderBy === 'price' || orderBy === 'duration') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      valA = valA?.toLowerCase?.() || '';
      valB = valB?.toLowerCase?.() || '';
    }
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  }

  // Filtered and sorted plans
  const filteredPlans = plans.filter(plan => plan.name.toLowerCase().includes(search.toLowerCase())).sort(sortComparator);
  // Paginated plans
  const paginatedPlans = filteredPlans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  function exportToCSV(data, filename) {
    const csvRows = [];
    const headers = ['Name', 'Price', 'Duration', 'modules'];
    csvRows.push(headers.join(','));
    for (const plan of data) {
      csvRows.push([
        '"' + plan.name.replace(/"/g, '""') + '"',
        plan.price,
        plan.duration,
        '"' + plan.modules.join('; ').replace(/"/g, '""') + '"',
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
    if (!window.confirm('Delete selected plans?')) return;
    setError('');
    setSuccess('');
    try {
      for (const id of selected) {
        await apiDelete(`/api/subscription-plans/${id}`);
      }
      setSuccess('Selected plans deleted');
      setSelected([]);
      fetchPlans();
    } catch (err) {
      setError('Bulk delete failed');
    }
  };

  const isSelected = id => selected.indexOf(id) !== -1;
  const handleSelectAllClick = e => {
    if (e.target.checked) {
      const newSelected = paginatedPlans.map(p => p._id);
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

  return (
    <Box>
      <Typography variant="h4" mb={3}>Subscription Plans</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search by name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <Button variant="outlined" onClick={() => exportToCSV(filteredPlans, 'subscription_plans.csv')}>
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
      {isAdmin && (
        <Button variant="contained" startIcon={<Add />} sx={{ mb: 2 }} onClick={() => handleOpenDialog()}>
          Add Plan
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
            {isAdmin && (
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < paginatedPlans.length}
                  checked={paginatedPlans.length > 0 && selected.length === paginatedPlans.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all plans' }}
                />
              </TableCell>
            )}
            {columns.find(c => c.id === 'name' && c.visible) && <TableCell sortDirection={orderBy === 'name' ? order : false}>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleSort('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>}
            {columns.find(c => c.id === 'user' && c.visible) && <TableCell>User</TableCell>}
            {columns.find(c => c.id === 'price' && c.visible) && <TableCell sortDirection={orderBy === 'price' ? order : false}>
              <TableSortLabel
                active={orderBy === 'price'}
                direction={orderBy === 'price' ? order : 'asc'}
                onClick={() => handleSort('price')}
              >
                Price
              </TableSortLabel>
            </TableCell>}
            {columns.find(c => c.id === 'duration' && c.visible) && <TableCell sortDirection={orderBy === 'duration' ? order : false}>
              <TableSortLabel
                active={orderBy === 'duration'}
                direction={orderBy === 'duration' ? order : 'asc'}
                onClick={() => handleSort('duration')}
              >
                Duration
              </TableSortLabel>
            </TableCell>}
            {columns.find(c => c.id === 'modules' && c.visible) && <TableCell>Modules</TableCell>}
            {columns.find(c => c.id === 'status' && c.visible) && <TableCell>Status</TableCell>}
            {columns.find(c => c.id === 'actions' && c.visible) && <TableCell align="right">Actions</TableCell>}
          </TableHead>
          <TableBody>
            {paginatedPlans.map(plan => {
              const isItemSelected = isSelected(plan._id);
              const userObj = users.find(u => u._id === plan.user);
              return (
                <TableRow
                  key={plan._id}
                  hover
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  onClick={e => handleClick(e, plan._id)}
                  selected={isItemSelected}
                >
                  {isAdmin && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={e => handleClick(e, plan._id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.find(c => c.id === 'name' && c.visible) && <TableCell>{plan.name}</TableCell>}
                  {columns.find(c => c.id === 'user' && c.visible) && <TableCell>{plan.user}</TableCell>}
                  {columns.find(c => c.id === 'price' && c.visible) && <TableCell>{plan.price}</TableCell>}
                  {columns.find(c => c.id === 'duration' && c.visible) && <TableCell>{plan.duration}</TableCell>}
                  {columns.find(c => c.id === 'modules' && c.visible) &&
                    <TableCell>
                      {plan.modules.length && plan.modules.map((f, idx) => (
                        <Chip key={idx} label={f.Name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>}
                  {columns.find(c => c.id === 'status' && c.visible) && <TableCell>{plan.status}</TableCell>}
                  {columns.find(c => c.id === 'actions' && c.visible) && (
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={e => { e.stopPropagation(); handleOpenDialog(plan); }}><Edit /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={e => { e.stopPropagation(); handleDelete(plan._id); }}><Delete /></IconButton>
                      </Tooltip>
                      <Tooltip title="View History">
                        <IconButton onClick={() => handleShowHistory(plan._id)}><History /></IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPlans.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editPlan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Price"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Duration"
              name="duration"
              select
              value={form.duration}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            >
              {durationList.map(r => <MenuItem key={r.val} value={r.val}>{r.name}</MenuItem>)}
            </TextField>
            <TextField
              label="User"
              name="user"
              type="number"
              value={form.user}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <Select
              label="Modules"
              name="modules"
              multiple
              value={form.modules}
              onChange={handleModuleChange}
              fullWidth
              margin="normal"
              renderValue={selected => modules.filter(m => selected.includes(m._id)).map(m => `${m.Name} (${m.GroupName})`).join(', ')}
            >
              {modules.map(module => (
                <MenuItem key={module._id} value={module._id}>
                  {module.Name} ({module.GroupName})
                </MenuItem>
              ))}
            </Select>
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              fullWidth
              sx={{ mt: 2 }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">{editPlan ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* History Dialog */}
      <Dialog open={historyDialog.open} onClose={handleCloseHistory} maxWidth="md" fullWidth>
        <DialogTitle>Plan History</DialogTitle>
        <DialogContent>
          {historyDialog.loading ? <Typography>Loading...</Typography> :
            historyDialog.history.length === 0 ? <Typography>No history found.</Typography> :
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Changed By</TableCell>
                    <TableCell>Changed At</TableCell>
                    <TableCell>Data Snapshot</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyDialog.history.map((h, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{h.action}</TableCell>
                      <TableCell>{h.changedBy?.name || h.changedBy?.email || h.changedBy}</TableCell>
                      <TableCell>{new Date(h.changedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <pre style={{ maxWidth: 400, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(h.data, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SubscriptionPlans; 