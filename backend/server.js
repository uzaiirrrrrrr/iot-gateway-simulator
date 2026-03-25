const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Platform is running', timestamp: new Date() });
});

const simulationEngine = require('./engines/simulationEngine');
// Wait for DB, then delay starting engine slightly to ensure DB is connected
setTimeout(() => {
    simulationEngine.start();
}, 2000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
