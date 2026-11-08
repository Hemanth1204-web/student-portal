
document.addEventListener("DOMContentLoaded", async () => {
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

    const facultyName = faculty.faculty_name || "Faculty";

    document.getElementById("facultyName").textContent = facultyName;
    document.getElementById("facultyId").textContent = faculty.faculty_id;
    document.getElementById("avatar").textContent =
        facultyName.charAt(0).toUpperCase();

    const subjectFilter = document.getElementById("subjectFilter");
    const yearFilter = document.getElementById("yearFilter");
    const semesterFilter = document.getElementById("semesterFilter");
    const sectionFilter = document.getElementById("sectionFilter");
    const searchInput = document.getElementById("studentSearch");

    const tbody = document.getElementById("studentsTable");
    const statusMessage = document.getElementById("statusMessage");
    const errorMessage = document.getElementById("errorMessage");
    const emptyState = document.getElementById("emptyState");

    let assignments = [];
    let students = [];

    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("faculty");
        window.location.replace("/");
    });

    function addOptions(select, values, labelPrefix = "") {
        const uniqueValues = [...new Set(
            values
                .filter(value => value !== null && value !== undefined && value !== "")
                .map(value => String(value).trim())
        )].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );

        uniqueValues.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = `${labelPrefix}${value}`;
            select.appendChild(option);
        });
    }

    function populateFilters() {
        addOptions(
            subjectFilter,
            assignments.map(a => a.course_code),
        );

        // Show subject names instead of codes where possible.
        const subjectNames = new Map(
            assignments.map(a => [
                String(a.course_code),
                `${a.course_code} — ${a.course_name}`
            ])
        );

        [...subjectFilter.options].forEach(option => {
            if (subjectNames.has(option.value)) {
                option.textContent = subjectNames.get(option.value);
            }
        });

        addOptions(yearFilter, assignments.map(a => a.year_of_study));
        addOptions(
            semesterFilter,
            assignments.map(a => a.semester),
            "Semester "
        );
        addOptions(
            sectionFilter,
            assignments.map(a => a.section),
            "Section "
        );
    }

    function renderStudents() {
        const search = searchInput.value.trim().toLowerCase();

        const filtered = students.filter(student => {
            const enrollment = String(
                student.enrollment_number || ""
            ).toLowerCase();

            const name = [
                student.first_name,
                student.last_name
            ].filter(Boolean).join(" ").toLowerCase();

            return enrollment.includes(search) || name.includes(search);
        });

        tbody.replaceChildren();

        document.getElementById("resultCount").textContent =
            `Showing ${filtered.length} of ${students.length} students`;

        if (filtered.length === 0) {
            emptyState.hidden = false;
            statusMessage.textContent = "";
            return;
        }

        emptyState.hidden = true;
        statusMessage.textContent = "";

        filtered.forEach((student, index) => {
            const row = document.createElement("tr");

            const fullName = [
                student.first_name,
                student.last_name
            ].filter(Boolean).join(" ") || "—";

            const values = [
                index + 1,
                student.enrollment_number,
                fullName,
                student.branch,
                student.year_of_study,
                student.semester,
                student.section
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    }

    async function loadStudents() {
        statusMessage.textContent = "Loading student records...";
        errorMessage.textContent = "";
        emptyState.hidden = true;

        const query = new URLSearchParams();

        if (subjectFilter.value) {
            query.set("course_code", subjectFilter.value);
        }

        if (yearFilter.value) {
            query.set("year", yearFilter.value);
        }

        if (semesterFilter.value) {
            query.set("semester", semesterFilter.value);
        }

        if (sectionFilter.value) {
            query.set("section", sectionFilter.value);
        }

        try {
            const url =
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/students` +
                (query.toString() ? `?${query.toString()}` : "");

           const response = await fetch(url);
const contentType = response.headers.get("content-type") || "";

if (!contentType.includes("application/json")) {
    const responseText = await response.text();

    console.error("Students API returned HTML or another non-JSON response:", {
        url,
        status: response.status,
        response: responseText.slice(0, 500)
    });

    throw new Error(
        `Students API returned a non-JSON response (HTTP ${response.status}). Check the API route in server.js.`
    );
}

const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load students."
                );
            }

            students = Array.isArray(data.students)
                ? data.students
                : [];

            document.getElementById("totalStudents").textContent =
                students.length;

            renderStudents();
        } catch (error) {
            console.error("My Students error:", error);

            students = [];
            tbody.replaceChildren();
            emptyState.hidden = true;
            statusMessage.textContent = "";

            document.getElementById("resultCount").textContent =
                "Unable to load student records.";

            errorMessage.textContent =
                error.message || "Could not load students.";
        }
    }

    async function initialisePage() {
        try {
            statusMessage.textContent = "Loading faculty assignments...";

            const response = await fetch(
                `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/assignments`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to load assignments."
                );
            }

            assignments = Array.isArray(data.assignments)
                ? data.assignments
                : [];

            document.getElementById("totalSubjects").textContent =
                new Set(
                    assignments.map(a => a.course_code || a.course_name)
                ).size;

            document.getElementById("totalSections").textContent =
                new Set(
                    assignments.map(a =>
                        `${a.year_of_study}|${a.semester}|${a.section}`
                    )
                ).size;

            populateFilters();
            await loadStudents();
        } catch (error) {
            console.error("Faculty assignments error:", error);

            statusMessage.textContent = "";
            errorMessage.textContent =
                error.message || "Could not load faculty assignments.";

            document.getElementById("totalStudents").textContent = "—";
            document.getElementById("totalSubjects").textContent = "—";
            document.getElementById("totalSections").textContent = "—";
        }
    }

    [subjectFilter, yearFilter, semesterFilter, sectionFilter]
        .forEach(select => {
            select.addEventListener("change", loadStudents);
        });

    searchInput.addEventListener("input", renderStudents);

    document.getElementById("refreshBtn").addEventListener("click", loadStudents);

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        subjectFilter.value = "";
        yearFilter.value = "";
        semesterFilter.value = "";
        sectionFilter.value = "";
        searchInput.value = "";
        loadStudents();
    });

    await initialisePage();
});
