
document.addEventListener("DOMContentLoaded", () => {
    let faculty;

    try {
        faculty = JSON.parse(sessionStorage.getItem("faculty") || "null");
    } catch {
        faculty = null;
    }

    if (!faculty || !faculty.faculty_id) {
        window.location.replace("/");
        return;
    }

    const name = faculty.faculty_name || "Faculty";

    document.getElementById("facultyName").textContent = name;
    document.getElementById("facultyId").textContent = faculty.faculty_id;
    document.getElementById("avatar").textContent =
        name.charAt(0).toUpperCase();

    const tbody = document.getElementById("subjectsTable");
    const statusMessage = document.getElementById("statusMessage");
    const errorMessage = document.getElementById("errorMessage");
    const emptyState = document.getElementById("emptyState");

    const searchInput = document.getElementById("subjectSearch");
    const semesterFilter = document.getElementById("semesterFilter");
    const sectionFilter = document.getElementById("sectionFilter");

    let assignments = [];

    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("faculty");
        window.location.replace("/");
    });

    async function loadSubjects() {
        statusMessage.textContent = "Loading your assignments...";
        errorMessage.textContent = "";
        emptyState.hidden = true;
        tbody.replaceChildren();

        const loadingRow = document.createElement("tr");
        const loadingCell = document.createElement("td");
        loadingCell.colSpan = 6;
        loadingCell.textContent = "Loading...";
        loadingRow.appendChild(loadingCell);
        tbody.appendChild(loadingRow);

        try {
            const response = await fetch(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/assignments`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to retrieve subjects."
                );
            }

            assignments = Array.isArray(data.assignments)
                ? data.assignments
                : [];

            // Count unique courses.
            const uniqueSubjects = new Set(
                assignments.map(item =>
                    item.course_code || item.course_name
                )
            );

            // Count unique year-semester-section combinations.
            const uniqueSections = new Set(
                assignments.map(item =>
                    `${item.year_of_study}|${item.semester}|${item.section}`
                )
            );

            document.getElementById("subjectCount").textContent =
                uniqueSubjects.size;

            document.getElementById("assignmentCount").textContent =
                assignments.length;

            document.getElementById("sectionCount").textContent =
                uniqueSections.size;

            renderSubjects();
        } catch (error) {
            console.error("My Subjects error:", error);

            statusMessage.textContent = "";
            errorMessage.textContent =
                error.message || "Unable to load subjects.";

            tbody.replaceChildren();
            document.getElementById("resultCount").textContent =
                "Assignments could not be loaded.";

            document.getElementById("subjectCount").textContent = "—";
            document.getElementById("assignmentCount").textContent = "—";
            document.getElementById("sectionCount").textContent = "—";
        }
    }

    function renderSubjects() {
        const search = searchInput.value.trim().toLowerCase();
        const semester = semesterFilter.value;
        const section = sectionFilter.value;

        const filtered = assignments.filter(item => {
            const code = String(item.course_code || "").toLowerCase();
            const subject = String(item.course_name || "").toLowerCase();

            const matchesSearch =
                code.includes(search) || subject.includes(search);

            const matchesSemester =
                !semester || String(item.semester) === semester;

            const matchesSection =
                !section ||
                String(item.section || "").trim().toUpperCase() === section;

            return matchesSearch && matchesSemester && matchesSection;
        });

        tbody.replaceChildren();

        document.getElementById("resultCount").textContent =
            `Showing ${filtered.length} of ${assignments.length} assignments`;

        if (filtered.length === 0) {
            statusMessage.textContent = "";
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;
        statusMessage.textContent = "";

        filtered.forEach((item, index) => {
            const row = document.createElement("tr");

            const values = [
                index + 1,
                item.course_code,
                item.course_name,
                item.year_of_study,
                item.semester,
                item.section
            ];

            values.forEach((value, columnIndex) => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";

                if (columnIndex === 2) {
                    cell.className = "subject-name";
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    }

    searchInput.addEventListener("input", renderSubjects);
    semesterFilter.addEventListener("change", renderSubjects);
    sectionFilter.addEventListener("change", renderSubjects);

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        searchInput.value = "";
        semesterFilter.value = "";
        sectionFilter.value = "";
        renderSubjects();
    });

    document.getElementById("refreshBtn").addEventListener("click", loadSubjects);

    loadSubjects();
});
