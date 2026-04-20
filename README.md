# 💰 ExpenseX - Full-Stack Data Dashboard

ExpenseX is a premium, full-stack financial platform designed to track, analyze, and visualize personal or business expenses. It combines a **Python API** for robust data processing with a **React-SPA** for a high-performance user experience.
demo: https://expense-tracker-mikli0ihx-shrutibedve10-3390s-projects.vercel.app

---

## 🚀 Advanced Features

### 🌐 Smart Web App (React)
- **Full CRUD Support**: Add and delete transactions with instant UI feedback.
- **Real-Time Search**: Instantly find specific transactions by description.
- **Category Filtering**: Drill down into specific spending areas like Rent, Food, or Salaries.
- **Glassmorphism UI**: A technical, modern dark-mode design with blurred surfaces.

### 📊 Python Backend & Analytics
- **REST API (Flask)**: Serves live data from CSV and handles persistence.
- **Analytical Dashboard (Streamlit)**: Deep-dive statistical charts and monthly trend analysis.
- **PDF Export**: Generate professional financial reports with the click of a button.
- **Currency Support**: Fully localized for the **Indian Rupee (₹)**.

---

## 🛠 Tech Stack

| Layer | Tools |
| :--- | :--- |
| **Frontend** | React (Vite), Recharts, Lucide Icons |
| **Backend** | Python, Flask, Pandas, FPDF2 |
| **Dashboard** | Streamlit, Matplotlib |
| **Data** | Flat-File (CSV), soon-to-be SQL |

---

## 📂 Project Structure

```text
Expense-Tracker-App/
├── backend/
│   ├── data/            # Local data storage
│   ├── main.py          # Data Science logic
│   ├── api.py           # REST API Server
│   ├── app.py           # Streamlit Web App
│   └── outputs/         # Generated PDF reports
├── frontend/
│   ├── src/             # Premium React source
│   └── dist/            # Production build
└── README.md
```

---

## ⚙️ How to Run Locally

### 1. API Server (Required)
```powershell
cd backend
.\venv\Scripts\activate
python api.py
```

### 2. Frontend (The UI)
```powershell
cd frontend
npm install
npm run dev
```

### 3. Analytics (Optional)
```powershell
cd backend
.\venv\Scripts\activate
streamlit run app.py
```
