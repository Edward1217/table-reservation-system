import { useNavigate } from "react-router-dom";

import AdminReservations from "../components/AdminReservations";

function AdminPage() {
  const navigate = useNavigate();

  // =========================================
  // Logout
  // =========================================

  const handleLogout = () => {
    localStorage.removeItem("adminToken");

    navigate("/admin/login");
  };

  return (
    <div className='admin-page'>
      {/* =====================================
          Admin Header
      ====================================== */}

      <header className='admin-header'>
        <div>
          <h1>Restaurant Admin</h1>

          <p>Manage reservations, tables, and customer bookings.</p>
        </div>

        <button className='logout-button' onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* =====================================
          Dashboard Content
      ====================================== */}

      <main className='admin-dashboard'>
        <div className='admin-section-header'>
          <div>
            <h2>Reservations</h2>

            <p>Search, edit, or cancel customer reservations.</p>
          </div>
        </div>

        <AdminReservations />
      </main>
    </div>
  );
}

export default AdminPage;
