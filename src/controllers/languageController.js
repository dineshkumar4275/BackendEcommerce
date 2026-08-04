// backend/src/controllers/languageController.js

import pool from '../config/database.js';

// ✅ Get user language preference
export const getUserLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT preferred_language FROM users WHERE id = $1',
      [userId]
    );
    
    const language = result.rows[0]?.preferred_language || 'en';
    
    res.json({
      success: true,
      language: language
    });
  } catch (error) {
    console.error('Get user language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user language',
      error: error.message
    });
  }
};

// ✅ Update user language preference
export const updateUserLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.body;
    
    // Validate language
    const validLanguages = ['en', 'hi', 'ta', 'te', 'ml', 'fr', 'es', 'de', 'ja', 'zh'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language code'
      });
    }
    
    await pool.query(
      'UPDATE users SET preferred_language = $1 WHERE id = $2',
      [language, userId]
    );
    
    res.json({
      success: true,
      message: 'Language updated successfully',
      language: language
    });
  } catch (error) {
    console.error('Update user language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language',
      error: error.message
    });
  }
};

// ✅ Get all available languages
export const getLanguages = async (req, res) => {
  try {
    const languages = [
      { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
      { code: 'ta', name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
      { code: 'ml', name: 'Malayalam', flag: '🇮🇳', nativeName: 'മലയാളം' },
      { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
      { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
      { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
      { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
      { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
    ];
    
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get languages',
      error: error.message
    });
  }
};

// ✅ Get product with translations
export const getProductWithTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'en' } = req.query;
    
    const result = await pool.query(
      `SELECT 
        id, name, description, price, category, 
        images, stock, created_at,
        CASE 
          WHEN $1 = 'ta' AND name_ta IS NOT NULL THEN name_ta
          WHEN $1 = 'hi' AND name_hi IS NOT NULL THEN name_hi
          ELSE name
        END as name_translated,
        CASE 
          WHEN $1 = 'ta' AND description_ta IS NOT NULL THEN description_ta
          WHEN $1 = 'hi' AND description_hi IS NOT NULL THEN description_hi
          ELSE description
        END as description_translated
      FROM products WHERE id = $2`,
      [lang, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const product = result.rows[0];
    
    res.json({
      success: true,
      data: {
        ...product,
        name: product.name_translated || product.name,
        description: product.description_translated || product.description
      }
    });
  } catch (error) {
    console.error('Get product with translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
};