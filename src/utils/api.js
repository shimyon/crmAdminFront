import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: '', // relative to current origin
});

// Universal loader logic
let loader;
function getLoader() {
  if (!loader) {
    // Dynamically import to avoid circular dependency
    loader = require('../contexts/LoaderContext');
  }
  return loader;
}

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  try {
    const { showLoader } = getLoader().useLoader();
    showLoader && showLoader();
  } catch {}
  return config;
});

api.interceptors.response.use(
  response => {
    try {
      const { hideLoader } = getLoader().useLoader();
      hideLoader && hideLoader();
    } catch {}
    return response;
  },
  error => {
    try {
      const { hideLoader } = getLoader().useLoader();
      hideLoader && hideLoader();
    } catch {}
    return Promise.reject(error);
  }
);

export const apiGet = (url, config = {}) => api.get(process.env.REACT_APP_APIURL+url, config);
export const apiPost = (url, data, config = {}) => api.post(process.env.REACT_APP_APIURL+url, data, config);
export const apiPut = (url, data, config = {}) => api.put(process.env.REACT_APP_APIURL+url, data, config);
export const apiDelete = (url, config = {}) => api.delete(process.env.REACT_APP_APIURL+url, config);

export default api; 