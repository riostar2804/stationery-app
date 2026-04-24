const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

//LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password ) {
        return res.status(400).json({ status: 'error', message: 'Incompleted Data'});
    }

    try {
        const query = 'SELECT id, users, password FROM tb_ujklogin WHERE users = ?';
        const [rows] = await pool.query(query, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Not Registered'})
        }
    
        const user = rows[0];

        const passMatch = await bcrypt.compare(password, user.password);

        if (passMatch) {
            const token = jwt.sign(
                { user_id: user.id, username: user.users }, 
                'SECRET', 
                { expiresIn: '1d' } 
            );

            res.json({
                status: 'success',
                message: 'Access Granted',
                data: {
                    token: token, 
                    user_id: user.id,
                    username: user.users
                }
            });
        } else {
            res.status(401).json({ status: 'error', message: 'Wrong Password!' });
        }
    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ status: 'error', message: "Server Failed"})
    }

});

app.get('/api/stationery', async (req, res) => {
    try {
        const query = `
            SELECT
                s.id,
                s.name,
                s.class_name,
                s.stock,
                u.users AS nama_master
            FROM tb_ujkstationery s
            JOIN tb_ujklogin u ON s.users_id = u.id`;

        const [rows] = await pool.query(query);

        res.json({
            status: 'success',
            message: "Success",
            data: rows
        });
    } catch (error) {
        console.error('Error while query:', error);
        res.status(500).json({
            status: 'error',
            message: 'Connection Failed',
            error: error.message
        });
    }
});

//CREATE
app.post('/api/stationery', async (req, res) => {
    const { users_id, name, class_name, stock } = req.body;

    if (!users_id || !name || !class_name) {
        return res.status(400).json({ status: 'error', message: 'Not Completed'})
    }

    try {
        const query = 'INSERT INTO tb_ujkstationery (users_id, name, class_name, stock) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(query, [users_id, name, class_name, stock]);

        res.json({
            status: 'success',
            message: `${name} success`,
            data: { id: result.insertId}
        });
    } catch (error) {
        console.error('Error name', error);
        res.status(500).json({ status: 'error', message: 'Failed'})
    }
});

//UPDATE
app.put('/api/stationery/:id', async (req, res) => {
    const nameId = req.params.id;
    const { name, class_name, stock } = req.body;

    try {
        const query = 'UPDATE tb_ujkstationery SET name = ?, class_name = ?, stock = ? WHERE id = ?';
        const [result] = await pool.query(query, [name, class_name, stock, nameId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Not Found'});
        }


        res.json({
            status: 'success',
            message: `Updated`,
        });
    } catch (error) {
        console.error('Error update name', error);
        res.status(500).json({ status: 'error', message: 'Update Failed'})
    }
});

//DELETE
app.delete('/api/stationery/:id', async (req, res) => {
    const nameId = req.params.id;

    try {
        const query = 'DELETE FROM tb_ujkstationery WHERE id = ?';
        const [result] = await pool.query(query, [nameId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Not Found'});
        }


        res.json({
            status: 'success',
            message: `Deleted`,
        });
    } catch (error) {
        console.error('Error delete name', error);
        res.status(500).json({ status: 'error', message: 'Delete Failed'})
    }
});

//TESTING
app.get('/', (req, res) => {
    res.send('<h1>Server Express Jupriola Siap Tempur! 🚀</h1><p>Akses data di: /api/servants</p>');
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
    console.log(`Server running on //localhost:${port}/api/stationery`);    
})