import { useEffect, useState } from 'react';
import axios from 'axios';

const ScheduleManager = () => {
  const token = localStorage.getItem('token');
  
  // Dữ liệu cho các ô chọn (Dropdown)
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Dữ liệu Form
  const [form, setForm] = useState({
    route_id: '',
    bus_id: '',
    driver_id: '',
    start_date: new Date().toISOString().slice(0, 10), // Mặc định hôm nay
    end_date: new Date().toISOString().slice(0, 10),   // Mặc định hôm nay
    start_time: '06:30'
  });

  // Load tất cả dữ liệu cần thiết khi mở trang
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const [routesRes, busesRes, driversRes] = await Promise.all([
          axios.get('http://localhost:3000/api/routes', { headers }),
          axios.get('http://localhost:3000/api/buses', { headers }),
          axios.get('http://localhost:3000/api/users/drivers', { headers })
        ]);

        setRoutes(routesRes.data.data);
        setBuses(busesRes.data.data);
        setDrivers(driversRes.data.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  // Xử lý nút Tạo Lịch
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate
    if(!form.route_id || !form.bus_id || !form.driver_id) {
      return alert("Vui lòng chọn đầy đủ Tuyến, Xe và Tài xế!");
    }

    try {
      const res = await axios.post('http://localhost:3000/api/schedules', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${res.data.message}`);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2563eb' }}>📅 Phân Công Lịch Trình</h2>

      <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ marginTop: 0, marginBottom: '20px' }}>Tạo lịch chạy mới</h4>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* 1. Chọn Tuyến */}
          <div>
            <label style={labelStyle}>Chọn Tuyến đường:</label>
            <select style={inputStyle} value={form.route_id} onChange={e => setForm({...form, route_id: e.target.value})}>
              <option value="">-- Chọn Tuyến --</option>
              {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_name}</option>)}
            </select>
          </div>

          {/* 2. Chọn Xe */}
          <div>
            <label style={labelStyle}>Chọn Xe Buýt:</label>
            <select style={inputStyle} value={form.bus_id} onChange={e => setForm({...form, bus_id: e.target.value})}>
              <option value="">-- Chọn Xe --</option>
              {buses.map(b => <option key={b.bus_id} value={b.bus_id}>{b.license_plate} ({b.brand})</option>)}
            </select>
          </div>

          {/* 3. Chọn Tài xế */}
          <div>
            <label style={labelStyle}>Chọn Tài xế:</label>
            <select style={inputStyle} value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})}>
              <option value="">-- Chọn Tài xế --</option>
              {drivers.map(d => <option key={d.user_id} value={d.user_id}>{d.full_name} ({d.phone})</option>)}
            </select>
          </div>

          {/* 4. Giờ chạy */}
          <div>
            <label style={labelStyle}>Giờ xuất phát:</label>
            <input type="time" style={inputStyle} value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
          </div>

          {/* 5. Ngày bắt đầu */}
          <div>
            <label style={labelStyle}>Từ ngày:</label>
            <input type="date" style={inputStyle} value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
          </div>

          {/* 6. Ngày kết thúc */}
          <div>
            <label style={labelStyle}>Đến ngày:</label>
            <input type="date" style={inputStyle} value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
          </div>

          <button type="submit" style={{ gridColumn: 'span 2', padding: '15px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            Tạo Lịch Trình
          </button>

        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#64748b' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', backgroundColor: 'white' };

export default ScheduleManager;