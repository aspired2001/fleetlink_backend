# ⚙️ FleetLink Backend

A **Node.js + Express.js backend API** for the **FleetLink Logistics Vehicle Booking System**.  
This service provides **RESTful APIs to manage vehicles, bookings, and logistics operations**.  
It uses **MongoDB** as the database and follows a **modular, secure, and production-ready setup**.

---

## ✨ Features

- ⚡ **Express.js** server with modular architecture
- 🛢️ **MongoDB + Mongoose ODM** for database operations
- 🛡️ **Security middleware** using Helmet and CORS
- 📋 **Request validation** using Express-Validator
- 📝 **Logging** using Morgan
- 🔁 **Hot reload** using Nodemon (development only)
- 🧪 **Jest + Supertest** test setup included
- 🐳 **Docker + Docker Compose** support with MongoDB service
- ⚙️ Environment-based configuration support using `.env`

---

---
## 📂 Project Structure

fleetlink_backend/
├── src/
│ ├── config/ # DB connection and environment setup
│ ├── controllers/ # Route controllers (business logic)
│ ├── models/ # Mongoose data models
│ ├── routes/ # Express route definitions
│ ├── middleware/ # Custom middlewares
│ └── server.js # Server entry point
├── tests/ # Jest test files
├── Dockerfile # Multi-stage Docker build
├── docker-compose.yml # Local dev services (MongoDB + App)
├── .env # Environment variables
├── package.json
└── README.md

---

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure:

```env
# ---------------------------
# 🌐 Server Configuration
# ---------------------------
PORT=3000
NODE_ENV=development

# ---------------------------
# 📦 MongoDB Configuration
# ---------------------------
# Local MongoDB URI (default fallback)
MONGODB_URI='mongodb+srv://wajhoor2001:Jaguar2001@cluster0.xcxg2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

# ---------------------------
# 🌍 Frontend Configuration
# ---------------------------
# Used in CORS to allow browser requests from the frontend
FRONTEND_URL=http://localhost:3001

# ---------------------------
# 🛡 Misc (Optional)
# ---------------------------
# JWT_SECRET=your_jwt_secret_here
# API_KEY=your_api_key_here
⚠️ Replace MONGODB_URI with your actual MongoDB connection string in production.

🚀 Getting Started
1. Clone the Repository
bash
Copy code
git clone https://github.com/your-username/fleetlink_backend.git
cd fleetlink_backend
2. Install Dependencies
bash
Copy code
npm install
3. Setup Environment
Create a .env file in the root as shown above.

4. Start the Server
Development (with hot reload)

bash
Copy code
npm run dev
Production

bash
Copy code
npm start
Server will be running at http://localhost:3000

📦 Available Scripts
Command	Description
npm run dev	Run server with Nodemon (development)
npm start	Start the server in production mode
npm test	Run all Jest tests
npm run test:watch	Run tests in watch mode
npm run test:coverage	Generate test coverage report

🧪 Testing
Tests are written using Jest and Supertest.

To run tests:

bash
Copy code
npm test
For coverage:

bash
Copy code
npm run test:coverage
🐳 Docker Setup
1. Build and Run with Docker Compose
bash
Copy code
docker compose up --build
This will:

Start a MongoDB container with persistent volume

Build and run the backend app container

Expose backend on port 3000 and MongoDB on 27017

2. Accessing Services
Backend API → http://localhost:3000

MongoDB → mongodb://localhost:27017

⚡ Health Checks
The docker-compose.yml includes health checks:

MongoDB → db.adminCommand('ping')

App → GET http://localhost:3000/health

⚛️ Tech Stack
Node.js (v20) + Express.js

MongoDB with Mongoose

Helmet, CORS, Morgan, dotenv

Jest, Supertest (for testing)

Docker + Docker Compose

💻 API Endpoints
Base URL: http://localhost:3000/api

Endpoint	Method	Description
/api/vehicles	GET/POST	Fetch or create vehicles
/api/vehicles/:id	GET/PUT/DELETE	Manage single vehicle
/api/bookings	GET/POST	Fetch or create bookings
/api/bookings/:id	GET/PUT/DELETE	Manage single booking

🤝 Contributing
Contributions are welcome!
To contribute:

Fork this repository

Create a feature branch (git checkout -b feature/my-feature)

Commit changes (git commit -m "Add feature")

Push to your branch (git push origin feature/my-feature)

Open a Pull Request

📜 License
This project is licensed under the MIT License.
Feel free to use and modify the code as needed.
