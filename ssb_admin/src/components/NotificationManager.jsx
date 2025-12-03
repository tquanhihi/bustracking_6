import { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationManager = () => {
  const [users, setUsers] = useState([]); // Danh sách người nhận
  const [form, setForm] = useState({ 
    user_id: '', 
    title: '', 
    message: '', 
    type: 'info' 
  });
  
  const token = localStorage.getItem('token');

  // Lấy danh sách Tài xế và Phụ huynh để chọn người nhận
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [driversRes, parentsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/users/drivers', { headers }),
          axios.get('http://localhost:3000/api/users/parents', { headers })
        ]);
        
        // Gộp lại thành 1 danh sách
        const allUsers = [
          ...driversRes.data.data.map(u => ({ ...u, role_label: 'Tài xế' })),
          ...parentsRes.data.data.map(u => ({ ...u, role_label: 'Phụ huynh' }))
        ];
        setUsers(allUsers);
      } catch (err) {
        console.error("Lỗi tải danh sách user:", err);
      }
    };
    fetchUsers();
  }, []);

  // Xử lý gửi tin
  const handleSend = async (e) => {
    e.preventDefault();
    if(!form.user_id || !form.title || !form.message) return alert("Vui lòng nhập đủ thông tin!");

    try {
      await axios.post('http://localhost:3000/api/notifications/send', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Đã gửi thông báo thành công!");
      setForm({ ...form, title: '', message: '' }); // Reset form
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2563eb' }}>🔔 Gửi Thông Báo</h2>

      <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* 1. Chọn Người Nhận */}
          <div>
            <label style={labelStyle}>Người nhận:</label>
            <select 
              style={inputStyle} 
              value={form.user_id} 
              onChange={e => setForm({...form, user_id: e.target.value})}
            >
              <option value="">-- Chọn người nhận --</option>
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  [{u.role_label}] {u.full_name} ({u.phone})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Tiêu đề */}
          <div>
            <label style={labelStyle}>Tiêu đề:</label>
            <input 
              style={inputStyle} 
              placeholder="VD: Thông báo khẩn" 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* 3. Loại tin */}
          <div>
            <label style={labelStyle}>Loại tin:</label>
            <select 
              style={inputStyle} 
              value={form.type} 
              onChange={e => setForm({...form, type: e.target.value})}
            >
              <option value="info">ℹ️ Thông tin thường</option>
              <option value="alert">⚠️ Cảnh báo/Khẩn cấp</option>
              <option value="reminder">⏰ Nhắc nhở</option>
            </select>
          </div>

          {/* 4. Nội dung */}
          <div>
            <label style={labelStyle}>Nội dung chi tiết:</label>
            <textarea 
              style={{...inputStyle, height: '100px', resize: 'vertical'}} 
              placeholder="Nhập nội dung tin nhắn..." 
              value={form.message} 
              onChange={e => setForm({...form, message: e.target.value})}
            />
          </div>

          <button type="submit" style={btnStyle}>📤 Gửi Ngay</button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { fontWeight: '500', marginBottom: '5px', display: 'block', color: '#475569' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' };
const btnStyle = { padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default NotificationManager;