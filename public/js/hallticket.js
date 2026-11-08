/* =========================================================
   APEX STUDENT PORTAL
   HALL TICKET
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       GET LOGGED-IN STUDENT
    ===================================================== */

    const studentData = sessionStorage.getItem("student");

    if (!studentData) {
        window.location.href = "/index.html";
        return;
    }

    let student;

    try {
        student = JSON.parse(studentData);
    } catch (error) {
        console.error("Invalid student session:", error);
        window.location.href = "/index.html";
        return;
    }


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const semesterSelect =
        document.getElementById("semesterSelect");

    const hallTicketCard =
        document.getElementById("hallTicketCard");

    const noHallTicket =
        document.getElementById("noHallTicket");

    const noHallTicketMessage =
        document.getElementById("noHallTicketMessage");

    const examTableBody =
        document.getElementById("examTableBody");

    const hallSemester =
        document.getElementById("hallSemester");

    const printButton =
        document.getElementById("printHallTicket");


    /* =====================================================
       STUDENT ELEMENTS
    ===================================================== */

    const studentName =
        document.getElementById("studentName");

    const studentEnrollment =
        document.getElementById("studentEnrollment");

    const studentBranch =
        document.getElementById("studentBranch");

    const studentSection =
        document.getElementById("studentSection");


    const ticketName =
        document.getElementById("ticketName");

    const ticketEnrollment =
        document.getElementById("ticketEnrollment");

    const ticketBranch =
        document.getElementById("ticketBranch");

    const ticketSection =
        document.getElementById("ticketSection");


    /* =====================================================
       HEADER / SIDEBAR
    ===================================================== */

    const sidebarName =
        document.getElementById("sidebarName");

    const sidebarEnrollment =
        document.getElementById("sidebarEnrollment");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const headerName =
        document.getElementById("headerName");

    const headerEnrollment =
        document.getElementById("headerEnrollment");

    const headerAvatar =
        document.getElementById("headerAvatar");


    /* =====================================================
       STUDENT INFORMATION
    ===================================================== */

    const firstName =
        student.first_name || "";

    const lastName =
        student.last_name || "";

    const fullName =
        `${firstName} ${lastName}`.trim() || "Student";

    const enrollment =
        student.enrollment_number || "--";

    const branch =
        student.branch || "--";

    const section =
        student.section || "--";


    /* =====================================================
       SET STUDENT INFORMATION
    ===================================================== */

    if (studentName)
        studentName.textContent = fullName;

    if (studentEnrollment)
        studentEnrollment.textContent = enrollment;

    if (studentBranch)
        studentBranch.textContent = branch;

    if (studentSection)
        studentSection.textContent = section;


    /* =====================================================
       HALL TICKET STUDENT INFORMATION
    ===================================================== */

    if (ticketName)
        ticketName.textContent = fullName;

    if (ticketEnrollment)
        ticketEnrollment.textContent = enrollment;

    if (ticketBranch)
        ticketBranch.textContent = branch;

    if (ticketSection)
        ticketSection.textContent = section;


    /* =====================================================
       SIDEBAR INFORMATION
    ===================================================== */

    if (sidebarName)
        sidebarName.textContent = fullName;

    if (sidebarEnrollment)
        sidebarEnrollment.textContent = enrollment;

    if (sidebarAvatar)
        sidebarAvatar.textContent =
            fullName.charAt(0).toUpperCase();


    /* =====================================================
       HEADER INFORMATION
    ===================================================== */

    if (headerName)
        headerName.textContent = fullName;

    if (headerEnrollment)
        headerEnrollment.textContent = enrollment;

    if (headerAvatar)
        headerAvatar.textContent =
            fullName.charAt(0).toUpperCase();


    /* =====================================================
       DETERMINE CURRENT SEMESTER
       
       26 -> 1st Year -> Sem 1
       25 -> 2nd Year -> Sem 3
       24 -> 3rd Year -> Sem 5
       23 -> 4th Year -> Sem 7
    ===================================================== */

    function getCurrentSemester() {

        const prefix =
            String(enrollment).substring(0, 2);

        switch (prefix) {

            case "26":
                return 1;

            case "25":
                return 3;

            case "24":
                return 5;

            case "23":
                return 7;

            default:
                return 1;
        }
    }


    const currentSemester =
        getCurrentSemester();


    /* =====================================================
       COMPLETED SEMESTERS
       
       Current semester is NOT shown.
       
       1st Year -> none
       2nd Year -> 1,2
       3rd Year -> 1,2,3,4
       4th Year -> 1,2,3,4,5,6
    ===================================================== */

  /* =====================================================
   ALL SEMESTERS INCLUDING CURRENT SEMESTER
===================================================== */

function getAvailableSemesters() {

    const semesters = [];

    for (let semester = 1; semester <= currentSemester; semester++) {
        semesters.push(semester);
    }

    return semesters;
}


   /* =====================================================
   POPULATE SEMESTER DROPDOWN
   Includes CURRENT semester
===================================================== */

function populateSemesterDropdown() {

    semesterSelect.innerHTML = "";

    const semesters =
        getAvailableSemesters();


    /* -------------------------------------------------
       ADD ALL SEMESTERS INCLUDING CURRENT SEMESTER
    ------------------------------------------------- */

    semesters.forEach((semester) => {

        const option =
            document.createElement("option");

        option.value = semester;

        option.textContent =
            `Semester ${semester}`;

        semesterSelect.appendChild(option);

    });


    /* -------------------------------------------------
       SELECT CURRENT SEMESTER BY DEFAULT
    ------------------------------------------------- */

    semesterSelect.value =
        currentSemester;


    /* -------------------------------------------------
       CHECK CURRENT SEMESTER
       
       Current semester:
       → Hall Ticket Not Available

       Previous semesters:
       → Hall Ticket Available
    ------------------------------------------------- */

    handleSemesterSelection(
        currentSemester
    );
}



function getAvailableSemesters() {

    const semesters = [];

    for (
        let semester = 1;
        semester <= currentSemester;
        semester++
    ) {
        semesters.push(semester);
    }

    return semesters;
}



function handleSemesterSelection(semester) {

    const selectedSemester =
        Number(semester);


    // Current semester
    if (selectedSemester === currentSemester) {

        showNoHallTicket(
            "Hall Ticket Not Available",
            `Hall ticket for Semester ${selectedSemester} is not available because this is your current semester.`
        );

        return;
    }


    // Previous semester
    loadHallTicket(selectedSemester);
}


    /* =====================================================
       LOAD HALL TICKET
    ===================================================== */

    async function loadHallTicket(semester) {

        if (!semester) {
            return;
        }


        try {

            showLoading();


            const response =
                await fetch(
                    `/api/hall-ticket/${student.id}`
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            const data =
                await response.json();


            console.log(
                "Hall Ticket API:",
                data
            );


            /* ------------------------------------------------
               GET EXAMS
            ------------------------------------------------ */

            let exams = [];


            if (Array.isArray(data.exams)) {

                exams =
                    data.exams.filter(
                        exam =>
                            Number(exam.semester) ===
                            Number(semester)
                    );

            } else if (
                data.exams &&
                data.exams[semester]
            ) {

                exams =
                    data.exams[semester];
            }


            /* ------------------------------------------------
               RENDER
            ------------------------------------------------ */

            renderHallTicket(
                exams,
                semester
            );


        } catch (error) {

            console.error(
                "Hall Ticket Error:",
                error
            );


            showNoHallTicket(
                "Unable to Load Hall Ticket",
                "Unable to load the examination schedule. Please try again."
            );
        }
    }


    /* =====================================================
       RENDER HALL TICKET
    ===================================================== */

    function renderHallTicket(
        exams,
        semester
    ) {

        if (!exams || exams.length === 0) {

            showNoHallTicket(
                "No Examination Schedule",
                `The examination schedule for Semester ${semester} has not been added yet.`
            );

            return;
        }


        /* -------------------------------------------------
           SORT BY DATE
        ------------------------------------------------- */

        exams.sort(
            (a, b) =>
                new Date(a.exam_date) -
                new Date(b.exam_date)
        );


        /* -------------------------------------------------
           SHOW HALL TICKET
        ------------------------------------------------- */

        if (noHallTicket) {
            noHallTicket.classList.add("hidden");
        }

        if (hallTicketCard) {
            hallTicketCard.classList.remove("hidden");
        }


        /* -------------------------------------------------
           SEMESTER TITLE
        ------------------------------------------------- */

        if (hallSemester) {

            hallSemester.textContent =
                `Semester ${semester}`;
        }


        /* -------------------------------------------------
           CLEAR TABLE
        ------------------------------------------------- */

        examTableBody.innerHTML = "";


        /* -------------------------------------------------
           ADD EXAM ROWS
        ------------------------------------------------- */

        exams.forEach((exam, index) => {

            const row =
                document.createElement("tr");


            const examDate =
                formatDate(exam.exam_date);


            const startTime =
                formatTime(exam.start_time);


            const endTime =
                formatTime(exam.end_time);


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            exam.subject_code || "--"
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        exam.subject_name || "--"
                    )}
                </td>

                <td>
                    ${examDate}
                </td>

                <td>
                    ${startTime} - ${endTime}
                </td>

            `;


            examTableBody.appendChild(row);

        });
    }


    /* =====================================================
       SHOW NO HALL TICKET
    ===================================================== */

    function showNoHallTicket(
        title,
        message
    ) {

        if (hallTicketCard) {
            hallTicketCard.classList.add("hidden");
        }


        if (noHallTicket) {

            noHallTicket.classList.remove(
                "hidden"
            );

            const titleElement =
                noHallTicket.querySelector("h3");

            if (titleElement) {
                titleElement.textContent =
                    title;
            }

            if (noHallTicketMessage) {
                noHallTicketMessage.textContent =
                    message;
            }
        }
    }


    /* =====================================================
       LOADING
    ===================================================== */

    function showLoading() {

        if (noHallTicket) {
            noHallTicket.classList.add("hidden");
        }

        if (hallTicketCard) {
            hallTicketCard.classList.remove("hidden");
        }

        if (hallSemester) {
            hallSemester.textContent =
                "Loading...";
        }

        if (examTableBody) {

            examTableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        style="
                            text-align:center;
                            padding:30px;
                            color:var(--text-secondary);
                        "
                    >
                        Loading examination schedule...
                    </td>

                </tr>

            `;
        }
    }


    /* =====================================================
       SEMESTER CHANGE
    ===================================================== */

    semesterSelect.addEventListener(
        "change",
        () => {

            const selectedSemester =
                semesterSelect.value;

            if (selectedSemester) {

                loadHallTicket(
                    selectedSemester
                );
            }
        }
    );


    /* =====================================================
       PRINT / DOWNLOAD A4
    ===================================================== */

    if (printButton) {

        printButton.addEventListener(
            "click",
            () => {

                const selectedSemester =
                    semesterSelect.value;


                if (!selectedSemester) {

                    alert(
                        "Please select a semester first."
                    );

                    return;
                }


                if (
                    !hallTicketCard ||
                    hallTicketCard.classList.contains(
                        "hidden"
                    )
                ) {

                    alert(
                        "Hall ticket is not available."
                    );

                    return;
                }


                /* -----------------------------------------
                   Save original title
                ----------------------------------------- */

                const originalTitle =
                    document.title;


                document.title =
                    `Hall Ticket - Semester ${selectedSemester}`;


                /* -----------------------------------------
                   Add print mode
                ----------------------------------------- */

                document.body.classList.add(
                    "printing-hall-ticket"
                );


                /* -----------------------------------------
                   Open browser print dialog
                   
                   User can choose:
                   Save as PDF
                   Paper Size: A4
                   Orientation: Portrait
                ----------------------------------------- */

                window.print();


                /* -----------------------------------------
                   Restore page
                ----------------------------------------- */

                setTimeout(() => {

                    document.title =
                        originalTitle;

                    document.body.classList.remove(
                        "printing-hall-ticket"
                    );

                }, 1000);

            }
        );
    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(dateString) {

        if (!dateString) {
            return "--";
        }


        const date =
            new Date(dateString);


        if (isNaN(date.getTime())) {
            return dateString;
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       TIME FORMAT
    ===================================================== */

    function formatTime(timeString) {

        if (!timeString) {
            return "--";
        }


        const parts =
            String(timeString).split(":");


        let hours =
            parseInt(parts[0], 10);


        const minutes =
            parts[1] || "00";


        const suffix =
            hours >= 12
                ? "PM"
                : "AM";


        hours =
            hours % 12 || 12;


        return `${hours}:${minutes} ${suffix}`;
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       START PAGE
    ===================================================== */

    populateSemesterDropdown();

});