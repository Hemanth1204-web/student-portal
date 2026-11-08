document.addEventListener("DOMContentLoaded", function () {

    /* ==========================================
       GET LOGGED-IN STUDENT
    ========================================== */

    const storedStudent =
        sessionStorage.getItem("student");

    if (!storedStudent) {

        window.location.href = "/";

        return;
    }

    const student =
        JSON.parse(storedStudent);


    /* ==========================================
       STUDENT NAME
    ========================================== */

    let studentName =
        student.first_name || "Student";

    if (student.last_name) {

        studentName +=
            " " + student.last_name;
    }


    /* ==========================================
       INITIAL
    ========================================== */

    const firstLetter =
        studentName
            .charAt(0)
            .toUpperCase();


    /* ==========================================
       HEADER
    ========================================== */

    const headerName =
        document.getElementById("headerStudentName");

    if (headerName) {
        headerName.textContent = studentName;
    }


    const headerAvatar =
        document.getElementById("headerAvatar");

    if (headerAvatar) {
        headerAvatar.textContent = firstLetter;
    }


    /* ==========================================
       SIDEBAR
    ========================================== */

    const sidebarName =
        document.getElementById("sidebarStudentName");

    if (sidebarName) {
        sidebarName.textContent = studentName;
    }


    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    if (sidebarAvatar) {
        sidebarAvatar.textContent = firstLetter;
    }


    /* ==========================================
       PROFILE HERO
    ========================================== */

    const profileName =
        document.getElementById("profileStudentName");

    if (profileName) {
        profileName.textContent = studentName;
    }


    const profileEnrollment =
        document.getElementById("profileEnrollment");

    if (profileEnrollment) {
        profileEnrollment.textContent =
            student.enrollment_number || "--";
    }


    /* ==========================================
       PROFILE AVATAR
    ========================================== */

    const profileAvatar =
        document.getElementById("profileAvatar");

    if (profileAvatar) {
        profileAvatar.textContent = firstLetter;
    }


    /* ==========================================
       PERSONAL INFORMATION
    ========================================== */

    const fullName =
        document.getElementById("fullName");

    if (fullName) {
        fullName.textContent =
            studentName;
    }


    const enrollmentNumber =
        document.getElementById("enrollmentNumber");

    if (enrollmentNumber) {
        enrollmentNumber.textContent =
            student.enrollment_number || "--";
    }


    const gender =
        document.getElementById("gender");

    if (gender) {
        gender.textContent =
            student.gender || "--";
    }


    const dateOfBirth =
        document.getElementById("dateOfBirth");

    if (dateOfBirth) {
        dateOfBirth.textContent =
            student.date_of_birth || "--";
    }


    const email =
        document.getElementById("email");

    if (email) {
        email.textContent =
            student.email || "--";
    }


    const phone =
        document.getElementById("phone");

    if (phone) {
        phone.textContent =
            student.phone || "--";
    }


    /* ==========================================
       ACADEMIC INFORMATION
    ========================================== */

    const course =
        document.getElementById("course");

    if (course) {
        course.textContent =
            student.course || "--";
    }


    const branch =
        document.getElementById("branch");

    if (branch) {
        branch.textContent =
            student.branch || "--";
    }


    const batch =
        document.getElementById("batch");

    if (batch) {
        batch.textContent =
            student.batch || "--";
    }


    const yearOfStudy =
        document.getElementById("yearOfStudy");

    if (yearOfStudy) {
        yearOfStudy.textContent =
            student.year_of_study || "--";
    }


    const semester =
        document.getElementById("semester");

    if (semester) {

        semester.textContent =
            student.semester
                ? "Semester " + student.semester
                : "--";
    }


    const section =
        document.getElementById("section");

    if (section) {
        section.textContent =
            student.section || "--";
    }


  /* ==========================================
   ACADEMICS DROPDOWN
========================================== */

const academicsToggle =
    document.getElementById("academicsToggle");

const academicsSubmenu =
    document.getElementById("academicsSubmenu");

const academicsArrow =
    document.getElementById("academicsArrow");


if (
    academicsToggle &&
    academicsSubmenu
) {

    academicsToggle.addEventListener(
        "click",
        function (event) {

            // Prevent page scrolling / default action
            event.preventDefault();

            // Prevent click from affecting other elements
            event.stopPropagation();

            academicsSubmenu.classList.toggle("show");

            if (academicsArrow) {

                academicsArrow.classList.toggle("rotate");

            }

        }
    );
}


    /* ==========================================
       LOGOUT
    ========================================== */

    const logoutButton =
        document.querySelector(".logout-item");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                sessionStorage.removeItem(
                    "student"
                );

                window.location.href = "/";

            }
        );
    }

});