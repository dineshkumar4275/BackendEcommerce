import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'my_super_secret_key_12345678';
  
  console.log('🔐 Generating token for ID:', id, 'Role:', role);
  
  const token = jwt.sign(
    { id, role },
    secret,
    { expiresIn: '30d' }
  );
  
  console.log('✅ Token generated');
  return token;
};

export default generateToken;