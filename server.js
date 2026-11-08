const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MYSQL CONNECTION
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// TEST MYSQL CONNECTION
async function testDatabase() {
    try {
        const connection = await db.getConnection();
        console.log("MySQL Connected Successfully");
        console.log("Database:", process.env.DB_NAME);
        connection.release();
    } catch (error) {
        console.error("MySQL Connection Failed:", error.message);
    }
}

testDatabase();

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "public")));
app.use("/faculty", express.static(path.join(__dirname, "faculty")));

// HOME / LOGIN PAGE
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ROLE-BASED LOGIN
app.post("/api/login", async (req, res) => {
    try {
        const { enrollmentNumber, password, role } = req.body;

        if (!enrollmentNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter your ID and password."
            });
        }

        // STUDENT LOGIN
        if (role === "student") {
            const [rows] = await db.query(
                `SELECT
                    id, first_name, last_name,
                    enrollment_number, password,
                    gender, date_of_birth, email,
                    phone, branch, course, batch,
                    year_of_study, semester, section
                 FROM students
                 WHERE enrollment_number = ?
                   AND password = ?
                 LIMIT 1`,
                [enrollmentNumber.trim(), password]
            );

            if (rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid enrollment number or password."
                });
            }

            const student = rows[0];
            delete student.password;

            return res.json({
                success: true,
                message: "Student login successful.",
                student
            });
        }

        // FACULTY LOGIN
        if (role === "faculty") {
            const [rows] = await db.query(
                `SELECT id, faculty_id, faculty_name, email
                 FROM faculty_accounts
                 WHERE faculty_id = ?
                   AND password = ?
                 LIMIT 1`,
                [enrollmentNumber.trim(), password]
            );

            if (rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid faculty ID or password."
                });
            }

            return res.json({
                success: true,
                message: "Faculty login successful.",
                faculty: rows[0]
            });
        }

        if (role === "admin") {
            return res.status(501).json({
                success: false,
                message: "Admin login is not configured yet."
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid login role."
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
});

// DASHBOARD DATA
app.get("/api/dashboard/:studentId", async (req, res) => {
    try {
        const studentId = req.params.studentId;

        const [studentRows] = await db.query(
            `SELECT
                id, first_name, last_name,
                enrollment_number, branch, course,
                batch, year_of_study, semester, section
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = studentRows[0];

        const [attendanceRows] = await db.query(
            `SELECT
                subject_code, subject_name,
                classes_held, classes_attended,
                attendance_percentage, semester
             FROM attendance
             WHERE student_id = ?
               AND semester = ?
             ORDER BY subject_code`,
            [studentId, student.semester]
        );

        let totalHeld = 0;
        let totalAttended = 0;

        attendanceRows.forEach(record => {
            totalHeld += Number(record.classes_held || 0);
            totalAttended += Number(record.classes_attended || 0);
        });

        const overallAttendance = totalHeld > 0
            ? (totalAttended / totalHeld) * 100
            : 0;

        return res.json({
            success: true,
            student,
            attendance: attendanceRows,
            overallAttendance: Number(overallAttendance.toFixed(2))
        });
    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard data"
        });
    }
});

// TEST STUDENT DATABASE
app.get("/api/test-student", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT
                first_name, last_name, enrollment_number,
                branch, batch, year_of_study, semester, section
             FROM students
             LIMIT 1`
        );

        return res.json(rows[0] || null);
    } catch (error) {
        console.error("Test Student Error:", error);

        return res.status(500).json({
            success: false,
            message: "Database query failed"
        });
    }
});

// COURSES DATA
app.get("/api/courses", async (req, res) => {
    try {
        const semesterNumber = Number(req.query.semester);
        const studentSection = String(req.query.section || "")
            .trim()
            .toUpperCase();
        const branch = String(req.query.branch || "")
            .trim()
            .toUpperCase();

        const validSections = {
            CSE: ["A", "B", "C", "D"],
            AIML: ["E", "F", "G", "H"],
            AIDS: ["I", "J", "K", "L"],
            ECE: ["M", "N", "O", "P"]
        };

        if (
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            semesterNumber > 7
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester"
            });
        }

        if (!validSections[branch]) {
            return res.status(400).json({
                success: false,
                message: "Invalid branch"
            });
        }

        if (!validSections[branch].includes(studentSection)) {
            return res.status(400).json({
                success: false,
                message: "Invalid section for this branch"
            });
        }

        const [rows] = await db.query(
            `SELECT course_code, course_name, semester,
                    section, faculty_name
             FROM courses
             WHERE semester = ?
               AND section = ?
               AND branch = ?
             ORDER BY course_code ASC`,
            [semesterNumber, studentSection, branch]
        );

        return res.json({
            success: true,
            courses: rows
        });
    } catch (error) {
        console.error("Courses Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load courses"
        });
    }
});

// ATTENDANCE BY SEMESTER
app.get("/api/attendance/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        const semester = Number(req.query.semester);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        if (!Number.isInteger(semester) || semester < 1 || semester > 7) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester"
            });
        }

        const [students] = await db.query(
            `SELECT id, branch, year_of_study, semester, section
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = students[0];

        const yearMap = {
            "1st Year": 1,
            "2nd Year": 2,
            "3rd Year": 3,
            "4th Year": 4
        };

        const yearOfStudy =
            yearMap[String(student.year_of_study).trim()];

        if (!yearOfStudy) {
            return res.status(400).json({
                success: false,
                message: "Invalid student year of study"
            });
        }

        const [rows] = await db.query(
            `SELECT
                s.course_code AS subject_code,
                s.course_name AS subject_name,
                s.semester,
                COUNT(DISTINCT s.id) AS classes_held,
                COUNT(DISTINCT CASE
                    WHEN r.status = 'Present' THEN s.id
                END) AS classes_attended,
                ROUND(
                    100.0 * COUNT(DISTINCT CASE
                        WHEN r.status = 'Present' THEN s.id
                    END) / NULLIF(COUNT(DISTINCT s.id), 0),
                    2
                ) AS attendance_percentage
             FROM faculty_attendance_sessions s
             INNER JOIN faculty_attendance_records r
                ON r.session_id = s.id
               AND r.student_id = ?
             WHERE UPPER(TRIM(s.branch)) = UPPER(TRIM(?))
               AND s.year_of_study = ?
               AND s.semester = ?
               AND UPPER(TRIM(s.section)) = UPPER(TRIM(?))
             GROUP BY s.course_code, s.course_name, s.semester
             ORDER BY s.course_code`,
            [
                studentId,
                student.branch,
                yearOfStudy,
                semester,
                student.section
            ]
        );

        return res.json({
            success: true,
            attendance: rows
        });
    } catch (error) {
        console.error("Student attendance API error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load attendance",
            error: error.message
        });
    }
});

// MARKS DATA
app.get("/api/marks/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        const semester = Number(req.query.semester);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        if (!Number.isInteger(semester) || semester < 1 || semester > 7) {
            return res.status(400).json({
                success: false,
                message: "Invalid semester"
            });
        }

        const [studentRows] = await db.query(
            `SELECT id, semester
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const [rows] = await db.query(
            `SELECT
                subject_code, subject_name, semester,
                has_lab, mid_term, assignment_1,
                assignment_2, lab_internal
             FROM marks
             WHERE student_id = ?
               AND semester = ?
             ORDER BY subject_code ASC`,
            [studentId, semester]
        );

        return res.json({
            success: true,
            marks: rows,
            currentSemester: Number(studentRows[0].semester),
            selectedSemester: semester,
            message: rows.length > 0
                ? "Marks loaded successfully."
                : "No marks have been uploaded for this semester yet."
        });
    } catch (error) {
        console.error("Marks API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load marks"
        });
    }
});

// FEES API
app.get("/api/fees/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const [studentRows] = await db.query(
            `SELECT
                id, first_name, last_name, enrollment_number,
                branch, section, year_of_study, semester,
                residence_type, transport_type
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = studentRows[0];

        const [feeRows] = await db.query(
            `SELECT
                semester, semester_fee, bus_fee,
                hostel_fee, total_paid, paid_date
             FROM fees
             WHERE student_id = ?
             ORDER BY semester ASC`,
            [studentId]
        );

        return res.json({
            success: true,
            student: {
                name: `${student.first_name} ${student.last_name}`.trim(),
                enrollment_number: student.enrollment_number,
                branch: student.branch,
                section: student.section,
                year_of_study: student.year_of_study,
                current_semester: student.semester,
                residence_type: student.residence_type,
                transport_type: student.transport_type
            },
            fees: feeRows
        });
    } catch (error) {
        console.error("Fees API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load fees"
        });
    }
});

// HALL TICKET API
app.get("/api/hall-ticket/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const [studentRows] = await db.query(
            `SELECT
                id, first_name, last_name, enrollment_number,
                branch, course, batch, year_of_study,
                semester, section
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = studentRows[0];
        const prefix = String(student.enrollment_number).substring(0, 2);

        let currentSemester;

        if (prefix === "26") {
            currentSemester = 1;
        } else if (prefix === "25") {
            currentSemester = 3;
        } else if (prefix === "24") {
            currentSemester = 5;
        } else if (prefix === "23") {
            currentSemester = 7;
        } else {
            currentSemester = Number(student.semester);
        }

        const availableSemesters = [];

        if (currentSemester > 1) {
            for (let i = 1; i < currentSemester; i++) {
                availableSemesters.push(i);
            }
        }

        let exams = [];

        if (availableSemesters.length > 0) {
            const placeholders = availableSemesters
                .map(() => "?")
                .join(",");

            const [examRows] = await db.query(
                `SELECT
                    semester, subject_code, subject_name,
                    exam_date, start_time, end_time
                 FROM hall_ticket_exams
                 WHERE semester IN (${placeholders})
                 ORDER BY semester, exam_date`,
                availableSemesters
            );

            exams = examRows;
        }

        return res.json({
            success: true,
            student: {
                name: `${student.first_name} ${student.last_name}`.trim(),
                enrollment_number: student.enrollment_number,
                branch: student.branch,
                course: student.course,
                batch: student.batch,
                section: student.section,
                year_of_study: student.year_of_study,
                current_semester: currentSemester
            },
            availableSemesters,
            exams
        });
    } catch (error) {
        console.error("Hall Ticket API Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load hall ticket"
        });
    }
});

// PASSWORD RESET OTP — DEVELOPMENT MODE
const passwordResetOtps = new Map();
const otpRequestTimes = new Map();
const otpFailedAttempts = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000;

// REQUEST OTP
app.post("/api/settings/request-password-otp", async (req, res) => {
    try {
        const studentId = Number(req.body.studentId);
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!Number.isInteger(studentId) || studentId <= 0 || !email) {
            return res.status(400).json({
                success: false,
                message: "Student ID and registered email are required."
            });
        }

        const lastRequest = otpRequestTimes.get(studentId) || 0;
        const remaining = 60000 - (Date.now() - lastRequest);

        if (remaining > 0) {
            return res.status(429).json({
                success: false,
                message: `Please wait ${Math.ceil(remaining / 1000)} seconds before requesting another OTP.`
            });
        }

        const [students] = await db.query(
            `SELECT id, email
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (
            students.length === 0 ||
            !students[0].email ||
            String(students[0].email).trim().toLowerCase() !== email
        ) {
            return res.json({
                success: true,
                message: "If the details match your account, an OTP will be generated."
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(`${studentId}:${otp}`)
            .digest("hex");

        passwordResetOtps.set(studentId, {
            email,
            otpHash,
            expiresAt: Date.now() + OTP_EXPIRY_MS
        });

        otpFailedAttempts.set(studentId, 0);
        otpRequestTimes.set(studentId, Date.now());

        if (process.env.NODE_ENV !== "production") {
            console.log("\n======================================");
            console.log("[DEV ONLY] Password reset OTP");
            console.log("Student ID:", studentId);
            console.log("OTP:", otp);
            console.log("Expires in: 5 minutes");
            console.log("======================================\n");
        }

        return res.json({
            success: true,
            message: "OTP generated. Check the server terminal in development mode."
        });
    } catch (error) {
        console.error("Request OTP error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process the OTP request."
        });
    }
});

// VERIFY OTP AND CHANGE PASSWORD
app.post("/api/settings/verify-password-otp", async (req, res) => {
    try {
        const studentId = Number(req.body.studentId);
        const email = String(req.body.email || "").trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");

        if (
            !Number.isInteger(studentId) ||
            studentId <= 0 ||
            !email ||
            !/^\d{6}$/.test(otp) ||
            newPassword.length < 8 ||
            newPassword.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter valid details and a password between 8 and 128 characters."
            });
        }

        const record = passwordResetOtps.get(studentId);

        if (!record || record.email !== email) {
            return res.status(400).json({
                success: false,
                message: "Request a new OTP and try again."
            });
        }

        if (Date.now() > record.expiresAt) {
            passwordResetOtps.delete(studentId);
            otpFailedAttempts.delete(studentId);

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new one."
            });
        }

        const attempts = otpFailedAttempts.get(studentId) || 0;

        if (attempts >= 5) {
            passwordResetOtps.delete(studentId);

            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Request a new OTP."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(`${studentId}:${otp}`)
            .digest("hex");

        const hashesMatch = crypto.timingSafeEqual(
            Buffer.from(submittedHash, "hex"),
            Buffer.from(record.otpHash, "hex")
        );

        if (!hashesMatch) {
            otpFailedAttempts.set(studentId, attempts + 1);

            return res.status(400).json({
                success: false,
                message: "Incorrect OTP."
            });
        }

        const [students] = await db.query(
            `SELECT id, email
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (
            students.length === 0 ||
            String(students[0].email || "").trim().toLowerCase() !== email
        ) {
            passwordResetOtps.delete(studentId);

            return res.status(400).json({
                success: false,
                message: "Unable to verify this account. Request a new OTP."
            });
        }

        // Matches the current plain-text password login implementation.
        // Use bcrypt hashing before deploying this application publicly.
        await db.query(
            `UPDATE students
             SET password = ?
             WHERE id = ?`,
            [newPassword, studentId]
        );

        passwordResetOtps.delete(studentId);
        otpFailedAttempts.delete(studentId);
        otpRequestTimes.delete(studentId);

        return res.json({
            success: true,
            message: "Password changed successfully. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Verify OTP error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to change the password."
        });
    }
});

// FACULTY DASHBOARD: ASSIGNMENTS
app.get("/api/faculty/:facultyId/assignments", async (req, res) => {
    try {
        const facultyId = String(req.params.facultyId || "").trim();

        const [facultyRows] = await db.query(
            `SELECT faculty_id, faculty_name, email
             FROM faculty_accounts
             WHERE faculty_id = ?
             LIMIT 1`,
            [facultyId]
        );

        if (facultyRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Faculty account not found."
            });
        }

        const faculty = facultyRows[0];

        const [assignments] = await db.query(
            `SELECT course_code, course_name, branch,
                    year_of_study, semester, section
             FROM courses
             WHERE LOWER(TRIM(faculty_name)) = LOWER(TRIM(?))
             ORDER BY semester, year_of_study, section, course_name`,
            [faculty.faculty_name]
        );

        return res.json({
            success: true,
            faculty,
            assignments
        });
    } catch (error) {
        console.error("Faculty assignments error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load faculty assignments."
        });
    }
});

// FACULTY: MY STUDENTS
app.get("/api/faculty/:facultyId/students", async (req, res) => {
    try {
        const facultyId = String(req.params.facultyId || "").trim();
        const courseCode = String(req.query.course_code || "").trim();
        const year = String(req.query.year || "").trim();
        const semester = String(req.query.semester || "").trim();
        const section = String(req.query.section || "").trim();

        if (!facultyId) {
            return res.status(400).json({
                success: false,
                message: "Faculty ID is required."
            });
        }

        const [facultyRows] = await db.query(
            `SELECT faculty_id, faculty_name
             FROM faculty_accounts
             WHERE faculty_id = ?
             LIMIT 1`,
            [facultyId]
        );

        if (facultyRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Faculty account not found."
            });
        }

        const faculty = facultyRows[0];

        let sql = `
            SELECT DISTINCT
                s.id,
                s.enrollment_number,
                s.first_name,
                s.last_name,
                s.branch,
                s.year_of_study,
                s.semester,
                s.section
            FROM students AS s
            WHERE EXISTS (
                SELECT 1
                FROM courses AS c
                WHERE LOWER(TRIM(c.faculty_name)) =
                      LOWER(TRIM(?))
                  AND c.year_of_study = s.year_of_study
                  AND c.semester = s.semester
                  AND TRIM(c.section) = TRIM(s.section)
        `;

        const params = [faculty.faculty_name];

        if (courseCode) {
            sql += " AND c.course_code = ?";
            params.push(courseCode);
        }

        if (year) {
            sql += " AND CAST(c.year_of_study AS CHAR) = ?";
            params.push(year);
        }

        if (semester) {
            sql += " AND CAST(c.semester AS CHAR) = ?";
            params.push(semester);
        }

        if (section) {
            sql += " AND TRIM(c.section) = ?";
            params.push(section);
        }

        sql += `
            )
            ORDER BY
                s.year_of_study,
                s.semester,
                s.section,
                s.enrollment_number
        `;

        const [students] = await db.query(sql, params);

        return res.json({
            success: true,
            faculty: {
                faculty_id: faculty.faculty_id,
                faculty_name: faculty.faculty_name
            },
            total: students.length,
            students
        });
    } catch (error) {
        console.error("MY STUDENTS API ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load student records.",
            error: error.message
        });
    }
});

// GRADE LIST
app.get("/api/grade-list/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID"
            });
        }

        const [students] = await db.query(
            `SELECT id, first_name, last_name, enrollment_number,
                    branch, section, semester
             FROM students
             WHERE id = ?
             LIMIT 1`,
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const student = students[0];
        const prefix = String(student.enrollment_number).substring(0, 2);

        const semesterAccess = {
            "26": [],
            "25": [1, 2],
            "24": [1, 2, 3, 4],
            "23": [1, 2, 3, 4, 5, 6]
        };

        const allowedSemesters = semesterAccess[prefix];

        if (!allowedSemesters) {
            return res.status(400).json({
                success: false,
                message: "Unknown enrollment number format"
            });
        }

        if (allowedSemesters.length === 0) {
            return res.json({
                success: true,
                student,
                semesters: [],
                message: "Grade List is not available for first-year students yet."
            });
        }

        const [marks] = await db.query(
            `SELECT subject_code, subject_name, semester, has_lab,
                    mid_term, assignment_1, assignment_2, lab_internal
             FROM marks
             WHERE student_id = ?
               AND semester IN (${allowedSemesters.map(() => "?").join(",")})
             ORDER BY semester, subject_code`,
            [studentId, ...allowedSemesters]
        );

        // Generate example external marks once per subject.
        for (const mark of marks) {
            const [existing] = await db.query(
                `SELECT id
                 FROM external_exam_marks
                 WHERE student_id = ?
                   AND semester = ?
                   AND subject_code = ?
                 LIMIT 1`,
                [studentId, mark.semester, mark.subject_code]
            );

            if (existing.length === 0) {
                const external = Math.random() < 0.20
                    ? Math.floor(Math.random() * 15)
                    : Math.floor(Math.random() * 25) + 16;

                await db.query(
                    `INSERT IGNORE INTO external_exam_marks
                     (student_id, semester, subject_code, external_marks)
                     VALUES (?, ?, ?, ?)`,
                    [studentId, mark.semester, mark.subject_code, external]
                );
            }
        }

        function getGrade(total, external) {
            if (total < 40 || external < 16) {
                return { grade: "F", points: 0 };
            }
            if (total >= 90) return { grade: "O", points: 10 };
            if (total >= 80) return { grade: "A+", points: 9 };
            if (total >= 70) return { grade: "A", points: 8 };
            if (total >= 60) return { grade: "B+", points: 7 };
            if (total >= 50) return { grade: "B", points: 6 };
            return { grade: "C", points: 5 };
        }

        const [rows] = await db.query(
            `SELECT
                m.subject_code, m.subject_name, m.semester, m.has_lab,
                m.mid_term, m.assignment_1, m.assignment_2, m.lab_internal,
                e.external_marks
             FROM marks m
             JOIN external_exam_marks e
               ON e.student_id = m.student_id
              AND e.semester = m.semester
              AND e.subject_code = m.subject_code
             WHERE m.student_id = ?
               AND m.semester IN (${allowedSemesters.map(() => "?").join(",")})
             ORDER BY m.semester, m.subject_code`,
            [studentId, ...allowedSemesters]
        );

        const results = rows.map(row => {
            const internal = Number(row.has_lab)
                ? Number(row.mid_term || 0) + Number(row.lab_internal || 0)
                : Number(row.mid_term || 0)
                  + Number(row.assignment_1 || 0)
                  + Number(row.assignment_2 || 0);

            const external = Number(row.external_marks || 0);
            const total = internal + external;
            const result = getGrade(total, external);

            return {
                subject_code: row.subject_code,
                subject_name: row.subject_name,
                semester: Number(row.semester),
                internal,
                external,
                total,
                grade: result.grade,
                grade_points: result.points,
                result: result.grade === "F" ? "Fail" : "Pass"
            };
        });

        const semesters = allowedSemesters.map(semester => {
            const subjects = results.filter(
                item => item.semester === semester
            );

            const sgpa = subjects.length
                ? subjects.reduce((sum, item) => sum + item.grade_points, 0)
                  / subjects.length
                : 0;

            return {
                semester,
                subjects,
                sgpa: Number(sgpa.toFixed(2)),
                subjectCount: subjects.length
            };
        }).filter(item => item.subjectCount > 0);

        const allSubjects = semesters.flatMap(item => item.subjects);

        const cgpa = allSubjects.length
            ? allSubjects.reduce((sum, item) => sum + item.grade_points, 0)
              / allSubjects.length
            : 0;

        return res.json({
            success: true,
            student,
            semesters,
            cgpa: Number(cgpa.toFixed(2)),
            totalSubjects: allSubjects.length,
            failedSubjects: allSubjects.filter(
                item => item.grade === "F"
            ).length
        });
    } catch (error) {
        console.error("Grade List error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load Grade List"
        });
    }
});

// ==========================================
// TIMETABLE CONFIGURATION
// ==========================================

const TIMETABLE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const TIMETABLE_SLOTS = [
    { session: 1, start: "09:30", end: "10:20" },
    { session: 2, start: "10:20", end: "11:10" },
    { session: 3, start: "11:25", end: "12:15" },
    { session: 4, start: "12:15", end: "13:00" },
    { session: 5, start: "14:00", end: "14:40" },
    { session: 6, start: "14:40", end: "15:20" },
    { session: 7, start: "15:20", end: "16:00" }
];

const TIMETABLE_SESSIONS_PER_SUBJECT = 3;


// ==========================================
// BUILD TIMETABLE
// ==========================================

function buildTimetable(courses) {

    const timetable = [];

    const sectionOccupied = new Set();
    const facultyOccupied = new Set();
    const subjectDayOccupied = new Set();

    const tasks = [];

    // Create 3 weekly sessions for each subject.
    for (const course of courses) {

        const semester = Number(course.semester);
        const section = String(course.section || "")
            .trim()
            .toUpperCase();

        for (let i = 0; i < TIMETABLE_SESSIONS_PER_SUBJECT; i++) {

            tasks.push({
                semester,
                section,
                year_of_study: course.year_of_study,
                course_code: course.course_code,
                course_name: course.course_name,
                faculty_name: String(course.faculty_name || "").trim()
            });
        }
    }

    // Schedule subjects with frequently assigned faculty first.
    const facultyFrequency = new Map();

    for (const task of tasks) {

        if (!task.faculty_name) continue;

        const key = task.faculty_name.toLowerCase();

        facultyFrequency.set(
            key,
            (facultyFrequency.get(key) || 0) + 1
        );
    }

    tasks.sort((a, b) => {

        const fa = facultyFrequency.get(
            a.faculty_name.toLowerCase()
        ) || 0;

        const fb = facultyFrequency.get(
            b.faculty_name.toLowerCase()
        ) || 0;

        return fb - fa;
    });

    // Schedule each subject session.
    for (const task of tasks) {

        const candidates = [];

        for (const day of TIMETABLE_DAYS) {

            for (const slot of TIMETABLE_SLOTS) {

                const sectionKey =
                    `${task.semester}|${task.section}|${day}|${slot.session}`;

                const facultyKey =
                    `${task.faculty_name.toLowerCase()}|${day}|${slot.session}`;

                const subjectDayKey =
                    `${task.semester}|${task.section}|${task.course_code}|${day}`;

                if (sectionOccupied.has(sectionKey)) continue;

                if (
                    task.faculty_name &&
                    facultyOccupied.has(facultyKey)
                ) continue;

                // Avoid scheduling the same subject twice on one day.
                if (subjectDayOccupied.has(subjectDayKey)) continue;

                candidates.push({
                    day,
                    slot,
                    sectionKey,
                    facultyKey,
                    subjectDayKey,
                    score: Math.random()
                });
            }
        }

        candidates.sort((a, b) => a.score - b.score);

        if (candidates.length === 0) {

            throw new Error(
                `Could not schedule ${task.course_code} for Semester ` +
                `${task.semester}, Section ${task.section}. ` +
                "Check faculty assignments and weekly session counts."
            );
        }

        const chosen = candidates[0];

        sectionOccupied.add(chosen.sectionKey);

        if (task.faculty_name) {
            facultyOccupied.add(chosen.facultyKey);
        }

        subjectDayOccupied.add(chosen.subjectDayKey);

        timetable.push({
            semester: task.semester,
            section: task.section,
            year_of_study: task.year_of_study,
            day: chosen.day,
            session: chosen.slot.session,
            start_time: chosen.slot.start,
            end_time: chosen.slot.end,
            course_code: task.course_code,
            course_name: task.course_name,
            faculty_name: task.faculty_name
        });
    }

    return timetable;
}


// ==========================================
// STUDENT TIMETABLE API
// ==========================================

app.get("/api/timetable", async (req, res) => {

    try {

        const semester = Number(req.query.semester);

        const section = String(req.query.section || "")
            .trim()
            .toUpperCase();

        if (![1, 3, 5, 7].includes(semester)) {

            return res.status(400).json({
                success: false,
                message: "Semester must be 1, 3, 5, or 7."
            });
        }

        const validSections = [
            "A", "B", "C", "D",
            "E", "F", "G", "H",
            "I", "J", "K", "L",
            "M", "N", "O", "P"
        ];

        if (!validSections.includes(section)) {

            return res.status(400).json({
                success: false,
                message: "Invalid section."
            });
        }

        // Fetch only the requested semester and section.
        const [courses] = await db.query(
            `SELECT semester,
                    year_of_study,
                    section,
                    course_code,
                    course_name,
                    faculty_name
             FROM courses
             WHERE semester = ?
               AND UPPER(TRIM(section)) = ?
             ORDER BY course_code`,
            [semester, section]
        );

        if (courses.length === 0) {

            return res.json({
                success: true,
                semester,
                section,
                days: TIMETABLE_DAYS,
                slots: TIMETABLE_SLOTS,
                timetable: [],
                message: "No course assignments found for this section."
            });
        }

        const timetable = buildTimetable(courses);

        return res.json({
            success: true,
            semester,
            section,
            days: TIMETABLE_DAYS,
            slots: TIMETABLE_SLOTS,
            timetable
        });

    } catch (error) {

        console.error("Timetable API error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to generate timetable."
        });
    }
});

// GET STUDENT TIMETABLE
app.get("/api/timetable", async (req, res) => {
    try {
        const semester = Number(req.query.semester);

        const section = String(req.query.section || "")
            .trim()
            .toUpperCase();

        if (![1, 3, 5, 7].includes(semester)) {
            return res.status(400).json({
                success: false,
                message: "Semester must be 1, 3, 5, or 7."
            });
        }

        const validSections = [
            "A", "B", "C", "D",
            "E", "F", "G", "H",
            "I", "J", "K", "L",
            "M", "N", "O", "P"
        ];

        if (!validSections.includes(section)) {
            return res.status(400).json({
                success: false,
                message: "Invalid section."
            });
        }

        // Fetch only the requested semester and section.
        const [courses] = await db.query(
            `SELECT semester, year_of_study, section,
                    course_code, course_name, faculty_name
             FROM courses
             WHERE semester = ?
               AND UPPER(TRIM(section)) = ?
             ORDER BY course_code`,
            [semester, section]
        );

        if (courses.length === 0) {
            return res.json({
                success: true,
                semester,
                section,
                days: TIMETABLE_DAYS,
                slots: TIMETABLE_SLOTS,
                timetable: [],
                message: `No faculty course assignments found for Semester ${semester}, Section ${section}.`
            });
        }

        // Generate only this section's timetable.
        const timetable = buildTimetable(courses);

        return res.json({
            success: true,
            semester,
            section,
            days: TIMETABLE_DAYS,
            slots: TIMETABLE_SLOTS,
            timetable
        });

    } catch (error) {
        console.error("Timetable generation error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unable to generate timetable."
        });
    }
});
// ==========================================
// FACULTY ATTENDANCE API
// ==========================================

async function verifyFacultyAssignment(facultyId, input) {
    const [rows] = await db.query(
        `SELECT
            c.course_code,
            c.course_name,
            c.branch,
            c.year_of_study,
            c.semester,
            c.section,
            f.faculty_id,
            f.faculty_name
         FROM faculty_accounts f
         JOIN courses c
           ON LOWER(TRIM(c.faculty_name)) =
              LOWER(TRIM(f.faculty_name))
         WHERE f.faculty_id = ?
           AND c.course_code = ?
           AND c.year_of_study = ?
           AND c.semester = ?
           AND UPPER(TRIM(c.section)) = UPPER(TRIM(?))
         LIMIT 1`,
        [
            facultyId,
            input.course_code,
            input.year,
            input.semester,
            input.section
        ]
    );

    if (!rows.length) return null;

    const assignment = rows[0];

    if (
        input.branch &&
        assignment.branch &&
        assignment.branch.toUpperCase() !==
            String(input.branch).toUpperCase()
    ) {
        return null;
    }

    return assignment;
}

// GET STUDENTS FOR AN ASSIGNED CLASS
app.get(
    "/api/faculty/:facultyId/attendance/students",
    async (req, res) => {
        try {
            const facultyId = String(req.params.facultyId || "").trim();

            const {
                course_code,
                year,
                semester,
                section
            } = req.query;

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to your faculty account."
                });
            }

            const [students] = await db.query(
                `SELECT id, enrollment_number, first_name, last_name
                 FROM students
                 WHERE UPPER(TRIM(branch)) = UPPER(TRIM(?))
                   AND year_of_study = ?
                   AND semester = ?
                   AND UPPER(TRIM(section)) = UPPER(TRIM(?))
                 ORDER BY enrollment_number`,
                [
                    assignment.branch,
                    assignment.year_of_study,
                    assignment.semester,
                    assignment.section
                ]
            );

            return res.json({
                success: true,
                assignment,
                students
            });
        } catch (error) {
            console.error("Attendance students API error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load students.",
                error: error.message
            });
        }
    }
);

// SAVE OR UPDATE ATTENDANCE
app.post(
    "/api/faculty/:facultyId/attendance",
    async (req, res) => {
        let connection;

        try {
            const facultyId = String(
                req.params.facultyId || ""
            ).trim();

            const {
                course_code,
                year,
                semester,
                section,
                date,
                records
            } = req.body;

            if (
                !date ||
                !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                !Array.isArray(records) ||
                records.length === 0 ||
                records.some(record =>
                    !Number.isInteger(Number(record.student_id)) ||
                    Number(record.student_id) <= 0 ||
                    !["Present", "Absent"].includes(record.status)
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Provide a valid date and attendance status for every student."
                });
            }

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to your faculty account."
                });
            }

            const yearMap = {
                "1st Year": 1,
                "2nd Year": 2,
                "3rd Year": 3,
                "4th Year": 4
            };

            const assignmentYear = String(
                assignment.year_of_study ?? ""
            ).trim();

            const yearOfStudy =
                yearMap[assignmentYear] ?? Number(assignmentYear);

            if (![1, 2, 3, 4].includes(yearOfStudy)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid year of study."
                });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            await connection.query(
                `INSERT INTO faculty_attendance_sessions
                    (
                        faculty_id,
                        course_code,
                        course_name,
                        branch,
                        year_of_study,
                        semester,
                        section,
                        attendance_date
                    )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    course_name = VALUES(course_name)`,
                [
                    facultyId,
                    assignment.course_code,
                    assignment.course_name,
                    assignment.branch,
                    yearOfStudy,
                    assignment.semester,
                    assignment.section,
                    date
                ]
            );

            const [sessionRows] = await connection.query(
                `SELECT id
                 FROM faculty_attendance_sessions
                 WHERE faculty_id = ?
                   AND course_code = ?
                   AND branch = ?
                   AND year_of_study = ?
                   AND semester = ?
                   AND section = ?
                   AND attendance_date = ?
                 LIMIT 1`,
                [
                    facultyId,
                    assignment.course_code,
                    assignment.branch,
                    yearOfStudy,
                    assignment.semester,
                    assignment.section,
                    date
                ]
            );

            if (sessionRows.length === 0) {
                throw new Error(
                    "Attendance session could not be retrieved."
                );
            }

            const sessionId = sessionRows[0].id;

            const ids = [
                ...new Set(
                    records.map(record => Number(record.student_id))
                )
            ];

            const [validStudents] = await connection.query(
                `SELECT id
                 FROM students
                 WHERE id IN (${ids.map(() => "?").join(",")})
                   AND UPPER(TRIM(branch)) = UPPER(TRIM(?))
                   AND year_of_study = ?
                   AND semester = ?
                   AND UPPER(TRIM(section)) = UPPER(TRIM(?))`,
                [
                    ...ids,
                    assignment.branch,
                    assignment.year_of_study,
                    assignment.semester,
                    assignment.section
                ]
            );

            if (validStudents.length !== ids.length) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Some students do not belong to this assigned class."
                });
            }

            for (const record of records) {
                await connection.query(
                    `INSERT INTO faculty_attendance_records
                        (session_id, student_id, status)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        status = VALUES(status)`,
                    [
                        sessionId,
                        Number(record.student_id),
                        record.status
                    ]
                );
            }

            await connection.commit();

            return res.json({
                success: true,
                message: "Attendance saved successfully."
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error("Attendance rollback error:", rollbackError);
                }
            }

            console.error("Save attendance API error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to save attendance.",
                error: error.message
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);

// GET ATTENDANCE HISTORY
app.get(
    "/api/faculty/:facultyId/attendance/history",
    async (req, res) => {
        try {
            const facultyId = String(
                req.params.facultyId || ""
            ).trim();

            const {
                course_code,
                year,
                semester,
                section
            } = req.query;

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to your faculty account."
                });
            }

            const yearMap = {
                "1st Year": 1,
                "2nd Year": 2,
                "3rd Year": 3,
                "4th Year": 4
            };

            const assignmentYear = String(
                assignment.year_of_study ?? ""
            ).trim();

            const yearOfStudy =
                yearMap[assignmentYear] ?? Number(assignmentYear);

            if (![1, 2, 3, 4].includes(yearOfStudy)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid year of study."
                });
            }

            const [history] = await db.query(
                `SELECT
                    s.attendance_date,
                    s.course_code,
                    s.course_name,
                    s.section,
                    SUM(r.status = 'Present') AS present_count,
                    SUM(r.status = 'Absent') AS absent_count
                 FROM faculty_attendance_sessions s
                 LEFT JOIN faculty_attendance_records r
                   ON r.session_id = s.id
                 WHERE s.faculty_id = ?
                   AND s.course_code = ?
                   AND s.branch = ?
                   AND s.year_of_study = ?
                   AND s.semester = ?
                   AND UPPER(TRIM(s.section)) = UPPER(TRIM(?))
                 GROUP BY
                    s.id,
                    s.attendance_date,
                    s.course_code,
                    s.course_name,
                    s.section
                 ORDER BY s.attendance_date DESC`,
                [
                    facultyId,
                    assignment.course_code,
                    assignment.branch,
                    yearOfStudy,
                    assignment.semester,
                    assignment.section
                ]
            );

            return res.json({
                success: true,
                history
            });
        } catch (error) {
            console.error("Attendance history API error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load attendance history.",
                error: error.message
            });
        }
    }
);


// ==========================================
// FACULTY ATTENDANCE API
// ==========================================

async function verifyFacultyAssignment(facultyId, input) {
    const [rows] = await db.query(
        `SELECT
            c.course_code,
            c.course_name,
            c.branch,
            c.year_of_study,
            c.semester,
            c.section,
            f.faculty_id,
            f.faculty_name
         FROM faculty_accounts f
         JOIN courses c
           ON LOWER(TRIM(c.faculty_name)) =
              LOWER(TRIM(f.faculty_name))
         WHERE f.faculty_id = ?
           AND c.course_code = ?
           AND c.year_of_study = ?
           AND c.semester = ?
           AND UPPER(TRIM(c.section)) = UPPER(TRIM(?))
         LIMIT 1`,
        [
            facultyId,
            input.course_code,
            input.year,
            input.semester,
            input.section
        ]
    );

    if (!rows.length) return null;

    const assignment = rows[0];

    if (
        input.branch &&
        assignment.branch &&
        assignment.branch.toUpperCase() !==
            String(input.branch).toUpperCase()
    ) {
        return null;
    }

    return assignment;
}

// GET STUDENTS FOR AN ASSIGNED CLASS
app.get(
    "/api/faculty/:facultyId/attendance/students",
    async (req, res) => {
        try {
            const facultyId = String(req.params.facultyId || "").trim();

            const {
                course_code,
                year,
                semester,
                section
            } = req.query;

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to your faculty account."
                });
            }

            const [students] = await db.query(
                `SELECT id, enrollment_number, first_name, last_name
                 FROM students
                 WHERE UPPER(TRIM(branch)) = UPPER(TRIM(?))
                   AND year_of_study = ?
                   AND semester = ?
                   AND UPPER(TRIM(section)) = UPPER(TRIM(?))
                 ORDER BY enrollment_number`,
                [
                    assignment.branch,
                    assignment.year_of_study,
                    assignment.semester,
                    assignment.section
                ]
            );

            return res.json({
                success: true,
                assignment,
                students
            });
        } catch (error) {
            console.error("Attendance students API error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load students.",
                error: error.message
            });
        }
    }
);

// SAVE OR UPDATE ATTENDANCE
app.post(
    "/api/faculty/:facultyId/attendance",
    async (req, res) => {
        let connection;

        try {
            const facultyId = String(
                req.params.facultyId || ""
            ).trim();

            const {
                course_code,
                year,
                semester,
                section,
                date,
                records
            } = req.body;

            if (
                !date ||
                !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                !Array.isArray(records) ||
                records.length === 0 ||
                records.some(record =>
                    !Number.isInteger(Number(record.student_id)) ||
                    Number(record.student_id) <= 0 ||
                    !["Present", "Absent"].includes(record.status)
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Provide a valid date and attendance status for every student."
                });
            }

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to your faculty account."
                });
            }

            const yearMap = {
                "1st Year": 1,
                "2nd Year": 2,
                "3rd Year": 3,
                "4th Year": 4
            };

            const assignmentYear = String(
                assignment.year_of_study ?? ""
            ).trim();

            const yearOfStudy =
                yearMap[assignmentYear] ?? Number(assignmentYear);

            if (![1, 2, 3, 4].includes(yearOfStudy)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid year of study."
                });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            await connection.query(
                `INSERT INTO faculty_attendance_sessions
                    (
                        faculty_id,
                        course_code,
                        course_name,
                        branch,
                        year_of_study,
                        semester,
                        section,
                        attendance_date
                    )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    course_name = VALUES(course_name)`,
                [
                    facultyId,
                    assignment.course_code,
                    assignment.course_name,
                    assignment.branch,
                    yearOfStudy,
                    assignment.semester,
                    assignment.section,
                    date
                ]
            );

            const [sessionRows] = await connection.query(
                `SELECT id
                 FROM faculty_attendance_sessions
                 WHERE faculty_id = ?
                   AND course_code = ?
                   AND branch = ?
                   AND year_of_study = ?
                   AND semester = ?
                   AND section = ?
                   AND attendance_date = ?
                 LIMIT 1`,
                [
                    facultyId,
                    assignment.course_code,
                    assignment.branch,
                    yearOfStudy,
                    assignment.semester,
                    assignment.section,
                    date
                ]
            );

            if (sessionRows.length === 0) {
                throw new Error(
                    "Attendance session could not be retrieved."
                );
            }

            const sessionId = sessionRows[0].id;

            const ids = [
                ...new Set(
                    records.map(record => Number(record.student_id))
                )
            ];

            const [validStudents] = await connection.query(
                `SELECT id
                 FROM students
                 WHERE id IN (${ids.map(() => "?").join(",")})
                   AND UPPER(TRIM(branch)) = UPPER(TRIM(?))
                   AND year_of_study = ?
                   AND semester = ?
                   AND UPPER(TRIM(section)) = UPPER(TRIM(?))`,
                [
                    ...ids,
                    assignment.branch,
                    assignment.year_of_study,
                    assignment.semester,
                    assignment.section
                ]
            );

            if (validStudents.length !== ids.length) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Some students do not belong to this assigned class."
                });
            }

            for (const record of records) {
                await connection.query(
                    `INSERT INTO faculty_attendance_records
                        (session_id, student_id, status)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        status = VALUES(status)`,
                    [
                        sessionId,
                        Number(record.student_id),
                        record.status
                    ]
                );
            }

            await connection.commit();

            return res.json({
                success: true,
                message: "Attendance saved successfully."
            });
        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error("Attendance rollback error:", rollbackError);
                }
            }

            console.error("Save attendance API error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to save attendance.",
                error: error.message
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);

// GET ATTENDANCE HISTORY
app.get(
    "/api/faculty/:facultyId/attendance/history",
    async (req, res) => {
        try {
            const facultyId = String(
                req.params.facultyId || ""
            ).trim();

            const {
                course_code,
                year,
                semester,
                section
            } = req.query;

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This class is not assigned to your faculty account."
                });
            }

            const yearMap = {
                "1st Year": 1,
                "2nd Year": 2,
                "3rd Year": 3,
                "4th Year": 4
            };

            const assignmentYear = String(
                assignment.year_of_study ?? ""
            ).trim();

            const yearOfStudy =
                yearMap[assignmentYear] ?? Number(assignmentYear);

            if (![1, 2, 3, 4].includes(yearOfStudy)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid year of study."
                });
            }

            const [history] = await db.query(
                `SELECT
                    s.attendance_date,
                    s.course_code,
                    s.course_name,
                    s.section,
                    SUM(r.status = 'Present') AS present_count,
                    SUM(r.status = 'Absent') AS absent_count
                 FROM faculty_attendance_sessions s
                 LEFT JOIN faculty_attendance_records r
                   ON r.session_id = s.id
                 WHERE s.faculty_id = ?
                   AND s.course_code = ?
                   AND s.branch = ?
                   AND s.year_of_study = ?
                   AND s.semester = ?
                   AND UPPER(TRIM(s.section)) = UPPER(TRIM(?))
                 GROUP BY
                    s.id,
                    s.attendance_date,
                    s.course_code,
                    s.course_name,
                    s.section
                 ORDER BY s.attendance_date DESC`,
                [
                    facultyId,
                    assignment.course_code,
                    assignment.branch,
                    yearOfStudy,
                    assignment.semester,
                    assignment.section
                ]
            );

            return res.json({
                success: true,
                history
            });
        } catch (error) {
            console.error("Attendance history API error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load attendance history.",
                error: error.message
            });
        }
    }
);

/* ==========================================================
   FACULTY MARKS MANAGEMENT API
========================================================== */


/* ==========================================================
   GET STUDENTS AND THEIR EXISTING MARKS
========================================================== */

app.get(
    "/api/faculty/:facultyId/marks/students",
    async (req, res) => {
        const { facultyId } = req.params;

        const {
            course_code,
            year,
            semester,
            section,
            branch
        } = req.query;

        try {
            if (
                !course_code ||
                !year ||
                !semester ||
                !section
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "course_code, year, semester and section are required."
                });
            }

            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year,
                    semester,
                    section,
                    branch
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not assigned to teach this subject and section."
                });
            }

            const [students] = await db.query(
                `
                SELECT
                    s.id,
                    s.enrollment_number,
                    s.first_name,
                    s.last_name,

                    COALESCE(m.has_lab, 0) AS has_lab,

                    m.mid_term,
                    m.assignment_1,
                    m.assignment_2,
                    m.lab_internal

                FROM students s

                LEFT JOIN marks m
                    ON m.student_id = s.id
                    AND m.subject_code = ?
                    AND m.semester = ?

                WHERE s.branch = ?
                    AND s.year_of_study = ?
                    AND s.semester = ?
                    AND s.section = ?

                ORDER BY s.enrollment_number
                `,
                [
                    course_code,
                    Number(semester),
                    assignment.branch || branch,
                    Number(year),
                    Number(semester),
                    section
                ]
            );

            return res.json({
                success: true,
                students
            });

        } catch (error) {
            console.error(
                "Error fetching faculty marks students:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch students and marks.",
                error: error.message
            });
        }
    }
);


/* ==========================================================
   SAVE OR UPDATE STUDENT MARKS
========================================================== */

app.post(
    "/api/faculty/:facultyId/marks",
    async (req, res) => {
        const { facultyId } = req.params;

        const {
            course_code,
            subject_name,
            year,
            semester,
            section,
            branch,
            records
        } = req.body;

        let connection;

        try {
            if (
                !course_code ||
                !subject_name ||
                !year ||
                !semester ||
                !section ||
                !Array.isArray(records) ||
                records.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Provide course_code, subject_name, year, semester, section and records."
                });
            }

            const semesterNumber = Number(semester);
            const yearNumber = Number(year);

            if (
                !Number.isInteger(semesterNumber) ||
                semesterNumber < 1 ||
                semesterNumber > 7
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid semester."
                });
            }

            if (
                !Number.isInteger(yearNumber) ||
                yearNumber < 1 ||
                yearNumber > 4
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid year of study."
                });
            }

            const markFields = [
                "mid_term",
                "assignment_1",
                "assignment_2",
                "lab_internal"
            ];

            // Validate student IDs and marks.
            for (const record of records) {
                if (
                    !record ||
                    !Number.isInteger(Number(record.student_id)) ||
                    Number(record.student_id) <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid student ID."
                    });
                }

                for (const field of markFields) {
                    const value = record[field];

                    if (
                        value !== null &&
                        value !== undefined &&
                        value !== ""
                    ) {
                        const number = Number(value);

                        if (
                            !Number.isFinite(number) ||
                            number < 0 ||
                            number > 100
                        ) {
                            return res.status(400).json({
                                success: false,
                                message:
                                    `Invalid ${field}. Marks must be between 0 and 100.`
                            });
                        }
                    }
                }
            }

            const studentIds = records.map(
                record => Number(record.student_id)
            );

            if (
                new Set(studentIds).size !== studentIds.length
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Duplicate student IDs are not allowed."
                });
            }

            // Verify faculty assignment.
            const assignment = await verifyFacultyAssignment(
                facultyId,
                {
                    course_code,
                    year: yearNumber,
                    semester: semesterNumber,
                    section,
                    branch
                }
            );

            if (!assignment) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not assigned to enter marks for this subject and section."
                });
            }

            connection = await db.getConnection();

            await connection.beginTransaction();

            // Verify that all students belong to this assigned class.
            const placeholders = studentIds.map(() => "?").join(",");

            const [validStudents] = await connection.query(
                `
                SELECT id
                FROM students
                WHERE id IN (${placeholders})
                    AND branch = ?
                    AND year_of_study = ?
                    AND semester = ?
                    AND section = ?
                `,
                [
                    ...studentIds,
                    assignment.branch,
                    yearNumber,
                    semesterNumber,
                    assignment.section
                ]
            );

            if (validStudents.length !== studentIds.length) {
                await connection.rollback();

                return res.status(403).json({
                    success: false,
                    message:
                        "One or more students do not belong to your assigned class."
                });
            }

            // Save marks for each student.
            for (const record of records) {
                const values = markFields.map(field => {
                    const value = record[field];

                    return (
                        value === null ||
                        value === undefined ||
                        value === ""
                    )
                        ? null
                        : Number(value);
                });

                const [existingRows] = await connection.query(
                    `
                    SELECT id
                    FROM marks
                    WHERE student_id = ?
                        AND semester = ?
                        AND subject_code = ?
                    LIMIT 1
                    `,
                    [
                        Number(record.student_id),
                        semesterNumber,
                        assignment.course_code
                    ]
                );

                if (existingRows.length > 0) {
                    // Update existing marks.
                    // Preserve has_lab unless a lab mark is entered.
                    await connection.query(
                        `
                        UPDATE marks
                        SET
                            subject_name = ?,
                            mid_term = ?,
                            assignment_1 = ?,
                            assignment_2 = ?,
                            lab_internal = ?,
                            has_lab = CASE
                                WHEN ? IS NOT NULL THEN 1
                                ELSE has_lab
                            END
                        WHERE id = ?
                        `,
                        [
                            assignment.course_name,
                            values[0],
                            values[1],
                            values[2],
                            values[3],
                            values[3],
                            existingRows[0].id
                        ]
                    );

                } else {
                    // Insert new marks.
                    // Mark as a lab subject when Lab Internal is entered.
                    const hasLab = values[3] !== null ? 1 : 0;

                    await connection.query(
                        `
                        INSERT INTO marks (
                            student_id,
                            subject_code,
                            subject_name,
                            semester,
                            has_lab,
                            mid_term,
                            assignment_1,
                            assignment_2,
                            lab_internal
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            Number(record.student_id),
                            assignment.course_code,
                            assignment.course_name,
                            semesterNumber,
                            hasLab,
                            values[0],
                            values[1],
                            values[2],
                            values[3]
                        ]
                    );
                }
            }

            await connection.commit();

            return res.json({
                success: true,
                message: "Student marks saved successfully.",
                count: records.length
            });

        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Marks rollback error:",
                        rollbackError
                    );
                }
            }

            console.error(
                "Error saving faculty marks:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to save student marks.",
                error: error.message
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);



// ==========================================
// FACULTY PROFILE API
// ==========================================

app.get("/api/faculty/:facultyId/profile", async (req, res) => {
    try {
        const facultyId = String(req.params.facultyId || "").trim();

        if (!facultyId) {
            return res.status(400).json({
                success: false,
                message: "Faculty ID is required."
            });
        }

        const [rows] = await db.query(
            `SELECT faculty_id, faculty_name, email, mobile
             FROM faculty_accounts
             WHERE faculty_id = ?
             LIMIT 1`,
            [facultyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Faculty account not found."
            });
        }

        return res.json({
            success: true,
            faculty: rows[0]
        });

    } catch (error) {
        console.error("Faculty profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load faculty profile."
        });
    }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(
        `Apex Student Portal running at http://localhost:${PORT}`
    );
});

