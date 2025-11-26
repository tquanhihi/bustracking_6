const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import pool kết nối database

const app = express();
const PORT = 3000; // Cổng cho API Backend

// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Cho phép đọc JSON từ request body

// =========================================================
//                  API CHO TÀI XẾ (DRIVERS)
// Cấu trúc bảng: driver_id (PK), full_name, phone, status, email
// =========================================================

// --- 1. Lấy danh sách Tài xế (READ) ---
app.get('/api/drivers', async (req, res) => {
    try {
        const sql = `
            SELECT 
                driver_id AS id, 
                full_name AS name, 
                phone, 
                status,
                email
            FROM drivers
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách tài xế:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// --- 2. Thêm Tài xế (CREATE) ---
app.post('/api/drivers', async (req, res) => {
    // Các trường dữ liệu: full_name, phone; status và email là tùy chọn
    const { name, phone, status, email } = req.body; 
    console.log('[POST /api/drivers] Payload:', req.body);
    if (!name || !phone) {
        return res.status(400).json({ message: 'Thiếu tên hoặc số điện thoại.' });
    }
    const finalStatus = status || 'active';
    try {
        const sql = 'INSERT INTO drivers (full_name, phone, status, email) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [name, phone, finalStatus, email || null]);
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Thêm tài xế thành công' 
        });
    } catch (error) {
        console.error('Lỗi khi thêm tài xế:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// --- 3. Cập nhật Tài xế (UPDATE) ---
app.put('/api/drivers/:id', async (req, res) => {
    // ID trong route là driver_id
    const { id } = req.params; 
    const { name, phone, status, email } = req.body;
    console.log('[PUT /api/drivers/:id] Payload:', req.body);
    if (!name || !phone) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết để cập nhật.' });
    }

    const finalStatus = status || 'active';

    try {
        const sql = 'UPDATE drivers SET full_name = ?, phone = ?, status = ?, email = ? WHERE driver_id = ?';
        const [result] = await db.query(sql, [name, phone, finalStatus, email || null, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy Tài xế để cập nhật.' });
        }
        
        res.json({ message: 'Cập nhật tài xế thành công' });
    } catch (error) {
        console.error('Lỗi khi cập nhật tài xế:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// --- 4. Xóa Tài xế (DELETE) ---
app.delete('/api/drivers/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const sql = 'DELETE FROM drivers WHERE driver_id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy Tài xế để xóa.' });
        }

        res.json({ message: 'Xóa tài xế thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa tài xế:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// =========================================================
//                  API CHO PHỤ HUYNH (PARENTS)
// Cấu trúc bảng: parent_id (PK), full_name, phone, cccd, student_name, email
// =========================================================

// --- 5. Lấy danh sách Phụ huynh (READ) ---
app.get('/api/parents', async (req, res) => {
    try {
        const sql = `
            SELECT 
                parent_id AS id, 
                full_name AS name, 
                phone, 
                cccd, 
                student_name AS student, 
                email
            FROM parents
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách phụ huynh:', error);
        res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
});

// --- 6. Thêm Phụ huynh (CREATE) ---
app.post('/api/parents', async (req, res) => {
    // Các trường dữ liệu cần thiết: full_name, phone, student_name, cccd, email
    const { name, phone, student, cccd, email } = req.body; 
    
    if (!name || !phone || !student) {
        return res.status(400).json({ message: 'Thiếu tên, số điện thoại hoặc tên học sinh.' });
    }
    
    try {
        const sql = 'INSERT INTO parents (full_name, phone, student_name, cccd, email) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [name, phone, student, cccd, email]);
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Thêm phụ huynh thành công' 
        });
    } catch (error) {
        console.error('Lỗi khi thêm phụ huynh:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// --- 7. Cập nhật Phụ huynh (UPDATE) ---
app.put('/api/parents/:id', async (req, res) => {
    // ID trong route là parent_id
    const { id } = req.params;
    const { name, phone, student, cccd, email } = req.body;
    
    if (!name || !phone || !student) {
        return res.status(400).json({ message: 'Thiếu thông tin cần thiết để cập nhật.' });
    }

    try {
        const sql = 'UPDATE parents SET full_name = ?, phone = ?, student_name = ?, cccd = ?, email = ? WHERE parent_id = ?';
        const [result] = await db.query(sql, [name, phone, student, cccd, email, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy Phụ huynh để cập nhật.' });
        }
        
        res.json({ message: 'Cập nhật phụ huynh thành công' });
    } catch (error) {
        console.error('Lỗi khi cập nhật phụ huynh:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// --- 8. Xóa Phụ huynh (DELETE) ---
app.delete('/api/parents/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const sql = 'DELETE FROM parents WHERE parent_id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy Phụ huynh để xóa.' });
        }

        res.json({ message: 'Xóa phụ huynh thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa phụ huynh:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});


// =========================================================
//                  KHỞI ĐỘNG SERVER
// =========================================================
app.listen(PORT, () => {
    console.log(`Backend Server đang chạy trên cổng ${PORT}`);
});

// =========================================================
//                  API CHO XE BUÝT (BUSES)
// Cấu trúc bảng: bus_id (PK), plate_no, run, status
// =========================================================

// Lấy danh sách buses
app.get('/api/buses', async (req, res) => {
    try {
        const sql = `SELECT bus_id AS id, plate_no AS plate, run, status FROM buses`;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách buses:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Thêm bus
app.post('/api/buses', async (req, res) => {
    const { plate, run, status } = req.body;
    console.log('[POST /api/buses] Payload:', req.body);
    if (!plate || !run) return res.status(400).json({ message: 'Thiếu biển số hoặc tuyến chạy.' });
    try {
        const sql = 'INSERT INTO buses (plate_no, run, status) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [plate, run, status || 'active']);
        res.status(201).json({ id: result.insertId, message: 'Thêm xe buýt thành công' });
    } catch (err) {
        console.error('Lỗi khi thêm bus:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Cập nhật bus
app.put('/api/buses/:id', async (req, res) => {
    const { id } = req.params;
    const { plate, run, status } = req.body;
    console.log('[PUT /api/buses/:id] Payload:', req.body);
    if (!plate || !run) return res.status(400).json({ message: 'Thiếu biển số hoặc tuyến chạy.' });
    try {
        const sql = 'UPDATE buses SET plate_no = ?, run = ?, status = ? WHERE bus_id = ?';
        const [result] = await db.query(sql, [plate, run, status || 'active', id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy xe để cập nhật.' });
        res.json({ message: 'Cập nhật xe thành công' });
    } catch (err) {
        console.error('Lỗi khi cập nhật bus:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Xóa bus
app.delete('/api/buses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'DELETE FROM buses WHERE bus_id = ?';
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy xe để xóa.' });
        res.json({ message: 'Xóa xe thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa bus:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// =========================================================
//                  API CHO TUYẾN (ROUTES)
// Cấu trúc bảng: route_id (PK), route_name, description, estimated_duration_minutes, created_at
// =========================================================

app.get('/api/routes', async (req, res) => {
    try {
        const sql = `SELECT route_id AS id, route_name AS name, description, estimated_duration_minutes AS duration, created_at FROM routes`;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách routes:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

app.post('/api/routes', async (req, res) => {
    const { name, description, duration } = req.body;
    console.log('[POST /api/routes] Payload:', req.body);
    if (!name) return res.status(400).json({ message: 'Thiếu tên tuyến.' });
    try {
        const sql = 'INSERT INTO routes (route_name, description, estimated_duration_minutes) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [name, description || null, duration || null]);
        res.status(201).json({ id: result.insertId, message: 'Thêm tuyến thành công' });
    } catch (err) {
        console.error('Lỗi khi thêm route:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

app.put('/api/routes/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, duration } = req.body;
    console.log('[PUT /api/routes/:id] Payload:', req.body);
    if (!name) return res.status(400).json({ message: 'Thiếu tên tuyến.' });
    try {
        const sql = 'UPDATE routes SET route_name = ?, description = ?, estimated_duration_minutes = ? WHERE route_id = ?';
        const [result] = await db.query(sql, [name, description || null, duration || null, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy tuyến để cập nhật.' });
        res.json({ message: 'Cập nhật tuyến thành công' });
    } catch (err) {
        console.error('Lỗi khi cập nhật route:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

app.delete('/api/routes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'DELETE FROM routes WHERE route_id = ?';
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy tuyến để xóa.' });
        res.json({ message: 'Xóa tuyến thành công' });
    } catch (err) {
        console.error('Lỗi khi xóa route:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// =========================================================
//                  API CHO LỊCH TRÌNH (SCHEDULES)
// Cấu trúc bảng: schedule_id (PK varchar), run (varchar), driver_id (bigint), shift (varchar)
// =========================================================
// Small middleware to log incoming requests to schedules endpoints
app.use('/api/schedules', (req, res, next) => {
    try {
        console.log(`[SCHEDULES REQUEST] ${req.method} ${req.originalUrl} query=${JSON.stringify(req.query)} body=${JSON.stringify(req.body)}`);
    } catch (e) {
        console.log('[SCHEDULES REQUEST] (unable to stringify request body)', e && e.message);
    }
    next();
});

app.get('/api/schedules', async (req, res) => {
    try {
        // Thêm schedule_date vào SELECT
        const sql = `SELECT schedule_id AS id, schedule_date, run, driver_id AS driver, bus_id AS bus, shift FROM schedules`;
        const [rows] = await db.query(sql);
        console.log('[GET /api/schedules] rows returned:', Array.isArray(rows) ? rows.length : typeof rows);
        res.json(rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách schedules:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
app.post('/api/schedules', async (req, res) => {
    // Thêm schedule_date vào destructuring
    const { schedule_id, schedule_date, run, driver_id, bus_id, shift } = req.body;
    console.log('[POST /api/schedules] Received payload:');
    console.log('  schedule_id:', schedule_id, 'type:', typeof schedule_id);
    console.log('  schedule_date:', schedule_date, 'type:', typeof schedule_date);
    console.log('  run:', run, 'type:', typeof run);
    console.log('  driver_id:', driver_id, 'type:', typeof driver_id);
    console.log('  bus_id:', bus_id, 'type:', typeof bus_id);
    console.log('  shift:', shift, 'type:', typeof shift);

    // Thêm validation cho schedule_date nếu cần
    if (!schedule_id || !schedule_date || !run || !driver_id) {
        console.warn('[POST /api/schedules] Missing required fields.');
        return res.status(400).json({ message: 'Thiếu schedule_id/schedule_date/run/driver_id.' });
    }

    try {
        // Thêm schedule_date vào INSERT
        const sql = 'INSERT INTO schedules (schedule_id, schedule_date, run, driver_id, bus_id, shift) VALUES (?, ?, ?, ?, ?, ?)';
        const params = [schedule_id, schedule_date, run, driver_id, bus_id || null, shift || null];
        console.log('[POST /api/schedules] Executing SQL:', sql, 'params:', params);
        const [result] = await db.query(sql, params);
        console.log('[POST /api/schedules] DB result:', result);
        res.status(201).json({ id: schedule_id, message: 'Thêm lịch thành công' });
    } catch (err) {
        console.error('Lỗi khi thêm schedule:', err && err.message, err);
        if (err && err.sqlMessage) console.error('SQL Message:', err.sqlMessage);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
app.put('/api/schedules/:id', async (req, res) => {
    const { id } = req.params;
    // Thêm schedule_date vào destructuring
    const { schedule_date, run, driver_id, bus_id, shift } = req.body;
    console.log('[PUT /api/schedules/:id] id:', id);
    console.log('  schedule_date:', schedule_date, 'type:', typeof schedule_date);
    console.log('  run:', run, 'type:', typeof run);
    console.log('  driver_id:', driver_id, 'type:', typeof driver_id);
    console.log('  bus_id:', bus_id, 'type:', typeof bus_id);
    console.log('  shift:', shift, 'type:', typeof shift);

    // Thêm validation cho schedule_date nếu cần
    if (!schedule_date || !run || !driver_id) {
        console.warn('[PUT /api/schedules/:id] Missing required fields.');
        return res.status(400).json({ message: 'Thiếu schedule_date/run hoặc driver_id.' });
    }
    try {
        // Thêm schedule_date vào UPDATE
        const sql = 'UPDATE schedules SET schedule_date = ?, run = ?, driver_id = ?, bus_id = ?, shift = ? WHERE schedule_id = ?';
        const params = [schedule_date, run, driver_id, bus_id || null, shift || null, id];
        console.log('[PUT /api/schedules/:id] Executing SQL:', sql, 'params:', params);
        const [result] = await db.query(sql, params);
        console.log('[PUT /api/schedules/:id] DB result:', result);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy lịch để cập nhật.' });
        res.json({ message: 'Cập nhật lịch thành công' });
    } catch (err) {
        console.error('Lỗi khi cập nhật schedule:', err && err.message, err);
        if (err && err.sqlMessage) console.error('SQL Message:', err.sqlMessage);
        res.status(500).json({ message: 'Lỗi server' });
    }
});
