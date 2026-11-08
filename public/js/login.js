console.log("LOGIN JS LOADED");


/* ==========================================
   ELEMENTS
========================================== */

const loginForm =
    document.getElementById("loginForm");


const enrollmentInput =
    document.getElementById("enrollmentNumber");


const passwordInput =
    document.getElementById("password");


const loginError =
    document.getElementById("loginError");


const loginButton =
    document.getElementById("loginButton");


const showPassword =
    document.getElementById("showPassword");


const loginRole =
    document.getElementById("loginRole");


const loginTitle =
    document.getElementById("loginTitle");


const loginSubtitle =
    document.getElementById("loginSubtitle");


const loginIdLabel =
    document.getElementById("loginIdLabel");


/* ==========================================
   ROLE SELECTOR
========================================== */

const roleOptions =
    document.querySelectorAll(".role-option");


roleOptions.forEach(function (button) {


    button.addEventListener(
        "click",
        function () {


            /* Remove active */

            roleOptions.forEach(function (option) {

                option.classList.remove("active");

            });


            /* Add active */

            button.classList.add("active");


            /* Get selected role */

            const role =
                button.dataset.role;


            loginRole.value =
                role;


            /* =================================
               STUDENT
            ================================= */

            if (role === "student") {


                loginTitle.textContent =
                    "Student Login";


                loginSubtitle.textContent =
                    "Sign in to access your student portal";


                loginIdLabel.textContent =
                    "Enrollment Number";


                enrollmentInput.placeholder =
                    "Enter your enrollment number";


            }


            /* =================================
               FACULTY
            ================================= */

            else if (role === "faculty") {


                loginTitle.textContent =
                    "Faculty Login";


                loginSubtitle.textContent =
                    "Sign in to access your faculty portal";


                loginIdLabel.textContent =
                    "Faculty ID";


                enrollmentInput.placeholder =
                    "Enter your faculty ID";


            }


            /* =================================
               ADMIN
            ================================= */

            else if (role === "admin") {


                loginTitle.textContent =
                    "Admin Login";


                loginSubtitle.textContent =
                    "Sign in to access the administration portal";


                loginIdLabel.textContent =
                    "Admin ID";


                enrollmentInput.placeholder =
                    "Enter your admin ID";

            }

        }
    );

});


/* ==========================================
   SHOW / HIDE PASSWORD
========================================== */

showPassword.addEventListener(
    "click",
    function () {


        if (
            passwordInput.type ===
            "password"
        ) {


            passwordInput.type =
                "text";


            showPassword.textContent =
                "Hide";


        } else {


            passwordInput.type =
                "password";


            showPassword.textContent =
                "Show";

        }

    }
);


/* ==========================================
   LOGIN
========================================== */

loginForm.addEventListener(
    "submit",
    async function (event) {


        event.preventDefault();


        loginError.textContent =
            "";

        loginError.style.display =
            "none";


        const userId =
            enrollmentInput.value.trim();


        const password =
            passwordInput.value;


        const role =
            loginRole.value;


        /* =================================
           EMPTY INPUT
        ================================= */

        if (!userId || !password) {


            loginError.textContent =
                "Please enter your ID and password";


            loginError.style.display =
                "block";


            return;

        }


        loginButton.disabled =
            true;


        try {


            const response =
                await fetch(
                    "/api/login",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                enrollmentNumber:
                                    userId,

                                password:
                                    password,

                                role:
                                    role

                            })

                    }
                );


            const data =
                await response.json();


            /* =================================
               LOGIN FAILED
            ================================= */

            if (!data.success) {


                loginError.textContent =
                    data.message;


                loginError.style.display =
                    "block";


                loginButton.disabled =
                    false;


                return;

            }


            /* =================================
               STUDENT LOGIN
            ================================= */

            if (role === "student") {


                sessionStorage.setItem(
                    "student",
                    JSON.stringify(
                        data.student
                    )
                );


                window.location.href =
                    "/pages/dashboard.html";


                return;

            }


            /* =================================
               FACULTY LOGIN
            ================================= */

            if (role === "faculty") {


                sessionStorage.setItem(
                    "faculty",
                    JSON.stringify(
                        data.faculty
                    )
                );


                window.location.href =
                    "/faculty/pages/faculty-dashboard.html";


                return;

            }


            /* =================================
               ADMIN LOGIN
            ================================= */

            if (role === "admin") {


                sessionStorage.setItem(
                    "admin",
                    JSON.stringify(
                        data.admin
                    )
                );


                window.location.href =
                    "/pages/admin-dashboard.html";


                return;

            }


        }


        catch (error) {


            console.error(error);


            loginError.textContent =
                "Unable to connect to server.";


            loginError.style.display =
                "block";


            loginButton.disabled =
                false;

        }

    }
);