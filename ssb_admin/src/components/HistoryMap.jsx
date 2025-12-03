import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix lỗi icon mặc định của Leaflet trong React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component con để tự động zoom bản đồ bao quát toàn bộ lộ trình
function FitBounds({ path }) {
  const map = useMap();
  useEffect(() => {
    if (path.length > 0) {
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50] }); // Zoom vừa khít lộ trình
    }
  }, [path, map]);
  return null;
}

const HistoryMap = ({ scheduleId }) => {
  const [path, setPath] = useState([]); // Mảng chứa các tọa độ [lat, lng]
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (scheduleId) {
      setLoading(true);
      // Gọi API lấy lịch sử (Bạn cần đảm bảo đã tạo API này ở Backend theo hướng dẫn trước)
      axios.get(`http://localhost:3000/api/tracking/history/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        // Chuyển đổi dữ liệu API thành format của Leaflet: [[lat1, lng1], [lat2, lng2]...]
        if (res.data.success && Array.isArray(res.data.data)) {
          const coords = res.data.data.map(log => [parseFloat(log.latitude), parseFloat(log.longitude)]);
          setPath(coords);
        }
      })
      .catch(err => console.error("Lỗi tải lịch sử lộ trình:", err))
      .finally(() => setLoading(false));
    }
  }, [scheduleId]);

  if (loading) return <div style={{textAlign: 'center', padding: 20}}>⏳ Đang tải dữ liệu lộ trình...</div>;

  if (path.length === 0) return (
    <div style={{
      height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: '#f8f9fa', border: '2px dashed #ccc', borderRadius: 12, color: '#888'
    }}>
      <p>📭 Chưa có dữ liệu lịch sử di chuyển cho chuyến này.</p>
    </div>
  );

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #ddd', marginTop: 10 }}>
      <MapContainer center={path[0]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Vẽ đường đi (Polyline) */}
        <Polyline positions={path} color="red" weight={5} opacity={0.7} />

        {/* Điểm Bắt đầu (Start) */}
        <Marker position={path[0]}>
          <Popup>🏁 Điểm xuất phát</Popup>
        </Marker>

        {/* Điểm Kết thúc (End) */}
        <Marker position={path[path.length - 1]}>
          <Popup>🛑 Điểm kết thúc hiện tại</Popup>
        </Marker>

        {/* Tự động căn chỉnh bản đồ */}
        <FitBounds path={path} />
      </MapContainer>
      
      <div style={{ padding: '10px', background: '#fff3cd', fontSize: '13px', color: '#856404', borderTop: '1px solid #ffeeba' }}>
        ℹ️ Hiển thị lại quãng đường xe đã đi qua dựa trên {path.length} điểm GPS được ghi nhận.
      </div>
    </div>
  );
};

export default HistoryMap;