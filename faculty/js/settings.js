
document.addEventListener("DOMContentLoaded", () => {

    let faculty;

    try {
        faculty = JSON.parse(
            sessionStorage.getItem("faculty") || "null"
        );
    } catch {
        faculty = null;
    }

    if (!faculty || !faculty.faculty_id) {
        window.location.replace("/");
        return;
    }

    const name = faculty.faculty_name || "Faculty";

    document.getElementById("facultyName").textContent = name;
    document.getElementById("facultyId").textContent =
        faculty.faculty_id;

    document.getElementById("avatar").textContent =
        name.trim().charAt(0).toUpperCase();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.removeItem("faculty");
        window.location.replace("/");
    });

    // Show / Hide passwords
    document.querySelectorAll(".toggle-password").forEach(button => {

        button.addEventListener("click", () => {

            const input = document.getElementById(button.dataset.target);

            if (!input) return;

            const show = input.type === "password";

            input.type = show ? "text" : "password";
            button.textContent = show ? "Hide" : "Show";
        });
    });

    // Change password form
    const form = document.getElementById("changePasswordForm");
    const message = document.getElementById("passwordMessage");
    const submitButton = document.getElementById("changePasswordBtn");

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        message.textContent = "";
        message.className = "password-message";

        if (newPassword.length < 8) {
            message.textContent =
                "New password must contain at least 8 characters.";
            message.classList.add("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            message.textContent = "New passwords do not match.";
            message.classList.add("error");
            return;
        }

        if (currentPassword === newPassword) {
            message.textContent =
                "New password must be different from current password.";
            message.classList.add("error");
            return;
        }

        // Backend integration will be added after verifying
        // the existing faculty login password storage method.
        message.textContent =
            "Password API is not connected yet.";
        message.classList.add("error");
    });

});
