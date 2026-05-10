# 🚑 Project: Accident & Emergency Coordination System (MedSwift)

Mobile Apps (User + Ambulance Driver) + Web Dashboards (Organization + Super Admin)
Real-time ambulance tracking + emergency request handling + organizational management.

---

# 1. Technologies Overview

## Mobile Apps (User + Driver)

* **React Native (Expo)** → Cross-platform mobile apps
* **Google Maps SDK** → Display maps and live ambulance location
* **Firebase Authentication** → User login/signup
* **Firebase Firestore** → Store users, organizations, requests
* **Firebase Realtime Database** → Live ambulance location tracking
* **Firebase Cloud Messaging (FCM)** → Push notifications

## Backend

* **Node.js + Express.js** → REST APIs and business logic
* **JWT / Firebase Token Verification** → Secure API access
* **Firebase Admin SDK** → Server-side database operations

## Web Dashboards (Organization + Admin)

* **React.js + Vite** → Web frontend
* **TailwindCSS** → Styling
* **Node.js + Express.js API** → Backend
* **Firestore** → Data storage
* **Google Maps JavaScript SDK** → Live tracking visualization

---

# 2. Core Functionalities

---

# 2.1 Authentication (All Roles)

### Technologies:

* Firebase Authentication
* Firestore

### Features:

* User signup/login (email or phone)
* Organization signup (web)
* Driver login (created by organization)
* Role-based access:

  * User
  * Driver
  * Organization
  * Admin
* Store user profile:

  * name
  * role
  * status (active/suspended)
  * organizationId (for drivers)

---

# 2.2 User Module (Mobile App)

### Technologies:

* React Native
* Firestore
* Realtime Database
* Google Maps SDK

### Functions:

* Register & Login
* Get current GPS location
* Display map with user location
* Emergency Button:

  * Send request with location
* View:

  * Assigned ambulance live location
  * Request status (Pending / Accepted / Completed)
* Emergency Contacts Section:

  * Call button (e.g., 1122)
* Support page
* Profile view

---

# 2.3 Ambulance Driver Module (Mobile App)

### Technologies:

* React Native
* Realtime Database
* Firestore
* Google Maps SDK
* Background location tracking

### Functions:

* Login (credentials from organization)
* Online / Offline toggle
* Receive nearby emergency requests
* Accept request:

  * Lock request for other drivers
* Start navigation (Google Maps redirect)
* Send live location continuously
* Complete trip
* Report false emergency

---

# 2.4 Organization Dashboard (Web)

### Technologies:

* React.js
* Node.js + Express.js
* Firestore
* Maps JavaScript SDK

### Features:

#### Driver Management:

* Add driver
* Edit driver
* Delete driver
* Activate / deactivate driver

#### Ambulance Management:

* Add ambulance
* Assign driver to ambulance

#### Monitoring:

* View active emergencies
* View assigned ambulances
* Live map of ambulances
* Emergency history

#### Reports:

* View false emergency reports

---

# 2.5 Super Admin Panel (Web)

### Technologies:

* React.js
* Node.js + Express.js
* Firestore

### Features:

#### Organization Management:

* View all organizations
* Approve / Reject new organizations
* Activate / deactivate organizations

#### System Monitoring:

* View all users
* View all drivers
* Monitor active emergencies

#### Abuse Control:

* View reports
* Track report count
* Auto suspend users after 3 reports

---

# 3. Real-Time Tracking Logic

### Technologies:

* React Native
* Firebase Realtime Database
* GPS

### Logic:

* Driver sends location to:
  `/liveLocations/{driverId}`
* User listens to assigned driver node
* Map updates in real time
* When trip completes → location removed

---

# 4. Emergency Request System

### Technologies:

* Node.js + Express.js
* Firestore

### Flow:

* User sends emergency request

* Store:

  * userId
  * location
  * status = Pending

* Fetch nearby drivers

* Notify drivers

* Driver accepts:

  * Update request → Accepted
  * Assign driverId
  * Lock request

* Trip completes:

  * Status → Completed

---

# 5. Notification System

### Technologies:

* Firebase Cloud Messaging (FCM)

### Features:

* Notify drivers of new emergency
* Notify user when accepted
* Background notifications support

---

# 6. Abuse Reporting System

### Technologies:

* Firestore
* Node.js

### Logic:

* Driver reports user
* Store report
* Increment user report count
* If count ≥ 3:

  * Suspend user account
* Admin can review reports

---

# 7. API Design (Node.js + Express)

## User APIs:

* POST `/emergency/request`
* GET `/emergency/status`

## Driver APIs:

* GET `/driver/requests`
* POST `/driver/accept`
* POST `/driver/location`

## Organization APIs:

* POST `/org/driver/add`
* GET `/org/drivers`
* GET `/org/ambulances`

## Admin APIs:

* GET `/admin/organizations`
* POST `/admin/approve`
* POST `/admin/suspend-user`

---

# 8. Database Design

## Firestore Collections:

### Users

* id
* name
* role
* status
* reportCount

### Organizations

* id
* name
* email
* verified

### Drivers

* id
* orgId
* status
* isOnline

### Ambulances

* id
* orgId
* driverId

### Requests

* id
* userId
* driverId
* status
* location

---

## Realtime Database:

* `/liveLocations/{driverId}`

  * latitude
  * longitude
  * timestamp

---

# 9. Request Flow Logic

### Steps:

1. User sends emergency request
2. System finds nearby drivers
3. Drivers receive notification
4. First driver accepts
5. Request locked
6. User tracks ambulance
7. Trip completed

---

# 10. System Rules

* Only verified organizations can operate
* Drivers must belong to an organization
* One request → one driver
* Max 3 false reports → user suspended
* Real-time updates must be optimized

---

# 🎯 Final Goal

* Reduce emergency response time
* Provide real-time visibility
* Enable digital ambulance management
* Ensure reliable and simple system

---

# ✅ End of File
