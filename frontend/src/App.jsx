
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import Login from './pages/Login';
import DashboardMahasiswa from './pages/DashboardMahasiswa';
import Keranjang from './pages/Keranjang';
import DashboardDosen from './pages/DashboardDosen';
import Jadwal from './pages/Jadwal';

function Guard({children,roles}) {
  const token = localStorage.getItem('token');
  let user = {};

  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (error) {
    console.error('Gagal membaca data pengguna:', error);
  }

  if (!token) return <Navigate to="/" replace/>;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'dosen' ? '/dosen' : '/mahasiswa'} replace/>;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/mahasiswa" element={<Guard roles={['mahasiswa']}><DashboardMahasiswa/></Guard>}/>
        <Route path="/keranjang" element={<Guard roles={['mahasiswa']}><Keranjang/></Guard>}/>
        <Route path="/jadwal" element={<Guard roles={['mahasiswa']}><Jadwal/></Guard>}/>
        <Route path="/dosen" element={<Guard roles={['dosen']}><DashboardDosen/></Guard>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}
