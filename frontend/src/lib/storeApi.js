import axios from 'axios';

const storeApi = axios.create({
  baseURL: '/api/storefront',
  headers: { 'Content-Type': 'application/json' },
});

storeApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default storeApi;
