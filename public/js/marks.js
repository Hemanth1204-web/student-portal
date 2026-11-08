
document.addEventListener("DOMContentLoaded", () => {
    const student = JSON.parse(sessionStorage.getItem("student") || "null");

    if (!student || !student.id) {
        window.location.href = "/index.html";
        return;
    }

    const currentSemester = Number(student.semester);

    if (!Number.isInteger(currentSemester) || currentSemester < 1) {
        alert("Invalid student semester. Please log in again.");
        return;
    }

    // ==========================================
    // STUDENT DETAILS
    // ==========================================

    const fullName =
        `${student.first_name || ""} ${student.last_name || ""}`.trim();

    const enrollment = student.enrollment_number || "-";

    document.getElementById("studentName").textContent = fullName;
    document.getElementById("studentEnrollment").textContent = enrollment;
    document.getElementById("studentBranch").textContent = student.branch || "-";
    document.getElementById("studentSection").textContent = student.section || "-";

    document.getElementById("headerName").textContent = fullName || "Student";
    document.getElementById("headerEnrollment").textContent = enrollment;
    document.getElementById("sidebarName").textContent = fullName || "Student";
    document.getElementById("sidebarEnrollment").textContent = enrollment;

    const initial = fullName
        ? fullName.charAt(0).toUpperCase()
        : "S";

    document.getElementById("headerAvatar").textContent = initial;
    document.getElementById("sidebarAvatar").textContent = initial;

    // ==========================================
    // SEMESTER DROPDOWN
    // Show every semester up to current semester.
    // ==========================================

    const semesterSelect =
        document.getElementById("semesterSelect");

    semesterSelect.innerHTML = "";

    for (let semester = 1; semester <= currentSemester; semester++) {
        const option = document.createElement("option");

        option.value = semester;
        option.textContent = `Semester ${semester}`;

        semesterSelect.appendChild(option);
    }

    // Select the student's existing/current semester.
    semesterSelect.value = String(currentSemester);

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    loadMarks(currentSemester);

    semesterSelect.addEventListener("change", () => {
        loadMarks(Number(semesterSelect.value));
    });

    // ==========================================
    // LOAD MARKS FROM DATABASE
    // ==========================================

    async function loadMarks(semester) {
        const marksContent =
            document.getElementById("marksContent");

        const currentMessage =
            document.getElementById("currentSemesterMessage");

        const noMarks =
            document.getElementById("noMarks");

        const nonLabSection =
            document.getElementById("nonLabSection");

        const labSection =
            document.getElementById("labSection");

        const description =
            document.getElementById("semesterDescription");

        // Reset previous display.
        marksContent.classList.remove("hidden");
        currentMessage.classList.add("hidden");
        noMarks.classList.add("hidden");
        nonLabSection.classList.add("hidden");
        labSection.classList.add("hidden");

        resetTables();

        description.textContent =
            `Loading marks for Semester ${semester}...`;

        try {
            const response = await fetch(
                `/api/marks/${student.id}?semester=${semester}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to fetch marks."
                );
            }

            const marks = Array.isArray(data.marks)
                ? data.marks
                : [];

            description.textContent =
                semester === currentSemester
                    ? `Your current semester: Semester ${semester}`
                    : `Your previous semester: Semester ${semester}`;

            // Show message only if no marks are actually saved.
            if (marks.length === 0) {
                marksContent.classList.add("hidden");
                noMarks.classList.remove("hidden");

                noMarks.querySelector("h3").textContent =
                    "No Marks Available";

                noMarks.querySelector("p").textContent =
                    `Faculty has not uploaded marks for Semester ${semester} yet.`;

                return;
            }

            // Display current OR previous semester marks.
            renderMarks(marks);

        } catch (error) {
            console.error("Marks loading error:", error);

            marksContent.classList.add("hidden");
            noMarks.classList.remove("hidden");

            noMarks.querySelector("h3").textContent =
                "Unable to Load Marks";

            noMarks.querySelector("p").textContent =
                error.message;
        }
    }

    // ==========================================
    // RENDER MARKS
    // ==========================================

    function renderMarks(marks) {
        const nonLabMarks = marks.filter(
            mark => Number(mark.has_lab) !== 1
        );

        const labMarks = marks.filter(
            mark => Number(mark.has_lab) === 1
        );

        const nonLabSection =
            document.getElementById("nonLabSection");

        const labSection =
            document.getElementById("labSection");

        if (nonLabMarks.length > 0) {
            nonLabSection.classList.remove("hidden");
            renderNonLabMarks(nonLabMarks);
        }

        if (labMarks.length > 0) {
            labSection.classList.remove("hidden");
            renderLabMarks(labMarks);
        }
    }

    // ==========================================
    // THEORY MARKS
    // ==========================================

    function renderNonLabMarks(marks) {
        const tbody =
            document.getElementById("nonLabTableBody");

        tbody.innerHTML = "";

        marks.forEach(mark => {
            const mid = Number(mark.mid_term || 0);
            const assignment1 = Number(mark.assignment_1 || 0);
            const assignment2 = Number(mark.assignment_2 || 0);

            const total = mid + assignment1 + assignment2;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(mark.subject_code)}</td>
                <td>${escapeHTML(mark.subject_name)}</td>
                <td>${mid}/30</td>
                <td>${assignment1}/15</td>
                <td>${assignment2}/15</td>
                <td class="total-cell">${total}/60</td>
            `;

            tbody.appendChild(row);
        });
    }

    // ==========================================
    // LAB MARKS
    // ==========================================

    function renderLabMarks(marks) {
        const tbody =
            document.getElementById("labTableBody");

        tbody.innerHTML = "";

        marks.forEach(mark => {
            const mid = Number(mark.mid_term || 0);
            const labInternal = Number(mark.lab_internal || 0);

            const total = mid + labInternal;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(mark.subject_code)}</td>
                <td>${escapeHTML(mark.subject_name)}</td>
                <td>${mid}/30</td>
                <td>${labInternal}/30</td>
                <td class="total-cell">${total}/60</td>
            `;

            tbody.appendChild(row);
        });
    }

    // ==========================================
    // RESET TABLES
    // ==========================================

    function resetTables() {
        document.getElementById("nonLabTableBody").innerHTML = "";
        document.getElementById("labTableBody").innerHTML = "";
    }

    // ==========================================
    // HTML SAFETY
    // ==========================================

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();

            sessionStorage.removeItem("student");

            window.location.href = "/index.html";
        });
    }
});
