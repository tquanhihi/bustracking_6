import { useEffect, useState } from 'react';
import axios from 'axios';

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ 
    full_name: '', 
    parent_id: '', 
    class_name: '', 
    pickup_address: '' 
  });
  
  // State quản lý chế độ Sửa
  const [editingId, setEditingId] = useState(null);
  
  const token = localStorage.getItem('token');

  // Lấy danh sách học sinh
  const fetchStudents = () => {
    axios.get('http://localhost:3000/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStudents(res.data.data))
    .catch(err => console.error("Lỗi tải danh sách học sinh"));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Xử lý Gửi Form (Thêm hoặc Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.full_name || !form.parent_id) return alert("Vui lòng nhập Tên và ID Phụ huynh!");

    try {
      if (editingId) {
        // --- CẬP NHẬT ---
        await axios.put(`http://localhost:3000/api/students/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Đã cập nhật thông tin học sinh!");
        setEditingId(null);
      } else {
        // --- THÊM MỚI ---
        await axios.post('http://localhost:3000/api/students', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Thêm học sinh thành công!");
      }
      
      // Reset form
      setForm({ full_name: '', parent_id: '', class_name: '', pickup_address: '' });
      fetchStudents();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Chuyển sang chế độ Sửa
  const handleEdit = (s) => {
    setEditingId(s.student_id);
    setForm({
      full_name: s.full_name,
      parent_id: s.parent_id,
      class_name: s.class_name,
      pickup_address: s.pickup_address
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hủy chế độ Sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ full_name: '', parent_id: '', class_name: '', pickup_address: '' });
  };

  // Xóa học sinh
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ học sinh này không?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStudents();
    } catch (err) {
      alert("Lỗi khi xóa học sinh.");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- PHẦN 1: FORM NHẬP LIỆU --- */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: '28px' }}>🎓</div>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>
              {editingId ? '✏️ Chỉnh Sửa Hồ Sơ' : '✨ Tiếp Nhận Học Sinh Mới'}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Quản lý thông tin học sinh và liên kết phụ huynh</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
          {/* Hàng 1: Tên & Lớp */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Họ và Tên (*)</label>
              <input 
                placeholder="Ví dụ: Nguyễn Văn An" 
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Lớp</label>
              <input 
                placeholder="VD: 1A" 
                value={form.class_name}
                onChange={e => setForm({...form, class_name: e.target.value})}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Hàng 2: Phụ huynh & Địa chỉ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '25px' }}>
            <div>
              <label style={labelStyle}>ID Phụ Huynh (*)</label>
              <input 
                type="number"
                placeholder="Nhập ID User (VD: 4)" 
                value={form.parent_id}
                onChange={e => setForm({...form, parent_id: e.target.value})}
                style={inputStyle}
              />
              <p style={{fontSize: '11px', color: '#94a3b8', marginTop: '5px'}}>* ID của tài khoản Phụ huynh trong hệ thống</p>
            </div>
            <div>
              <label style={labelStyle}>Địa chỉ đón / trả</label>
              <input 
                placeholder="Số nhà, Tên đường, Quận..." 
                value={form.pickup_address}
                onChange={e => setForm({...form, pickup_address: e.target.value})}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Nút bấm */}
          <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" style={{...btnPrimary, background: editingId ? '#f97316' : '#2563eb'}}>
              {editingId ? '💾 Lưu Cập Nhật' : '+ Thêm Học Sinh'}
            </button>
            
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={btnCancel}>
                Hủy bỏ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- PHẦN 2: DANH SÁCH HỌC SINH --- */}
      <div style={{ ...cardStyle, marginTop: '25px', padding: '0' }}>
        <div style={{ padding: '15px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#334155' }}>Danh sách học sinh ({students.length})</h4>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Họ Tên</th>
              <th style={thStyle}>Lớp</th>
              <th style={thStyle}>Thông Tin Phụ Huynh</th>
              <th style={thStyle}>Địa Chỉ Đón</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#999'}}>Chưa có dữ liệu học sinh.</td></tr>
            ) : (
              students.map((s, idx) => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={tdStyle}>#{s.student_id}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#2563eb', fontSize: '15px' }}>{s.full_name}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle}>{s.class_name}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{fontWeight:'600', color:'#334155'}}>{s.parent_name}</div>
                    <div style={{fontSize:'12px', color:'#64748b'}}>📞 {s.parent_phone}</div>
                  </td>
                  <td style={{...tdStyle, fontSize:'13px', color:'#475569', maxWidth: '200px'}}>
                    {s.pickup_address}
                  </td>
                  <td style={tdStyle}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={() => handleEdit(s)} style={{...actionBtn, color: '#f59e0b', background: '#fff7ed'}}>
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(s.student_id)} style={{...actionBtn, color: '#ef4444', background: '#fef2f2'}}>
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

const badgeStyle = {
  background: '#e0e7ff',
  color: '#4338ca',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '700'
};

const actionBtn = {
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
  padding: '6px 12px',
  transition: '0.2s'
};

export default StudentManager;