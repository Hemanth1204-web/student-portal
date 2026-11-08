
/* =========================================
   APEX STUDENT PORTAL
   DASHBOARD JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       1. GET LOGGED-IN STUDENT
    ========================================= */

    const studentData = sessionStorage.getItem("student");

    if (!studentData) {
        window.location.href = "/";
        return;
    }

    let student;

    try {
        student = JSON.parse(studentData);

        if (!student || typeof student !== "object") {
            throw new Error("Invalid student data");
        }
    } catch (error) {
        sessionStorage.removeItem("student");
        window.location.href = "/";
        return;
    }


    /* =========================================
       2. UPDATE STUDENT NAME
    ========================================= */

    const studentName =
        [student.first_name, student.last_name]
            .filter(Boolean)
            .join(" ") || "Student";

    const sidebarName =
        document.getElementById("sidebarStudentName");

    const headerName =
        document.getElementById("headerStudentName");

    const welcomeName =
        document.getElementById("welcomeStudentName");

    if (sidebarName) {
        sidebarName.textContent = studentName;
    }

    if (headerName) {
        headerName.textContent = studentName;
    }


    /* =========================================
       3. WELCOME GREETING
    ========================================= */

    if (welcomeName) {
        const hour = new Date().getHours();

        let greeting;

        if (hour < 12) {
            greeting = "Good Morning";
        } else if (hour < 17) {
            greeting = "Good Afternoon";
        } else {
            greeting = "Good Evening";
        }

        welcomeName.textContent = `${greeting}, ${studentName}!`;
    }


    /* =========================================
       4. CURRENT DATE
    ========================================= */

    const currentDate =
        document.getElementById("currentDate");

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    /* =========================================
       5. ACADEMICS COLLAPSIBLE MENU
    ========================================= */

    const academicsToggle =
        document.getElementById("academicsToggle");

    const academicsSubmenu =
        document.getElementById("academicsSubmenu");

    const academicsArrow =
        document.getElementById("academicsArrow");

    if (academicsToggle && academicsSubmenu) {

        // Open submenu by default
        academicsSubmenu.classList.add("open");
        academicsToggle.classList.add("open");

        academicsToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        if (academicsArrow) {
            academicsArrow.textContent = "▴";
        }

        // Toggle submenu when Academics is clicked
        academicsToggle.addEventListener("click", (event) => {
            event.preventDefault();

            const isOpen =
                academicsSubmenu.classList.toggle("open");

            academicsToggle.classList.toggle("open", isOpen);

            academicsToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            if (academicsArrow) {
                academicsArrow.textContent =
                    isOpen ? "▴" : "▾";
            }
        });
    }


    /* =========================================
       6. MOBILE SIDEBAR
    ========================================= */

    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.getElementById("sidebar");

    if (mobileMenu && sidebar) {
        mobileMenu.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }


    /* =========================================
       7. LOGOUT
    ========================================= */

    const logoutButton =
        document.querySelector(".logout-item");

    if (logoutButton) {
        logoutButton.addEventListener("click", (event) => {
            event.preventDefault();

            sessionStorage.removeItem("student");

            window.location.href = "/";
        });
    }

});
