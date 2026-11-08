
document.addEventListener("DOMContentLoaded", async () => {
    let student;

    try {
        student = JSON.parse(sessionStorage.getItem("student") || "null");
    } catch {
        student = null;
    }

    if (!student || !student.id) {
        window.location.href = "/index.html";
        return;
    }

    // Student details
    const fullName = [
        student.first_name,
        student.last_name
    ].filter(Boolean).join(" ") || student.name || "Student";

    const enrollment =
        student.enrollment_number || student.enrollment || "N/A";

    const prefix = String(enrollment).substring(0, 2);

    const batchMap = {
        "23": "2023-2027",
        "24": "2024-2028",
        "25": "2025-2029",
        "26": "2026-2030"
    };

    const batch = student.batch || batchMap[prefix] || "N/A";
    const course = student.course || student.branch || "N/A";
    const initial = fullName.charAt(0).toUpperCase();

    const profileValues = {
        sidebarName: fullName,
        headerName: fullName,
        sidebarEnrollment: enrollment,
        headerEnrollment: enrollment,
        sidebarAvatar: initial,
        headerAvatar: initial
    };

    Object.entries(profileValues).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    // Logout
    document.getElementById("logoutButton")?.addEventListener("click", event => {
        event.preventDefault();
        sessionStorage.removeItem("student");
        window.location.href = "/index.html";
    });

    // Academics dropdown
    const academicsToggle = document.getElementById("academicsToggle");
    const academicsSubmenu = document.getElementById("academicsSubmenu");
    const academicsArrow = document.getElementById("academicsArrow");

    academicsToggle?.addEventListener("click", () => {
        if (!academicsSubmenu) return;

        const open = academicsSubmenu.classList.toggle("show");

        academicsToggle.setAttribute("aria-expanded", String(open));

        if (academicsArrow) {
            academicsArrow.textContent = open ? "▾" : "▸";
        }
    });

   // Tabs: show content only after the user selects a category
const documentWelcome = document.getElementById("documentWelcome");

document.querySelectorAll(".document-tab").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".document-tab").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        document.querySelectorAll(".document-section").forEach(section => {
            section.hidden = section.id !== button.dataset.section;
        });

        if (documentWelcome) {
            documentWelcome.hidden = true;
        }
    });
});

    // Grade Sheet elements
    const semesterSelect = document.getElementById("semesterSelect");
    const gradeTableBody = document.getElementById("gradeTableBody");
    const gradeMessage = document.getElementById("gradeMessage");

    const semesterAccess = {
        "26": [],
        "25": [1, 2],
        "24": [1, 2, 3, 4],
        "23": [1, 2, 3, 4, 5, 6]
    };

    const allowedSemesters = semesterAccess[prefix] || [];

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent =
                value === null || value === undefined || value === ""
                    ? "—"
                    : String(value);
        }
    }

    function showMessage(text) {
        if (!gradeMessage) return;
        gradeMessage.textContent = text;
        gradeMessage.hidden = false;
    }

    function hideMessage() {
        if (!gradeMessage) return;
        gradeMessage.textContent = "";
        gradeMessage.hidden = true;
    }

    function clearTable(text) {
        gradeTableBody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 3;
        cell.textContent = text;

        row.appendChild(cell);
        gradeTableBody.appendChild(row);
    }

    function addRow(serial, subject, grade, isSummary = false) {
        const row = document.createElement("tr");

        if (isSummary) row.classList.add("summary-row");

        [serial, subject, grade].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent =
                value === null || value === undefined ? "" : String(value);
            row.appendChild(cell);
        });

        gradeTableBody.appendChild(row);
    }

    function renderGradeSheet(data, semesterNumber) {
        const apiStudent = data.student || student;

        const apiName = [
            apiStudent.first_name,
            apiStudent.last_name
        ].filter(Boolean).join(" ") || fullName;

        setText("gradeStudentName", apiName);
        setText("gradeEnrollment", apiStudent.enrollment_number || enrollment);
        setText("gradeBatch", apiStudent.batch || batch);
        setText(
            "gradeCourse",
            apiStudent.course || apiStudent.branch || course
        );
        setText("gradeSemester", semesterNumber);

        // IMPORTANT: The actual API returns data.semesters.
        const semesterData = data.semesters.find(
            item => Number(item.semester) === Number(semesterNumber)
        );

        gradeTableBody.replaceChildren();

        if (!semesterData || !Array.isArray(semesterData.subjects)
            || semesterData.subjects.length === 0) {
            clearTable("No grade records are available for this semester.");
            return;
        }

        semesterData.subjects.forEach((subject, index) => {
            addRow(
                index + 1,
                subject.subject_name || subject.subject_code || "—",
                subject.grade || "—"
            );
        });

        // Use SGPA and CGPA returned by the Grade List API.
        addRow("", "SGPA", Number(semesterData.sgpa).toFixed(2), true);
        addRow("", "CGPA", Number(data.cgpa).toFixed(2), true);
    }

    async function loadGradeSheet(semesterNumber) {
        hideMessage();
        clearTable("Loading grade sheet...");

        try {
            const response = await fetch(
                `/api/grade-list/${encodeURIComponent(student.id)}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load Grade Sheet.");
            }

            // Verify semester access against the API response.
            if (!allowedSemesters.includes(Number(semesterNumber))) {
                throw new Error("This semester is not available for your enrollment.");
            }

            renderGradeSheet(data, semesterNumber);
        } catch (error) {
            console.error("Grade Sheet error:", error);
            clearTable("Unable to load grade records.");
            showMessage(error.message || "Unable to load Grade Sheet.");
        }
    }

    // Populate dropdown using the same semester list returned by Grade List.
    async function initializeGradeSheet() {
        setText("gradeStudentName", fullName);
        setText("gradeEnrollment", enrollment);
        setText("gradeBatch", batch);
        setText("gradeCourse", course);

        semesterSelect.replaceChildren();

        if (allowedSemesters.length === 0) {
            semesterSelect.disabled = true;

            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No grade sheets available";
            semesterSelect.appendChild(option);

            showMessage("Grade sheets are not available for first-year students.");
            clearTable("Grade sheets are not available for your year.");
            setText("gradeSemester", "—");
            return;
        }

        try {
            const response = await fetch(
                `/api/grade-list/${encodeURIComponent(student.id)}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load Grade List.");
            }

            // Use semesters that actually have subject records.
            const availableSemesters = data.semesters
                .filter(item =>
                    allowedSemesters.includes(Number(item.semester)) &&
                    Array.isArray(item.subjects) &&
                    item.subjects.length > 0
                )
                .map(item => Number(item.semester));

            if (availableSemesters.length === 0) {
                semesterSelect.disabled = true;

                const option = document.createElement("option");
                option.value = "";
                option.textContent = "No grade sheets available";
                semesterSelect.appendChild(option);

                showMessage("No grade records are available for your semesters yet.");
                clearTable("No grade records are available.");
                return;
            }

            availableSemesters.forEach(semester => {
                const option = document.createElement("option");
                option.value = String(semester);
                option.textContent = `Semester ${semester}`;
                semesterSelect.appendChild(option);
            });

            semesterSelect.disabled = false;

            // Default to the latest semester that actually has grades.
            const defaultSemester =
                availableSemesters[availableSemesters.length - 1];

            semesterSelect.value = String(defaultSemester);

            // Render using the already-fetched API response.
            renderGradeSheet(data, defaultSemester);

            semesterSelect.addEventListener("change", () => {
                renderGradeSheet(data, Number(semesterSelect.value));
            });

        } catch (error) {
            console.error("Grade Sheet initialization error:", error);
            semesterSelect.disabled = true;
            showMessage(error.message || "Unable to load Grade Sheet.");
            clearTable("Unable to load grade records.");
        }
    }

    await initializeGradeSheet();

    document.getElementById("printGradeSheet")?.addEventListener("click", () => {
        window.print();
    });
});
