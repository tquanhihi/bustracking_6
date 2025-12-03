import { useEffect, useState } from 'react';
import axios from 'axios';

const RoutesManager = () => {
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]); 
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  
  const [form, setForm] = useState({ route_name: '', start_point: '', end_point: '', estimated_duration: '60' });
  const [assignForm, setAssignForm] = useState({ stop_id: '', order_index: '', minutes_from_start: '' });

  const token = localStorage.getItem('token');

  // Load dữ liệu ban đầu
  useEffect(() => {
    fetchRoutes();
    fetchAllStops();
  }, []);

  const fetchRoutes = () => {
    axios.get('http://localhost:3000/api/routes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setRoutes(res.data.data));
  };

  const fetchAllStops = () => {
    axios.get('http://localhost:3000/api/stops', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAllStops(res.data.data));
  };

  // Khi bấm chọn Tuyến -> Load trạm của tuyến đó
  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    fetchRouteStops(route.route_id);
  };

  const fetchRouteStops = (routeId) => {
    axios.get(`http://localhost:3000/api/routes/${routeId}/stops`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => setRouteStops(res.data.data));
  };

  // 1. Tạo Tuyến Mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/routes', form, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Đã tạo tuyến thành công!");
      setForm({ route_name: '', start_point: '', end_point: '', estimated_duration: '60' });
      fetchRoutes();
    } catch (err) { alert("Lỗi tạo tuyến"); }
  };

  // 2. Gán Trạm vào Tuyến
  const handleAssignStop = async () => {
    if(!assignForm.stop_id || !assignForm.order_index) return alert("Vui lòng chọn trạm và thứ tự!");
    try {
      await axios.post('http://localhost:3000/api/routes/stops', {
        route_id: selectedRoute.route_id,
        ...assignForm
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchRouteStops(selectedRoute.route_id);
      setAssignForm({ ...assignForm, order_index: '', minutes_from_start: '' }); // Giữ lại stop_id để chọn tiếp nếu cần
    } catch(err) { alert("Lỗi: Có thể trạm này đã có trong tuyến."); }
  };

  // 3. Gỡ Trạm
  const handleRemoveStop = async (stopId) => {
    if(!window.confirm("Gỡ trạm này khỏi tuyến?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/routes/${selectedRoute.route_id}/stops/${stopId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchRouteStops(selectedRoute.route_id);
    } catch(err) { alert("Lỗi xóa trạm"); }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '85vh' }}>
      
      {/* CỘT TRÁI: DANH SÁCH TUYẾN */}
      <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: 20, overflowY: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h3 style={{borderBottom: '1px solid #eee', paddingBottom: 10, color: '#2563eb', margin: 0, marginBottom: 15}}>🛣️ Danh sách Tuyến</h3>
        
        {/* Form tạo nhanh */}
        <div style={{background: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0'}}>
            <input placeholder="Tên tuyến (VD: Tuyến 01)" value={form.route_name} onChange={e=>setForm({...form, route_name:e.target.value})} style={inputStyle} />
            <div style={{display:'flex', gap:5}}>
                <input placeholder="Điểm đầu" value={form.start_point} onChange={e=>setForm({...form, start_point:e.target.value})} style={inputStyle} />
                <input placeholder="Điểm cuối" value={form.end_point} onChange={e=>setForm({...form, end_point:e.target.value})} style={inputStyle} />
            </div>
            <button onClick={handleSubmit} style={{...btnPrimary, marginTop:5, width:'100%'}}>+ Tạo Tuyến Mới</button>
        </div>

        {routes.map(r => (
          <div 
            key={r.route_id} 
            onClick={() => handleSelectRoute(r)}
            style={{
              padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', borderRadius: 8, marginBottom: 5,
              background: selectedRoute?.route_id === r.route_id ? '#eff6ff' : 'white',
              borderLeft: selectedRoute?.route_id === r.route_id ? '4px solid #2563eb' : '4px solid transparent',
              transition: '0.2s'
            }}
          >
            <div style={{fontWeight:'bold', color:'#334155'}}>{r.route_name}</div>
            <div style={{fontSize:12, color:'#64748b', marginTop:3}}>📍 {r.start_point} ➝ 🏁 {r.end_point}</div>
          </div>
        ))}
      </div>

      {/* CỘT PHẢI: CHI TIẾT TRẠM */}
      <div style={{ flex: 2, background: 'white', borderRadius: 12, padding: 20, overflowY: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        {selectedRoute ? (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:15}}>
              <div>
                <h3 style={{margin:0, color:'#2563eb'}}>{selectedRoute.route_name}</h3>
                <span style={{fontSize:13, color:'#64748b'}}>Cấu hình lộ trình dừng đón</span>
              </div>
            </div>

            {/* Form Gán Trạm */}
            <div style={{marginTop: 20, background: '#fff7ed', padding: 15, borderRadius: 8, border: '1px solid #ffedd5'}}>
              <h4 style={{margin:'0 0 10px 0', color:'#c2410c'}}>➕ Thêm Trạm vào Tuyến này</h4>
              <div style={{display:'flex', gap:10, alignItems:'center', flexWrap: 'wrap'}}>
                 <select style={{flex: 2, minWidth: 200, padding:10, borderRadius:6, border:'1px solid #ddd'}} 
                         value={assignForm.stop_id} 
                         onChange={e=>setAssignForm({...assignForm, stop_id:e.target.value})}>
                    <option value="">-- Chọn Trạm từ DB --</option>
                    {allStops.map(s => <option key={s.stop_id} value={s.stop_id}>{s.name}</option>)}
                 </select>
                 <input type="number" placeholder="Thứ tự (1,2..)" style={{flex:1, minWidth: 80, padding:10, borderRadius:6, border:'1px solid #ddd'}}
                        value={assignForm.order_index} onChange={e=>setAssignForm({...assignForm, order_index:e.target.value})} />
                 <input type="number" placeholder="Phút thứ..." style={{flex:1, minWidth: 80, padding:10, borderRadius:6, border:'1px solid #ddd'}}
                        value={assignForm.minutes_from_start} onChange={e=>setAssignForm({...assignForm, minutes_from_start:e.target.value})} />
                 <button onClick={handleAssignStop} style={{padding:'10px 20px', background:'#f97316', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:'bold'}}>Thêm</button>
              </div>
              <p style={{fontSize:12, color:'#9a3412', margin:'8px 0 0 0'}}>* Nếu chưa có trạm trong danh sách, vui lòng vào menu "Trạm Dừng" để tạo mới.</p>
            </div>

            {/* Danh sách Trạm đã gán */}
            <div style={{marginTop: 20}}>
              <h4 style={{color:'#334155', marginBottom: 15}}>Lộ trình hiện tại ({routeStops.length} điểm dừng)</h4>
              {routeStops.length === 0 ? (
                <div style={{padding: 30, textAlign: 'center', color: '#999', border: '2px dashed #eee', borderRadius: 8}}>
                  Chưa có trạm nào được gán vào tuyến này.
                </div>
              ) : (
                <div style={{position:'relative', paddingLeft: 20}}>
                  {/* Đường kẻ dọc nối các trạm */}
                  <div style={{position:'absolute', left: 6, top: 15, bottom: 30, width: 2, background:'#e2e8f0'}}></div>
                  
                  {routeStops.map((stop) => (
                    <div key={stop.stop_id} style={{display:'flex', alignItems:'center', marginBottom: 15, position:'relative'}}>
                      <div style={{width: 14, height: 14, borderRadius: '50%', background: '#ef4444', border: '2px solid white', boxShadow: '0 0 0 2px #ef4444', marginRight: 15, zIndex: 1}}></div>
                      
                      <div style={{background:'#f8fafc', padding: 12, borderRadius: 8, flex: 1, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:'bold', color:'#334155'}}>
                            <span style={{background:'#e0f2fe', color:'#0369a1', padding:'2px 6px', borderRadius:4, marginRight:8, fontSize:11}}>#{stop.order_index}</span>
                            {stop.name}
                          </div>
                          <div style={{fontSize:12, color:'#64748b', marginTop: 2}}>Dự kiến đến: Phút thứ {stop.minutes_from_start || 0}</div>
                        </div>
                        <button onClick={() => handleRemoveStop(stop.stop_id)} style={{background:'#fee2e2', color:'#ef4444', border:'none', padding:'6px 12px', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:'bold'}}>Gỡ bỏ</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', flexDirection:'column'}}>
            <div style={{fontSize:40, marginBottom: 10}}>👈</div>
            <p>Chọn một tuyến đường bên trái để cấu hình trạm dừng</p>
          </div>
        )}
      </div>

    </div>
  );
};

const inputStyle = { width: '100%', padding: '8px', marginBottom: 5, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' };
const btnPrimary = { padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' };

export default RoutesManager;