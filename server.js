import express from 'express';

const app = express();

// Basic middleware
app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running!' 
  });
});

app.post('/api/drivers/send-otp', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'OTP sent successfully',
    devOTP: '123456'
  });
});

app.post('/api/drivers/verify-otp', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'OTP verified successfully' 
  });
});

export default app;