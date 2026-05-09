const pool = require('../config/database');

class UserModel {
    static async create(userData) {
        const { name, email, password, role = 'user' } = userData;
        const query = `
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at
        `;
        const values = [name, email, password, role];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT id, name, email, role, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async updateLastLogin(id) {
        const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
        await pool.query(query, [id]);
    }
}

module.exports = UserModel;