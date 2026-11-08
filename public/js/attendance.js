document.addEventListener("DOMContentLoaded", async function () {

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
        studentName += " " + student.last_name;
    }


    /* ==========================================
       HEADER STUDENT
    ========================================== */

    const headerName =
        document.getElementById("headerStudentName");

    if (headerName) {
        headerName.textContent = studentName;
    }


    /* ==========================================
       SIDEBAR STUDENT
    ========================================== */

    const sidebarName =
        document.getElementById("sidebarStudentName");

    if (sidebarName) {
        sidebarName.textContent = studentName;
    }


    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    if (sidebarAvatar) {
        sidebarAvatar.textContent =
            studentName.charAt(0).toUpperCase();
    }


    /* ==========================================
       HEADER AVATAR
    ========================================== */

    const avatar =
        document.getElementById("avatarLetter");

    if (avatar) {
        avatar.textContent =
            studentName.charAt(0).toUpperCase();
    }


    /* ==========================================
       STUDENT DETAILS
    ========================================== */

    const studentEnrollment =
        document.getElementById("studentEnrollment");

    if (studentEnrollment) {
        studentEnrollment.textContent =
            student.enrollment_number || "--";
    }


    const studentAcademic =
        document.getElementById("studentAcademic");

    if (studentAcademic) {
        studentAcademic.textContent =
            `${student.branch || "--"} • ${student.batch || "--"} • ${student.year_of_study || "--"}`;
    }


    /* ==========================================
       GET YEAR
       
       26 = 1st Year
       25 = 2nd Year
       24 = 3rd Year
       23 = 4th Year
    ========================================== */

    const enrollmentNumber =
        String(student.enrollment_number || "").trim();

    const admissionYear =
        enrollmentNumber.substring(0, 2);


    let semesterList = [];


    if (admissionYear === "26") {

        // 1st Year
        semesterList = [1];

    } else if (admissionYear === "25") {

        // 2nd Year
        semesterList = [1, 2, 3];

    } else if (admissionYear === "24") {

        // 3rd Year
        semesterList = [1, 2, 3, 4, 5];

    } else if (admissionYear === "23") {

        // 4th Year
        semesterList = [1, 2, 3, 4, 5, 6, 7];

    } else {

        /*
           Fallback using year_of_study
        */

        const year =
            Number(student.year_of_study);

        if (year === 1) {
            semesterList = [1];
        } else if (year === 2) {
            semesterList = [1, 2, 3];
        } else if (year === 3) {
            semesterList = [1, 2, 3, 4, 5];
        } else if (year === 4) {
            semesterList = [1, 2, 3, 4, 5, 6, 7];
        }
    }


    /* ==========================================
       SEMESTER DROPDOWN
    ========================================== */

    const semesterSelect =
        document.getElementById("semesterSelect");

    const semesterDescription =
        document.getElementById("semesterDescription");


    if (!semesterSelect) {
        console.error("Semester dropdown not found");
        return;
    }


    semesterSelect.innerHTML = "";


    semesterList.forEach(semester => {

        const option =
            document.createElement("option");

        option.value = semester;
        option.textContent =
            `Semester ${semester}`;

        semesterSelect.appendChild(option);

    });


    /* ==========================================
       DEFAULT SEMESTER
       
       Use student's actual semester
       
       Example:
       4th year + DB semester 7
       → Semester 7 selected
    ========================================== */

    const actualSemester =
        Number(student.semester);


    if (semesterList.includes(actualSemester)) {

        semesterSelect.value =
            actualSemester;

    } else if (semesterList.length > 0) {

        semesterSelect.value =
            semesterList[semesterList.length - 1];

    }


    /* ==========================================
       LOAD ATTENDANCE FUNCTION
    ========================================== */

    async function loadAttendance(selectedSemester) {

        try {

            /* ======================================
               UPDATE DESCRIPTION
            ====================================== */

            if (semesterDescription) {

                semesterDescription.textContent =
                    `Attendance records for Semester ${selectedSemester}`;

            }


            /* ======================================
               GET ATTENDANCE DATA
               
               Dashboard API currently returns
               student's current semester attendance.
               
               We therefore fetch attendance directly
               using the new semester API below.
            ====================================== */

            const attendanceResponse =
                await fetch(
                    `/api/attendance/${student.id}?semester=${selectedSemester}`
                );


            const attendanceData =
                await attendanceResponse.json();


            if (
                !attendanceResponse.ok ||
                !attendanceData.success
            ) {

                throw new Error(
                    attendanceData.message ||
                    "Unable to load attendance"
                );

            }


            const attendance =
                attendanceData.attendance || [];


            /* ======================================
               GET SUBJECTS FROM COURSES TABLE
            ====================================== */

          
const section = String(student.section || "")
    .trim()
    .toUpperCase();

const branch = String(student.branch || "")
    .trim()
    .toUpperCase();

const coursesResponse = await fetch(
    `/api/courses?semester=${selectedSemester}` +
    `&section=${encodeURIComponent(section)}` +
    `&branch=${encodeURIComponent(branch)}`
);

const coursesData = await coursesResponse.json();

if (!coursesResponse.ok || !coursesData.success) {
    throw new Error(
        coursesData.message || "Unable to load subjects"
    );
}

const courses = coursesData.courses || [];



            /* ======================================
               MERGE COURSES + ATTENDANCE
            ====================================== */

            const attendanceMap =
                new Map();


            attendance.forEach(record => {

                const code =
                    String(
                        record.subject_code || ""
                    )
                    .trim()
                    .toUpperCase();


                attendanceMap.set(
                    code,
                    record
                );

            });


            const subjectAttendance =
                courses.map(course => {

                    const code =
                        String(
                            course.course_code || ""
                        )
                        .trim()
                        .toUpperCase();


                    const record =
                        attendanceMap.get(code);


                    /* ==============================
                       ATTENDANCE EXISTS
                    ============================== */

                    if (record) {

                        return {

                            subject_code:
                                course.course_code,

                            subject_name:
                                course.course_name,

                            classes_held:
                                Number(
                                    record.classes_held
                                ) || 0,

                            classes_attended:
                                Number(
                                    record.classes_attended
                                ) || 0,

                            attendance_percentage:
                                Number(
                                    record.attendance_percentage
                                ) || 0,

                            faculty_name:
                                course.faculty_name

                        };

                    }


                    /* ==============================
                       NO ATTENDANCE YET
                    ============================== */

                    return {

                        subject_code:
                            course.course_code,

                        subject_name:
                            course.course_name,

                        classes_held: 0,

                        classes_attended: 0,

                        attendance_percentage: 0,

                        faculty_name:
                            course.faculty_name

                    };

                });


            /* ==========================================
               CALCULATE OVERALL ATTENDANCE
            ========================================== */

            let totalHeld = 0;
            let totalAttended = 0;


            subjectAttendance.forEach(record => {

                totalHeld +=
                    Number(record.classes_held) || 0;

                totalAttended +=
                    Number(record.classes_attended) || 0;

            });


            let overallAttendance = 0;


            if (totalHeld > 0) {

                overallAttendance =
                    (
                        totalAttended /
                        totalHeld
                    ) * 100;

            }


            /* ==========================================
               UPDATE SUMMARY CARDS
            ========================================== */

            document.getElementById(
                "overallAttendance"
            ).textContent =
                `${overallAttendance.toFixed(2)}%`;


            document.getElementById(
                "totalClasses"
            ).textContent =
                totalHeld;


            document.getElementById(
                "classesAttended"
            ).textContent =
                totalAttended;


            document.getElementById(
                "subjectCount"
            ).textContent =
                subjectAttendance.length;


            /* ==========================================
               UPDATE TABLE
            ========================================== */

            const tableBody =
                document.getElementById(
                    "attendanceTableBody"
                );


            tableBody.innerHTML = "";


            if (subjectAttendance.length === 0) {

                tableBody.innerHTML = `

                    <tr>

                        <td
                            colspan="7"
                            class="loading"
                        >

                            No subjects found
                            for Semester ${selectedSemester}.

                        </td>

                    </tr>

                `;

                return;

            }


            /* ==========================================
               CREATE SUBJECT ROWS
            ========================================== */

            subjectAttendance.forEach(
                (record, index) => {

                    const percentage =
                        Number(
                            record.attendance_percentage
                        ) || 0;


                    let statusText;
                    let statusClass;


                    if (percentage >= 85) {

                        statusText = "Good";
                        statusClass = "good";

                    }

                    else if (percentage >= 75) {

                        statusText = "Average";
                        statusClass = "average";

                    }

                    else {

                        statusText = "Low";
                        statusClass = "low";

                    }


                    const row =
                        document.createElement("tr");


                    row.innerHTML = `

                        <td>
                            ${index + 1}
                        </td>

                        <td>

                            <span class="subject-name">
                                ${record.subject_name}
                            </span>

                        </td>

                        <td>

                            <span class="subject-code">
                                ${record.subject_code}
                            </span>

                        </td>

                        <td>
                            ${record.classes_held}
                        </td>

                        <td>
                            ${record.classes_attended}
                        </td>

                        <td>

                            <span class="attendance-percent">
                                ${percentage.toFixed(2)}%
                            </span>

                            <span class="progress-container">

                                <span
                                    class="progress-bar"
                                    style="width:${Math.min(
                                        percentage,
                                        100
                                    )}%"
                                ></span>

                            </span>

                        </td>

                        <td>

                            <span
                                class="status ${statusClass}"
                            >
                                ${statusText}
                            </span>

                        </td>

                    `;


                    tableBody.appendChild(row);

                }
            );

        }

        catch (error) {

            console.error(
                "Attendance Error:",
                error
            );


            document.getElementById(
                "attendanceTableBody"
            ).innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        class="loading"
                    >

                        Unable to load attendance.

                    </td>

                </tr>

            `;

        }

    }


    /* ==========================================
       LOAD DEFAULT SEMESTER
    ========================================== */

    await loadAttendance(
        Number(semesterSelect.value)
    );


    /* ==========================================
       SEMESTER CHANGE
    ========================================== */

    semesterSelect.addEventListener(
        "change",
        async function () {

            const selectedSemester =
                Number(this.value);

            await loadAttendance(
                selectedSemester
            );

        }
    );


    /* ==========================================
       ACADEMICS DROPDOWN
    ========================================== */

    const academicsToggle =
        document.getElementById(
            "academicsToggle"
        );


    const academicsSubmenu =
        document.getElementById(
            "academicsSubmenu"
        );


    const academicsArrow =
        document.getElementById(
            "academicsArrow"
        );


    if (
        academicsToggle &&
        academicsSubmenu
    ) {

        academicsSubmenu.classList.add(
            "open"
        );

        academicsToggle.classList.add(
            "open"
        );


        academicsToggle.addEventListener(
            "click",
            function () {

                academicsSubmenu.classList.toggle(
                    "open"
                );


                academicsToggle.classList.toggle(
                    "open"
                );


                if (academicsArrow) {

                    academicsArrow.classList.toggle(
                        "rotate"
                    );

                }

            }
        );

    }


    /* ==========================================
       LOGOUT
    ========================================== */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                sessionStorage.removeItem(
                    "student"
                );


                window.location.href =
                    "/";

            }
        );

    }

});