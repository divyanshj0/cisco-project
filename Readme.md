Here is the `README.md` file for your project.

# IoT Sensor Monitoring Dashboard

This is a full-stack application for monitoring and visualizing data from IoT devices. It features a Next.js frontend for the user interface and a Node.js (Express) backend for handling API requests and data management.

## Features

  * **User Authentication**: Secure user registration and login system using JWT (JSON Web Tokens).
  * **Device Management**:
      * Add new IoT devices to your dashboard.
      * View a list of all your registered devices.
      * Delete devices and their associated data.
  * **Data Visualization**:
      * View real-time temperature and humidity readings for each device.
      * Analyze historical data with interactive graphs (line and bar charts).
      * Display a statistical table with the minimum, maximum, and average values, as well as the total number of readings for both temperature and humidity.
  * **Time-Based Filtering**:
      * Filter statistics and graphs by time ranges: last 24 hours, last 7 days, last 30 days, or a custom date range.
  * **Manual Data Entry**: A modal to manually send temperature and humidity data to a device, useful for testing and debugging.
  * **Responsive Design**: A clean and responsive user interface built with Tailwind CSS.

-----

## Project Structure

The project is divided into two main parts: a frontend application and a backend server.

### Frontend (`iot-frontend`)

The frontend is a [Next.js](https://nextjs.org/) application using the App Router.

```
iot-frontend/
├── app/
│   ├── api/iot/         # API routes for frontend-backend communication
│   ├── dashboard/
│   │   ├── [deviceId]/  # Dynamic page for individual device details
│   │   └── page.js      # Main dashboard page
│   ├── login/           # Authentication
│   ├── register/
│   └── ...
├── components/                 # Reusable React components
│   ├── DeviceGraph.js          # Component for rendering charts
│   ├── StatsTable.js           # Component for the statistics table
│   ├── SendDataModal.js        # Component for sending data to database
│   ├── ChangePasswordModal.js  # Component for the statistics table
│   ├── CreateDeviceModal.js    # Component for the device creation
│   └── ...
└── ...
```

### Backend (`iot-backend`)

The backend is a [Node.js](https://nodejs.org/) application using the [Express](https://expressjs.com/) framework.

```
iot-backend/
├── db.js                # Database connection and Sequelize models
├── server.js            # Main Express server file with API endpoints
└── package.json
```

-----

## How to Run Locally

To run this project on your local machine, you'll need to set up both the backend and the frontend.

### Prerequisites

  * [Node.js](https://nodejs.org/en/) (version 18.x or higher is recommended)
  * [npm](https://www.npmjs.com/) (usually comes with Node.js)
  * A [PostgreSQL](https://www.postgresql.org/) database (you can use a cloud service like [Supabase](https://supabase.com/) or run it locally)

### 1\. Backend Setup

First, set up and run the backend server.

1.  **Navigate to the backend directory**:

    ```bash
    cd iot-backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Create an environment file**:
    Create a file named `.env` in the `iot-backend` directory and add the following variables:

    ```env
    # Your PostgreSQL database connection string
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # A secret key for signing JWTs (choose a long, random string)
    TOKEN_SECRET="YOUR_SUPER_SECRET_KEY"
    ```

4.  **Start the backend server**:

    ```bash
    npm start
    ```

    The backend server should now be running on `http://localhost:8080`.

### 2\. Frontend Setup

Next, set up and run the frontend application.

1.  **Navigate to the frontend directory**:

    ```bash
    cd iot-frontend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Create an environment file**:
    Create a file named `.env.local` in the `iot-frontend` directory and add the following variable:

    ```env
    # The URL of your running backend server
    NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
    ```

4.  **Start the frontend development server**:

    ```bash
    npm run dev
    ```

5.  **Open the application**:
    Open your web browser and go to `http://localhost:3000` to see the application running. You can now register a new user and start adding devices.