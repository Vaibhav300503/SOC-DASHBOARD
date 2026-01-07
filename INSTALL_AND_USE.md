# SOC Dashboard - Installation & Usage Guide

This guide explains how to install dependencies and run the SOC Dashboard project (Frontend & Backend).

## 1. Prerequisites

- **Node.js**: Ensure Node.js (v16 or higher) is installed.
- **MongoDB**: Ensure MongoDB is installed and running locally on port 27017, or configure your `.env` connection string.

## 2. One-Time Installation

To install all dependencies for both the frontend and backend, open your terminal in the project root folder (`c:\Users\INDIA TECHNOLOGY\Desktop\cyart`) and run:

```bash
# Install Frontend Dependencies
npm install

# Install Backend Dependencies
cd backend
npm install
cd ..
```

*Note: The `requirements.txt` file in the root folder lists these modules for your reference.*

## 3. Running the Application

You need to run the Backend and Frontend simultaneously. It is recommended to use two separate terminal windows.

### Terminal 1: Backend
Start the Express server which handles API requests and database connections.

```bash
cd backend
npm start
```
*The server will typically start on port 3001 or 3002.*

### Terminal 2: Frontend
Start the Vue.js development server.

```bash
npm run dev
```
*The dashboard will be accessible at http://localhost:5173 (or the port shown in your terminal).*

## 4. Configuration

- **Frontend**: Check `.env` in the root folder.
- **Backend**: Check `backend/.env` (create if missing) to configure MongoDB URI, JWT secrets, etc.

## 5. Troubleshooting

- **Module Not Found**: If you see errors about missing modules, simply run `npm install` again in the respective directory.
- **Database Connection Error**: Ensure MongoDB is running (`mongod`).
