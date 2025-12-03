import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import io from 'socket.io-client';
import axios from 'axios';

// --- CẤU HÌNH ICONS ---

// 1. Icon Xe Buýt (Hình ảnh sinh động)
const BusIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -40]
});

// 2. Icon Trạm Dừng (Chấm tròn đỏ)
const StopIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: #ef4444;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

// 3. Fix lỗi icon mặc định
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Kết nối Socket (1 lần duy nhất)
const socket = io('http://localhost:3000');

// Component phụ: Tự động Zoom
function ChangeView({ center, bounds }) {
  const map = useMap();
  
  // Ưu tiên Zoom theo danh sách trạm (Lộ trình)
  if (bounds && bounds.length > 0) {
    try {
      const latLngBounds = L.latLngBounds(bounds);
      map.fitBounds(latLngBounds, { padding: [50, 50] }); 
    } catch (e) {}
  } 
  // Nếu không có trạm, Zoom theo xe
  else if (center && Array.isArray(center) && center.length === 2) {
    map.setView(center);
  }
  return null;
}

const MapTracking = ({ scheduleId, routeId }) => {
  const [busPos, setBusPos] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [stops, setStops] = useState([]);       // Danh sách trạm
  const [routePath, setRoutePath] = useState([]); // Đường vẽ nối các trạm
  
  const token = localStorage.getItem('token');

  // 1. LẤY DANH SÁCH TRẠM (Chạy khi có routeId)
  useEffect(() => {
    if (routeId) {
      console.log(">> Đang tải trạm cho Route ID:", routeId);
      axios.get(`http://localhost:3000/api/routes/${routeId}/stops`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.success) {
          const rawStops = res.data.data;
          
          // Xử lý dữ liệu: Chuyển string sang number để Leaflet hiểu
          const processedStops = rawStops.map(s => ({
            ...s,
            latitude: parseFloat(s.latitude),
            longitude: parseFloat(s.longitude)
          }));

          setStops(processedStops);

          // Tạo đường nối (Polyline)
          const path = processedStops.map(s => [s.latitude, s.longitude]);
          setRoutePath(path);
          console.log(`>> Đã tải ${processedStops.length} trạm.`);
        }
      })
      .catch(err => console.error("Lỗi tải lộ trình:", err));
    } else {
      console.warn(">> Không có Route ID để tải trạm!");
      setStops([]);
      setRoutePath([]);
    }
  }, [routeId, token]);

  // 2. REAL-TIME TRACKING XE
  useEffect(() => {
    if (!scheduleId) return;

    socket.emit('join_trip', { schedule_id: scheduleId });

    const handleLocationUpdate = (data) => {
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setBusPos([data.lat, data.lng]);
        setSpeed(data.speed || 0);
      }
    };
    
    const handleIncident = (data) => alert(`🚨 SỰ CỐ: ${data.message}`);

    socket.on('update_location', handleLocationUpdate);
    socket.on('incident_alert', handleIncident);

    return () => {
      socket.off('update_location', handleLocationUpdate);
      socket.off('incident_alert', handleIncident);
    };
  }, [scheduleId]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      <MapContainer center={[10.762622, 106.660172]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {/* LỚP 1: VẼ LỘ TRÌNH (Đường xanh nối các trạm) */}
        {routePath.length > 0 && (
          <Polyline 
            positions={routePath} 
            color="#3b82f6" weight={6} opacity={0.6} dashArray="10, 10" 
          />
        )}

        {/* LỚP 2: VẼ CÁC CHẤM ĐỎ (TRẠM DỪNG) */}
        {stops.map((s, index) => (
          <Marker key={s.stop_id} position={[s.latitude, s.longitude]} icon={StopIcon}>
            <Popup>
              <div style={{textAlign: 'center'}}>
                <b style={{color: '#ef4444'}}>🚏 Trạm {index + 1}</b><br/>
                <span style={{fontSize: '13px'}}>{s.name}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* LỚP 3: XE BUÝT */}
        {busPos && (
          <Marker position={busPos} icon={BusIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{textAlign:'center'}}>
                <b style={{color: '#2563eb'}}>🚌 Xe đang chạy</b><br/>
                {speed} km/h
              </div>
            </Popup>
          </Marker>
        )}

        <ChangeView center={busPos} bounds={routePath.length > 0 ? routePath : null} />
      </MapContainer>
      
      {/* BẢNG CHÚ THÍCH */}
      <div style={{
        position: 'absolute', top: 10, right: 10, 
        background: 'rgba(255, 255, 255, 0.95)', padding: '10px', 
        borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
        zIndex: 999, fontSize: '12px', border: '1px solid #eee'
      }}>
        <div style={{fontWeight:'bold', marginBottom:5}}>🗺️ Chú thích</div>
        <div style={{display:'flex', gap:5, marginBottom:3}}><span style={{color:'#3b82f6'}}>➖</span> Lộ trình</div>
        <div style={{display:'flex', gap:5, marginBottom:3}}>🔴 Trạm dừng ({stops.length})</div>
        <div style={{display:'flex', gap:5}}>🚌 Vị trí xe</div>
      </div>

      {!busPos && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', zIndex: 1000
        }}>
          📡 Đang chờ tín hiệu GPS...
        </div>
      )}
    </div>
  );
};

export default MapTracking;