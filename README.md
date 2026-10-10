# Rentora — No-Broker Rental Platform

A full-stack rental property platform designed to connect tenants directly with property owners, making property discovery and rental management easier.

## 🏠 About the Project

Rentora is a web application that helps users find rental properties based on location, budget, BHK, and furnishing preferences. It provides separate workflows for tenants and property owners, reducing the need for traditional broker-based property searching.

## ✨ Features

- **Property Listings:** Browse rental properties with detailed information.
- **Search & Filters:** Filter properties by location, rent, bedrooms, and furnishing.
- **Interactive Maps:** Explore properties and nearby societies on a map.
- **Nearby Societies:** Find nearby societies and view their available properties.
- **User Authentication:** Secure login and registration.
- **Wishlist:** Save favourite properties.
- **Rental Applications:** Submit and track rental applications.
- **Visit Scheduling:** Request property visits and manage visit availability.
- **Notifications:** Receive updates about relevant rental activities.
- **Role-Based Dashboards:** Separate experiences for tenants and owners.
- **Property Management:** Owners can manage their property listings.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| Maps | Leaflet, OpenStreetMap |
| API Testing | Postman |

## 📸 Screenshots

Add screenshots of your working application here.

### Home Page
<!-- Replace with your actual screenshot path -->
![Rentora Home Page](docs/screenshots/home.png)

### Property Listings and Map
![Property Listings](docs/screenshots/properties.png)

### Property Details
![Property Details](docs/screenshots/property-details.png)

### Tenant Dashboard
![Tenant Dashboard](docs/screenshots/tenant-dashboard.png)

> Replace these placeholder image paths with screenshots you have actually added to the repository.

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Maneesh7060/Rentora_No-broker-plateform.git
cd Rentora_No-broker-plateform
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory using the environment variables required by your backend:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Use your own local database credentials. Never commit `.env` to GitHub.

### 3. Configure the database

Create a PostgreSQL database and apply the project's database schema or migrations as required.

Use the schema and setup instructions available in the repository.

### 4. Start the backend

From the `server` directory, run the command defined in your `package.json`, for example:

```bash
npm run dev
```

### 5. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## 🔐 Security

- Store credentials and secret keys in environment variables.
- Do not upload `.env` files or database passwords.
- Validate user input and enforce role-based access control.

## 🎯 Project Goal

To make rental property discovery more transparent and convenient by helping tenants connect directly with property owners.

## 👨‍💻 Author

**Maneesh**

GitHub: [@Maneesh7060](https://github.com/Maneesh7060)

## 📄 License

No license has been specified yet. Add a license file if you intend to distribute this project under a particular open-source license.
