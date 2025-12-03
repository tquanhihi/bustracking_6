import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Giả lập độ trễ nhẹ để tạo hiệu ứng mượt mà
      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await axios.post('http://localhost:3000/api/auth/login', {
        phone,
        password
      });

      if (res.data.success) {
        // --- QUAN TRỌNG: ĐÃ BỎ ĐOẠN CHECK ROLE 'ADMIN' ĐỂ AI CŨNG VÀO ĐƯỢC ---
        
        // Lưu thông tin
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // Báo cho App.jsx biết để chuyển hướng
        onLoginSuccess(res.data.token);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Kết nối thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background trang trí */}
      <div style={{...bgCircle, top: '10%', left: '20%', background: 'rgba(255, 255, 255, 0.1)'}}></div>
      <div style={{...bgCircle, bottom: '10%', right: '20%', background: 'rgba(255, 255, 255, 0.15)', width: 200, height: 200}}></div>

      <div className="login-box" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* HEADER: Đổi tên thành PORTAL chung */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '50px', marginBottom: '10px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
            🚍
          </div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            SMART SCHOOL BUS
          </h2>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>
            Cổng thông tin điện tử & Giám sát
          </p>
        </div>
        
        {/* THÔNG BÁO LỖI */}
        {error && (
          <div style={{ 
            background: '#fef2f2', color: '#ef4444', padding: '12px', 
            borderRadius: '8px', fontSize: '13px', marginBottom: '20px', 
            border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={labelStyle}>Số điện thoại</label>
            <div style={inputWrapper}>
              <span style={{ fontSize: '18px', paddingLeft: '12px', opacity: 0.5 }}>📱</span>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
                placeholder="Nhập số điện thoại..."
                autoFocus
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '25px', textAlign: 'left' }}>
            <label style={labelStyle}>Mật khẩu</label>
            <div style={inputWrapper}>
              <span style={{ fontSize: '18px', paddingLeft: '12px', opacity: 0.5 }}>🔒</span>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '14px', background: loading ? '#94a3b8' : '#4f46e5', 
              color: 'white', border: 'none', borderRadius: '10px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', fontSize: '15px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
            }}
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        {/* FOOTER */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Dành cho Quản lý, Tài xế và Phụ huynh.<br/>
            Quên mật khẩu? Liên hệ: <b>0909.123.456</b>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' };
const inputWrapper = { display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', overflow: 'hidden' };
const inputStyle = { width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#334155' };
const bgCircle = { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%' };

export default Login;