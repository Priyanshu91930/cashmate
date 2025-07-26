
# 💸 CashMate – UPI-Cash Exchange Platform for Students

CashMate is a real-time web application designed to help students exchange UPI money for cash conveniently and securely on campus. Whether you're out of physical currency or need digital funds quickly, CashMate connects students in need with those who can help.

## 🚀 Features

- 🔐 **Student Login System** – Login via student ID with secure password change options.
- 📍 **Location-Based Discovery** – See active users nearby using geolocation.
- 💰 **Request Money Feature** – One-click request sends alerts to nearby users.
- 🔗 **Connection Matching** – First user to accept the request connects with requester.
- 💬 **Real-Time Chat** – Integrated chat interface for payment confirmation & discussion.
- 🗺️ **Mini Map View** – See each other's location during active session.
- 🧾 **Transaction Details** – Share amount, confirm payment via Razorpay/UPI.
- 🧑‍🤝‍🧑 **User Profiles** – Basic student info visible during chat for identity confirmation.

## 🧱 Project Structure

/cashmate │ ├── /frontend (React App) │   ├── /components │   ├── /pages │   └── /assets │ ├── /backend (Node.js/Express) │   ├── /routes │   ├── /controllers │   └── server.js │ └── /data └── users.json (temporary storage for active user sessions)

## ⚙️ Tech Stack

- **Frontend:** React.js, TailwindCSS
- **Backend:** Node.js, Express
- **Database:** JSON (can be upgraded to MongoDB)
- **Authentication:** Basic login (student ID and password)
- **Payments:** Razorpay or UPI ID support
- **Geolocation:** HTML5 Geolocation API

## 📸 Screenshots

*(Add screenshots of: Login Page, Radar Map, Request Flow, Chat System, Payment Confirmation Page)*

## 🛠️ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/Priyanshu91930/cashmate.git
cd cashmate

# Start backend
cd backend
npm install
node server.js

# In a new terminal, start frontend
cd ../frontend
npm install
npm start

> Make sure to allow location access in the browser for full functionality.



🧪 Future Improvements

🔄 Use MongoDB for persistent database support

🔐 Implement JWT-based secure login

🌐 Add PWA support for offline access

🧭 Smart matching based on user rating, amount range, and time


🤝 Contribution

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.


---

📬 Contact

Made with ❤️ by Priyanshu Solanki

📧 Email: priyanshusolanki91930@gmail.com
🔗 LinkedIn: Your LinkedIn

