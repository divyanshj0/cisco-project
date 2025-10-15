// This line must be at the very top to load the .env file
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set!");
}

// Initialize Sequelize with the connection string from your .env file
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        // Supabase and other cloud providers require an SSL connection
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});


//user modal
const User = sequelize.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, //email has be unique
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
})

// Device modal
const Device = sequelize.define('Device', {
    name: {
        type: DataTypes.STRING,
        allowNull:false,
    },
    location: {
        type: DataTypes.STRING,
        defaultValue:'Not set',
    },
    thresholds: {
        type: DataTypes.JSONB,
        defaultValue: {
            tempMin: null,
            tempMax: null,
            humidityMin: null,
            humidityMax: null
        }
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['name', 'UserUserId'], // Unique per user
        },
    ],
});

// Reading modals
const Reading = sequelize.define('Reading', {
    temperature: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    humidity: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }
})

// Alert model
const Alert = sequelize.define('Alert', {
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    seen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
});

// Relationships
User.hasMany(Device, { onDelete: 'CASCADE' });
Device.belongsTo(User);

Device.hasMany(Reading, { onDelete: 'CASCADE' });
Reading.belongsTo(Device);

Device.hasMany(Alert, { onDelete: 'CASCADE' });
Alert.belongsTo(Device);

// create table if doesn't exsist
sequelize.sync({ alter: true })
    .then(() => console.log('Databse and table created'))
    .catch(error => console.log('Error syncing database', error))

// Test the database connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('☁️ Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// Export the sequelize instance to be used in other parts of the application
module.exports = { sequelize, Device, Reading, User,Alert };