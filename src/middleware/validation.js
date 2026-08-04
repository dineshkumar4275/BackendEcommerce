// backend/src/middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validateAddress = [
    body('full_name')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .isLength({ min: 10, max: 15 }).withMessage('Mobile number must be between 10 and 15 digits')
        .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid mobile number format'),
    
    body('alternate_mobile')
        .optional()
        .isLength({ min: 10, max: 15 }).withMessage('Alternate mobile must be between 10 and 15 digits')
        .matches(/^[0-9+\-\s()]*$/).withMessage('Invalid alternate mobile format'),
    
    body('address_line1')
        .trim()
        .notEmpty().withMessage('Address line 1 is required')
        .isLength({ max: 255 }).withMessage('Address line 1 is too long (max 255 characters)'),
    
    body('address_line2')
        .optional()
        .isLength({ max: 255 }).withMessage('Address line 2 is too long (max 255 characters)'),
    
    body('landmark')
        .optional()
        .isLength({ max: 100 }).withMessage('Landmark is too long (max 100 characters)'),
    
    body('city')
        .trim()
        .notEmpty().withMessage('City is required')
        .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('City can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('district')
        .optional()
        .isLength({ max: 50 }).withMessage('District is too long (max 50 characters)')
        .matches(/^[a-zA-Z\s\-']*$/).withMessage('District can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('state')
        .trim()
        .notEmpty().withMessage('State is required')
        .isLength({ min: 2, max: 50 }).withMessage('State must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('State can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('country')
        .optional()
        .isLength({ max: 50 }).withMessage('Country is too long (max 50 characters)')
        .matches(/^[a-zA-Z\s\-']*$/).withMessage('Country can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('pincode')
        .trim()
        .notEmpty().withMessage('Pincode is required')
        .isLength({ min: 5, max: 10 }).withMessage('Pincode must be between 5 and 10 characters')
        .matches(/^[0-9]+$/).withMessage('Pincode can only contain numbers'),
    
    body('address_type')
        .optional()
        .isIn(['Home', 'Work', 'Other']).withMessage('Address type must be Home, Work, or Other'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];