# Apex Institute of Technology – Student Management Portal

\<p align="center">
&#x20; \<b>A Web-Based Student Management System\</b>
&#x20; \<br>
&#x20; Developed using HTML, CSS, JavaScript, Node.js, Express.js and MySQL.
\</p>

\<p align="center">
&#x20; \<a href="[https://github.com/Hemanth1204-web/student-portal](https://github.com/Hemanth1204-web/student-portal)">GitHub Repository\</a>
\</p>

---

## 1. Project Overview

The **Apex Institute of Technology Student Management Portal** is a full-stack web application designed to simplify and manage student-related academic information through a centralized platform.

The system provides separate login access for students and faculty members. Students can access their personal profiles, dashboards, attendance information and academic details. Faculty members can access their dedicated faculty interface.

The application uses HTML, CSS and JavaScript for the frontend, Node.js and Express.js for backend development, and MySQL for database management.

## 2. Project Objectives

- Develop a centralized student management platform.
- Provide separate login access for students and faculty.
- Implement student authentication using enrollment numbers and passwords.
- Add OTP-based verification to student login.
- Allow students to view their personal and academic information.
- Provide an organized dashboard for accessing portal features.
- Store and manage student and faculty records using MySQL.
- Develop a user-friendly and responsive interface.

## 3. Technologies Used

| Component                   | Technology              |
| --------------------------- | ----------------------- |
| Frontend                    | HTML5, CSS3, JavaScript |
| Backend                     | Node.js                 |
| Backend Framework           | Express.js              |
| Database                    | MySQL                   |
| Database Connector          | mysql2                  |
| Authentication              | Session-based login     |
| OTP Generation              | Node.js Crypto          |
| Password Hashing Dependency | bcrypt                  |
| Environment Configuration   | dotenv                  |
| Development Environment     | Visual Studio Code      |
| Version Control             | Git and GitHub          |

## 4. Main Features

### Student Module

- Student login using enrollment number and password.
- OTP-based login verification.
- Personalized student dashboard.
- Student profile management and information display.
- Attendance section.
- Academic information access.

### Faculty Module

- Separate faculty login.
- Faculty authentication using faculty credentials.
- Dedicated faculty dashboard.
- Separate faculty interface.

### Authentication Module

- Role-based login for students and faculty.
- Six-digit OTP generation for student login.
- OTP verification before granting student dashboard access.
- OTP expiration after five minutes.
- Maximum of five incorrect OTP attempts.
- Sixty-second OTP resend cooldown.
- Password visibility toggle.
- Remember Me option.

## 5. Project Repository

**GitHub Repository:**

[https://github.com/Hemanth1204-web/student-portal](https://github.com/Hemanth1204-web/student-portal)

To clone the repository:

```bash
git clone https://github.com/Hemanth1204-web/student-portal.git
```

## 6. Project Folder Structure

The following is the main project structure. Actual folders and filenames may vary depending on the implementation.

```text
student-portal/
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
├── README.md
│
├── public/
│   ├── index.html
│   │
│   ├── css/
│   │   └── login.css
│   │
│   ├── js/
│   │   └── login.js
│   │
│   └── pages/
│       ├── dashboard.html
│       ├── profile.html
│       └── attendance.html
│
└── faculty/
    └── pages/
        └── faculty-dashboard.html
```

## 7. System Requirements

The following software and tools are required to run the application:

- Node.js
- npm (Node Package Manager)
- MySQL Server
- MySQL Workbench (optional)
- Visual Studio Code
- Git
- Google Chrome or another modern web browser

## 8. Installation Instructions

Follow these steps to download and configure the project locally.

### Step 1: Clone the Repository

Open the terminal and execute:

```bash
git clone https://github.com/Hemanth1204-web/student-portal.git
```

### Step 2: Navigate to the Project Directory

```bash
cd student-portal
```

### Step 3: Open the Project in Visual Studio Code

```bash
code .
```

Alternatively, open the downloaded folder manually in Visual Studio Code.

### Step 4: Install Dependencies

Execute the following command in the VS Code terminal:

```bash
npm install
```

This command installs the dependencies specified in `package.json`.

Main dependencies include:

- express
- mysql2
- dotenv
- express-session
- bcrypt

## 9. Database Configuration

The application uses MySQL to store student and faculty information.

### Step 1: Start MySQL Server

Start your MySQL server using MySQL Workbench or your preferred MySQL management tool.

### Step 2: Create the Database

Create a database for the student management portal.

Example:

```sql
CREATE DATABASE student_portal;
```

### Step 3: Create Required Tables

Create the required student and faculty tables according to the database schema used by the application.

The database should contain the information required for student authentication, student profiles, academic details and faculty authentication.

**Note:** The database schema and initial records must be configured before running the application.

### Step 4: Configure Environment Variables

Create a `.env` file in the project root directory.

Example configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_portal
PORT=5000
```

Replace the example database credentials with your actual MySQL configuration.

Do not upload your actual `.env` file or database credentials to GitHub.

## 10. Running the Application

After completing the installation and database configuration, follow these steps.

### Step 1: Open the Project Terminal

Open the project folder in Visual Studio Code and launch the integrated terminal.

### Step 2: Start the Backend Server

Execute:

```bash
npm start
```

Alternatively, run:

```bash
node server.js
```

### Step 3: Access the Application

Open your browser and enter:

```text
http://localhost:5000
```

The Apex Institute of Technology Student Management Portal login page will be displayed.

### Step 4: Login to the Portal

1. Select the required login role.
2. Enter the login credentials.
3. For student login, complete the OTP verification process.
4. After successful authentication, the user will be redirected to the appropriate dashboard.

## 11. Student OTP Verification Process

The student login module includes an additional OTP verification mechanism to provide an extra authentication step.

The process works as follows:

1. The student enters their enrollment number and password.
2. The backend validates the credentials against the MySQL database.
3. After successful credential validation, a six-digit OTP is generated.
4. During development, the OTP and registered email address are displayed in the VS Code terminal.
5. The student enters the generated OTP on the login page.
6. The backend verifies the submitted OTP.
7. If verification is successful, the student is redirected to the dashboard.

### OTP Security Features

| Feature                    | Configuration                  |
| -------------------------- | ------------------------------ |
| OTP Length                 | 6 Digits                       |
| OTP Expiration             | 5 Minutes                      |
| Maximum Incorrect Attempts | 5                              |
| Resend Cooldown            | 60 Seconds                     |
| OTP Display                | VS Code Terminal (Development) |

**Note:** The current development implementation displays the OTP in the terminal. It does not automatically send the OTP to the student's email address.

## 12. Database Management

MySQL is used as the primary database management system.

The database stores and manages information such as:

- Student personal information.
- Student enrollment numbers.
- Student login credentials.
- Email addresses and contact information.
- Branch and course details.
- Academic year and semester information.
- Faculty account information.

The Node.js backend communicates with the MySQL database using the `mysql2` package.

## 13. Troubleshooting

| Issue                   | Possible Solution                                            |
| ----------------------- | ------------------------------------------------------------ |
| MySQL connection failed | Verify MySQL service status and database credentials.        |
| Module not found        | Execute `npm install`.                                       |
| Port already in use     | Change the port or stop the process using the existing port. |
| Login failed            | Verify login credentials and database records.               |
| OTP not appearing       | Check the VS Code terminal and server output.                |
| Application not loading | Ensure the backend server is running.                        |
| Database not found      | Create the database and verify the `.env` configuration.     |

## 14. Future Enhancements

The following features can be incorporated in future versions:

- Email-based OTP delivery.
- Subject-wise attendance management.
- Marks and examination management.
- Course and timetable management.
- Faculty attendance management.
- Administrative dashboard.
- Student academic performance reports.
- Downloadable attendance and academic reports.
- Enhanced authentication and password security.

## 15. Conclusion

The Apex Institute of Technology Student Management Portal provides a centralized web-based platform for managing student and faculty access to academic information.

The project demonstrates the practical implementation of full-stack web development by integrating frontend technologies, Node.js, Express.js and MySQL.

The application aims to simplify student information access, improve organization and provide a foundation for additional academic management features.

## 16. Author Information

| Detail       | Information                                                                         |
| ------------ | ----------------------------------------------------------------------------------- |
| Project Name | Apex Institute of Technology Student Management Portal                              |
| Author       | Gudipati Hemanth                                                                    |
| Department   | Computer Science and Engineering                                                    |
| Institution  | ICFAI University                                                                    |
| Project Type | Full-Stack Web Development                                                          |
| GitHub       | [Hemanth1204-web/student-portal](https://github.com/Hemanth1204-web/student-portal) |

---

\<p align="center">
&#x20; \<b>Apex Institute of Technology Student Management Portal\</b>
&#x20; \<br>
&#x20; \<i>Making Student Information Management Simpler and More Organized.\</i>
\</p>
