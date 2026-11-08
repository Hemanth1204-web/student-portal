
document.addEventListener("DOMContentLoaded", () => {
    const faculty = JSON.parse(sessionStorage.getItem("faculty") || "null");

    const dateInput = document.getElementById("attendanceDate");
    const assignmentSelect = document.getElementById("assignmentSelect");
    const subjectDisplay = document.getElementById("subjectDisplay");
    const branchDisplay = document.getElementById("branchDisplay");
    const yearDisplay = document.getElementById("yearDisplay");
    const sectionDisplay = document.getElementById("sectionDisplay");

    const studentsTable = document.getElementById("studentsTable");
    const message = document.getElementById("attendanceMessage");
    const error = document.getElementById("attendanceError");
    const saveButton = document.getElementById("saveAttendanceBtn");
    const markAllButton = document.getElementById("markAllPresentBtn");
    const historyButton = document.getElementById("loadHistoryBtn");
    const historyMessage = document.getElementById("historyMessage");
    const historyTable = document.getElementById("historyTable");

    let assignments = [];
    let requestVersion = 0;

    const today = new Date();
    dateInput.value =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (!faculty || !faculty.faculty_id) {
        message.textContent = "Faculty login details not found. Please log in again.";
        return;
    }

    document.getElementById("facultyName").textContent =
        faculty.faculty_name || "Faculty";
    document.getElementById("facultyId").textContent = faculty.faculty_id;
    document.getElementById("avatar").textContent =
        (faculty.faculty_name || "F").trim().charAt(0).toUpperCase();

    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("faculty");
        window.location.href = "/";
    });

    document.getElementById("profileLink").addEventListener("click", event => {
        event.preventDefault();
        message.textContent = "Profile settings are managed from your faculty account.";
    });

    async function api(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message || `Request failed with HTTP ${response.status}.`
            );
        }

        return data;
    }

    function selectedAssignment() {
        if (assignmentSelect.value === "") return null;
        return assignments[Number(assignmentSelect.value)] || null;
    }

    function showError(text = "") {
        error.textContent = text;
    }

    function showClass(assignment) {
        subjectDisplay.value = assignment
            ? `${assignment.course_code} — ${assignment.course_name}`
            : "Select a section";

        branchDisplay.value = assignment?.branch || "—";

        yearDisplay.value = assignment
            ? `${assignment.year_of_study} / Semester ${assignment.semester}`
            : "—";

        sectionDisplay.value = assignment?.section || "—";

        document.getElementById("classTitle").textContent = assignment
            ? `${assignment.course_code} — ${assignment.course_name}`
            : "Select an assigned class";
    }

    function resetStudentTable(text) {
        studentsTable.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = text;
        row.appendChild(cell);
        studentsTable.appendChild(row);

        document.getElementById("studentSummary").textContent = "0 students";
        document.getElementById("markedSummary").textContent = "No attendance marked yet.";

        saveButton.disabled = true;
        markAllButton.disabled = true;
    }

    async function loadAssignments() {
        try {
            const data = await api(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/assignments`
            );

            assignments = Array.isArray(data.assignments)
                ? data.assignments
                : [];

            assignmentSelect.replaceChildren();

            if (!assignments.length) {
                assignmentSelect.add(new Option("No assigned classes found", ""));
                message.textContent = "No teaching assignments found for this faculty account.";
                resetStudentTable("No assigned classes found.");
                return;
            }

            assignmentSelect.add(new Option("Choose an assigned class", ""));

            assignments.forEach((item, index) => {
                const label =
                    `Section ${item.section} — ${item.branch || "Branch unavailable"} — ` +
                    `${item.year_of_study}, Semester ${item.semester} — ` +
                    `${item.course_code} ${item.course_name}`;

                assignmentSelect.add(new Option(label, String(index)));
            });

            message.textContent = "Choose an assigned class to load its students.";
            resetStudentTable("Select an assigned class to load students.");
        } catch (err) {
            message.textContent = err.message;
            showError("Unable to load assignments. Check the server response.");
            resetStudentTable("Assignments could not be loaded.");
        }
    }

    async function loadStudents() {
        const version = ++requestVersion;
        const assignment = selectedAssignment();

        showError("");
        showClass(assignment);
        resetStudentTable("Loading students...");
        historyButton.disabled = true;

        if (!assignment) {
            message.textContent = "Select an assigned class.";
            return;
        }

        if (!dateInput.value) {
            message.textContent = "Choose an attendance date.";
            return;
        }

        message.textContent = "Loading students...";

        try {
            const params = new URLSearchParams({
                course_code: assignment.course_code,
                year: String(assignment.year_of_study),
                semester: String(assignment.semester),
                section: assignment.section,
                date: dateInput.value
            });

            const data = await api(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/attendance/students?${params}`
            );

            if (version !== requestVersion) return;

            const students = Array.isArray(data.students) ? data.students : [];

            if (!students.length) {
                resetStudentTable("No students found for this assigned class.");
                message.textContent =
                    "No students returned. Check the branch, year, semester, and section values in the database.";
                historyButton.disabled = false;
                return;
            }

            studentsTable.replaceChildren();

            students.forEach((student, index) => {
                const row = document.createElement("tr");
                row.dataset.studentId = student.id;

                [
                    String(index + 1),
                    student.enrollment_number || "—",
                    `${student.first_name || ""} ${student.last_name || ""}`.trim() || "—"
                ].forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value;
                    row.appendChild(cell);
                });

                const statusCell = document.createElement("td");
                const options = document.createElement("div");
                options.className = "status-options";

                ["Present", "Absent"].forEach(status => {
                    const label = document.createElement("label");
                    label.className = "status-option";

                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = `attendance-${student.id}`;
                    radio.value = status;
                    radio.addEventListener("change", updateSummary);

                    const text = document.createElement("span");
                    text.textContent = status;

                    label.append(radio, text);
                    options.appendChild(label);
                });

                statusCell.appendChild(options);
                row.appendChild(statusCell);
                studentsTable.appendChild(row);
            });

            document.getElementById("studentSummary").textContent =
                `${students.length} students in this assigned class`;

            message.textContent = "Mark each student's attendance, then save.";
            markAllButton.disabled = false;
            historyButton.disabled = false;

            updateSummary();
        } catch (err) {
            if (version !== requestVersion) return;

            resetStudentTable("Unable to load students.");
            message.textContent = err.message;
            showError("The student request failed. Check the attendance API route in server.js.");
        }
    }

    function updateSummary() {
        const rows = [
            ...studentsTable.querySelectorAll("tr[data-student-id]")
        ];

        let present = 0;
        let absent = 0;

        rows.forEach(row => {
            const checked = row.querySelector('input[type="radio"]:checked');

            if (checked?.value === "Present") present++;
            if (checked?.value === "Absent") absent++;
        });

        document.getElementById("markedSummary").textContent =
            `${present} present · ${absent} absent · ${rows.length - present - absent} unmarked`;

        saveButton.disabled =
            rows.length === 0 || present + absent !== rows.length;
    }

    markAllButton.addEventListener("click", () => {
        studentsTable.querySelectorAll('input[value="Present"]').forEach(input => {
            input.checked = true;
        });

        updateSummary();
    });

    assignmentSelect.addEventListener("change", loadStudents);
    dateInput.addEventListener("change", loadStudents);
    historyButton.addEventListener("click", loadHistory);

    saveButton.addEventListener("click", async () => {
        const assignment = selectedAssignment();

        if (!assignment || !dateInput.value) return;

        const records = [
            ...studentsTable.querySelectorAll("tr[data-student-id]")
        ].map(row => ({
            student_id: Number(row.dataset.studentId),
            status: row.querySelector('input[type="radio"]:checked')?.value
        }));

        if (!records.length || records.some(record => !record.status)) {
            showError("Mark every student Present or Absent before saving.");
            return;
        }

        saveButton.disabled = true;
        showError("");

        try {
            const data = await api(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/attendance`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        course_code: assignment.course_code,
                        year: assignment.year_of_study,
                        semester: assignment.semester,
                        section: assignment.section,
                        date: dateInput.value,
                        records
                    })
                }
            );

            message.textContent =
                data.message || "Attendance saved successfully.";
            message.className = "attendance-message attendance-success";

            await loadHistory();
        } catch (err) {
            showError(err.message);
        } finally {
            updateSummary();
        }
    });

    async function loadHistory() {
        const assignment = selectedAssignment();

        if (!assignment) {
            historyMessage.textContent = "Select an assigned class first.";
            return;
        }

        historyMessage.textContent = "Loading attendance history...";

        try {
            const params = new URLSearchParams({
                course_code: assignment.course_code,
                year: String(assignment.year_of_study),
                semester: String(assignment.semester),
                section: assignment.section
            });

            const data = await api(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/attendance/history?${params}`
            );

            historyTable.replaceChildren();

            if (!Array.isArray(data.history) || !data.history.length) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");
                cell.colSpan = 5;
                cell.textContent = "No saved attendance records found.";
                row.appendChild(cell);
                historyTable.appendChild(row);

                historyMessage.textContent = "No attendance history found.";
                return;
            }

            data.history.forEach(item => {
                const row = document.createElement("tr");

                [
                    item.attendance_date,
                    `${item.course_code} — ${item.course_name}`,
                    item.section,
                    item.present_count,
                    item.absent_count
                ].forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "—";
                    row.appendChild(cell);
                });

                historyTable.appendChild(row);
            });

            historyMessage.textContent = "Attendance history loaded.";
        } catch (err) {
            historyMessage.textContent = err.message;
        }
    }

    loadAssignments();
});
