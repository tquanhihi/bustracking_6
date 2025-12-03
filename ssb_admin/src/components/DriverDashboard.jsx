import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const DriverDashboard = ({ user, onLogout }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [students, setStudents] = useState([]);
  const [isDriving, setIsDriving] = useState(false);
  
  // Lấy token an toàn
  const token = localStorage.getItem('token');
  const socketRef = useRef(null);

  // --- LỚP BẢO VỆ 1: Kiểm tra user trước khi render ---
  if (!user) {
    return (
      <div style={{textAlign: 'center', marginTop: 50}}>
        <h3>Đang tải thông tin tài xế...</h3>
        <button onClick={onLogout}>Đăng xuất</button>
      </div>
    );
  }

  // --- LOGIC KẾT NỐI ---
  useEffect(() => {
    socketRef.current = io('http://localhost:3000');
    
    // Chỉ gọi API nếu có token
    if (token) {
      fetchSchedules();
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchSchedules = () => {
    axios.get('http://localhost:3000/api/schedules/driver/me', { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => {
      // Kiểm tra dữ liệu trả về có phải mảng không
      if (res.data && Array.isArray(res.data.data)) {
        setSchedules(res.data.data);
      } else {
        setSchedules([]);
      }
    })
    .catch(err => console.error("Lỗi tải lịch trình:", err));
  };

  const handleSelectTrip = (trip) => {
    axios.get(`http://localhost:3000/api/schedules/${trip.schedule_id}/students`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => {
      setStudents(res.data.data || []);
      setSelectedTrip(trip);
      if (socketRef.current) {
        socketRef.current.emit('join_trip', { schedule_id: trip.schedule_id });
      }
    })
    .catch(err => alert("Lỗi tải danh sách học sinh"));
  };

  const handleAttendance = async (studentId, status) => {
    try {
      await axios.put('http://localhost:3000/api/tracking/attendance', {
        schedule_id: selectedTrip.schedule_id, student_id: studentId, status
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
    } catch (err) { alert("Lỗi kết nối server"); }
  };

  const handleReport = (type) => {
    if (socketRef.current) {
      socketRef.current.emit('driver_report_incident', {
        schedule_id: selectedTrip.schedule_id,
        type, 
        description: type === 'traffic' ? 'Kẹt xe nghiêm trọng' : 'Xe gặp sự cố kỹ thuật'
      });
      alert("🚨 Đã gửi báo cáo sự cố về trung tâm!");
    }
  };

  // Logic lái xe giả lập
  useEffect(() => {
    let interval;
    if (isDriving && selectedTrip && socketRef.current) {
      let lat = 10.762622; let lng = 106.660172;
      interval = setInterval(() => {
        lat += 0.00015; lng += 0.00015;
        socketRef.current.emit('driver_send_location', {
          schedule_id: selectedTrip.schedule_id, lat, lng, speed: Math.floor(Math.random()*20 + 20)
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isDriving, selectedTrip]);

  // --- GIAO DIỆN ---
  return (
    <div className="mobile-wrapper" style={{background: '#f8fafc'}}>
      
      {/* HEADER MOBILE */}
      <div className="mobile-header" style={{padding: '20px 25px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            {/* Avatar chữ cái đầu của tên */}
            <div style={{width: 45, height: 45, borderRadius: '50%', background: 'white', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18}}>
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div>
              <div style={{fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Tài xế</div>
              <div style={{fontSize: 16, fontWeight: '700'}}>{user.full_name || 'Không tên'}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{background:'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border:'none', color:'white', padding:'8px 16px', borderRadius: '20px', cursor:'pointer', fontSize:12, fontWeight: '600', transition: '0.2s'}}>Thoát</button>
        </div>
      </div>

      <div className="mobile-content" style={{padding: '20px'}}>
        {!selectedTrip ? (
          // MÀN HÌNH 1: DANH SÁCH LỊCH TRÌNH
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h4 style={{margin: 0, color: '#64748b', fontSize: 13, fontWeight: '700', letterSpacing: '0.5px'}}>LỊCH CHẠY HÔM NAY</h4>
              <span style={{background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 'bold'}}>{new Date().toLocaleDateString('vi-VN')}</span>
            </div>

            {schedules.length === 0 ? (
              <div style={{textAlign:'center', color:'#94a3b8', marginTop: 60}}>
                <div style={{fontSize: 60, marginBottom: 10}}>😴</div>
                <p>Hôm nay bác tài được nghỉ ngơi!</p>
                <p style={{fontSize: 12}}>(Hoặc chưa được phân công lịch)</p>
              </div>
            ) : 
              schedules.map(item => (
                <div 
                  key={item.schedule_id} 
                  onClick={() => handleSelectTrip(item)} 
                  className="mobile-card trip-card"
                  style={{cursor:'pointer', borderLeft: '5px solid #2563eb'}}
                >
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
                    <span style={{background:'#dbeafe', color:'#1e40af', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:'bold'}}>{item.route_name}</span>
                    <span style={{fontSize:12, fontWeight:'bold', color: item.status==='running'?'#16a34a':'#d97706'}}>
                      {item.status === 'running' ? '● ĐANG CHẠY' : '● CHỜ KHỞI HÀNH'}
                    </span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:15}}>
                    <div style={{width: 50, height: 50, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24}}>🚌</div>
                    <div>
                      <div style={{fontWeight:'700', fontSize:16, color: '#334155'}}>{item.license_plate}</div>
                      <div style={{fontSize:13, color:'#64748b', marginTop: 4}}>🕒 Xuất phát: <b style={{color: '#333'}}>{item.start_time}</b></div>
                    </div>
                  </div>
                  <div style={{marginTop: 15, borderTop: '1px dashed #e2e8f0', paddingTop: 10, textAlign: 'right', color: '#2563eb', fontWeight: '700', fontSize: 13}}>
                    CHẠM ĐỂ BẮT ĐẦU &rarr;
                  </div>
                </div>
              ))
            }
          </>
        ) : (
          // MÀN HÌNH 2: CHI TIẾT CHUYẾN XE
          <div style={{animation: 'fadeIn 0.3s'}}>
            <button 
              onClick={() => {setSelectedTrip(null); setIsDriving(false);}} 
              style={{background:'none', border:'none', color:'#64748b', marginBottom:15, cursor:'pointer', fontWeight:'600', display: 'flex', alignItems: 'center', gap: 5, padding: 0}}
            >
              ← Quay lại danh sách
            </button>
            
            {/* BẢNG ĐIỀU KHIỂN CHÍNH */}
            <div style={{background:'white', borderRadius:20, padding:25, boxShadow:'0 10px 30px -10px rgba(0,0,0,0.1)', textAlign:'center', marginBottom:25, border: '1px solid #f1f5f9'}}>
              <h2 style={{margin:'0 0 5px 0', color:'#1e293b', fontSize: 18}}>{selectedTrip.route_name}</h2>
              <p style={{margin:'0 0 20px 0', color:'#64748b', fontSize:13, fontWeight: 500}}>Xe: {selectedTrip.license_plate}</p>
              
              <button 
                className={`mobile-btn ${isDriving ? 'btn-danger' : 'btn-start'}`}
                style={{
                    height: '60px', fontSize: '18px',
                    background: isDriving ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: isDriving ? '0 10px 20px rgba(239, 68, 68, 0.3)' : '0 10px 20px rgba(16, 185, 129, 0.3)'
                }}
                onClick={() => setIsDriving(!isDriving)}
              >
                {isDriving ? (
                    <span style={{display: 'flex', alignItems: 'center', gap: 10}}>🛑 DỪNG LỘ TRÌNH</span>
                ) : (
                    <span style={{display: 'flex', alignItems: 'center', gap: 10}}>▶️ BẮT ĐẦU CHẠY</span>
                )}
              </button>

              <div style={{marginTop: 20, display: isDriving ? 'block' : 'none'}}>
                <div style={{display: 'flex', gap: 10}}>
                   <button onClick={() => handleReport('traffic')} style={{flex: 1, border:'1px solid #fbbf24', background:'#fffbeb', color:'#d97706', padding:'10px', borderRadius:12, cursor:'pointer', fontWeight: 'bold'}}>🚗 Kẹt Xe</button>
                   <button onClick={() => handleReport('breakdown')} style={{flex: 1, border:'1px solid #f87171', background:'#fef2f2', color:'#dc2626', padding:'10px', borderRadius:12, cursor:'pointer', fontWeight: 'bold'}}>🔧 Hỏng Xe</button>
                </div>
              </div>
            </div>

            {/* DANH SÁCH HỌC SINH */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                <h4 style={{margin: 0, color: '#64748b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase'}}>DANH SÁCH ĐIỂM DANH</h4>
                <span style={{background: '#f1f5f9', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 'bold', color: '#64748b'}}>{students.length} bé</span>
            </div>
            
            <div style={{background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9'}}>
              {students.map((s, idx) => (
                <div key={s.student_id} className="student-item" style={{transition: 'background 0.2s'}}>
                  <div style={{display:'flex', alignItems:'center'}}>
                    <div className="student-avatar" style={{
                        background: s.status === 'picked_up' ? '#dcfce7' : (s.status === 'dropped_off' ? '#dbeafe' : '#f1f5f9'),
                        color: s.status === 'picked_up' ? '#16a34a' : (s.status === 'dropped_off' ? '#2563eb' : '#64748b')
                    }}>
                        {s.full_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{fontWeight:'700', fontSize:14, color: '#334155'}}>{s.full_name}</div>
                      <div style={{fontSize:12, color:'#94a3b8', marginTop: 2}}>
                        {s.stop_name ? `📍 ${s.stop_name}` : `🏠 ${s.pickup_address || 'Chưa có địa chỉ'}`}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{display:'flex', gap: 8}}>
                    <button 
                      onClick={() => handleAttendance(s.student_id, 'picked_up')}
                      className={`check-btn pick ${s.status === 'picked_up' ? 'active' : ''}`}
                      style={{
                          opacity: s.status === 'dropped_off' ? 0.3 : 1,
                          background: s.status === 'picked_up' ? '#10b981' : 'white',
                          borderColor: s.status === 'picked_up' ? '#10b981' : '#e2e8f0',
                          color: s.status === 'picked_up' ? 'white' : '#cbd5e1'
                      }}
                      title="Đón lên xe"
                    >⬆️</button>
                    
                    <button 
                      onClick={() => handleAttendance(s.student_id, 'dropped_off')}
                      className={`check-btn drop ${s.status === 'dropped_off' ? 'active' : ''}`}
                      style={{
                          opacity: s.status === 'picked_up' ? 1 : (s.status === 'dropped_off' ? 1 : 0.3),
                          background: s.status === 'dropped_off' ? '#3b82f6' : 'white',
                          borderColor: s.status === 'dropped_off' ? '#3b82f6' : '#e2e8f0',
                          color: s.status === 'dropped_off' ? 'white' : '#cbd5e1',
                          cursor: s.status === 'picked_up' || s.status === 'dropped_off' ? 'pointer' : 'not-allowed'
                      }}
                      title="Trả xuống xe"
                      disabled={s.status === 'not_picked'}
                    >⬇️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;