import { useEffect, useState } from 'react';
import axios from 'axios';

const StopManager = () => {
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '' });
  const token = localStorage.getItem('token');

  const fetchStops = () => {
    axios.get('http://localhost:3000/api/stops', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStops(res.data.data)).catch(console.error);
  };

  useEffect(() => { fetchStops(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name || !form.latitude || !form.longitude) return alert("Nhập tên và tọa độ!");
    try {
      await axios.post('http://localhost:3000/api/stops', form, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Đã tạo trạm mới!");
      setForm({ name: '', address: '', latitude: '', longitude: '' });
      fetchStops();
    } catch (err) { alert("Lỗi: " + err.message); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Xóa trạm này?")) {
      await axios.delete(`http://localhost:3000/api/stops/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchStops();
    }
  };

  return (
    <div style={{ padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: 15, color: '#2563eb' }}>🚏 Quản lý Trạm Dừng</h2>

      <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, marginBottom: 25, border: '1px solid #e2e8f0' }}>
        <h4>Thêm Trạm Mới</h4>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <input placeholder="Tên Trạm (VD: Cổng Siêu Thị)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
          <input placeholder="Địa chỉ mô tả" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={inputStyle} />
          <input placeholder="Vĩ độ (Lat) - VD: 10.762..." value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} style={inputStyle} />
          <input placeholder="Kinh độ (Lng) - VD: 106.660..." value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} style={inputStyle} />
          <button type="submit" style={{ gridColumn: 'span 2', padding: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>+ Lưu Trạm</button>
        </form>
        <p style={{fontSize: 12, color: '#666'}}>* Bạn có thể lấy tọa độ từ Google Maps (Chuột phải &rarr; Chọn số đầu tiên).</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#f1f5f9', textAlign: 'left' }}><th style={{padding:12}}>Tên Trạm</th><th>Địa chỉ</th><th>Tọa độ</th><th>Hành Động</th></tr></thead>
        <tbody>
          {stops.map(s => (
            <tr key={s.stop_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{padding:12, fontWeight:'bold', color:'#2563eb'}}>{s.name}</td>
              <td>{s.address}</td>
              <td style={{fontSize: 12, fontFamily: 'monospace'}}>{s.latitude}, {s.longitude}</td>
              <td><button onClick={() => handleDelete(s.stop_id)} style={{background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer'}}>Xóa</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const inputStyle = { padding: 10, border: '1px solid #ddd', borderRadius: 6 };
export default StopManager;