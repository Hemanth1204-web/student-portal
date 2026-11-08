
document.addEventListener("DOMContentLoaded", async () => {
    const student = JSON.parse(sessionStorage.getItem("student") || "null");

    const semesterSelect = document.getElementById("semesterSelect");
    const gradeTableBody = document.getElementById("gradeTableBody");
    const gradeMessage = document.getElementById("gradeMessage");

    const studentNameEl = document.getElementById("studentName");
    const studentEnrollmentEl = document.getElementById("studentEnrollment");
    const studentBranchSectionEl = document.getElementById("studentBranchSection");

    const semesterSGPAEl = document.getElementById("semesterSGPA");
    const overallCGPAEl = document.getElementById("overallCGPA");
    const failedSubjectsEl = document.getElementById("failedSubjects");
    const semesterDescriptionEl = document.getElementById("semesterDescription");
    const gradeTableTitle = document.getElementById("gradeTableTitle");

    // Redirect to login if no student is logged in
    if (!student || !student.id) {
        window.location.href = "/index.html";
        return;
    }

    // Populate student details
    const fullName = [
        student.first_name,
        student.last_name
    ].filter(Boolean).join(" ") || "Student";

    const enrollment = student.enrollment_number || "N/A";
    const branch = student.branch || student.course || "N/A";
    const section = student.section || "N/A";
    const initials = fullName.charAt(0).toUpperCase();

    studentNameEl.textContent = fullName;
    studentEnrollmentEl.textContent = enrollment;
    studentBranchSectionEl.textContent = `${branch} / ${section}`;

    document.getElementById("sidebarName").textContent = fullName;
    document.getElementById("sidebarEnrollment").textContent = enrollment;
    document.getElementById("sidebarAvatar").textContent = initials;

    document.getElementById("headerName").textContent = fullName;
    document.getElementById("headerEnrollment").textContent = enrollment;
    document.getElementById("headerAvatar").textContent = initials;

    // Academics sidebar toggle
    const academicsToggle = document.getElementById("academicsToggle");
    const academicsSubmenu = document.getElementById("academicsSubmenu");
    const academicsArrow = document.getElementById("academicsArrow");

    if (academicsToggle && academicsSubmenu) {
        academicsToggle.addEventListener("click", () => {
            academicsSubmenu.classList.toggle("show");

            if (academicsArrow) {
                academicsArrow.textContent =
                    academicsSubmenu.classList.contains("show") ? "▾" : "▸";
            }
        });
    }

    // Logout
    document.getElementById("logoutButton").addEventListener("click", event => {
        event.preventDefault();
        sessionStorage.removeItem("student");
        window.location.href = "/index.html";
    });

    // Initial loading state
    semesterSelect.disabled = true;
    gradeTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="grade-message">Loading grade details...</td>
        </tr>
    `;

    try {
        const response = await fetch(
            `/api/grade-list/${encodeURIComponent(student.id)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load Grade List.");
        }

        const semesters = Array.isArray(data.semesters) ? data.semesters : [];

        overallCGPAEl.textContent =
            Number(data.cgpa || 0).toFixed(2);

        if (semesters.length === 0) {
            semesterSelect.innerHTML = `<option value="">No semesters available</option>`;
            semesterSelect.disabled = true;

            semesterSGPAEl.textContent = "—";
            failedSubjectsEl.textContent = "—";

            gradeTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="grade-message">
                        ${escapeHTML(
                            data.message ||
                            "No grade details are available for your account yet."
                        )}
                    </td>
                </tr>
            `;

            semesterDescriptionEl.textContent =
                "Grade List is not available for these semesters yet.";

            return;
        }

        // Populate dropdown using semesters returned by the API
        semesterSelect.innerHTML = semesters.map(item => `
            <option value="${Number(item.semester)}">
                Semester ${Number(item.semester)}
            </option>
        `).join("");

        semesterSelect.disabled = false;

        // Select the first available semester initially
        semesterSelect.value = String(semesters[0].semester);

        function renderSemester() {
            const selectedSemester = Number(semesterSelect.value);

            const semesterData = semesters.find(
                item => Number(item.semester) === selectedSemester
            );

            if (!semesterData) {
                gradeTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="grade-message">
                            No data found for this semester.
                        </td>
                    </tr>
                `;

                semesterSGPAEl.textContent = "—";
                failedSubjectsEl.textContent = "—";
                return;
            }

            const subjects = Array.isArray(semesterData.subjects)
                ? semesterData.subjects
                : [];

            const failedCount = subjects.filter(
                subject => subject.grade === "F"
            ).length;

            semesterSGPAEl.textContent =
                Number(semesterData.sgpa || 0).toFixed(2);

            failedSubjectsEl.textContent = failedCount;

            semesterDescriptionEl.textContent =
                `Showing ${subjects.length} subject(s) for Semester ${selectedSemester}.`;

            gradeTableTitle.textContent =
                `Semester ${selectedSemester} Grade Details`;

            if (subjects.length === 0) {
                gradeTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="grade-message">
                            No subjects found for this semester.
                        </td>
                    </tr>
                `;
                return;
            }

            gradeTableBody.innerHTML = subjects.map(subject => {
                const isFail = subject.grade === "F";
                const resultClass = isFail ? "fail" : "pass";

                return `
                    <tr>
                        <td>${escapeHTML(subject.subject_code || "—")}</td>
                        <td>${escapeHTML(subject.subject_name || "—")}</td>
                        <td>${formatMark(subject.internal)}</td>
                        <td>${formatMark(subject.external)}</td>
                        <td><strong>${formatMark(subject.total)}</strong></td>
                        <td>
                            <span class="grade-badge ${resultClass}">
                                ${escapeHTML(subject.grade || "—")}
                            </span>
                        </td>
                        <td>
                            <span class="grade-status ${resultClass}">
                                ${isFail ? "Fail" : "Pass"}
                            </span>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        // Update the table whenever the dropdown changes
        semesterSelect.addEventListener("change", renderSemester);

        renderSemester();

    } catch (error) {
        console.error("Grade List error:", error);

        semesterSelect.disabled = true;
        semesterSelect.innerHTML = `<option value="">Unavailable</option>`;

        gradeTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="grade-message grade-error">
                    Unable to load grades. Please check the server and try again.
                </td>
            </tr>
        `;

        semesterDescriptionEl.textContent =
            error.message || "An error occurred while loading grades.";
    }

    function formatMark(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number.toFixed(1).replace(/\.0$/, "") : "—";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }
});
