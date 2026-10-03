# 🎓 Testing Project - Student Admission Portal & QA Automation Lab

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Playwright Tests](https://img.shields.io/badge/Playwright-29%20Tests%20Passing-brightgreen.svg)](https://playwright.dev/)
[![Express.js](https://img.shields.io/badge/Express-4.21.2-blue.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-JSON%20%7C%20MSSQL-orange.svg)](#database-setup)

**Testing Project** is a full-stack student admission web application built with vanilla web technologies and an Express REST API backend. 

It is specially designed as an **end-to-end QA Automation Playground** containing **5 intentional software bugs** toggled via a built-in switch, backed by a comprehensive suite of **29 Playwright automation tests** (covering Functional E2E, Bug Spotting, Security, Performance, Mobile Responsiveness, Accessibility, and API Contracts).

---

## 📺 Project Demo Video

Watch the full walk-through showing the application workflow, toggling bugs, and running the automated test suite:

<!-- Option A: Embedded MP4 Video (works on GitHub if uploaded directly to assets or repo) -->
https://github.com/user-attachments/assets/your-video-id-here

> 💡 **Tip:** To embed your video on GitHub:
> 1. Drag and drop your `.mp4` / `.mov` file directly into this README while editing it on GitHub.
> 2. Or replace the link below with your YouTube/Loom demo:

[![Watch the Demo Video]((https://youtu.be/HqPL3ExmPVE))

---

## ✨ Features

- **Multi-Step Admission Form:**
  - **Step 1:** Authentication (Login with credential check).
  - **Step 2:** Personal Details (Name, Email, Stream, Class, DOB, Gender).
  - **Step 3:** File Uploads (Supports documents and profile photos via Multer).
  - **Step 4:** Confirmation & Summary generation.
- **Dual-Mode Database Layer:**
  - Default: Light-weight, zero-config flat file JSON (`data/db.json`).
  - Optional: Microsoft SQL Server (`mssql`) with automatic schema setup.
- **QA Interactive Dashboard:** Built-in interactive dashboard to monitor test runs visually at `/test-dashboard.html`.
- **Bug Simulation Toggle:** A switch in the header that activates 5 deliberate edge-case bugs for automation training.

---

## 🐛 Intentional Bugs (Bug Mode)

When the **"Bug Mode"** toggle is turned on, the system triggers the following behaviors:

| Bug ID | Location | Expected vs Actual Behavior |
| :--- | :--- | :--- |
| **BUG-01** | Login Form | Subdomain and plus-tagged emails (e.g., `student@mail.temous.edu`) get falsely rejected by an overly strict regex. |
| **BUG-02** | Form Details | Selecting the **Commerce** stream silently resets the Class dropdown selection. |
| **BUG-03** | Validation | The Date of Birth future-date validation check is bypassed, allowing future dates. |
| **BUG-04** | Accessibility / UX | The `for` attribute for the "Other" gender label targets the "Female" radio button. |
| **BUG-05** | Form Submission | The submission button freezes on "Saving Application..." permanently upon any upload error. |

---

## 📁 Repository Structure

```text
BasicTestInterface/
├── .env                          # DB settings & environment configurations
├── package.json                  # Dependencies & test run scripts
├── playwright.config.js          # Playwright test framework configuration
├── server.js                     # Express REST API & static server
├── database.js                   # Dual database abstraction (JSON & MSSQL)
├── brain.md                      # Detailed internal architecture knowledge base
├── data/
│   └── db.json                   # Flat-file database (auto-created on first run)
├── uploads/                      # Uploaded files folder (auto-created)
├── public/                       # Frontend SPA files (Vanilla HTML, CSS, JS)
│   ├── index.html                # Main 3-step application form
│   ├── style.css                 # Dark theme responsive styling
│   ├── app.js                    # Client logic and bug simulation code
│   └── test-dashboard.html       # Visual QA test dashboard
└── tests/                        # 29 Playwright test specs
    ├── helpers.js                # Helper utilities (dummy file generators)
    ├── 01_e2e_happy_path.spec.js
    ├── 02_bug01_subdomain_email.spec.js
    ├── 03_bug02_commerce_stream.spec.js
    ├── 04_bug03_dob_future_date.spec.js
    ├── 05_bug04_gender_label_mismatch.spec.js
    ├── 06_backend_persistence.spec.js
    ├── 07_duplicate_email_rejection.spec.js
    ├── 08_schema_regression_backwards_compatibility.spec.js
    ├── 09_incomplete_form_validation.spec.js
    ├── 10_performance_page_load.spec.js
    ├── 11_security_login_rejection.spec.js
    ├── 12_mobile_responsiveness.spec.js
    ├── 13_keyboard_accessibility.spec.js
    └── 14_api_contract_verification.spec.js
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes with Node.js)

### 2. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/your-username/temous-central.git
cd temous-central
npm install
```

Install the Playwright browser binaries:

```bash
npx playwright install chromium
```

### 3. Run the Application

Start the local server:

```bash
npm start
```

Open your browser and navigate to:
- **Application:** `http://localhost:3000`
- **QA Test Dashboard:** `http://localhost:3000/test-dashboard.html`

### 4. Default Login Credentials

You can use any of these pre-seeded accounts:
- `admin@temous.com` / `password123`
- `test@temous.com` / `PassWord123!`
- `student@mail.temous.edu` / `password123`

---

## 🧪 Running Automated Tests

All tests are implemented using **Playwright**.

### Run All 29 Tests (Headless)
```bash
npm test
```

### Run Tests with Interactive UI
```bash
npm run test:ui
```

### Run Specific Test Categories
```bash
# Performance & Load Time Tests
npm run test:perf

# Security & Injection Rejection Tests
npm run test:security

# Multi-Device Responsive Tests (320px to 1440px)
npm run test:responsive

# Accessibility (Keyboard & Screen Reader) Tests
npm run test:a11y

# Backend API Contract Verification Tests
npm run test:api
```

### View Playwright HTML Report
```bash
npx playwright show-report
```

---

## 🗄️ Database Setup (Optional MSSQL)

By default, the application runs using `data/db.json` with zero configuration needed. 

If you want to run with **Microsoft SQL Server**:
1. Open `.env` and set `USE_MSSQL=true`.
2. Provide your SQL Server credentials:
   ```env
   USE_MSSQL=true
   DB_SERVER=localhost
   DB_PORT=1433
   DB_NAME=TemousCentralDB
   DB_USER=sa
   DB_PASSWORD=YourPassword123
   ```
3. Start the server (`npm start`). It will automatically create the required database tables.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
