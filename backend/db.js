const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1', // Hoặc IP của database server
    user: 'root',      // Thay bằng user MySQL của bạn
    password: '1234567890123wQ', // Thay bằng mật khẩu của bạn
    database: 'ssb', // Tên database của bạn
    port: 3307,
});

module.exports = pool;