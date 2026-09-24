import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import CustomerPage from "./pages/CustomerPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ReservationPage from "./pages/ReservationPage";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <nav className='navbar'>
        <Link to='/'>Reservation</Link>

        <Link to='/admin'>Admin</Link>
      </nav>

      <Routes>
        <Route path='/' element={<CustomerPage />} />

        <Route path='/admin/login' element={<AdminLoginPage />} />

        <Route
          path='/admin'
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path='/reservation/:id' element={<ReservationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
