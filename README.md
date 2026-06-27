# HelpGhar – Home Service Marketplace

## Overview

**HelpGhar** is a full-stack web application that connects customers with verified home service professionals such as plumbers, electricians, cleaners, painters, carpenters, and other skilled workers. The platform ensures secure user verification, easy service booking, online payments, worker performance tracking, customer reviews, and efficient dispute management through a centralized admin panel.

The project focuses on providing a safe, transparent, and user-friendly experience for both customers and service providers.

---

## Features

### User Verification & Authentication

* Customer and Worker registration
* Worker CNIC and certificate verification
* Admin approval/rejection of registrations
* Secure JWT authentication
* Password encryption using bcrypt
* Role-based access control (Customer, Worker, Admin)

### Service Booking & Scheduling

* Browse services by category
* Search workers by location
* View worker profiles, pricing, and ratings
* Book services with date and time selection
* Prevent duplicate or overlapping bookings
* Booking history
* Booking cancellation and rescheduling

### Payment & Transaction Management

* Secure online payment integration
* Automatic platform commission calculation
* Electronic payment receipts
* Payment release after service completion
* Refund processing
* Transaction history
* Payment status notifications

### Work Tracking & Incentive System

* Workers update job status
* Track task start and completion time
* Customer confirmation of completed work
* Performance analytics
* Incentive points and rewards
* Worker dashboard with statistics

### Worker Recommendation & Review

* Customer ratings and reviews
* Average worker ratings
* Worker recommendations based on:

  * Location
  * Skills
  * Ratings
* Review moderation by admin
* Review notifications

### Admin Management & Dispute Handling

* Manage customers and workers
* Verify worker documents
* Handle complaints and disputes
* Issue refunds or warnings
* View dispute history
* Dashboard analytics
* User activity monitoring

---

## User Roles

### Customer

* Register/Login
* Browse services
* Book workers
* Make payments
* Track bookings
* Submit reviews
* Raise disputes

### Worker

* Register and upload verification documents
* Manage profile
* Accept bookings
* Update work status
* View earnings
* Track performance
* Receive incentives

### Admin

* Verify worker registrations
* Manage all users
* Resolve disputes
* Process refunds
* View reports and analytics
* Moderate reviews

---

## Tech Stack

### Frontend

* React.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Router DOM
* Axios
* React Hook Form

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Bcrypt.js
* Cloudinary (File Uploads)
* Multer

### Development Tools

* Visual Studio Code
* Git & GitHub
* Postman

---

## Project Structure

```
HelpGhar
│
├── client
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── layouts
│   │   ├── hooks
│   │   ├── services
│   │   ├── utils
│   │   └── assets
│
├── server
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   ├── utils
│   ├── config
│   └── app.js
│
├── README.md
└── package.json
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/helpghar.git
```

### Navigate to Project

```bash
cd helpghar
```

### Install Frontend Dependencies

```bash
cd client
npm install
```

### Install Backend Dependencies

```bash
cd ../server
npm install
```

---

## ▶ Running the Project

### Start Backend

```bash
npm run dev
```

### Start Frontend

```bash
cd client
npm run dev
```

The frontend will run on:

```
http://localhost:5173
```

---

## Environment Variables

Create a `.env` file inside the server folder.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection

ACCESS_TOKEN_SECRET=your_access_secret

REFRESH_TOKEN_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

---

## Screenshots

Add screenshots of:

* Home Page
* Login Page
* Registration
* Customer Dashboard
* Worker Dashboard
* Admin Dashboard
* Booking Page
* Payment Page

---

## Future Improvements

* Real-time chat between customers and workers
* Live worker location tracking
* AI-based worker recommendation
* Push notifications
* Mobile application
* Multi-language support
* Video consultation
* Service subscription plans

---

## Contributors

* **Zoya Siddiqui**
* **Waniya Azhar**
* **M. Danish**
* **Zohaib Ali**

---

## License

This project is developed for educational and academic purposes.
