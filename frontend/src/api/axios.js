
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(method, path, body) {
  const headers = {'Content-Type': 'application/json'};
  const token = localStorage.getItem('token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    console.error('Kesalahan koneksi API:', error);
    throw new Error(
    'Tidak dapat terhubung ke server. Pastikan backend berjalan.',
        {cause: error}
    );
  }
  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    console.warn('Respons server bukan JSON:', error);
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    const e = new Error(data.message || 'Permintaan gagal.');
    e.response = {status: response.status, data};
    throw e;
  }

  return {data, status: response.status};
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  delete: (path) => request('DELETE', path)
};

export default api;
