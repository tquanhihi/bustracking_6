import { useEffect, useState } from 'react';
import axios from 'axios';

const ParentManager = () => {
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState({ full_name: '', phone: '', password: '123' });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem('token');

  // Lấy danh sách phụ huynh từ API
  const fetchParents = () => {
    axios.get('http://localhost:3000/api/users/parents', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setParents(res.data.data))
    .catch(err => console.error(err));
  };

  useEffect(() => { fetchParents(); }, []);

  // Xử lý Gửi Form (Thêm mới HOẶC Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.full_name || !form.phone) return alert("Vui lòng nhập đủ Họ tên và Số điện thoại!");

    try {
      if (editingId) {
        // --- CẬP NHẬT ---
        // Không gửi password khi update để tránh reset nhầm
        const { password, ...updateData } = form;
        await axios.put(`http://localhost:3000/api/users/${editingId}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Đã cập nhật thông tin phụ huynh!");
        setEditingId(null);
      } else {
        // --- THÊM MỚI ---
        await axios.post('http://localhost:3000/api/users/parents', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Tạo tài khoản phụ huynh thành công!");
      }

      // Reset form
      setForm({ full_name: '', phone: '', password: '123' });
      fetchParents();

    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Chuyển sang chế độ Sửa
  const handleEdit = (p) => {
    setEditingId(p.user_id);
    setForm({
      full_name: p.full_name,
      phone: p.phone,
      password: '' // Không hiện password cũ
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hủy chế độ Sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ full_name: '', phone: '', password: '123' });
  };

  // Xóa tài khoản
  const handleDelete = async (id) => {
    if(!window.confirm("CẢNH BÁO: Xóa tài khoản phụ huynh sẽ xóa luôn dữ liệu các học sinh liên quan. Bạn có chắc chắn không?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchParents();
    } catch (err) {
      alert("Lỗi khi xóa tài khoản.");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- PHẦN 1: FORM NHẬP LIỆU --- */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: '28px' }}>👨‍👩‍👧</div>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>
              {editingId ? '✏️ Chỉnh Sửa Tài Khoản' : '✨ Thêm Phụ Huynh Mới'}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Quản lý thông tin liên lạc và tài khoản truy cập</p>
          </div>
        </div>

        <div style={{
          padding: '25px', 
          backgroundColor: editingId ? '#fff7ed' : 'white',
          transition: 'background-color 0.3s ease'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            
            <div style={{flex: 2, minWidth: '250px'}}>
              <label style={labelStyle}>Họ và Tên (*)</label>
              <input 
                placeholder="VD: Trần Thị B" 
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                style={inputStyle}
              />
            </div>

            <div style={{flex: 1, minWidth: '150px'}}>
              <label style={labelStyle}>Số điện thoại (Login ID) (*)</label>
              <input 
                placeholder="VD: 0909..." 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                style={inputStyle}
              />
            </div>

            {/* Chỉ hiện ô nhập mật khẩu khi tạo mới (hoặc để trống khi sửa) */}
            {!editingId && (
              <div style={{flex: 1, minWidth: '150px'}}>
                <label style={labelStyle}>Mật khẩu</label>
                <input 
                  placeholder="Mặc định: 123" 
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{display: 'flex', gap: '10px'}}>
              <button type="submit" style={{...btnPrimary, background: editingId ? '#f97316' : '#2563eb'}}>
                {editingId ? '💾 Cập Nhật' : '+ Tạo Mới'}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={btnCancel}>
                  Hủy bỏ
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* --- PHẦN 2: DANH SÁCH PHỤ HUYNH --- */}
      <div style={{ ...cardStyle, marginTop: '25px', padding: '0' }}>
        <div style={{ padding: '15px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#334155' }}>Danh sách phụ huynh ({parents.length})</h4>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Họ Tên</th>
              <th style={thStyle}>Số Điện Thoại</th>
              <th style={thStyle}>Địa Chỉ (Tùy chọn)</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#999'}}>Chưa có dữ liệu phụ huynh.</td></tr>
            ) : (
              parents.map((p, idx) => (
                <tr key={p.user_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{...tdStyle, color: '#64748b'}}>#{p.user_id}</td>
                  <td style={{...tdStyle, fontWeight: '600', color: '#2563eb', fontSize: '15px'}}>{p.full_name}</td>
                  <td style={tdStyle}>
                    <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: '500', color: '#334155'}}>
                      📞 {p.phone}
                    </span>
                  </td>
                  <td style={{...tdStyle, color: '#64748b', fontSize: '13px'}}>
                    {p.address || '—'}
                  </td>
                  <td style={tdStyle}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button 
                        onClick={() => handleEdit(p)} 
                        style={{...actionBtn, color: '#f59e0b', background: '#fff7ed'}}
                        title="Sửa thông tin"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(p.user_id)} 
                        style={{...actionBtn, color: '#ef4444', background: '#fef2f2'}}
                        title="Xóa tài khoản"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STYLES (CSS-in-JS Consistent Theme) ---
const cardStyle = {
  background: 'white',
  borderRadius: '16px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  border: '1px solid #e2e8f0'
};

const headerStyle = {
  background: '#f8fafc',
  padding: '20px 25px',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  backgroundColor: '#fff'
};

const btnPrimary = {
  flex: 1,
  padding: '12px',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '15px',
  cursor: 'pointer',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.1s'
};

const btnCancel = {
  padding: '12px 25px',
  background: '#e2e8f0',
  color: '#475569',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const thStyle = { padding: '15px 20px', textAlign: 'left' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };

const actionBtn = {
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
  padding: '6px 12px',
  transition: '0.2s'
};

export default ParentManager;