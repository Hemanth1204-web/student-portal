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


    const firstLetter =
        studentName.charAt(0).toUpperCase();



    /* ==========================================
       HEADER
    ========================================== */

    const headerName =
        document.getElementById("headerStudentName");

    const headerAvatar =
        document.getElementById("headerAvatar");


    if (headerName) {

        headerName.textContent =
            studentName;

    }


    if (headerAvatar) {

        headerAvatar.textContent =
            firstLetter;

    }



    /* ==========================================
       SIDEBAR
    ========================================== */

    const sidebarName =
        document.getElementById("sidebarStudentName");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");


    if (sidebarName) {

        sidebarName.textContent =
            studentName;

    }


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            firstLetter;

    }



    /* ==========================================
       STUDENT INFORMATION
    ========================================== */

    const enrollment =
        student.enrollment_number || "";


    document.getElementById(
        "studentEnrollment"
    ).textContent =
        enrollment || "--";



    /* ==========================================
       DETERMINE YEAR
       
       26 = 1st Year
       25 = 2nd Year
       24 = 3rd Year
       23 = 4th Year
    ========================================== */

    const admissionYear =
        enrollment.substring(0, 2);


    let academicYear = "--";

    let yearNumber = 0;

    let semesterList = [];


    if (admissionYear === "26") {

        academicYear =
            "1st Year";

        yearNumber = 1;

        semesterList = [1];

    }

    else if (admissionYear === "25") {

        academicYear =
            "2nd Year";

        yearNumber = 2;

        semesterList = [1, 2, 3];

    }

    else if (admissionYear === "24") {

        academicYear =
            "3rd Year";

        yearNumber = 3;

        semesterList =
            [1, 2, 3, 4, 5];

    }

    else if (admissionYear === "23") {

        academicYear =
            "4th Year";

        yearNumber = 4;

        semesterList =
            [1, 2, 3, 4, 5, 6, 7];

    }

    else {

        academicYear =
            student.year_of_study || "--";

        yearNumber = 0;

        semesterList = [];

    }



    /* ==========================================
       BRANCH
    ========================================== */

    const branch =
        (student.branch || "").toUpperCase();



    /* ==========================================
       SECTION
    ========================================== */

    const section =
        (student.section || "").toUpperCase();



    /* ==========================================
       STUDENT ACADEMIC INFORMATION
    ========================================== */

    document.getElementById(
        "studentAcademic"
    ).textContent =
        `${branch} • ${student.batch || "--"} • ${academicYear}`;


    document.getElementById(
        "yearDisplay"
    ).textContent =
        academicYear;


    document.getElementById(
        "branchDisplay"
    ).textContent =
        branch || "--";


    document.getElementById(
        "sectionDisplay"
    ).textContent =
        section || "--";



    /* ==========================================
       SEMESTER SELECTOR
    ========================================== */

    const semesterSelect =
        document.getElementById(
            "semesterSelect"
        );


    semesterSelect.innerHTML = "";


    if (semesterList.length === 0) {

        const option =
            document.createElement("option");


        option.textContent =
            "Semesters not available";

        option.value = "";


        semesterSelect.appendChild(
            option
        );

    }

    else {

        semesterList.forEach(
            semester => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    semester;


                option.textContent =
                    `Semester ${semester}`;


                semesterSelect.appendChild(
                    option
                );

            }
        );

    }



    /* ==========================================
       CURRENT SEMESTER
    ========================================== */

    let currentSemester =
        Number(student.semester);


    if (
        !semesterList.includes(
            currentSemester
        )
    ) {

        currentSemester =
            semesterList[0];

    }


    if (currentSemester) {

        semesterSelect.value =
            currentSemester;


        document.getElementById(
            "semesterDisplay"
        ).textContent =
            `Semester ${currentSemester}`;

    }



    /* ==========================================
       GET COURSES FROM DATABASE
    ========================================== */

    async function getCourses(semester) {

        try {

            /* ==============================
               SECURITY CHECK
            ============================== */

            if (
                !semesterList.includes(
                    Number(semester)
                )
            ) {

                return [];

            }


            /* ==============================
               REQUEST DATABASE COURSES
            ============================== */

            const response = await fetch(
    `/api/courses?semester=${semester}` +
    `&section=${encodeURIComponent(section)}` +
    `&branch=${encodeURIComponent(branch)}`
);


            if (!response.ok) {

                throw new Error(
                    "Course API request failed"
                );

            }


            const data =
                await response.json();


            if (!data.success) {

                console.error(
                    "Course API Error:",
                    data.message
                );

                return [];

            }


            return data.courses || [];

        }

        catch (error) {

            console.error(
                "Failed to load courses:",
                error
            );

            return [];

        }

    }



    /* ==========================================
       RENDER COURSES
    ========================================== */

    async function renderCourses(
        semester
    ) {

        const courseList =
            document.getElementById(
                "courseList"
            );


        const noCourses =
            document.getElementById(
                "noCourses"
            );


        const semesterTitle =
            document.getElementById(
                "semesterTitle"
            );


        const courseCount =
            document.getElementById(
                "courseCount"
            );


        /* ==============================
           CLEAR OLD COURSES
        ============================== */

        courseList.innerHTML = "";


        /* ==============================
           SHOW LOADING
        ============================== */

        courseList.style.display =
            "flex";

        noCourses.style.display =
            "none";


        semesterTitle.textContent =
            `Semester ${semester}`;


        courseCount.textContent =
            "Loading...";


        /* ==============================
           GET DATABASE COURSES
        ============================== */

        const list =
            await getCourses(
                Number(semester)
            );


        /* ==============================
           NO COURSES
        ============================== */

        if (list.length === 0) {

            courseList.style.display =
                "none";

            noCourses.style.display =
                "block";


            noCourses.querySelector(
                "h3"
            ).textContent =
                "No Subjects Available";


            noCourses.querySelector(
                "p"
            ).textContent =
                "Subjects for this semester have not been added yet.";


            courseCount.textContent =
                "0 Subjects";


            return;

        }


        /* ==============================
           DISPLAY COURSE COUNT
        ============================== */

        courseCount.textContent =
            `${list.length} Subjects`;


        courseList.style.display =
            "flex";


        noCourses.style.display =
            "none";



        /* ==============================
           CREATE COURSE ITEMS
        ============================== */

        list.forEach(
            (subject, index) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "course-item";


                item.innerHTML = `

                    <div class="course-number">
                        ${index + 1}
                    </div>

                    <div class="course-info">

                        <div class="course-name">
                            ${subject.course_name}
                        </div>

                        <div class="course-code">
                            ${subject.course_code}
                        </div>

                        <div class="course-faculty">
                            Faculty: ${subject.faculty_name}
                        </div>

                    </div>

                    <div class="course-type">
                        Core Subject
                    </div>

                `;


                courseList.appendChild(
                    item
                );

            }
        );

    }



    /* ==========================================
       INITIAL RENDER
    ========================================== */

    if (currentSemester) {

        renderCourses(
            currentSemester
        );

    }



    /* ==========================================
       SEMESTER CHANGE
    ========================================== */

    semesterSelect.addEventListener(
        "change",
        function () {

            const semester =
                Number(this.value);


            if (
                !semesterList.includes(
                    semester
                )
            ) {

                return;

            }


            document.getElementById(
                "semesterDisplay"
            ).textContent =
                `Semester ${semester}`;


            renderCourses(
                semester
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

        academicsToggle.addEventListener(
            "click",
            function () {

                academicsSubmenu.classList.toggle(
                    "show"
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