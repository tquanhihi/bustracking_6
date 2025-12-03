import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './components/MapTracking';
import Login from './components/Login';
import RoutesManager from './components/RoutesManager';
import StudentManager from './components/StudentManager';
import BusManager from './components/BusManager';
import DriverManager from './components/DriverManager';
import ParentManager from './components/ParentManager';
import ScheduleManager from './components/ScheduleManager';
import NotificationManager from './components/NotificationManager';
import StopManager from './components/StopManager'; // <--- 1. Import Mới

// Giao diện người dùng khác
import DriverDashboard from './components/DriverDashboard';
import ParentDashboard from './components/ParentDashboard';

function App() {
  // 1. Khởi tạo State
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  // Lấy thông tin User an toàn
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dữ liệu Dashboard
  const [schedules, setSchedules] = useState([]); 
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState(null);

  // --- HÀM LOGIC CHUNG ---
  
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    const savedUser = JSON.parse(localStorage.getItem('user'));
    setUser(savedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/reports/attendance', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
      link.setAttribute('download', `BaoCao_DiemDanh_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Lỗi tải báo cáo."); }
  };

  // Gọi API Dashboard (Chỉ chạy nếu là Admin)
  useEffect(() => {
    if (token && user?.role === 'admin' && activeTab === 'dashboard') {
      axios.get('http://localhost:3000/api/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const data = res.data?.data;
        if(Array.isArray(data)) {
          setSchedules(data);
          if(data.length > 0 && !selectedTrip) setSelectedTrip(data[0].schedule_id);
        } else {
          setSchedules([]);
        }
      })
      .catch(err => {
        if(err.response?.status === 401) handleLogout();
        else setError("Lỗi kết nối Server.");
      });
    }
  }, [token, activeTab, user]);

  // --- 1. CHƯA ĐĂNG NHẬP -> HIỆN LOGIN ---
  if (!token || !user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // --- 2. PHÂN QUYỀN (ROUTER) ---

  if (user.role === 'driver') return <DriverDashboard user={user} onLogout={handleLogout} />;
  if (user.role === 'parent') return <ParentDashboard user={user} onLogout={handleLogout} />;

  // Chặn nếu không phải Admin
  if (user.role !== 'admin') {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <h1 style={{fontSize: 50}}>🚫 403</h1>
        <h3>Bạn không có quyền truy cập trang Quản Trị!</h3>
        <button onClick={handleLogout} style={{marginTop: 20, padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer'}}>Đăng xuất</button>
      </div>
    );
  }

  // --- 3. GIAO DIỆN ADMIN ---
  return (
    <div className="app-container">
      
      {/* SIDEBAR ADMIN */}
      <div className="sidebar">
        <div className="brand">🚍 SSB Admin</div>
        
        {/* Nhóm Điều Hành */}
        <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Giám sát (Live)</div>
        <div className={`menu-item ${activeTab === 'schedule_create' ? 'active' : ''}`} onClick={() => setActiveTab('schedule_create')}>📅 Phân công Lịch</div>
        <div className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>🔔 Gửi Thông báo</div>
        
        <div style={{height: 1, backgroundColor: '#334155', margin: '10px 0'}}></div>

        {/* Nhóm Hạ Tầng */}
        <div className={`menu-item ${activeTab === 'routes' ? 'active' : ''}`} onClick={() => setActiveTab('routes')}>🛣️ Tuyến đường</div>
        
        {/* 2. Thêm Menu Trạm vào đây */}
        <div className={`menu-item ${activeTab === 'stops' ? 'active' : ''}`} onClick={() => setActiveTab('stops')}>🚏 Trạm Dừng</div>

        <div className={`menu-item ${activeTab === 'buses' ? 'active' : ''}`} onClick={() => setActiveTab('buses')}>🚌 Quản lý Xe</div>

        {/* Nhóm Con Người */}
        <div className={`menu-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>🎓 Học sinh</div>
        <div className={`menu-item ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>👨‍✈️ Tài xế</div>
        <div className={`menu-item ${activeTab === 'parents' ? 'active' : ''}`} onClick={() => setActiveTab('parents')}>👨‍👩‍👧 Phụ huynh</div>
        
        <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="top-bar">
          <h2>
            {activeTab === 'dashboard' && 'Dashboard Giám Sát'}
            {activeTab === 'schedule_create' && 'Phân công Lịch trình'}
            {activeTab === 'notifications' && 'Gửi Thông báo'}
            {activeTab === 'routes' && 'Quản lý Tuyến đường'}
            {activeTab === 'stops' && 'Quản lý Trạm Dừng'}
            {activeTab === 'students' && 'Quản lý Học sinh'}
            {activeTab === 'buses' && 'Quản lý Đội Xe'}
            {activeTab === 'drivers' && 'Quản lý Tài Xế'}
            {activeTab === 'parents' && 'Quản lý Phụ Huynh'}
          </h2>
          {error && <span style={{color:'red', marginLeft: 10}}>⚠️ {error}</span>}
          <div style={{color: '#64748b'}}>Admin: {user.full_name}</div>
        </div>

        {/* --- ROUTER NỘI DUNG --- */}
        {/* 3. Hiển thị nội dung Trạm */}
        {activeTab === 'stops' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><StopManager /></div>}

        {activeTab === 'schedule_create' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><ScheduleManager /></div>}
        {activeTab === 'notifications' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><NotificationManager /></div>}
        {activeTab === 'routes' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><RoutesManager /></div>}
        {activeTab === 'students' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><StudentManager /></div>}
        {activeTab === 'buses' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><BusManager /></div>}
        {activeTab === 'drivers' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><DriverManager /></div>}
        {activeTab === 'parents' && <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100vh - 80px)' }}><ParentManager /></div>}

        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div><div className="stat-number">{schedules.length}</div><div className="stat-label">Tổng chuyến</div></div><div style={{fontSize: 30}}>🚌</div></div>
              <div className="stat-card"><div><div className="stat-number" style={{color: '#10b981'}}>{schedules.filter(s => s.status === 'running').length}</div><div className="stat-label">Đang chạy</div></div><div style={{fontSize: 30}}>📡</div></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <button onClick={handleExport} style={{ background: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📥 Xuất Báo Cáo</button>
               </div>
            </div>

            <div className="dashboard-view">
              <div className="list-panel">
                <div className="table-container">
                  {schedules.length === 0 ? <p style={{padding:20}}>Chưa có dữ liệu.</p> : (
                    <table>
                      <thead><tr><th>Tuyến</th><th>Biển số</th><th>TT</th></tr></thead>
                      <tbody>{schedules.map(item => (
                        <tr key={item.schedule_id} className={selectedTrip === item.schedule_id ? 'selected' : ''} onClick={() => setSelectedTrip(item.schedule_id)}>
                          <td>{item.route_name}</td><td>{item.license_plate}</td><td><span className={`badge ${item.status}`}>{item.status}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              </div>
              
              <div className="map-panel">
                {selectedTrip ? (
                   (() => {
                      // Tìm thông tin chuyến xe để lấy route_id cho bản đồ vẽ lộ trình
                      const tripInfo = schedules.find(s => s.schedule_id === selectedTrip);
                      return (
                         <MapTracking 
                            key={selectedTrip} 
                            scheduleId={selectedTrip} 
                            routeId={tripInfo?.route_id} 
                         />
                      );
                   })()
                ) : (
                  <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#999'}}>
                    <p>👈 Chọn một chuyến xe để xem vị trí</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;