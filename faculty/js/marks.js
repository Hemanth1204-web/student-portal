document.addEventListener("DOMContentLoaded", () => {
    const faculty = JSON.parse(sessionStorage.getItem("faculty") || "null");

    const assignmentSelect = document.getElementById("assignmentSelect");
    const subjectDisplay = document.getElementById("subjectDisplay");
    const branchDisplay = document.getElementById("branchDisplay");
    const yearDisplay = document.getElementById("yearDisplay");
    const sectionDisplay = document.getElementById("sectionDisplay");

    const studentsTable = document.getElementById("studentsTable");
    const message = document.getElementById("marksMessage");
    const error = document.getElementById("marksError");
    const searchInput = document.getElementById("studentSearch");
    const dialog = document.getElementById("marksDialog");
    const form = document.getElementById("studentMarksForm");

    const fields = {
        mid_term: document.getElementById("midTerm"),
        assignment_1: document.getElementById("assignment1"),
        assignment_2: document.getElementById("assignment2"),
        lab_internal: document.getElementById("labInternal")
    };

    let assignments = [];
    let students = [];
    let requestVersion = 0;
    let activeStudent = null;
    let activeAssignment = null;

    if (!faculty || !faculty.faculty_id) {
        message.textContent =
            "Faculty login details not found. Please log in again.";

        assignmentSelect.innerHTML =
            '<option value="">Please log in again</option>';

        return;
    }

    document.getElementById("facultyName").textContent =
        faculty.faculty_name || "Faculty";

    document.getElementById("facultyId").textContent =
        faculty.faculty_id;

    document.getElementById("avatar").textContent =
        (faculty.faculty_name || "F").trim().charAt(0).toUpperCase();

    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("faculty");
        window.location.href = "/";
    });

    document.getElementById("profileLink").addEventListener("click", event => {
        event.preventDefault();

        message.textContent =
            "Profile settings are managed from your faculty account.";
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
                data.message ||
                data.error ||
                `Request failed (${response.status}).`
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
            ? `${assignment.course_code} — ${assignment.course_name} — Section ${assignment.section}`
            : "Select an assigned class";
    }

    function resetStudentTable(text) {
        studentsTable.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = text;

        row.appendChild(cell);
        studentsTable.appendChild(row);

        document.getElementById("studentSummary").textContent = "0 students";
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
                assignmentSelect.add(
                    new Option("No assigned classes found", "")
                );

                message.textContent =
                    "No teaching assignments found for this faculty account.";

                resetStudentTable("No assigned classes found.");
                return;
            }

            assignmentSelect.add(
                new Option("Choose an assigned class", "")
            );

            assignments.forEach((item, index) => {
                const label =
                    `Section ${item.section} — ${item.branch || "Branch unavailable"} — ` +
                    `${item.year_of_study}, Semester ${item.semester} — ` +
                    `${item.course_code} ${item.course_name}`;

                assignmentSelect.add(new Option(label, String(index)));
            });

            message.textContent =
                "Choose an assigned class to load its students.";

            resetStudentTable("Select an assigned class to load students.");

        } catch (err) {
            message.textContent = err.message;

            showError(
                "Unable to load assignments. Check the server response."
            );

            resetStudentTable("Assignments could not be loaded.");
        }
    }

    async function loadStudents() {
        const version = ++requestVersion;
        const assignment = selectedAssignment();

        activeAssignment = assignment;
        students = [];

        showError("");
        showClass(assignment);
        resetStudentTable("Loading students...");

        if (!assignment) {
            message.textContent = "Select an assigned class.";
            return;
        }

        message.textContent =
            "Loading students and existing marks...";

        try {
            const params = new URLSearchParams({
                course_code: assignment.course_code,
                year: String(assignment.year_of_study),
                semester: String(assignment.semester),
                section: assignment.section,
                branch: assignment.branch
            });

            const data = await api(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}` +
                `/marks/students?${params}`
            );

            if (version !== requestVersion) return;

            students = Array.isArray(data.students)
                ? data.students
                : [];

            if (!students.length) {
                resetStudentTable(
                    "No students found for this assigned class."
                );

                message.textContent =
                    "Check the branch, year, semester, and section values in your database.";

                return;
            }

            renderStudents();

            document.getElementById("studentSummary").textContent =
                `${students.length} students in this assigned class`;

            message.textContent =
                "Select Upload Marks beside a student to enter or edit their marks.";

        } catch (err) {
            if (version !== requestVersion) return;

            resetStudentTable("Unable to load students.");
            message.textContent = err.message;

            showError(
                "The student request failed. Check the marks API route in server.js."
            );
        }
    }

    function hasAnyMarks(student) {
        return [
            student.mid_term,
            student.assignment_1,
            student.assignment_2,
            student.lab_internal
        ].some(value =>
            value !== null &&
            value !== undefined &&
            value !== ""
        );
    }

    function renderStudents() {
        const search = searchInput.value.trim().toLowerCase();

        const visibleStudents = students.filter(student => {
            const text = [
                student.enrollment_number,
                student.first_name,
                student.last_name
            ].join(" ").toLowerCase();

            return text.includes(search);
        });

        studentsTable.replaceChildren();

        if (!visibleStudents.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "No students match your search.";

            row.appendChild(cell);
            studentsTable.appendChild(row);
            return;
        }

        visibleStudents.forEach((student, index) => {
            const row = document.createElement("tr");

            const values = [
                String(index + 1),
                student.enrollment_number || "—",
                `${student.first_name || ""} ${student.last_name || ""}`.trim() || "—"
            ];

            values.forEach((value, valueIndex) => {
                const cell = document.createElement("td");

                cell.textContent = value;

                if (valueIndex === 1) cell.className = "enrollment";
                if (valueIndex === 2) cell.className = "student-name";

                row.appendChild(cell);
            });

            const statusCell = document.createElement("td");
            const status = document.createElement("span");
            const uploaded = hasAnyMarks(student);

            status.className = uploaded
                ? "student-status complete"
                : "student-status";

            status.textContent = uploaded
                ? "Marks uploaded"
                : "Not uploaded";

            statusCell.appendChild(status);
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");
            const button = document.createElement("button");

            button.type = "button";
            button.className = "upload-marks-btn";
            button.textContent = uploaded
                ? "Edit Marks"
                : "Upload Marks";

            button.addEventListener("click", () => {
                openMarksForm(student);
            });

            actionCell.appendChild(button);
            row.appendChild(actionCell);

            studentsTable.appendChild(row);
        });
    }

    function openMarksForm(student) {
        activeStudent = student;

        document.getElementById("dialogStudentId").value = student.id;

        document.getElementById("dialogStudentInfo").textContent =
            `${student.enrollment_number || ""} — ` +
            `${student.first_name || ""} ${student.last_name || ""}`.trim();

        document.getElementById("dialogSubjectInfo").textContent =
            activeAssignment
                ? `${activeAssignment.course_code} — ${activeAssignment.course_name} · ` +
                  `${activeAssignment.branch} · Semester ${activeAssignment.semester} · ` +
                  `Section ${activeAssignment.section}`
                : "";

        fields.mid_term.value = student.mid_term ?? "";
        fields.assignment_1.value = student.assignment_1 ?? "";
        fields.assignment_2.value = student.assignment_2 ?? "";
        fields.lab_internal.value = student.lab_internal ?? "";

        // Lab Internal remains editable for first-time entries.
        fields.lab_internal.disabled = false;

        const dialogMessage = document.getElementById("dialogMessage");

        dialogMessage.textContent =
            "Enter the available marks. Leave Lab Internal blank for theory subjects.";

        dialogMessage.className = "marks-message";

        dialog.showModal();
    }

    function closeDialog() {
        if (dialog.open) dialog.close();

        activeStudent = null;
    }

    document.getElementById("closeDialogBtn")
        .addEventListener("click", closeDialog);

    document.getElementById("cancelDialogBtn")
        .addEventListener("click", closeDialog);

    dialog.addEventListener("click", event => {
        if (event.target === dialog) closeDialog();
    });

    function readMark(input) {
        if (input.disabled || input.value.trim() === "") {
            return null;
        }

        const value = Number(input.value);

        if (!Number.isFinite(value) || value < 0 || value > 100) {
            throw new Error("Each mark must be between 0 and 100.");
        }

        return value;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!activeStudent || !activeAssignment) return;

        const saveButton =
            document.getElementById("saveStudentMarksBtn");

        const dialogMessage =
            document.getElementById("dialogMessage");

        let record;

        try {
            record = {
                student_id: Number(activeStudent.id),
                mid_term: readMark(fields.mid_term),
                assignment_1: readMark(fields.assignment_1),
                assignment_2: readMark(fields.assignment_2),
                lab_internal: readMark(fields.lab_internal)
            };

        } catch (err) {
            dialogMessage.className = "marks-message error";
            dialogMessage.textContent = err.message;
            return;
        }

        saveButton.disabled = true;

        dialogMessage.className = "marks-message";
        dialogMessage.textContent = "Saving marks...";

        try {
            const data = await api(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/marks`,
                {
                    method: "POST",

                    body: JSON.stringify({
                        course_code: activeAssignment.course_code,
                        subject_name: activeAssignment.course_name,
                        year: activeAssignment.year_of_study,
                        semester: Number(activeAssignment.semester),
                        section: activeAssignment.section,
                        branch: activeAssignment.branch,
                        records: [record]
                    })
                }
            );

            const student = students.find(
                item => Number(item.id) === Number(activeStudent.id)
            );

            if (student) {
                student.mid_term = record.mid_term;
                student.assignment_1 = record.assignment_1;
                student.assignment_2 = record.assignment_2;
                student.lab_internal = record.lab_internal;

                if (record.lab_internal !== null) {
                    student.has_lab = 1;
                }
            }

            dialogMessage.className = "marks-message success";

            dialogMessage.textContent =
                data.message || "Marks saved successfully.";

            renderStudents();

            window.setTimeout(() => {
                closeDialog();

                message.textContent =
                    "Marks saved. The student's marks page can now load the updated values.";

            }, 600);

        } catch (err) {
            dialogMessage.className = "marks-message error";
            dialogMessage.textContent = err.message;

        } finally {
            saveButton.disabled = false;
        }
    });

    assignmentSelect.addEventListener("change", loadStudents);

    searchInput.addEventListener("input", renderStudents);

    document.getElementById("reloadStudentsBtn")
        .addEventListener("click", loadStudents);

    loadAssignments();
});