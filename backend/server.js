require('dotenv').config();
const { app, server } = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3002;

// Debug environment variables
console.log('Environment variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***' : 'not set');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_connect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
    
    // Start server only after successful database connection
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`WebSocket server is ready`);
        console.log(`Health check available at http://localhost:${PORT}/health`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
}); 