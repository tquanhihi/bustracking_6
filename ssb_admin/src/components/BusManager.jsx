import { useEffect, useState } from 'react';
import axios from 'axios';

const BusManager = () => {
  const [buses, setBuses] = useState([]);
  
  // State quản lý Form
  const [form, setForm] = useState({ license_plate: '', brand: '', capacity: '16', status: 'active' });
  
  // State quản lý chế độ Sửa (Lưu ID của xe đang sửa)
  const [editingId, setEditingId] = useState(null);
  
  const token = localStorage.getItem('token');

  // Lấy danh sách xe từ API
  const fetchBuses = () => {
    axios.get('http://localhost:3000/api/buses', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setBuses(res.data.data))
    .catch(err => console.error(err));
  };

  useEffect(() => { fetchBuses(); }, []);

  // Xử lý Gửi Form (Thêm mới HOẶC Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.license_plate) return alert("Biển số xe là bắt buộc!");

    try {
      if (editingId) {
        // --- TRƯỜNG HỢP SỬA (UPDATE) ---
        await axios.put(`http://localhost:3000/api/buses/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Đã cập nhật thông tin xe thành công!");
        setEditingId(null); // Thoát chế độ sửa
      } else {
        // --- TRƯỜNG HỢP THÊM MỚI (CREATE) ---
        await axios.post('http://localhost:3000/api/buses', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Thêm xe mới thành công!");
      }

      // Reset form về mặc định và tải lại danh sách
      setForm({ license_plate: '', brand: '', capacity: '16', status: 'active' });
      fetchBuses();

    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Khi bấm nút "Sửa" trên bảng
  const handleEdit = (bus) => {
    setEditingId(bus.bus_id); // Đánh dấu đang sửa xe này
    // Điền thông tin cũ vào form
    setForm({
      license_plate: bus.license_plate,
      brand: bus.brand,
      capacity: bus.capacity,
      status: bus.status
    });
    // Cuộn màn hình lên đầu để thấy form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Khi bấm nút "Hủy" chế độ sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ license_plate: '', brand: '', capacity: '16', status: 'active' });
  };

  // Xử lý Xóa xe
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa xe này không?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/buses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBuses();
    } catch (err) {
      alert("Không thể xóa xe này (Có thể xe đang có lịch trình hoặc đang hoạt động).");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- PHẦN 1: FORM NHẬP LIỆU --- */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: '28px' }}>🚌</div>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>
              {editingId ? '✏️ Chỉnh Sửa Thông Tin Xe' : '✨ Thêm Xe Mới'}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Quản lý đội xe và trạng thái hoạt động</p>
          </div>
        </div>

        <div style={{
          padding: '25px', 
          backgroundColor: editingId ? '#fff7ed' : 'white', // Đổi nền nhẹ khi sửa
          transition: 'background-color 0.3s ease'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
              
              <div>
                <label style={labelStyle}>Biển Số (*)</label>
                <input 
                  placeholder="VD: 59B-123.45" 
                  value={form.license_plate}
                  onChange={e => setForm({...form, license_plate: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Hiệu Xe</label>
                <input 
                  placeholder="VD: Hyundai Solati" 
                  value={form.brand}
                  onChange={e => setForm({...form, brand: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Số Chỗ Ngồi</label>
                <select 
                  value={form.capacity}
                  onChange={e => setForm({...form, capacity: e.target.value})}
                  style={inputStyle}
                >
                  <option value="16">16 Chỗ</option>
                  <option value="29">29 Chỗ</option>
                  <option value="45">45 Chỗ</option>
                </select>
              </div>

              {/* Chỉ hiện chọn trạng thái khi đang sửa */}
              {editingId && (
                <div>
                  <label style={labelStyle}>Trạng Thái</label>
                  <select 
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="active">🟢 Đang Hoạt Động</option>
                    <option value="maintenance">🟠 Đang Bảo Trì</option>
                    <option value="inactive">🔴 Ngưng Hoạt Động</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button type="submit" style={{...btnPrimary, background: editingId ? '#f97316' : '#2563eb'}}>
                {editingId ? '💾 Lưu Cập Nhật' : '+ Lưu Xe Mới'}
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

      {/* --- PHẦN 2: DANH SÁCH XE --- */}
      <div style={{ ...cardStyle, marginTop: '25px', padding: '0' }}>
        <div style={{ padding: '15px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#334155' }}>Đội xe hiện tại ({buses.length})</h4>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Biển Số</th>
              <th style={thStyle}>Hiệu Xe</th>
              <th style={thStyle}>Số Chỗ</th>
              <th style={thStyle}>Trạng Thái</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#999'}}>Chưa có dữ liệu xe.</td></tr>
            ) : (
              buses.map((b, idx) => (
                <tr key={b.bus_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{...tdStyle, color: '#64748b'}}>#{b.bus_id}</td>
                  <td style={{...tdStyle, fontWeight: '700', color: '#2563eb', fontSize: '15px'}}>{b.license_plate}</td>
                  <td style={tdStyle}>{b.brand}</td>
                  <td style={tdStyle}>{b.capacity} chỗ</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase',
                      background: b.status === 'active' ? '#dcfce7' : (b.status === 'maintenance' ? '#ffedd5' : '#fee2e2'),
                      color: b.status === 'active' ? '#166534' : (b.status === 'maintenance' ? '#c2410c' : '#991b1b')
                    }}>
                      {b.status === 'active' ? 'Hoạt động' : (b.status === 'maintenance' ? 'Bảo trì' : 'Ngưng')}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button 
                        onClick={() => handleEdit(b)} 
                        style={{...actionBtn, color: '#f59e0b', background: '#fff7ed'}}
                        title="Sửa thông tin"
                      >
                        Sửa
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(b.bus_id)} 
                        style={{...actionBtn, color: '#ef4444', background: '#fef2f2'}}
                        title="Xóa xe này"
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

export default BusManager;