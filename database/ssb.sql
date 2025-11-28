-- Lệnh này thiết lập cơ sở dữ liệu (Schema)
CREATE SCHEMA IF NOT EXISTS ssb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ssb;

-- --------------------------------------------------------
-- Bảng: buses
-- --------------------------------------------------------
CREATE TABLE buses (
  bus_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  plate_no VARCHAR(20) NOT NULL,
  run TINYINT(1) DEFAULT 0,
  driver_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: drivers
-- --------------------------------------------------------
CREATE TABLE drivers (
  driver_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  cccd VARCHAR(20) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: parents
-- --------------------------------------------------------
CREATE TABLE parents (
  parent_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  cccd VARCHAR(20) NOT NULL,
  student_name VARCHAR(150), -- Lưu ý: Cột này nên được xem xét loại bỏ trong thiết kế chuẩn.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: messages
-- --------------------------------------------------------
CREATE TABLE messages (
  message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_context TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  type ENUM('driver_to_parent','parent_to_driver') NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: routes
-- --------------------------------------------------------
CREATE TABLE routes (
  route_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(150) NOT NULL,
  description TEXT,
  estimated_duration_min INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: schedules
-- --------------------------------------------------------
CREATE TABLE schedules (
  schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  bus_id BIGINT NOT NULL,
  driver_id BIGINT NOT NULL,
  run TINYINT(1) DEFAULT 0,
  schedule_date VARCHAR(20) NOT NULL,
  shift VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: stops
-- --------------------------------------------------------
CREATE TABLE stops (
  stop_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(10) NOT NULL,
  stop_name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  sequence_order INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Bảng: students (Đã điều chỉnh theo các sửa đổi trước đó của bạn)
-- --------------------------------------------------------
CREATE TABLE students (
  student_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  pickup_stop_id BIGINT,
  dropoff_stop_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- --------------------------------------------------------
-- THIẾT LẬP CÁC KHÓA NGOẠI (FOREIGN KEY CONSTRAINTS)
-- --------------------------------------------------------

-- Khóa ngoại cho schedules
ALTER TABLE schedules
  ADD CONSTRAINT fk_schedule_route FOREIGN KEY (route_id) REFERENCES routes (route_id),
  ADD CONSTRAINT fk_schedule_bus FOREIGN KEY (bus_id) REFERENCES buses (bus_id),
  ADD CONSTRAINT fk_schedule_driver FOREIGN KEY (driver_id) REFERENCES drivers (driver_id);

-- Khóa ngoại cho buses
ALTER TABLE buses
  ADD CONSTRAINT fk_bus_driver FOREIGN KEY (driver_id) REFERENCES drivers (driver_id);

-- Khóa ngoại cho students
ALTER TABLE students
  ADD CONSTRAINT fk_student_parent FOREIGN KEY (parent_id) REFERENCES parents (parent_id),
  ADD CONSTRAINT fk_student_pickup_stop FOREIGN KEY (pickup_stop_id) REFERENCES stops (stop_id),
  ADD CONSTRAINT fk_student_dropoff_stop FOREIGN KEY (dropoff_stop_id) REFERENCES stops (stop_id);
