-- Thiết lập để đảm bảo khóa ngoại có thể được tạo an toàn
SET FOREIGN_KEY_CHECKS = 0; 

-- Chọn/Tạo cơ sở dữ liệu (Schema)
-- CREATE DATABASE IF NOT EXISTS ssb;
USE ssb;

---------------------------------------------------------------------------------------------------------
-- 1. TẠO BẢNG routes (ROUTE_ID LÀ MÃ TUYẾN - VARCHAR)
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS routes;

CREATE TABLE routes (
    route_id VARCHAR(10) PRIMARY KEY, -- Mã tuyến thực tế (ví dụ: '03', '45')
    route_name VARCHAR(150) NOT NULL,
    description TEXT,
    estimated_duration_minutes INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DỮ LIỆU routes (10 tuyến TPHCM)
INSERT INTO routes (route_id, route_name, description, estimated_duration_minutes, created_at) VALUES
('03', 'Bến Thành - Thạnh Lộc', 'Lộ trình từ trung tâm Q.1 qua các quận Gò Vấp, đi qua sân bay Tân Sơn Nhất.', 90, '2025-11-24 16:30:00'),
('08', 'Đại học Quốc Gia - Bến xe Miền Tây', 'Kết nối Khu đô thị Đại học Quốc Gia với Bến xe Miền Tây, đi qua khu vực Quận 10.', 120, '2025-11-24 16:35:00'),
('10', 'Bến xe Miền Tây - KDL Suối Tiên', 'Tuyến chính đi qua Xa lộ Hà Nội, kết nối khu vực phía Tây với khu vực Thủ Đức và KDL Suối Tiên.', 100, '2025-11-24 16:40:00'),
('19', 'Bến Thành - KCX Linh Trung', 'Tuyến kết nối trung tâm thành phố với Khu chế xuất Linh Trung (Thủ Đức).', 80, '2025-11-24 16:45:00'),
('20', 'Bến Thành - Nhà Bè', 'Tuyến đi dọc theo trục đường Nguyễn Tất Thành, kết nối trung tâm Q.1 với huyện Nhà Bè.', 75, '2025-11-24 16:50:00'),
('27', 'Bến Thành - Âu Cơ - Bến xe An Sương', 'Kết nối trung tâm Q.1 với Bến xe An Sương (Q.12/Hóc Môn), đi qua các trục đường lớn Âu Cơ, Trường Chinh.', 95, '2025-11-24 16:55:00'),
('33', 'Bến xe An Sương - Suối Tiên - ĐH Quốc Gia', 'Tuyến huyết mạch phía Bắc, kết nối Bến xe An Sương với khu vực Làng Đại học.', 110, '2025-11-24 17:00:00'),
('45', 'Bến xe Quận 8 - Bến Thành - Bến xe Miền Đông', 'Tuyến đi qua các quận trung tâm, kết nối 3 bến xe lớn.', 105, '2025-11-24 17:05:00'),
('65', 'Bến Thành - CMT8 - Bến xe An Sương', 'Tuyến đi qua đường Cách Mạng Tháng Tám, là trục dọc quan trọng của thành phố.', 85, '2025-11-24 17:10:00'),
('152', 'KDC Trung Sơn - Sân bay Tân Sơn Nhất - Bến Thành', 'Tuyến ngắn, phục vụ hành khách đi Sân bay Tân Sơn Nhất, đi qua KDC Trung Sơn.', 60, '2025-11-24 17:15:00');

---------------------------------------------------------------------------------------------------------
-- 2. TẠO BẢNG drivers
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS drivers;
CREATE TABLE drivers (
    driver_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    status ENUM('active', 'inactive') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DỮ LIỆU drivers (30 tài xế)
INSERT INTO drivers (driver_id, full_name, phone, email, status, created_at) VALUES
(1, 'Nguyễn Văn Đạt', '0910000101', 'dat.nguyenvan@sbt.com', 'active', '2025-11-20 08:00:00'),
(2, 'Trần Thị Thu', '0910000102', 'thu.tranthi@sbt.com', 'active', '2025-11-20 08:15:00'),
(3, 'Lê Văn Minh', '0910000103', 'minh.levan@sbt.com', 'inactive', '2025-11-20 08:30:00'),
(4, 'Phạm Thị Hương', '0910000104', 'huong.phamthi@sbt.com', 'active', '2025-11-20 08:45:00'),
(5, 'Hoàng Văn Phúc', '0910000105', 'phuc.hoangvan@sbt.com', 'active', '2025-11-20 09:00:00'),
(6, 'Đặng Thị Mai', '0910000106', 'mai.dangthi@sbt.com', 'inactive', '2025-11-20 09:15:00'),
(7, 'Vũ Văn Hùng', '0910000107', 'hung.vuvan@sbt.com', 'active', '2025-11-20 09:30:00'),
(8, 'Bùi Thị Lan', '0910000108', 'lan.buithi@sbt.com', 'active', '2025-11-20 09:45:00'),
(9, 'Ngô Văn Sơn', '0910000109', 'son.ngovan@sbt.com', 'inactive', '2025-11-20 10:00:00'),
(10, 'Châu Thị Yến', '0910000110', 'yen.chauthi@sbt.com', 'active', '2025-11-20 10:15:00'),
(11, 'Mai Văn Kiên', '0910000111', 'kien.maivan@sbt.com', 'active', '2025-11-20 10:30:00'),
(12, 'Đỗ Thị Hồng', '0910000112', 'hong.dothi@sbt.com', 'inactive', '2025-11-20 10:45:00'),
(13, 'Cao Văn Lợi', '0910000113', 'loi.caovan@sbt.com', 'active', '2025-11-20 11:00:00'),
(14, 'Trịnh Thị Thảo', '0910000114', 'thao.trinhthi@sbt.com', 'active', '2025-11-20 11:15:00'),
(15, 'Lương Văn Tài', '0910000115', 'tai.luongvan@sbt.com', 'inactive', '2025-11-20 11:30:00'),
(16, 'Võ Thị Trâm', '0910000116', 'tram.vothi@sbt.com', 'active', '2025-11-20 11:45:00'),
(17, 'Phan Văn Quý', '0910000117', 'quy.phanvan@sbt.com', 'active', '2025-11-20 12:00:00'),
(18, 'Đinh Thị Nga', '0910000118', 'nga.dinhthi@sbt.com', 'inactive', '2025-11-20 12:15:00'),
(19, 'Lý Văn Trung', '0910000119', 'trung.lyvan@sbt.com', 'active', '2025-11-20 12:30:00'),
(20, 'Khuất Thị Hà', '0910000120', 'ha.khuatthi@sbt.com', 'active', '2025-11-20 12:45:00'),
(21, 'Nguyễn Văn Tiến', '0910000121', 'tien.nguyenvan@sbt.com', 'active', '2025-11-20 13:00:00'),
(22, 'Trần Thị Mỹ', '0910000122', 'my.tranthi@sbt.com', 'inactive', '2025-11-20 13:15:00'),
(23, 'Lê Văn Hiếu', '0910000123', 'hieu.levan@sbt.com', 'active', '2025-11-20 13:30:00'),
(24, 'Phạm Thị Ánh', '0910000124', 'anh.phamthi@sbt.com', 'active', '2025-11-20 13:45:00'),
(25, 'Hoàng Văn Sang', '0910000125', 'sang.hoangvan@sbt.com', 'inactive', '2025-11-20 14:00:00'),
(26, 'Đặng Thị Loan', '0910000126', 'loan.dangthi@sbt.com', 'active', '2025-11-20 14:15:00'),
(27, 'Vũ Văn Long', '0910000127', 'long.vuvan@sbt.com', 'active', '2025-11-20 14:30:00'),
(28, 'Bùi Thị Trinh', '0910000128', 'trinh.buithi@sbt.com', 'inactive', '2025-11-20 14:45:00'),
(29, 'Ngô Văn Tùng', '0910000129', 'tung.ngovan@sbt.com', 'active', '2025-11-20 15:00:00'),
(30, 'Châu Thị Thủy', '0910000130', 'thuy.chauthi@sbt.com', 'active', '2025-11-20 15:15:00');

---------------------------------------------------------------------------------------------------------
-- 3. TẠO BẢNG parents
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS parents;
CREATE TABLE parents (
    parent_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    cccd VARCHAR(20) UNIQUE,
    student_name VARCHAR(150), -- Tạm thời giữ lại, nhưng nên dùng bảng students
    email VARCHAR(150) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DỮ LIỆU parents (30 phụ huynh)
INSERT INTO parents (parent_id, full_name, phone, cccd, student_name, email, created_at) VALUES
(11, 'Nguyễn Văn A', '0901000011', '123456789011', 'Trần Thị Hằng', 'nguyenvana11@example.com', '2025-11-24 10:00:00'),
(12, 'Trần Thị B', '0901000012', '123456789012', 'Lê Văn Minh', 'tranthib12@example.com', '2025-11-24 10:05:00'),
(13, 'Lê Văn C', '0901000013', '123456789013', 'Phạm Thị Lan', 'levanc13@example.com', '2025-11-24 10:10:00'),
(14, 'Phạm Thị D', '0901000014', '123456789014', 'Nguyễn Văn Tèo', 'phamthid14@example.com', '2025-11-24 10:15:00'),
(15, 'Hoàng Văn E', '0901000015', '123456789015', 'Trần Văn Hùng', 'hoangvane15@example.com', '2025-11-24 10:20:00'),
(16, 'Đặng Thị F', '0901000016', '123456789016', 'Lê Thị Mai', 'dangthif16@example.com', '2025-11-24 10:25:00'),
(17, 'Vũ Văn G', '0901000017', '123456789017', 'Phạm Văn Đức', 'vuvang17@example.com', '2025-11-24 10:30:00'),
(18, 'Bùi Thị H', '0901000018', '123456789018', 'Nguyễn Đình Khôi', 'buithih18@example.com', '2025-11-24 10:35:00'),
(19, 'Ngô Văn I', '0901000019', '123456789019', 'Trần Minh Anh', 'ngovani19@example.com', '2025-11-24 10:40:00'),
(20, 'Châu Thị K', '0901000020', '123456789020', 'Lê Hoàng Nam', 'chauthik20@example.com', '2025-11-24 10:45:00'),
(21, 'Mai Văn L', '0901000021', '123456789021', 'Phạm Thảo Vy', 'maivanl21@example.com', '2025-11-24 10:50:00'),
(22, 'Đỗ Thị M', '0901000022', '123456789022', 'Nguyễn Bảo Trâm', 'dothim22@example.com', '2025-11-24 10:55:00'),
(23, 'Cao Văn N', '0901000023', '123456789023', 'Trần Gia Bảo', 'caovann23@example.com', '2025-11-24 11:00:00'),
(24, 'Trịnh Thị O', '0901000024', '123456789024', 'Lê Thanh Hải', 'trinhthio24@example.com', '2025-11-24 11:05:00'),
(25, 'Lương Văn P', '0901000025', '123456789025', 'Phạm Đình Quân', 'luongvanp25@example.com', '2025-11-24 11:10:00'),
(26, 'Võ Thị Q', '0901000026', '123456789026', 'Nguyễn Ngọc Diệp', 'vothiq26@example.com', '2025-11-24 11:15:00'),
(27, 'Phan Văn R', '0901000027', '123456789027', 'Trần Mỹ Linh', 'phanvanr27@example.com', '2025-11-24 11:20:00'),
(28, 'Đinh Thị S', '0901000028', '123456789028', 'Lê Văn Tiến', 'dinhthis28@example.com', '2025-11-24 11:25:00'),
(29, 'Lý Văn T', '0901000029', '123456789029', 'Phạm Huy Hoàng', 'lyvant29@example.com', '2025-11-24 11:30:00'),
(30, 'Khuất Thị U', '0901000030', '123456789030', 'Nguyễn Thanh Tâm', 'khuatthiu30@example.com', '2025-11-24 11:35:00'),
(31, 'Nguyễn Văn V', '0901000031', '123456789031', 'Trần Bảo An', 'nguyenvanv31@example.com', '2025-11-24 11:40:00'),
(32, 'Trần Thị W', '0901000032', '123456789032', 'Lê Minh Khang', 'tranthiw32@example.com', '2025-11-24 11:45:00'),
(33, 'Lê Văn X', '0901000033', '123456789033', 'Phạm Gia Hưng', 'levanx33@example.com', '2025-11-24 11:50:00'),
(34, 'Phạm Thị Y', '0901000034', '123456789034', 'Nguyễn Ngọc Hà', 'phamthiy34@example.com', '2025-11-24 11:55:00'),
(35, 'Hoàng Văn Z', '0901000035', '123456789035', 'Trần Quang Vinh', 'hoangvanz35@example.com', '2025-11-24 12:00:00'),
(36, 'Đặng Thị AA', '0901000036', '123456789036', 'Lê Văn Sang', 'dangthiaa36@example.com', '2025-11-24 12:05:00'),
(37, 'Vũ Văn BB', '0901000037', '123456789037', 'Phạm Thanh Trúc', 'vuvabb37@example.com', '2025-11-24 12:10:00'),
(38, 'Bùi Thị CC', '0901000038', '123456789038', 'Nguyễn Minh Nhật', 'buithicc38@example.com', '2025-11-24 12:15:00'),
(39, 'Ngô Văn DD', '0901000039', '123456789039', 'Trần Quốc Việt', 'ngovandd39@example.com', '2025-11-24 12:20:00'),
(40, 'Châu Thị EE', '0901000040', '123456789040', 'Lê Thị Kim', 'chauthee40@example.com', '2025-11-24 12:25:00');

---------------------------------------------------------------------------------------------------------
-- 4. TẠO BẢNG buses
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS buses;
CREATE TABLE buses (
    bus_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plate_no VARCHAR(30) UNIQUE NOT NULL,
    run VARCHAR(10) NOT NULL, -- Mã tuyến (route_id) mà xe này thường chạy
    status ENUM('active', 'maintenance', 'inactive') NOT NULL,
    
    FOREIGN KEY (run) REFERENCES routes(route_id)
);

-- DỮ LIỆU buses (30 xe buýt)
INSERT INTO buses (bus_id, plate_no, run, status) VALUES
(1, '51B-123.45', '03', 'active'),
(2, '50H-987.65', '03', 'active'),
(3, '29C-456.78', '08', 'maintenance'),
(4, '30F-111.22', '08', 'active'),
(5, '70K-333.44', '10', 'active'),
(6, '51B-678.90', '10', 'active'),
(7, '50H-246.80', '19', 'maintenance'),
(8, '29C-135.79', '19', 'active'),
(9, '30F-000.11', '20', 'active'),
(10, '70K-555.66', '20', 'inactive'),
(11, '51B-001.01', '27', 'active'),
(12, '50H-002.02', '27', 'active'),
(13, '51B-003.03', '33', 'maintenance'),
(14, '50H-004.04', '33', 'active'),
(15, '29C-005.05', '45', 'active'),
(16, '30F-006.06', '45', 'active'),
(17, '51B-007.07', '65', 'active'),
(18, '50H-008.08', '65', 'active'),
(19, '29C-009.09', '152', 'maintenance'),
(20, '30F-010.10', '152', 'inactive'),
(21, '51B-011.11', '03', 'active'),
(22, '50H-012.12', '08', 'active'),
(23, '51B-013.13', '10', 'active'),
(24, '50H-014.14', '19', 'maintenance'),
(25, '29C-015.15', '20', 'active'),
(26, '30F-016.16', '27', 'active'),
(27, '51B-017.17', '33', 'active'),
(28, '50H-018.18', '45', 'maintenance'),
(29, '29C-019.19', '65', 'active'),
(30, '30F-020.20', '152', 'active');

---------------------------------------------------------------------------------------------------------
-- 5. TẠO BẢNG schedules
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS schedules;
CREATE TABLE schedules (
    schedule_id VARCHAR(50) PRIMARY KEY, -- Khóa chính dạng chuỗi (ví dụ: w1022025)
    schedule_date VARCHAR(20),           -- Ngày lịch trình (VARCHAR)
    run VARCHAR(10) NOT NULL,            -- Mã tuyến (route_id)
    driver_id BIGINT NOT NULL,           -- Mã tài xế
    bus_id BIGINT NOT NULL,              -- Mã xe buýt
    shift VARCHAR(50) NOT NULL,          -- Ca làm việc (ví dụ: Morning, Afternoon)
    
    FOREIGN KEY (run) REFERENCES routes(route_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id)
);

-- DỮ LIỆU schedules (15 mẫu)
INSERT INTO schedules (schedule_id, schedule_date, run, driver_id, bus_id, shift) VALUES
('W490301AM', '2025-11-25', '03', 1, 1, 'Morning (05:00)'), 
('W490302PM', '2025-11-25', '03', 2, 2, 'Afternoon (13:00)'), 
('W490804AM', '2025-11-25', '08', 4, 3, 'Morning (05:30)'), 
('W490805PM', '2025-11-25', '08', 5, 4, 'Afternoon (14:00)'),
('W491007AM', '2025-11-25', '10', 7, 5, 'Morning (06:00)'), 
('W491008PM', '2025-11-25', '10', 8, 6, 'Afternoon (14:30)'),
('W491910AM', '2025-11-26', '19', 10, 7, 'Morning (06:30)'), 
('W491911PM', '2025-11-26', '19', 11, 8, 'Afternoon (15:00)'),
('W492713AM', '2025-11-26', '27', 13, 11, 'Morning (07:00)'), 
('W492714PM', '2025-11-26', '27', 14, 12, 'Afternoon (15:30)'),
('W493316FD', '2025-11-27', '33', 16, 13, 'Full-day'),
('W494517AM', '2025-11-27', '45', 17, 15, 'Morning (07:30)'),
('W496519PM', '2025-11-27', '65', 19, 17, 'Afternoon (16:00)'),
('W4915220FD', '2025-11-27', '152', 20, 19, 'Full-day');

---------------------------------------------------------------------------------------------------------
-- 6. TẠO BẢNG stops (Trạm dừng)
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS stops;

CREATE TABLE stops (
    stop_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(10) NOT NULL,
    stop_name VARCHAR(150) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    sequence_order INT NOT NULL, -- Thứ tự dừng trên tuyến
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id)
);

-- DỮ LIỆU stops (10 mẫu)
INSERT INTO stops (stop_id, route_id, stop_name, latitude, longitude, sequence_order) VALUES
(1, '03', 'Trạm Bến Thành', 10.7725000, 106.6975000, 1),
(2, '03', 'Trạm Công Viên Gia Định', 10.8034000, 106.6852000, 5),
(3, '08', 'Trạm ĐH Quốc Gia', 10.8800000, 106.7900000, 1),
(4, '08', 'Trạm Ngã Tư Thủ Đức', 10.8490000, 106.7560000, 8),
(5, '10', 'Trạm Bến Xe Miền Tây', 10.7500000, 106.6180000, 1),
(6, '19', 'Trạm Khu Chế Xuất Linh Trung', 10.8750000, 106.7750000, 15),
(7, '45', 'Trạm Bến Xe Miền Đông', 10.8050000, 106.7150000, 20),
(8, '45', 'Trạm Bến Xe Quận 8', 10.7350000, 106.6650000, 1),
(9, '65', 'Trạm Bến Xe An Sương', 10.8490000, 106.6020000, 25),
(10, '152', 'Trạm Sân Bay Tân Sơn Nhất', 10.8180000, 106.6570000, 5);

---------------------------------------------------------------------------------------------------------
-- 7. TẠO BẢNG students (Học sinh)
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS students;
CREATE TABLE students (
    student_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    parent_id BIGINT NOT NULL,
    stop_id BIGINT, -- Trạm dừng mặc định của học sinh
    grade VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES parents(parent_id),
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id)
);

-- DỮ LIỆU students (10 mẫu)
INSERT INTO students (student_id, full_name, parent_id, stop_id, grade, is_active) VALUES
(1, 'Trần Thị Hằng', 11, 1, 'Lớp 1A', TRUE),
(2, 'Lê Văn Minh', 12, 1, 'Lớp 2A', TRUE),
(3, 'Phạm Thị Lan', 13, 3, 'Lớp 3A', TRUE),
(4, 'Nguyễn Văn Tèo', 14, 4, 'Lớp 4A', FALSE),
(5, 'Trần Văn Hùng', 15, 5, 'Lớp 5A', TRUE),
(6, 'Lê Thị Mai', 16, 6, 'Lớp 6A', TRUE),
(7, 'Phạm Văn Đức', 17, 7, 'Lớp 7A', TRUE),
(8, 'Nguyễn Đình Khôi', 18, 8, 'Lớp 8A', TRUE),
(9, 'Trần Minh Anh', 19, 9, 'Lớp 9A', TRUE),
(10, 'Lê Hoàng Nam', 20, 10, 'Lớp 10A', TRUE);

---------------------------------------------------------------------------------------------------------
-- 8. TẠO BẢNG messages (Thông báo)
---------------------------------------------------------------------------------------------------------
DROP TABLE IF EXISTS messages;
CREATE TABLE messages (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT, -- ID người gửi (driver_id hoặc parent_id)
    recipient_id BIGINT, -- ID người nhận (driver_id hoặc parent_id)
    message_content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    type ENUM('driver_to_parent', 'parent_to_driver', 'system') NOT NULL
);

-- DỮ LIỆU messages (5 mẫu)
INSERT INTO messages (message_id, sender_id, recipient_id, message_content, type) VALUES
(1, 1, 11, 'Sáng nay xe 03 đến trễ 10 phút do tắc đường.', 'driver_to_parent'),
(2, 12, 1, 'Tài xế ơi, con tôi Lê Văn Minh hôm nay nghỉ học.', 'parent_to_driver'),
(3, NULL, NULL, 'Hệ thống sẽ cập nhật lịch trình mới vào 2025-11-30.', 'system'),
(4, 7, 15, 'Vui lòng xác nhận địa điểm đón/trả mới.', 'driver_to_parent'),
(5, 20, 10, 'Đã nhận thông báo của tài xế 20.', 'parent_to_driver');

-- Thiết lập lại sau khi hoàn thành
SET FOREIGN_KEY_CHECKS = 1;
