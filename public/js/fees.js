document.addEventListener("DOMContentLoaded", async () => {


    /* =========================================
       GET LOGGED-IN STUDENT
    ========================================== */

    const student =
        JSON.parse(
            sessionStorage.getItem("student")
        );


    if (!student) {

        window.location.href = "/index.html";

        return;

    }


    /* =========================================
       ELEMENTS
    ========================================== */

    const tableBody =
        document.getElementById(
            "feesTableBody"
        );

    const loading =
        document.getElementById(
            "feesLoading"
        );

    const noFees =
        document.getElementById(
            "noFees"
        );


    /* =========================================
       LOAD FEE DETAILS
    ========================================== */

    async function loadFees() {

        try {


            const response =
                await fetch(
                    `/api/fees/${student.id}`
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load fees"
                );

            }


            const data =
                await response.json();


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load fees"
                );

            }


            /* ===============================
               STUDENT INFORMATION
            ================================ */

            const studentData =
                data.student;


            document.getElementById(
                "feeStudentName"
            ).textContent =
                studentData.name;


            document.getElementById(
                "feeEnrollment"
            ).textContent =
                studentData.enrollment_number;


            document.getElementById(
                "residenceType"
            ).textContent =
                formatResidence(
                    studentData.residence_type
                );


            document.getElementById(
                "transportType"
            ).textContent =
                formatTransport(
                    studentData.transport_type
                );


            /* ===============================
               FEE RECORDS
            ================================ */

            const fees =
                data.fees || [];


            loading.classList.add(
                "hidden"
            );


            if (fees.length === 0) {

                noFees.classList.remove(
                    "hidden"
                );

                return;

            }


            noFees.classList.add(
                "hidden"
            );


            renderFees(fees);


        }

        catch (error) {

            console.error(
                "Fees loading error:",
                error
            );


            loading.classList.add(
                "hidden"
            );


            noFees.classList.remove(
                "hidden"
            );

        }

    }


    /* =========================================
       RENDER FEE TABLE
    ========================================== */

    function renderFees(fees) {

        tableBody.innerHTML = "";


        fees.forEach(
            (fee, index) => {


                const row =
                    document.createElement(
                        "tr"
                    );


                const semesterFee =
                    Number(
                        fee.semester_fee || 0
                    );


                const busFee =
                    Number(
                        fee.bus_fee || 0
                    );


                const hostelFee =
                    Number(
                        fee.hostel_fee || 0
                    );


                const totalPaid =
                    Number(
                        fee.total_paid || 0
                    );


                const paidDate =
                    formatDate(
                        fee.paid_date
                    );


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        Semester ${fee.semester}
                    </td>

                    <td>
                        ${formatCurrency(
                            semesterFee
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            busFee
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            hostelFee
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            totalPaid
                        )}
                    </td>

                    <td>
                        ${paidDate}
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    /* =========================================
       CURRENCY
    ========================================== */

    function formatCurrency(value) {

        return "₹" +
            Number(value).toLocaleString(
                "en-IN"
            );

    }


    /* =========================================
       DATE
    ========================================== */

    function formatDate(dateValue) {

        if (!dateValue) {

            return "--";

        }


        const date =
            new Date(dateValue);


        if (isNaN(date.getTime())) {

            return "--";

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


    /* =========================================
       RESIDENCE
    ========================================== */

    function formatResidence(value) {

        if (
            value === "HOSTELER"
        ) {

            return "Hosteler";

        }


        return "Day Scholar";

    }


    /* =========================================
       TRANSPORT
    ========================================== */

    function formatTransport(value) {

        if (
            value === "BUS"
        ) {

            return "Bus";

        }


        return "No Bus";

    }


    /* =========================================
       LOGOUT
    ========================================== */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();


                sessionStorage.removeItem(
                    "student"
                );


                window.location.href =
                    "/index.html";

            }
        );

    }


    /* =========================================
       LOAD
    ========================================== */

    await loadFees();

});