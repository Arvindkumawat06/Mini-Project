# FetalSense AI: Explainable Fetal Health Classification

![FetalSense AI](https://img.shields.io/badge/FetalSense-AI-teal?style=for-the-badge) 
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![scikit-learn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)

FetalSense AI is a full-stack, machine-learning-powered web application designed to assist obstetricians and medical professionals in evaluating fetal health. By analyzing 21 clinical features extracted from Cardiotocography (CTG) exams, the application accurately classifies fetal health states into **Normal**, **Suspect**, or **Pathological**.

Going beyond traditional "black-box" machine learning, this project implements state-of-the-art **Explainable AI (XAI)** techniques—specifically **SHAP** and **LIME**—to ensure that every prediction is fully transparent, interpretable, and clinically trustworthy.

---

## 🌟 Key Features

* **Real-time Predictive Analytics:** Uses a highly accurate Random Forest ensemble model trained on the UCI Cardiotocography dataset to evaluate 21 CTG parameters instantly.
* **Dual-Level Explainability:** 
  * **Global Context (SHAP):** Understand the overarching trends and the most critical features driving the model across the entire dataset.
  * **Local Context (LIME):** Get a customized, patient-specific breakdown of exactly *why* a specific diagnosis was made for an individual record.
* **Clinical Risk Scoring:** Converts raw machine learning probabilities into a weighted, easy-to-understand prototype risk score: `R = 100(0.2*Pn + 0.5*Ps + 1.0*Pp)`.
* **Modern & Responsive UI:** A beautiful, fully interactive dashboard built with React and Tailwind CSS, featuring smooth animations, dynamic charting (Recharts), and auto-scrolling workflows.
* **Dataset Explorer:** Directly explore and browse the underlying clinical records from the UCI Machine Learning Repository.

---

## 🏗️ Architecture & Tech Stack

This project is built using a decoupled, full-stack architecture for optimal performance and maintainability.

### Frontend (`/frontend`)
* **Framework:** React.js (via Vite)
* **Styling:** Tailwind CSS, Framer Motion (animations)
* **Data Visualization:** Recharts
* **Icons:** Lucide React
* **Routing:** React Router DOM

### Backend (`/backend`)
* **Framework:** FastAPI (Python)
* **Machine Learning:** scikit-learn, XGBoost, Pandas, NumPy
* **Explainable AI:** SHAP (`shap`), LIME (`lime`)
* **Model Serialization:** Joblib

---

## 🚀 How to Run Locally

Follow these steps to get the application running on your local machine. You will need to start both the Python backend server and the React frontend development server.

### Prerequisites
* Python 3.9+ installed
* Node.js (v16+) and npm installed

### 1. Start the Backend Server
Open a terminal and navigate to the `backend` directory.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment (optional but recommended)
python -m venv .venv_new

# 3. Activate the virtual environment
# On Windows:
.\.venv_new\Scripts\activate
# On Mac/Linux:
# source .venv_new/bin/activate

# 4. Install the required Python dependencies
pip install -r requirements.txt
# (Ensure fastapi, uvicorn, scikit-learn, pandas, shap, lime, etc., are installed)

# 5. Start the FastAPI server using Uvicorn
python -m uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will now be running at `http://localhost:8000`.

### 2. Start the Frontend Application
Open a **new, separate terminal window** and navigate to the `frontend` directory.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
The frontend application will now be running. Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).

---

## 📊 Dataset Information
The model is trained on the **Cardiotocography Data Set** from the UCI Machine Learning Repository. 
* **Instances:** 2,126
* **Attributes:** 21 quantitative features (e.g., baseline heart rate, accelerations, prolonged decelerations, histogram variance).
* **Target Classes:** 
  1. Normal (Low Risk)
  2. Suspect (Medium Risk)
  3. Pathological (High Risk)

---

## 🤝 Disclaimer
*This application is a **research prototype** designed for academic and demonstrative purposes. It should not be used as a substitute for professional medical advice, diagnosis, or treatment.*
