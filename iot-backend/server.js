// Import and execute the database connection logic from db.js
const { User, Device, Reading, sequelize } = require('./db');


// Import required packages
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const http = require('http');
const { WebSocketServer } = require('ws');
const url = require('url');
const { error } = require('console');
// Initialize the Express app
const app = express();
const PORT = 8080;


//HTTP server 
const server = http.createServer(app);

//websocet connected to http server
const wss = new WebSocketServer({ server });


const clients = new Map();
wss.on('connection', async (ws, req) => {
    // The frontend will send the JWT as a query parameter, e.g., ws://.../?token=...
    const token = url.parse(req.url, true).query.token;

    if (!token) {
        console.log('WebSocket connection rejected: No token provided.');
        ws.close(1008, 'Token not provided');
        return;
    }

    try {
        // Verify the JWT
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            console.log('WebSocket connection rejected: User not found.');
            ws.close(1008, 'User not found');
            return;
        }

        const userId = user.userId;

        // Store the authenticated connection
        clients.set(userId, ws);
        console.log(`Client connected and authenticated for user ID: ${userId}`);

        ws.on('close', () => {
            // Remove the client from the map when they disconnect
            clients.delete(userId);
            console.log(`Client disconnected for user ID: ${userId}`);
        });

    } catch (error) {
        console.log('WebSocket connection rejected: Invalid token.');
        ws.close(1008, 'Invalid token');
    }
});


// Use middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON payloads

// middleware to verify user
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the correct secret from .env
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

            // Attach user to the request object
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] } // Don't include the password
            });

            if (!req.user) {
                return res.status(401).json({ error: 'User not found' });
            }

            next(); // Proceed to the endpoint logic
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};


//Authentication 

// create user
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });
        res.status(201).json({ message: 'User created successfully', userId: user.userId });
    } catch (error) {
        res.status(500).json({ error: error || 'Email may already be in use.' });
    }
});

// user login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user){
            return res.status(401).json({error:'User does not exist'})
        }
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create a JWT. Use a secret from your .env file in a real app!
        const token = jwt.sign({ id: user.userId }, process.env.TOKEN_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//change password
app.post('/auth/change-password', protect, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = req.user;
        console.log(oldPassword, newPassword)
        // 1. Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect old password.' });
        }

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get and post api endpoints
// Define a simple root route to test the server
app.get('/', (req, res) => {
    res.status(200).send('IoT Sensor Monitor Backend is running!');
});

// Get a list of all devices
app.get('/api/devices', protect, async (req, res) => {
    try {
        const devices = await Device.findAll({ where: { UserUserId: req.user.userId } });
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// create device 
app.post('/api/devices', protect, async (req, res) => {
    try {
        const { name, location } = req.body;

        // Check if this user already has a device with this ID
        const existingDevice = await Device.findOne({
            where: { UserUserId: req.user.userId, name }
        });

        if (existingDevice) {
            return res.status(409).json({ error: 'A device with this ID already exists.' });
        }

        const device = await Device.create({
            name,
            location,
            UserUserId: req.user.userId
        });
        res.status(201).json(device);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'You already have a device with this name.' });
        }
        res.status(500).json({ error: error.message });
    }
});
// Ingest a new sensor reading
app.post('/api/readings', protect, async (req, res) => {
    try {
        const { deviceId, temperature, humidity } = req.body;

        // Create the new reading and associate it with the device
        const newReading = await Reading.create({
            temperature,
            humidity,
            DeviceId: deviceId
        });

        res.status(201).json(newReading);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// delete a device 
app.delete('/api/devices/:deviceId', protect, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const device = await Device.findOne({
            where: { id: deviceId, UserUserId: req.user.userId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found or you do not own this device.' });
        }

        await device.destroy();//to delete reading of this device
        res.status(200).json({ message: 'Device and all its readings deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all readings for a specific device
app.get('/api/readings/:deviceId', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const offset = (page - 1) * limit;
        const { deviceId } = req.params;

        const device = await Device.findOne({
            where: { id: deviceId, UserUserId: req.user.userId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found.' });
        }

        const whereClause = { DeviceId: deviceId };
        const orderClause = [['createdAt', req.query.order || 'DESC']];

        if (req.query.startDate && req.query.endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
            };
        }

        if (req.query.sortBy) {
            orderClause[0][0] = req.query.sortBy;
        }

        const readings = await Reading.findAndCountAll({
            where: whereClause,
            order: orderClause,
            limit: limit,
            offset: offset,
        });
        res.status(200).json({
            totalPages: Math.ceil(readings.count / limit),
            currentPage: page,
            readings: readings.rows,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics for a device
app.get('/api/stats/:deviceId', protect, async (req, res) => {
    try {
        const device = await Device.findOne({
            where: { id: req.params.deviceId, UserUserId: req.user.userId }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found or you do not have permission to view it.' });
        }
        const result = await Reading.findOne({
            where: { DeviceDeviceId: req.params.deviceId },
            attributes: [
                [sequelize.fn('MIN', sequelize.col('temperature')), 'minTemp'],
                [sequelize.fn('MAX', sequelize.col('temperature')), 'maxTemp'],
                [sequelize.fn('AVG', sequelize.col('temperature')), 'avgTemp'],
                [sequelize.fn('MIN', sequelize.col('humidity')), 'minHum'],
                [sequelize.fn('MAX', sequelize.col('humidity')), 'maxHum'],
                [sequelize.fn('AVG', sequelize.col('humidity')), 'avgHum'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'readingCount']
            ],
            raw: true, // Returns a plain object
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Start the server and listen for connections
server.listen(PORT, () => {
    console.log(`🚀 Server is live and listening on http://localhost:${PORT}`);
});