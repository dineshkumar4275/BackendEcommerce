// backend/src/controllers/addressController.js
import AddressService from '../services/addressService.js';

class AddressController {
    /**
     * GET /api/address - Get user's address
     */
    static async getAddress(req, res) {
        try {
            const userId = req.user.id || req.userId;
            const address = await AddressService.getAddress(userId);
            
            res.json({
                success: true,
                data: address
            });
        } catch (error) {
            console.error('Get address error:', error);
            
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch address',
                error: error.message
            });
        }
    }

    /**
     * PUT /api/address - Update user's address
     */
    static async updateAddress(req, res) {
        try {
            const userId = req.user.id || req.userId;
            const address = await AddressService.updateAddress(userId, req.body);
            
            res.json({
                success: true,
                message: 'Address updated successfully',
                data: address
            });
        } catch (error) {
            console.error('Update address error:', error);
            
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            if (error.message === 'Failed to update address') {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update address'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to update address',
                error: error.message
            });
        }
    }

    /**
     * DELETE /api/address - Delete user's address
     */
    static async deleteAddress(req, res) {
        try {
            const userId = req.user.id || req.userId;
            const result = await AddressService.deleteAddress(userId);
            
            res.json({
                success: true,
                message: 'Address deleted successfully'
            });
        } catch (error) {
            console.error('Delete address error:', error);
            
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to delete address',
                error: error.message
            });
        }
    }
}

export default AddressController;