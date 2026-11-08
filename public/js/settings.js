
document.addEventListener("DOMContentLoaded", () => {
    const student = JSON.parse(sessionStorage.getItem("student") || "null");

    // Require a logged-in student.
    if (!student || !student.id) {
        window.location.href = "/index.html";
        return;
    }

    const $ = (selector) => document.querySelector(selector);

    const getInitials = (name) => {
        const words = String(name || "Student").trim().split(/\s+/);
        return words.slice(0, 2).map(word => word[0] || "").join("").toUpperCase() || "S";
    };

    const fullName = [
        student.first_name,
        student.last_name
    ].filter(Boolean).join(" ") || student.name || "Student";

    const enrollment = student.enrollment_number || "";

    // Fill the existing portal profile areas.
    $("#sidebarName").textContent = fullName;
    $("#headerName").textContent = fullName;
    $("#sidebarEnrollment").textContent = enrollment;
    $("#headerEnrollment").textContent = enrollment;
    $("#photoStudentName").textContent = fullName;

    $("#sidebarAvatar").textContent = getInitials(fullName);
    $("#headerAvatar").textContent = getInitials(fullName);
    $("#photoPreview").textContent = getInitials(fullName);

    // Academics submenu toggle.
    const academicsToggle = $("#academicsToggle");
    const academicsSubmenu = $("#academicsSubmenu");

    if (academicsToggle && academicsSubmenu) {
        academicsToggle.addEventListener("click", () => {
            const isOpen = academicsSubmenu.classList.toggle("show");
            academicsToggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    // Switch settings panels without navigating away.
    const settingButtons = document.querySelectorAll(".settings-option");
    const panels = document.querySelectorAll(".settings-panel");

    settingButtons.forEach(button => {
        button.addEventListener("click", () => {
            settingButtons.forEach(item => item.classList.remove("selected"));
            panels.forEach(panel => panel.classList.remove("active"));

            button.classList.add("selected");
            const panel = document.getElementById(button.dataset.panel);

            if (panel) panel.classList.add("active");
        });
    });

    // Message helper.
    function showMessage(element, message, type = "") {
        if (!element) return;
        element.textContent = message;
        element.className = "settings-message";
        if (type) element.classList.add(type);
    }

    // API helper: gives a useful error when an endpoint is missing.
    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options
        });

        const contentType = response.headers.get("content-type") || "";
        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            throw new Error(
                "The server did not return JSON. Check that the backend route exists and restart your server."
            );
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.message || "The request failed.");
        }

        return data;
    }

    // -------------------------------------
    // PROFILE PHOTO
    // -------------------------------------
    const photoForm = $("#photoForm");
    const photoInput = $("#profilePhoto");
    const photoPreview = $("#photoPreview");
    const uploadPhotoBtn = $("#uploadPhotoBtn");
    const photoMessage = $("#photoMessage");

    let selectedPhoto = null;

    function displayPhoto(url) {
        if (!url) return;

        const image = document.createElement("img");
        image.alt = "Student profile photo";
        image.src = url;
        image.onerror = () => {
            photoPreview.textContent = getInitials(fullName);
        };

        photoPreview.replaceChildren(image);
    }

    // If your login API returns an existing photo URL, show it.
    if (student.profile_photo_url) {
        displayPhoto(student.profile_photo_url);
    }

    photoInput.addEventListener("change", () => {
        selectedPhoto = photoInput.files && photoInput.files[0];

        showMessage(photoMessage, "");

        if (!selectedPhoto) return;

        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(selectedPhoto.type)) {
            photoInput.value = "";
            selectedPhoto = null;
            showMessage(photoMessage, "Please select a JPEG or PNG image.", "error");
            return;
        }

        if (selectedPhoto.size > maxSize) {
            photoInput.value = "";
            selectedPhoto = null;
            showMessage(photoMessage, "The image must be 5 MB or smaller.", "error");
            return;
        }

        const previewUrl = URL.createObjectURL(selectedPhoto);
        displayPhoto(previewUrl);
    });

    photoForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!selectedPhoto) {
            showMessage(photoMessage, "Please choose a photo first.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("profilePhoto", selectedPhoto);

        uploadPhotoBtn.disabled = true;
        uploadPhotoBtn.textContent = "Uploading...";

        try {
            const data = await apiRequest("/api/settings/profile-photo", {
                method: "POST",
                body: formData
            });

            if (!data.photoUrl) {
                throw new Error("Upload completed without a photo URL.");
            }

            displayPhoto(data.photoUrl);

            // Update the current session's photo URL.
            student.profile_photo_url = data.photoUrl;
            sessionStorage.setItem("student", JSON.stringify(student));

            showMessage(photoMessage, "Profile photo updated successfully.", "success");
            photoInput.value = "";
            selectedPhoto = null;
        } catch (error) {
            showMessage(photoMessage, error.message, "error");
        } finally {
            uploadPhotoBtn.disabled = false;
            uploadPhotoBtn.textContent = "Upload Photo";
        }
    });

    // -------------------------------------
    // PASSWORD OTP
    // -------------------------------------
    const otpRequestForm = $("#otpRequestForm");
    const otpEmail = $("#otpEmail");
    const otpSection = $("#otpSection");
    const otpRequestBtn = $("#requestOtpBtn");
    const otpRequestMessage = $("#otpRequestMessage");
    const changePasswordForm = $("#changePasswordForm");
    const otpCode = $("#otpCode");
    const newPassword = $("#newPassword");
    const confirmPassword = $("#confirmPassword");
    const changePasswordBtn = $("#changePasswordBtn");
    const passwordMessage = $("#passwordMessage");

    // Use the registered email if available in the student session.
    if (student.email) {
        otpEmail.value = student.email;
    }

    otpRequestForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = otpEmail.value.trim();

        if (!email) {
            showMessage(otpRequestMessage, "Enter your registered email address.", "error");
            return;
        }

        otpRequestBtn.disabled = true;
        otpRequestBtn.textContent = "Requesting...";

        try {
            const data = await apiRequest("/api/settings/request-password-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: student.id,
                    email
                })
            });

            otpSection.hidden = false;
            showMessage(
                otpRequestMessage,
                data.message || "If the details match your account, an OTP has been generated.",
                "success"
            );
            showMessage(passwordMessage, "");
            otpCode.focus();
        } catch (error) {
            showMessage(otpRequestMessage, error.message, "error");
        } finally {
            otpRequestBtn.disabled = false;
            otpRequestBtn.textContent = "Request OTP";
        }
    });

    changePasswordForm.addEventListener("submit", async event => {
        event.preventDefault();

        const otp = otpCode.value.trim();
        const password = newPassword.value;
        const confirmation = confirmPassword.value;

        if (!/^\d{6}$/.test(otp)) {
            showMessage(passwordMessage, "Enter the 6-digit OTP.", "error");
            return;
        }

        if (password.length < 8) {
            showMessage(passwordMessage, "Your new password must contain at least 8 characters.", "error");
            return;
        }

        if (password !== confirmation) {
            showMessage(passwordMessage, "The passwords do not match.", "error");
            return;
        }

        changePasswordBtn.disabled = true;
        changePasswordBtn.textContent = "Verifying...";

        try {
            const data = await apiRequest("/api/settings/verify-password-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: student.id,
                    email: otpEmail.value.trim(),
                    otp,
                    newPassword: password
                })
            });

            showMessage(
                passwordMessage,
                data.message || "Password changed successfully.",
                "success"
            );

            changePasswordForm.reset();
            otpRequestForm.reset();
            otpSection.hidden = true;

            // Do not store the password or OTP in sessionStorage.
        } catch (error) {
            showMessage(passwordMessage, error.message, "error");
        } finally {
            changePasswordBtn.disabled = false;
            changePasswordBtn.textContent = "Verify OTP & Change Password";
        }
    });

    // -------------------------------------
    // THEME: LIGHT, DARK OR SYSTEM
    // -------------------------------------
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const themeMessage = $("#themeMessage");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(preference) {
        // Remove only the classes managed by this page.
        document.body.classList.remove("settings-theme-light", "settings-theme-dark");

        const effectiveTheme = preference === "system"
            ? (systemTheme.matches ? "dark" : "light")
            : preference;

        document.body.classList.add(`settings-theme-${effectiveTheme}`);
    }

    let savedTheme = "system";

    try {
        savedTheme = localStorage.getItem("apexPortalTheme") || "system";
    } catch (error) {
        // The default remains system if localStorage is unavailable.
    }

    if (!["light", "dark", "system"].includes(savedTheme)) {
        savedTheme = "system";
    }

    const selectedRadio = document.querySelector(
        `input[name="theme"][value="${savedTheme}"]`
    );

    if (selectedRadio) selectedRadio.checked = true;
    applyTheme(savedTheme);

    themeRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (!radio.checked) return;

            try {
                localStorage.setItem("apexPortalTheme", radio.value);
            } catch (error) {
                // Theme still applies to the current page.
            }

            applyTheme(radio.value);

            showMessage(
                themeMessage,
                `Appearance set to ${radio.value === "system"
                    ? "System"
                    : radio.value.charAt(0).toUpperCase() + radio.value.slice(1)}.`,
                "success"
            );
        });
    });

    systemTheme.addEventListener?.("change", () => {
        let preference = "system";

        try {
            preference = localStorage.getItem("apexPortalTheme") || "system";
        } catch (error) {}

        if (preference === "system") applyTheme("system");
    });
});
