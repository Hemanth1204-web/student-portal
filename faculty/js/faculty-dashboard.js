
document.addEventListener("DOMContentLoaded", async () => {
    let faculty;

    try {
        faculty = JSON.parse(
            sessionStorage.getItem("faculty") || "null"
        );
    } catch {
        faculty = null;
    }

    // Require a faculty login
    if (!faculty || !faculty.faculty_id) {
        window.location.replace("/");
        return;
    }

    const name = faculty.faculty_name || "Faculty";

    document.getElementById("facultyName").textContent = name;
    document.getElementById("welcomeName").textContent =
        name.split(" ")[0];
    document.getElementById("facultyId").textContent =
        faculty.faculty_id;
    document.getElementById("avatar").textContent =
        name.charAt(0).toUpperCase();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("faculty");
        window.location.replace("/");
    });

    // Load assigned subjects
    try {
        const response = await fetch(
            `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/assignments`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load faculty assignments."
            );
        }

        const assignments = data.assignments || [];

        const uniqueSubjects = new Set(
            assignments.map(item => item.course_code || item.course_name)
        );

        const uniqueSections = new Set(
            assignments.map(item =>
                `${item.year_of_study}-${item.semester}-${item.section}`
            )
        );

        document.getElementById("subjectCount").textContent =
            uniqueSubjects.size;

        document.getElementById("sectionCount").textContent =
            uniqueSections.size;

        document.getElementById("assignmentCount").textContent =
            assignments.length;

        // We will calculate this using the real student roster later.
        document.getElementById("studentCount").textContent = "—";

        const tbody = document.getElementById("subjectsTable");
        const message = document.getElementById("subjectMessage");

        tbody.replaceChildren();

        if (assignments.length === 0) {
            message.textContent =
                "No subjects are currently assigned to this account.";

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "No assignments found.";

            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        message.textContent = "";

        assignments.forEach(item => {
            const row = document.createElement("tr");

            [
                item.course_code,
                item.course_name,
                item.year_of_study,
                item.semester,
                item.section
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Faculty dashboard error:", error);

        document.getElementById("dashboardError").textContent =
            error.message || "Could not load dashboard data.";

        document.getElementById("subjectMessage").textContent =
            "Unable to load assignments. Check your server and database.";

        const tbody = document.getElementById("subjectsTable");
        tbody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "Could not load assignments.";

        row.appendChild(cell);
        tbody.appendChild(row);
    }
});
