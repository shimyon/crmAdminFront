import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, MenuItem, Alert, Toolbar, Button
} from '@mui/material';
import { getToken, getUser } from '../utils/auth';
import { apiGet } from '../utils/api';

const actions = [
  'register', 'login', 'update_user', 'create_role', 'update_role', 'delete_role',
  'create_plan', 'update_plan', 'delete_plan', 'create_subscription', 'update_subscription', 'delete_subscription',
  'create_ticket', 'update_ticket', 'delete_ticket'
];

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(userFilter && { user: userFilter }),
        ...(actionFilter && { action: actionFilter }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo })
      });
      const res = await apiGet(`/api/audit-logs?${params.toString()}`);
      const data = res.data;
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, rowsPerPage, userFilter, actionFilter, dateFrom, dateTo]);

  const isAdmin = getUser()?.role === 'admin';
  if (!isAdmin) return <Alert severity="error">Access denied</Alert>;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Audit Logs</Typography>
      <Toolbar sx={{ mb: 2, gap: 2 }}>
        <TextField label="User ID" value={userFilter} onChange={e => setUserFilter(e.target.value)} size="small" />
        <TextField label="Action" select value={actionFilter} onChange={e => setActionFilter(e.target.value)} size="small" sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          {actions.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>
        <TextField label="From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
        <Button onClick={() => { setUserFilter(''); setActionFilter(''); setDateFrom(''); setDateTo(''); }}>Clear</Button>
      </Toolbar>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log._id}>
                <TableCell>{log.user?.name || log.user?.email || log.user || '-'}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.target}</TableCell>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}</pre>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
}

export default AuditLogs; 