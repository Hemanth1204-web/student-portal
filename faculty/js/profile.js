
document.addEventListener("DOMContentLoaded", async () => {

    const message = document.getElementById("profileMessage");

    let faculty;

    try {
        faculty = JSON.parse(
            sessionStorage.getItem("faculty") || "null"
        );
    } catch (error) {
        faculty = null;
    }

    // Require faculty login
    if (!faculty || !faculty.faculty_id) {
        window.location.replace("/");
        return;
    }

    // Logout
    const logoutButton = document.getElementById("logoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem("faculty");
            window.location.replace("/");
        });
    }

    try {
        message.textContent = "Loading profile information...";
        message.classList.remove("error");

        const response = await fetch(
            `/api/faculty/${encodeURIComponent(faculty.faculty_id)}/profile`
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.faculty) {
            throw new Error(
                data.message || "Unable to load faculty profile."
            );
        }

        const details = data.faculty;

        const name = details.faculty_name || "Faculty";
        const facultyId = details.faculty_id || "—";
        const email = details.email || "Not provided";
        const mobile = details.mobile || "Not provided";
        const initial = name.trim().charAt(0).toUpperCase() || "F";

        // Header details
        document.getElementById("topFacultyName").textContent = name;
        document.getElementById("topFacultyId").textContent = facultyId;
        document.getElementById("avatar").textContent = initial;

        // Profile card
        document.getElementById("profileAvatar").textContent = initial;
        document.getElementById("profileName").textContent = name;
        document.getElementById("profileFacultyId").textContent = facultyId;

        // Personal information
        document.getElementById("facultyName").textContent = name;
        document.getElementById("facultyId").textContent = facultyId;
        document.getElementById("facultyEmail").textContent = email;
        document.getElementById("facultyMobile").textContent = mobile;

        message.textContent = "";

    } catch (error) {
        console.error("Faculty profile error:", error);

        message.textContent =
            error.message || "Could not load profile information.";

        message.classList.add("error");
    }
});
