import dayjs from 'dayjs';

export const formatDate = (date) => dayjs(date).format('MMMM D, YYYY');
export const formatDateShort = (date) => dayjs(date).format('MMM D, YYYY');
export const formatTime = (time) => dayjs(`2000-01-01 ${time}`).format('h:mm A');
export const formatDateTime = (date) => dayjs(date).format('MMM D, YYYY h:mm A');

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  return phone;
};

export const truncate = (str, length = 100) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusLabel = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const getApiImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};
