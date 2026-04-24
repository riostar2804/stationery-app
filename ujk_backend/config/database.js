const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '172.26.80.1',
    user: 'admin',
    password: '12345',
    database:'db_ujk',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;