# TransitOps — Smart Transport Operations Platform

A full-stack fleet operations platform: vehicle registry, driver management, trip
dispatch, maintenance workflow, fuel & expense tracking, and reporting — built with
React (Vite + Tailwind v4) on the frontend and Node.js/Express + MongoDB on the backend.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, React Router, Axios, Recharts, lucide-react
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt
- **Auth:** Email/password login with JWT, Role-Based Access Control (RBAC)

Roles: `FleetManager`, `Driver`, `SafetyOfficer`, `FinancialAnalyst`.

## Project structure

```
transitops/
├── backend/            Express API + MongoDB models
│   ├── models/          Mongoose schemas (User, Vehicle, Driver, Trip, Maintenance, FuelLog, Expense)
│   ├── middleware/       auth.js (JWT) and rbac.js (role gating)
│   ├── routes/           REST endpoints per resource
│   ├── utils/seed.js     Demo data seeder
│   └── server.js
└── frontend/            React app (Vite)
    └── src/
        ├── api/axios.js       Axios instance with auth interceptor
        ├── context/           AuthContext (login/register/session)
        ├── components/        Layout, Modal, StatusTag, form fields
        └── pages/              Dashboard, Vehicles, Drivers, Trips, Maintenance, FuelExpenses, Reports
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongod` running on `localhost:27017`) or a
  connection string from MongoDB Atlas.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env if your MongoDB URI or JWT secret differ from the defaults
npm install
npm run seed     # optional: creates 4 demo users + sample vehicles/drivers
npm run dev       # starts the API on http://localhost:5000 (nodemon)
# or: npm start
```

Demo logins created by the seed script (password for all: `password123`):

| Role              | Email                             |
|-------------------|------------------------------------|
| Fleet Manager     | fleet.manager@transitops.demo      |
| Driver            | driver@transitops.demo             |
| Safety Officer    | safety.officer@transitops.demo     |
| Financial Analyst | analyst@transitops.demo            |

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your API isn't on http://localhost:5000/api
npm install
npm run dev       # starts on http://localhost:5173
```

Open http://localhost:5173, sign in with a demo account (or register a new one), and
you're in.

## Business rules implemented

- Vehicle registration numbers and driver license numbers are unique.
- Retired or In Shop vehicles are excluded from dispatch selection (`availableForDispatch=true` query param).
- Drivers with expired licenses or Suspended status cannot be dispatched.
- A vehicle or driver already On Trip cannot be assigned to a second trip.
- Cargo weight is validated against the vehicle's max load capacity, both at trip
  creation and again at dispatch time.
- Dispatching a trip sets vehicle + driver to On Trip; completing or cancelling a
  dispatched trip restores both to Available.
- Creating an open maintenance record moves the vehicle to In Shop automatically;
  closing it restores Available (or Retired, if chosen).
- Operational cost (Fuel + Maintenance) and ROI 
  are computed per vehicle in Reports, alongside fuel efficiency (distance/fuel) and
  fleet utilization. Reports can be exported as CSV.

## Role permissions (RBAC)

| Action                          | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|----------------------------------|:---:|:---:|:---:|:---:|
| View dashboard / vehicles / trips | ✅ | ✅ | ✅ | ✅ |
| Create / edit / delete vehicles   | ✅ | – | – | – |
| Create / edit drivers             | ✅ | – | ✅ | – |
| Delete drivers                    | ✅ | – | – | – |
| Create / dispatch / complete / cancel trips | ✅ | ✅ | – | – |
| Create / close maintenance records | ✅ | – | – | – |
| Log fuel                         | ✅ | ✅ | – | – |
| Log other expenses               | ✅ | ✅ | – | ✅ |
| View reports & export CSV        | ✅ | ✅ | ✅ | ✅ |


