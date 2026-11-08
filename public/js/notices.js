
document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------
    // STUDENT SESSION
    // -----------------------------------------
    let student;

    try {
        student = JSON.parse(sessionStorage.getItem("student") || "null");
    } catch (error) {
        student = null;
    }

    if (!student || !student.id) {
        window.location.href = "/index.html";
        return;
    }

    const studentName =
        [student.first_name, student.last_name].filter(Boolean).join(" ") ||
        "Student";

    const enrollment = student.enrollment_number || "Student";
    const initials = studentName.charAt(0).toUpperCase();

    setText("sidebarStudentName", studentName);
    setText("headerStudentName", studentName);
    setText("sidebarAvatar", initials);
    setText("headerAvatar", initials);

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // -----------------------------------------
    // LOGOUT
    // -----------------------------------------
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();
            sessionStorage.removeItem("student");
            window.location.href = "/index.html";
        });
    }

    // -----------------------------------------
    // ACADEMICS DROPDOWN
    // Uses the .show class from global.css
    // -----------------------------------------
    const academicsToggle = document.getElementById("academicsToggle");
    const academicsSubmenu = document.getElementById("academicsSubmenu");
    const academicsArrow = document.getElementById("academicsArrow");

    if (academicsToggle && academicsSubmenu) {
        function setAcademicsOpen(isOpen) {
            academicsSubmenu.classList.toggle("show", isOpen);
            academicsToggle.classList.toggle("open", isOpen);
            academicsToggle.setAttribute("aria-expanded", String(isOpen));

            if (academicsArrow) {
                academicsArrow.textContent = isOpen ? "▴" : "▾";
            }
        }

        // Start closed; click Academics to open it.
        setAcademicsOpen(false);

        academicsToggle.addEventListener("click", () => {
            const isOpen = academicsSubmenu.classList.contains("show");
            setAcademicsOpen(!isOpen);
        });
    }

    // -----------------------------------------
    // NOTICE BOARD ELEMENTS
    // -----------------------------------------
    const searchInput = document.getElementById("noticeSearch");
    const showAllCheckbox = document.getElementById("showAllNotices");
    const tableBody = document.getElementById("noticeTableBody");
    const noticeCount = document.getElementById("noticeCount");
    const emptyMessage = document.getElementById("noticeEmpty");

    if (!searchInput || !showAllCheckbox || !tableBody ||
        !noticeCount || !emptyMessage) {
        console.error(
            "Notice Board elements are missing. Check the IDs in notices.html."
        );
        return;
    }

    // -----------------------------------------
    // SAMPLE NOTICES
    // These are local sample notices, not MySQL data.
    // -----------------------------------------
    const notices = [
        {
            id: 1,
            title: "EGL101 English Language Skills Seat Allotment",
            category: "Academics",
            date: "09/10/2026",
            viewed: false,
            body: "Students enrolled in EGL101 English Language Skills are requested to check their allotted seats and classroom details with the department before attending the scheduled session."
        },
        {
            id: 2,
            title: "World Mental Health Day Observation",
            category: "Announcement",
            date: "09/10/2026",
            viewed: true,
            body: "Students are encouraged to participate in awareness activities and support a healthy, respectful campus environment."
        },
        {
            id: 3,
            title: "Recharge Station",
            category: "Campus",
            date: "09/10/2026",
            viewed: true,
            body: "The campus recharge station is available for use in the designated area. Please follow the posted instructions and keep the area clean."
        },
        {
            id: 4,
            title: "Holiday Circular 02/10/2026",
            category: "Holiday",
            date: "01/10/2026",
            viewed: true,
            body: "Students should confirm holidays and academic schedules through official college communications."
        },
        {
            id: 5,
            title: "Student Safety and Awareness",
            category: "Student Welfare",
            date: "30/09/2026",
            viewed: true,
            body: "All students are requested to follow campus safety instructions and report safety concerns to the appropriate college office."
        },
        {
            id: 6,
            title: "Prohibited/Narcotic Substances - Notice",
            category: "Student Welfare",
            date: "30/09/2026",
            viewed: false,
            body: "Possession, use, or distribution of prohibited substances on campus is not permitted. Students must follow institute rules and applicable law."
        },
        {
            id: 7,
            title: "Midterm Notice - Room Allotment",
            category: "Examinations",
            date: "28/09/2026",
            viewed: true,
            body: "Students should check their examination room allotment before the midterm examinations. Please arrive on time and carry the required student identification."
        },
        {
            id: 8,
            title: "Classwork Circular",
            category: "Academics",
            date: "23/09/2026",
            viewed: true,
            body: "Students are advised to keep their classwork and course records updated. Contact the respective faculty member if clarification is required."
        },
        {
            id: 9,
            title: "Midterm Notice - Room Allotment (Section A)",
            category: "Examinations",
            date: "23/09/2026",
            viewed: true,
            body: "Students should verify their examination room and confirm the official timetable through the examination office."
        },
        {
            id: 10,
            title: "Midterm Notice - Room Allotment (Section B)",
            category: "Examinations",
            date: "22/09/2026",
            viewed: true,
            body: "Students in the relevant section should confirm their examination room and reporting time before the examination date."
        }
    ];

    // Keep viewed status separate for each student.
    const storageKey =
        `apexViewedNotices_${student.enrollment_number || student.id}`;

    try {
        const savedIds = JSON.parse(localStorage.getItem(storageKey) || "[]");

        if (Array.isArray(savedIds)) {
            notices.forEach(notice => {
                if (savedIds.includes(notice.id)) {
                    notice.viewed = true;
                }
            });
        }
    } catch (error) {
        console.warn("Could not load saved notice status:", error);
    }

    function saveViewedStatus() {
        try {
            const viewedIds = notices
                .filter(notice => notice.viewed)
                .map(notice => notice.id);

            localStorage.setItem(storageKey, JSON.stringify(viewedIds));
        } catch (error) {
            console.warn("Could not save notice status:", error);
        }
    }

    // -----------------------------------------
    // RENDER NOTICE TABLE
    // -----------------------------------------
    function renderNotices() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const showAll = showAllCheckbox.checked;

        const filtered = notices.filter(notice => {
            const matchesSearch =
                notice.title.toLowerCase().includes(searchTerm) ||
                notice.category.toLowerCase().includes(searchTerm) ||
                notice.date.toLowerCase().includes(searchTerm);

            return matchesSearch && (showAll || !notice.viewed);
        });

        tableBody.replaceChildren();

        filtered.forEach((notice, index) => {
            const row = document.createElement("tr");

            const serialCell = document.createElement("td");
            serialCell.className = "notice-serial";
            serialCell.textContent = String(index + 1);

            const titleCell = document.createElement("td");
            const titleButton = document.createElement("button");

            titleButton.type = "button";
            titleButton.className = "notice-link";
            titleButton.dataset.noticeId = String(notice.id);

            const icon = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            icon.setAttribute("viewBox", "0 0 20 22");
            icon.setAttribute("fill", "none");
            icon.setAttribute("aria-hidden", "true");
            icon.classList.add("notice-document-icon");

            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

            path.setAttribute(
                "d",
                "M4 1.5H11.5L17 7V19.5C17 20.05 16.55 20.5 16 20.5H4C3.45 20.5 3 20.05 3 19.5V2.5C3 1.95 3.45 1.5 4 1.5Z"
            );
            path.setAttribute("stroke", "currentColor");
            path.setAttribute("stroke-width", "1.6");
            icon.appendChild(path);

            const titleText = document.createElement("span");
            titleText.className = "notice-title-text";
            titleText.textContent = notice.title;

            titleButton.append(icon, titleText);
            titleCell.appendChild(titleButton);

            const viewedCell = document.createElement("td");
            viewedCell.className =
                `notice-viewed ${notice.viewed ? "yes" : "no"}`;
            viewedCell.textContent = notice.viewed ? "✓" : "✗";
            viewedCell.setAttribute(
                "aria-label",
                notice.viewed ? "Viewed" : "Not viewed"
            );

            const dateCell = document.createElement("td");
            dateCell.className = "notice-date";
            dateCell.textContent = notice.date;

            row.append(serialCell, titleCell, viewedCell, dateCell);
            tableBody.appendChild(row);
        });

        noticeCount.textContent = showAll
            ? `Showing all ${filtered.length} of ${notices.length} notices`
            : `Showing ${filtered.length} unread of ${notices.length} notices`;

        emptyMessage.hidden = filtered.length > 0;
    }

    searchInput.addEventListener("input", renderNotices);
    showAllCheckbox.addEventListener("change", renderNotices);

    // -----------------------------------------
    // OPEN NOTICE AS A PDF
    // Requires internet access to load jsPDF.
    // -----------------------------------------
    let pdfLibraryPromise;

    function loadJsPDF() {
        if (window.jspdf && window.jspdf.jsPDF) {
            return Promise.resolve(window.jspdf.jsPDF);
        }

        if (!pdfLibraryPromise) {
            pdfLibraryPromise = new Promise((resolve, reject) => {
                const script = document.createElement("script");

                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

                script.onload = () => {
                    if (window.jspdf && window.jspdf.jsPDF) {
                        resolve(window.jspdf.jsPDF);
                    } else {
                        reject(new Error("PDF library could not be initialized."));
                    }
                };

                script.onerror = () => {
                    pdfLibraryPromise = null;
                    reject(new Error("Could not load PDF library."));
                };

                document.head.appendChild(script);
            });
        }

        return pdfLibraryPromise;
    }

    async function openNotice(notice) {
        // Open the tab immediately to reduce popup-blocker issues.
        const pdfWindow = window.open("about:blank", "_blank");

        if (!pdfWindow) {
            alert("Allow pop-ups for this site, then try again.");
            return;
        }

        pdfWindow.document.title = "Preparing notice";

        const message = pdfWindow.document.createElement("p");
        message.textContent = "Generating notice PDF...";
        message.style.cssText = "font-family:Arial;padding:24px";
        pdfWindow.document.body.replaceChildren(message);

        try {
            const jsPDF = await loadJsPDF();
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const textWidth = pageWidth - margin * 2;

            pdf.setFont("times", "bold");
            pdf.setFontSize(16);
            pdf.text("APEX INSTITUTE OF TECHNOLOGY", pageWidth / 2, 22, {
                align: "center"
            });

            pdf.setFont("times", "normal");
            pdf.setFontSize(11);
            pdf.text("NOTICE", pageWidth / 2, 34, { align: "center" });
            pdf.text(`Date: ${notice.date}`, margin, 48);

            pdf.setFont("times", "bold");
            pdf.setFontSize(13);
            const titleLines = pdf.splitTextToSize(
                `Subject: ${notice.title}`,
                textWidth
            );
            pdf.text(titleLines, margin, 62);

            pdf.setFont("times", "normal");
            pdf.setFontSize(12);

            const bodyLines = pdf.splitTextToSize(
                notice.body,
                textWidth
            );

            const startY = 72 + titleLines.length * 7;
            pdf.text(bodyLines, margin, startY);

            pdf.setFontSize(10);
            pdf.text(
                "By Order of the Director",
                margin,
                Math.min(startY + bodyLines.length * 7 + 20, 275)
            );

            const pdfUrl = URL.createObjectURL(pdf.output("blob"));
            pdfWindow.location.replace(pdfUrl);

            notice.viewed = true;
            saveViewedStatus();
            renderNotices();

            // Revoke the temporary URL when the PDF tab is closed/navigated away.
            pdfWindow.addEventListener(
                "pagehide",
                () => URL.revokeObjectURL(pdfUrl),
                { once: true }
            );
        } catch (error) {
            console.error("Could not generate notice PDF:", error);

            if (!pdfWindow.closed) {
                const errorText = pdfWindow.document.createElement("p");
                errorText.textContent =
                    "Could not generate the PDF. Check your internet connection and try again.";
                errorText.style.cssText =
                    "font-family:Arial;padding:24px;color:#b42318";
                pdfWindow.document.body.replaceChildren(errorText);
            }
        }
    }

    tableBody.addEventListener("click", event => {
        const button = event.target.closest(".notice-link");
        if (!button) return;

        const notice = notices.find(
            item => item.id === Number(button.dataset.noticeId)
        );

        if (notice) openNotice(notice);
    });

    // Display all notices initially.
    showAllCheckbox.checked = true;
    renderNotices();
});
