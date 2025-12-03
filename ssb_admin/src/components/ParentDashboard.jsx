import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapTracking from './MapTracking';
import io from 'socket.io-client';

// --- HÀM TÍNH KHOẢNG CÁCH (Haversine Formula) ---
// Trả về khoảng cách (km) giữa 2 điểm GPS
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const ParentDashboard = ({ user, onLogout }) => {
  const [tripInfo, setTripInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State cho ETA (Thời gian dự kiến)
  const [eta, setEta] = useState(null); // phút
  const [distance, setDistance] = useState(null); // km
  
  const token = localStorage.getItem('token');
  const socketRef = useRef(null);

  // 1. TẢI THÔNG TIN CHUYẾN XE
  useEffect(() => {
    const fetchChildTrip = async () => {
      if (!user || !user.id || !token) return setLoading(false);

      try {
        // Lấy danh sách học sinh để tìm con mình
        const studentsRes = await axios.get('http://localhost:3000/api/students', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (studentsRes.data.success && Array.isArray(studentsRes.data.data)) {
          const myChild = studentsRes.data.data.find(s => String(s.parent_id) === String(user.id));

          if (myChild) {
            // Gọi API lấy vị trí xe của con
            const res = await axios.get(`http://localhost:3000/api/parent/bus-location/${myChild.student_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
              setTripInfo(res.data.data);
            } else {
              setErrorMsg(res.data.message || "Không tìm thấy thông tin chuyến xe.");
            }
          } else {
            setErrorMsg("Tài khoản chưa liên kết với học sinh nào.");
          }
        }
      } catch (err) {
        console.error("Lỗi:", err);
        setErrorMsg("Hiện tại xe chưa hoạt động.");
      } finally {
        setLoading(false);
      }
    };

    fetchChildTrip();
  }, [user, token]);

  // 2. KẾT NỐI SOCKET ĐỂ TÍNH ETA (Chạy song song với MapTracking)
  useEffect(() => {
    if (!tripInfo?.schedule_id) return;

    // Kết nối riêng để xử lý logic tính toán (MapTracking lo phần vẽ)
    socketRef.current = io('http://localhost:3000');
    socketRef.current.emit('join_trip', { schedule_id: tripInfo.schedule_id });

    socketRef.current.on('update_location', (data) => {
      // Kiểm tra nếu có tọa độ trạm đón
      if (tripInfo.stop_lat && tripInfo.stop_lng) {
        
        // Tính khoảng cách từ Xe -> Trạm
        const distKm = getDistanceFromLatLonInKm(data.lat, data.lng, tripInfo.stop_lat, tripInfo.stop_lng);
        setDistance(distKm.toFixed(1)); // Lưu khoảng cách (VD: 1.5 km)

        // Tính thời gian: t = s / v
        // Nếu xe chạy quá chậm hoặc dừng (< 5km/h), lấy tạm 20km/h để ước lượng
        const currentSpeed = data.speed > 5 ? data.speed : 20; 
        const timeMinutes = (distKm / currentSpeed) * 60;
        
        setEta(Math.ceil(timeMinutes)); // Làm tròn phút (VD: 4.2 -> 5 phút)
      }
    });

    return () => {
      if(socketRef.current) socketRef.current.disconnect();
    };
  }, [tripInfo]);

  return (
    <div className="mobile-wrapper" style={{background: '#eef2f6', position: 'relative'}}>
      
      {/* HEADER NỔI */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '15px 20px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
          <div style={{fontSize: 12, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px'}}>Phụ huynh</div>
          <div style={{fontSize: 18, fontWeight: 'bold'}}>{user?.full_name}</div>
        </div>
        
        <button 
          onClick={onLogout} 
          style={{
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)', color: 'white',
            padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
            fontSize: 12, fontWeight: '600'
          }}
        >
          Thoát
        </button>
      </div>

      {/* CONTENT */}
      <div style={{flex: 1, height: '100%', position: 'relative'}}>
        {loading ? (
          <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>
            <div className="spinner" style={{width: 20, height: 20, border: '3px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 1s infinite', margin: '0 auto 10px'}}></div>
            Đang tải...
          </div>
        ) : tripInfo ? (
          <>
            {/* BẢN ĐỒ */}
            <MapTracking scheduleId={tripInfo?.schedule_id} routeId={null} />
            
            {/* BOTTOM SHEET THÔNG TIN */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'white', 
              borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
              padding: '25px 20px 30px 20px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
              zIndex: 1000,
              animation: 'slideUp 0.4s ease-out'
            }}>
              
              {/* --- PHẦN MỚI: THANH ETA (THỜI GIAN DỰ KIẾN) --- */}
              {eta !== null && (
                <div style={{
                  background: eta < 5 ? '#dcfce7' : '#e0f2fe', 
                  color: eta < 5 ? '#166534' : '#0369a1',
                  padding: '15px', borderRadius: 12, marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: `1px solid ${eta < 5 ? '#86efac' : '#bae6fd'}`,
                  boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05)'
                }}>
                  <div style={{display:'flex', alignItems:'center', gap: 12}}>
                    <div style={{fontSize: 24}}>{eta < 5 ? '🏃' : '⏱️'}</div>
                    <div>
                      <div style={{fontWeight: '800', fontSize: 15}}>
                        {eta <= 1 ? 'XE SẮP ĐẾN NƠI!' : `Dự kiến đến: ${eta} phút`}
                      </div>
                      <div style={{fontSize: 12, opacity: 0.8}}>
                        Còn cách trạm: <b>{distance} km</b>
                      </div>
                    </div>
                  </div>
                  <div style={{fontWeight: '900', fontSize: 22}}>{eta}'</div>
                </div>
              )}
              {/* ----------------------------------------------- */}

              <h2 style={{margin: '0 0 15px 0', color: '#1e293b', fontSize: 18, display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontSize:14, background:'#f3f4f6', padding:'4px 8px', borderRadius:6}}>🚌</span>
                {tripInfo?.route_name}
              </h2>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
                 <div style={{background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9'}}>
                    <div style={{fontSize: 11, color: '#64748b', textTransform: 'uppercase'}}>TRẠM ĐÓN</div>
                    <div style={{fontWeight: 'bold', color: '#2563eb', marginTop: 2}}>{tripInfo.stop_name || 'Chưa rõ'}</div>
                 </div>
                 <div style={{background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9'}}>
                    <div style={{fontSize: 11, color: '#64748b', textTransform: 'uppercase'}}>BIỂN SỐ XE</div>
                    <div style={{fontWeight: 'bold', color: '#334155', marginTop: 2}}>{tripInfo.license_plate}</div>
                 </div>
              </div>

              {/* Thông tin tài xế nhỏ bên dưới */}
              <div style={{marginTop: 15, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5}}>
                 <span>👨‍✈️ Tài xế: <b>{tripInfo.driver_name}</b></span>
                 <span>•</span>
                 <span>📞 {tripInfo.driver_phone}</span>
              </div>

            </div>
          </>
        ) : (
          // Màn hình chờ
          <div style={{height:'100%', display:'flex', justifyContent:'center', alignItems:'center', color:'#94a3b8', flexDirection:'column'}}>
             <div style={{fontSize: 50, marginBottom: 10}}>😴</div>
             <p style={{fontWeight: 500}}>{errorMsg}</p>
             <p style={{fontSize: 12, marginTop: 5}}>Vui lòng quay lại vào giờ xe chạy.</p>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ParentDashboard;