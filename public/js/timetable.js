document.addEventListener("DOMContentLoaded", () => {
    const timetableBody = document.getElementById("timetableBody");
    const timetableMessage = document.getElementById("timetableMessage");

    const days = [
        { key: "Mon", label: "Mon" },
        { key: "Tue", label: "Tue" },
        { key: "Wed", label: "Wed" },
        { key: "Thu", label: "Thu" },
        { key: "Fri", label: "Fri" }
    ];

    const sessions = [1, 2, 3, 4, 5, 6, 7];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function getStudent() {
        try {
            return JSON.parse(
                sessionStorage.getItem("student") || "null"
            );
        } catch (error) {
            console.error("Could not read student session:", error);
            return null;
        }
    }

    function getSemester(student) {
        const semester = Number(student.semester);

        if ([1, 3, 5, 7].includes(semester)) {
            return semester;
        }

        const enrollment = String(student.enrollment_number || "");

        const semesterByPrefix = {
            "26": 1,
            "25": 3,
            "24": 5,
            "23": 7
        };

        return semesterByPrefix[enrollment.slice(0, 2)] || null;
    }

    function getStudentName(student) {
        return [
            student.first_name,
            student.last_name
        ].filter(Boolean).join(" ") || "Student";
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value ?? "";
        }
    }

    function populateStudentDetails(student, semester, section) {
        const name = getStudentName(student);
        const enrollment = student.enrollment_number || "—";
        const initial = name.charAt(0).toUpperCase();

        // Same IDs used by marks.html
        setText("sidebarName", name);
        setText("sidebarEnrollment", enrollment);
        setText("headerName", name);
        setText("headerEnrollment", enrollment);
        setText("sidebarAvatar", initial);
        setText("headerAvatar", initial);

        setText("studentSemester", `Semester ${semester}`);
        setText("studentSection", `Section ${section}`);

        const batch = student.batch ||
                      student.batch_year ||
                      student.academic_year ||
                      "—";

        setText("studentBatch", batch);
    }

    function renderTimetable(timetable) {
        const timetableMap = new Map();

        timetable.forEach(item => {
            const day = String(item.day || "").trim();
            const session = Number(item.session);

            if (
                days.some(entry => entry.key === day) &&
                sessions.includes(session)
            ) {
                timetableMap.set(`${day}|${session}`, item);
            }
        });

        const fragment = document.createDocumentFragment();

        days.forEach(day => {
            const row = document.createElement("tr");

            const dayCell = document.createElement("th");
            dayCell.scope = "row";
            dayCell.textContent = day.label;
            row.appendChild(dayCell);

            sessions.forEach(session => {
                // Lunch is a separate column between S4 and S5.
                if (session === 5) {
                    const lunchCell = document.createElement("td");
                    lunchCell.className = "lunch-cell";
                    lunchCell.textContent = "LUNCH";
                    lunchCell.setAttribute("aria-label", "Lunch break");
                    row.appendChild(lunchCell);
                }

                const cell = document.createElement("td");
                const item = timetableMap.get(`${day.key}|${session}`);

                if (item) {
                    cell.className = "class-cell";

                    cell.innerHTML = `
                        <span class="subject-code">
                            ${escapeHTML(item.course_code)}
                        </span>
                        <span class="subject-name">
                            ${escapeHTML(item.course_name)}
                        </span>
                        <span class="faculty-name">
                            ${escapeHTML(item.faculty_name)}
                        </span>
                    `;
                } else {
                    cell.className = "free-cell";
                    cell.innerHTML = "&nbsp;";
                    cell.setAttribute("aria-label", "Free session");
                }

                row.appendChild(cell);
            });

            fragment.appendChild(row);
        });

        timetableBody.replaceChildren(fragment);
    }

    async function loadTimetable() {
        const student = getStudent();

        if (!student) {
            timetableMessage.textContent =
                "Student session not found. Please log in again.";
            timetableBody.replaceChildren();
            return;
        }

        const semester = getSemester(student);
        const section = String(student.section || "")
            .trim()
            .toUpperCase();

        if (!semester || !["A", "B", "C", "D"].includes(section)) {
            timetableMessage.textContent =
                "Your semester or section is missing from your profile.";
            timetableBody.replaceChildren();
            return;
        }

        populateStudentDetails(student, semester, section);

        timetableMessage.textContent = "Loading your timetable...";
        timetableBody.replaceChildren();

        try {
            const response = await fetch(
                `/api/timetable?semester=${semester}&section=${encodeURIComponent(section)}`
            );

            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    "The timetable API did not return JSON. " +
                    "Check the /api/timetable route in server.js."
                );
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load the timetable."
                );
            }

            if (!Array.isArray(data.timetable)) {
                throw new Error("The timetable response is invalid.");
            }

            renderTimetable(data.timetable);

            timetableMessage.textContent =
                `Your timetable — Semester ${semester}, Section ${section}`;

        } catch (error) {
            console.error("Timetable error:", error);

            timetableBody.replaceChildren();
            timetableMessage.textContent = error.message;
        }
    }

    const printButton = document.getElementById("printTimetable");

    if (printButton) {
        printButton.addEventListener("click", () => window.print());
    }

    loadTimetable();
});