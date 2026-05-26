import axios from 'axios';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'store_token';

export const storeApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1',
  withCredentials: false,
});

storeApi.interceptors.request.use(config => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

storeApi.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    return Promise.reject(err);
  },
);

export const setStoreToken = (token: string) => Cookies.set(TOKEN_KEY, token, { expires: 7 });
export const removeStoreToken = () => Cookies.remove(TOKEN_KEY);
export const getStoreToken = () => Cookies.get(TOKEN_KEY);
