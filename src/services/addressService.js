// backend/src/services/addressService.js
import pool from '../config/database.js';

class AddressService {
    /**
     * Get user's address
     */
    static async getAddress(userId) {
        const result = await pool.query(
            `SELECT 
                full_name,
                mobile,
                alternate_mobile,
                address_line1,
                address_line2,
                landmark,
                city,
                district,
                state,
                country,
                pincode,
                latitude,
                longitude,
                address_type,
                address_updated_at,
                CASE 
                    WHEN full_name IS NOT NULL AND full_name != '' THEN true 
                    ELSE false 
                END as has_address
            FROM users 
            WHERE id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        return result.rows[0];
    }

    /**
     * Update user's address
     */
    static async updateAddress(userId, addressData) {
        const {
            full_name,
            mobile,
            alternate_mobile,
            address_line1,
            address_line2,
            landmark,
            city,
            district,
            state,
            country,
            pincode,
            latitude,
            longitude,
            address_type
        } = addressData;

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }

        const result = await pool.query(
            `UPDATE users SET
                full_name = $1,
                mobile = $2,
                alternate_mobile = $3,
                address_line1 = $4,
                address_line2 = $5,
                landmark = $6,
                city = $7,
                district = $8,
                state = $9,
                country = $10,
                pincode = $11,
                latitude = $12,
                longitude = $13,
                address_type = $14,
                address_updated_at = CURRENT_TIMESTAMP
            WHERE id = $15
            RETURNING 
                full_name,
                mobile,
                alternate_mobile,
                address_line1,
                address_line2,
                landmark,
                city,
                district,
                state,
                country,
                pincode,
                latitude,
                longitude,
                address_type,
                address_updated_at,
                true as has_address`,
            [
                full_name,
                mobile,
                alternate_mobile || null,
                address_line1,
                address_line2 || null,
                landmark || null,
                city,
                district || null,
                state,
                country || 'India',
                pincode,
                latitude || null,
                longitude || null,
                address_type || 'Home',
                userId
            ]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Failed to update address');
        }
        
        return result.rows[0];
    }

    /**
     * Delete user's address
     */
    static async deleteAddress(userId) {
        const result = await pool.query(
            `UPDATE users SET
                full_name = NULL,
                mobile = NULL,
                alternate_mobile = NULL,
                address_line1 = NULL,
                address_line2 = NULL,
                landmark = NULL,
                city = NULL,
                district = NULL,
                state = NULL,
                country = NULL,
                pincode = NULL,
                latitude = NULL,
                longitude = NULL,
                address_type = NULL,
                address_updated_at = NULL
            WHERE id = $1
            RETURNING id`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        return { 
            success: true, 
            message: 'Address deleted successfully' 
        };
    }

    /**
     * Get address for checkout (copy to order)
     */
    static async getAddressForOrder(userId) {
        const result = await pool.query(
            `SELECT 
                full_name,
                mobile,
                address_line1,
                address_line2,
                landmark,
                city,
                state,
                country,
                pincode
            FROM users 
            WHERE id = $1 
            AND full_name IS NOT NULL 
            AND full_name != ''`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    }
}

export default AddressService;