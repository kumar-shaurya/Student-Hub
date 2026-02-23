import { API_BASE_URL, TARGETS } from './modules/constants.js';
import { state } from './modules/state.js';
import * as UI from './modules/ui.js';
import * as Data from './modules/data_service.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard module loaded.");

    // ============================================================
    //  CRITICAL FAILSAFE: STUCK ON LOADING WATCHDOG
    // ============================================================
    setTimeout(() => {
        const scheduleEl = document.getElementById('today-schedule-container');
        const snapshotEl = document.getElementById('snapshot-attendance-perc');
        const userLabel = document.getElementById('sidebar-username');

        const isScheduleStuck = scheduleEl && (scheduleEl.innerText.toLowerCase().includes('loading') || scheduleEl.innerText.trim() === '');
        const isSnapshotStuck = snapshotEl && snapshotEl.innerText === '...';
        const isUserStuck = userLabel && userLabel.textContent.trim() === 'Loading...';

        if (isScheduleStuck || isSnapshotStuck || isUserStuck) {
            console.warn(">> WATCHDOG: App stuck on loading. VTOP session likely expired. Forcing Reset.");
            localStorage.removeItem('vtop_session_id');
            window.location.href = '/login';
        }
    }, 3000); 
    // ============================================================

    let decryptedStudentList = []; 
    let isDirectoryUnlocked = false;

    const elements = {
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebar-overlay'),
        navLinks: document.querySelectorAll('.nav-link'),
        navLinkChildren: document.querySelectorAll('.nav-link-child'),
        pageSections: document.querySelectorAll('.page-section'),
        academicsToggle: document.querySelector('[data-section="academics"]'),
        examinationsToggle: document.querySelector('[data-section="examinations"]'),
        extraToggle: document.querySelector('[data-section="extra"]'),
        semesterSelect: document.getElementById('semester-select'),
        logoutBtn: document.getElementById('logoutBtn'),
        sidebarUsername: document.getElementById('sidebar-username'),
        sidebarRegNo: document.getElementById('sidebar-regno'),
        contentContainer: document.getElementById('content'),
        btnQuickAttendance: document.getElementById('btn-quick-attendance'),
        btnQuickMarks: document.getElementById('btn-quick-marks'),

        todaySchedule: document.getElementById('today-schedule-container'),
        timetable: document.getElementById('timetable-container'),
        courses: document.getElementById('courses-container'),
        attendance: document.getElementById('attendance-container'),
        marks: document.getElementById('marks-container'),
        examSchedule: document.getElementById('exam-schedule-container'),
        calendar: document.getElementById('calendar-container'),
        enrollment: document.getElementById('enrollment-container'),
        profile: document.getElementById('profile-container'),
        calculator: document.getElementById('extra-calculator'),

        dirPassword: document.getElementById('dir-password'),
        dirTogglePassword: document.getElementById('dir-toggle-password'),
        dirSearch: document.getElementById('dir-search'),
        dirSearchBtn: document.getElementById('dir-search-btn'),
        dirResults: document.getElementById('dir-results'),
        dirLockScreen: document.getElementById('dir-lock-screen'),
        dirSearchScreen: document.getElementById('dir-search-screen'),
        dirUnlockBtn: document.getElementById('dir-unlock-btn'),
        dirLockBtn: document.getElementById('dir-lock-btn'),

        modal: document.getElementById('detail-modal'),
        modalContent: document.querySelector('.modal-content'),
        modalTitle: document.getElementById('modal-title'),
        modalBody: document.getElementById('modal-body'),
        modalCloseBtn: document.getElementById('modal-close-btn')
    };

    const allDataContainers = [
        elements.todaySchedule, elements.timetable, elements.courses,
        elements.attendance, elements.marks, elements.examSchedule,
        elements.calendar,
        elements.enrollment, elements.profile,
        elements.calculator
    ];

    function closeSidebar() {
        if (window.innerWidth < 768) {
            elements.sidebar.classList.add('-translate-x-full');
            if (elements.sidebarOverlay) {
                elements.sidebarOverlay.classList.remove('opacity-100');
                setTimeout(() => elements.sidebarOverlay.classList.add('hidden'), 300);
            }
        }
    }

    function openSidebar() {
        elements.sidebar.classList.remove('-translate-x-full');
        if (elements.sidebarOverlay) {
            elements.sidebarOverlay.classList.remove('hidden');
            setTimeout(() => elements.sidebarOverlay.classList.add('opacity-100'), 10);
        }
    }

    function refreshCurrentPage() {
        UI.clearAllDataContainers(allDataContainers);
        const activeNav = document.querySelector('.nav-link.active');

        if (activeNav && !['academics', 'examinations', 'extra'].includes(activeNav.dataset.section)) {
            const sectionId = activeNav.dataset.section;
            if (sectionId === 'dashboard') {
                Data.fetchTimetableAndCourses(null, null, elements.todaySchedule)
                    .then(() => Data.fetchAndCalculateAttendanceSnapshot())
                    .then(() => Data.fetchAndDisplayODSnapshot());
            } else if (sectionId === 'enrollment') Data.fetchAndDisplay(TARGETS.ENROLLMENT, elements.enrollment, "Course Enrollment");
            else if (sectionId === 'profile') Data.fetchAndDisplay(TARGETS.PROFILE, elements.profile, "Profile");
        } else {
            const activeSub = document.querySelector('.nav-link-child.active-subsection');
            if (activeSub) activeSub.click();
        }
    }

    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-attendance-detail');
        if (btn) {
            e.preventDefault(); e.stopPropagation();
            const { classId, slot } = UI.openAttendanceDetailModal(
                elements.modal, elements.modalTitle, elements.modalBody,
                elements.modalContent, btn.dataset.classId, btn.dataset.slot, btn.dataset.courseTitle
            );
            Data.fetchAttendanceDetails(classId, slot, elements.modalBody);
        }
    });

    if (elements.modalCloseBtn) elements.modalCloseBtn.addEventListener('click', () => UI.closeModal(elements.modal, elements.modalContent, elements.modalBody));
    if (elements.modal) elements.modal.addEventListener('click', (e) => { if (e.target === elements.modal) UI.closeModal(elements.modal, elements.modalContent, elements.modalBody); });

    if (elements.btnQuickAttendance) elements.btnQuickAttendance.addEventListener('click', (e) => {
        e.preventDefault();
        const link = document.querySelector('.nav-link-child[data-subsection="academics-attendance"]');
        if (link) link.click();
    });
    if (elements.btnQuickMarks) elements.btnQuickMarks.addEventListener('click', (e) => {
        e.preventDefault();
        const link = document.querySelector('.nav-link-child[data-subsection="examinations-marks"]');
        if (link) link.click();
    });

    elements.navLinks.forEach(link => {
        if (['academics', 'examinations', 'extra'].includes(link.dataset.section)) return;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UI.showPageSection(link.dataset.section, elements.pageSections, elements.navLinks, elements.academicsToggle, elements.examinationsToggle, elements.extraToggle);

            const section = link.dataset.section;
            if (section === 'enrollment') Data.fetchAndDisplay(TARGETS.ENROLLMENT, elements.enrollment, "Course Enrollment");
            else if (section === 'profile') Data.fetchAndDisplay(TARGETS.PROFILE, elements.profile, "Profile");

            closeSidebar();
            elements.contentContainer.scrollTop = 0;
        });
    });

    elements.navLinkChildren.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const parentId = link.dataset.parent;
            const subsectionId = link.dataset.subsection;

            UI.showPageSection(parentId, elements.pageSections, elements.navLinks, elements.academicsToggle, elements.examinationsToggle, elements.extraToggle);
            UI.showSubsection(parentId, subsectionId, elements.navLinkChildren);

            if (subsectionId === 'extra-calculator') {
                elements.calculator.innerHTML = '<div class="p-8 text-center"><i data-lucide="loader" class="animate-spin h-8 w-8 mx-auto text-indigo-500 mb-2"></i><p class="text-gray-500">Opening calculator...</p></div>';
                if (typeof lucide !== 'undefined') lucide.createIcons();

                Promise.all([Data.fetchAttendanceForCache(), Data.fetchTimetableForCache()]).then(() => {
                    if (window.initAttendanceCalculator) window.initAttendanceCalculator(elements.calculator, state.cachedAttendance, state.cachedTimetable);
                });
            }
            else if (subsectionId === 'academics-courses') Data.fetchTimetableAndCourses(elements.courses, null, null);
            else if (subsectionId === 'academics-timetable') Data.fetchTimetableAndCourses(null, elements.timetable, null);
            else if (subsectionId === 'academics-attendance') Data.fetchAndCalculateAttendanceSnapshot().then(() => Data.fetchAndDisplay(TARGETS.ATTENDANCE, elements.attendance, "Attendance"));
            else if (subsectionId === 'academics-calendar') Data.fetchAndDisplay(TARGETS.CALENDAR, elements.calendar, "Academic Calendar");
            else if (subsectionId === 'examinations-marks') Data.fetchAndDisplay(TARGETS.MARKS, elements.marks, "Marks");
            else if (subsectionId === 'examinations-schedule') Data.fetchAndDisplay(TARGETS.EXAM_SCHEDULE, elements.examSchedule, "Exam Schedule");
            
            // =====================================
            // TRIGGER MY ROOM LOGIC
            // =====================================
            else if (subsectionId === 'hostel-my-room') {
                populateMyRoomData();
            }

            else if (subsectionId === 'extra-directory') {
                if (!isDirectoryUnlocked) {
                    elements.dirPassword.value = '';
                    elements.dirSearch.value = '';
                    elements.dirResults.classList.add('hidden');
                    elements.dirResults.innerHTML = '';
                    if (elements.dirTogglePassword) {
                        elements.dirPassword.type = 'password';
                        elements.dirTogglePassword.innerHTML = '<i data-lucide="eye" class="h-5 w-5"></i>';
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }
                    elements.dirLockScreen.classList.remove('hidden');
                    elements.dirSearchScreen.classList.add('hidden');
                    setTimeout(() => elements.dirPassword.focus(), 100);
                } else {
                    elements.dirLockScreen.classList.add('hidden');
                    elements.dirSearchScreen.classList.remove('hidden');
                    setTimeout(() => elements.dirSearch.focus(), 100);
                }
            }

            closeSidebar();
            elements.contentContainer.scrollTop = 0;
        });
    });

    if (elements.menuToggle) elements.menuToggle.addEventListener('click', () => { if (elements.sidebar.classList.contains('-translate-x-full')) openSidebar(); else closeSidebar(); });
    if (elements.sidebarOverlay) elements.sidebarOverlay.addEventListener('click', closeSidebar);

    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    if (elements.semesterSelect) {
        elements.semesterSelect.addEventListener('change', () => {
            const val = elements.semesterSelect.value;
            state.setSemesterId(val);
            localStorage.setItem('vtop_semester_id', val);
            refreshCurrentPage();
        });
    }

    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (navigator.onLine) {
                try { await fetch(`${API_BASE_URL}/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: localStorage.getItem('vtop_session_id') }) }); } catch (e) { }
            }
            localStorage.removeItem('vtop_session_id');
            window.location.href = '/login';
        });
    }

    if (elements.calendar) {
        elements.calendar.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.calendar-nav-btn');
            if (navBtn) Data.fetchAndDisplay(TARGETS.CALENDAR, elements.calendar, "Academic Calendar", { calDate: navBtn.dataset.date });
        });
    }

    // --- Directory Logic ---
    if (elements.dirTogglePassword) {
        elements.dirTogglePassword.addEventListener('click', () => {
            const type = elements.dirPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            elements.dirPassword.setAttribute('type', type);
            if (type === 'password') {
                elements.dirTogglePassword.innerHTML = '<i data-lucide="eye" class="h-5 w-5"></i>';
            } else {
                elements.dirTogglePassword.innerHTML = '<i data-lucide="eye-off" class="h-5 w-5"></i>';
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    if (elements.dirUnlockBtn) {
        elements.dirUnlockBtn.addEventListener('click', async () => {
            const password = elements.dirPassword.value;
            if (!password) { alert("Please enter the password."); return; }
            const originalBtnText = elements.dirUnlockBtn.innerHTML;
            elements.dirUnlockBtn.innerHTML = '<i data-lucide="loader" class="animate-spin w-4 h-4 mr-2"></i> Unlocking & Syncing...';
            elements.dirUnlockBtn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            try {
                const key = CryptoJS.SHA256(password);
                const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js');
                const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js');
                const firebaseConfig = {
                    apiKey: "AIzaSyBsdpGsNO3y6a0EapBakU1cS6WC0pEoXSU",
                    authDomain: "vitc29.firebaseapp.com",
                    projectId: "vitc29",
                    storageBucket: "vitc29.firebasestorage.app",
                    messagingSenderId: "376204861458",
                    appId: "1:376204861458:web:5dc7fdaa74f2650911f8cb",
                    measurementId: "G-733GMSBTQQ"
                };
                const app = initializeApp(firebaseConfig);
                const db = getFirestore(app);

                let querySnapshot;
                try {
                    querySnapshot = await getDocs(collection(db, "encrypted_students"));
                } catch (fetchError) {
                    let errMsg = "Database Unreachable.";
                    if (fetchError.code === 'permission-denied') errMsg += " (Access Denied)";
                    if (fetchError.code === 'unavailable') errMsg += " (Network Error)";
                    throw new Error(errMsg);
                }

                decryptedStudentList = [];
                let decryptionFailedCount = 0;
                let successCount = 0;
                let totalDocs = querySnapshot.size;

                if (totalDocs === 0) {
                    alert("Database is empty. Please upload data first.");
                    elements.dirUnlockBtn.innerHTML = originalBtnText;
                    elements.dirUnlockBtn.disabled = false;
                    return;
                }

                querySnapshot.forEach((doc) => {
                    try {
                        const data = doc.data();
                        const decrypted = CryptoJS.AES.decrypt(data.blob, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
                        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
                        if (jsonString && jsonString.startsWith('{')) {
                            const student = JSON.parse(jsonString);
                            student._searchStr = `${student.Name} ${student.RegNo} ${student.Mail} ${student.Mobile}`.toLowerCase();
                            decryptedStudentList.push(student);
                            successCount++;
                        } else {
                            decryptionFailedCount++;
                        }
                    } catch (e) { decryptionFailedCount++; }
                });

                if (successCount === 0) {
                    alert("Unlock Failed: Incorrect Password.");
                    elements.dirUnlockBtn.innerHTML = originalBtnText;
                    elements.dirUnlockBtn.disabled = false;
                    return;
                }

                isDirectoryUnlocked = true;
                elements.dirLockScreen.classList.add('hidden');
                elements.dirSearchScreen.classList.remove('hidden');
                elements.dirPassword.value = ''; 
                setTimeout(() => elements.dirSearch.focus(), 100);

            } catch (error) {
                alert(error.message || "Failed to connect or download database.");
                elements.dirUnlockBtn.innerHTML = originalBtnText;
                elements.dirUnlockBtn.disabled = false;
            }
        });
    }

    if (elements.dirLockBtn) {
        elements.dirLockBtn.addEventListener('click', () => {
            decryptedStudentList = []; 
            isDirectoryUnlocked = false;
            elements.dirLockScreen.classList.remove('hidden');
            elements.dirSearchScreen.classList.add('hidden');
            elements.dirResults.classList.add('hidden');
            elements.dirResults.innerHTML = '';
            elements.dirUnlockBtn.innerHTML = '<i data-lucide="lock-open" class="h-4 w-4 mr-2"></i> Unlock Directory';
            elements.dirUnlockBtn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    if (elements.dirSearch) {
        elements.dirSearch.addEventListener('input', (e) => {
            if (!isDirectoryUnlocked) return;
            const term = e.target.value.toLowerCase().trim();
            const resultsContainer = elements.dirResults;

            if (term.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.classList.add('hidden');
                return;
            }

            const matches = decryptedStudentList.filter(s => s._searchStr.includes(term)).slice(0, 10); 
            resultsContainer.innerHTML = '';

            if (matches.length === 0) {
                resultsContainer.innerHTML = '<div class="p-3 text-gray-500 text-sm text-center">No matches found.</div>';
            } else {
                matches.forEach(student => {
                    const card = document.createElement('div');
                    card.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group';
                    card.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <h4 class="font-bold text-gray-900 dark:text-white text-base">${student.Name}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${student.RegNo}</p>
                            </div>
                            <div class="transform transition-transform duration-200 chevron-icon text-gray-400 group-hover:text-indigo-500">
                                <i data-lucide="chevron-down" class="w-5 h-5"></i>
                            </div>
                        </div>
                        <div class="hidden mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm space-y-2">
                            <div class="flex items-center text-gray-700 dark:text-gray-300">
                                <i data-lucide="mail" class="w-4 h-4 mr-2 text-gray-400"></i>
                                <span>${student.Mail || 'N/A'}</span>
                            </div>
                            <div class="flex items-center text-gray-700 dark:text-gray-300">
                                <i data-lucide="phone" class="w-4 h-4 mr-2 text-gray-400"></i>
                                <span>${student.Mobile || 'N/A'}</span>
                            </div>
                        </div>
                    `;
                    card.addEventListener('click', function () {
                        const details = this.querySelector('.hidden, .block'); 
                        const chevron = this.querySelector('.chevron-icon');
                        if (details.classList.contains('hidden')) {
                            details.classList.remove('hidden');
                            details.classList.add('block');
                            chevron.classList.add('rotate-180');
                        } else {
                            details.classList.add('hidden');
                            details.classList.remove('block');
                            chevron.classList.remove('rotate-180');
                        }
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    });
                    resultsContainer.appendChild(card);
                });
            }
            resultsContainer.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    if (elements.dirSearchBtn) {
        elements.dirSearchBtn.addEventListener('click', () => {
            elements.dirSearch.dispatchEvent(new Event('input'));
        });
    }

    window.unlockCredentials = async function () {
        const passwordInput = document.getElementById('creds-password-input');
        const unlockBtn = document.getElementById('creds-unlock-btn');
        const errorMsg = document.getElementById('creds-error');
        const lockedView = document.getElementById('creds-locked');
        const contentView = document.getElementById('creds-content');

        const password = passwordInput.value;
        if (!password) { errorMsg.textContent = "Please enter your password."; errorMsg.classList.remove('hidden'); return; }

        const originalBtnText = unlockBtn.innerHTML;
        unlockBtn.innerHTML = '<i data-lucide="loader" class="animate-spin w-4 h-4 mr-2"></i> Verifying...';
        unlockBtn.disabled = true;
        errorMsg.classList.add('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const response = await fetch(`${window.location.origin}/fetch-profile-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: localStorage.getItem('vtop_session_id'), password: password })
            });
            const data = await response.json();
            if (data.status === 'success') {
                contentView.innerHTML = data.html_content;
                lockedView.style.opacity = '0';
                setTimeout(() => { lockedView.classList.add('hidden'); contentView.classList.remove('hidden'); }, 300);
            } else {
                errorMsg.textContent = data.message || "Verification failed.";
                errorMsg.classList.remove('hidden');
                unlockBtn.innerHTML = originalBtnText;
                unlockBtn.disabled = false;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } catch (error) {
            console.error(error);
            errorMsg.textContent = "Network error. Please try again.";
            errorMsg.classList.remove('hidden');
            unlockBtn.innerHTML = originalBtnText;
            unlockBtn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    function startOfflineMode() {
        console.log("Starting offline/fallback mode.");
        const cachedName = localStorage.getItem('vtop_username_cache');
        const cachedRegNo = localStorage.getItem('vtop_regno_cache');

        if (elements.sidebarUsername) elements.sidebarUsername.textContent = cachedName || 'User';
        if (elements.sidebarRegNo) elements.sidebarRegNo.textContent = cachedRegNo || 'Offline';

        const savedSemId = localStorage.getItem('vtop_semester_id');
        if (savedSemId) {
            state.setSemesterId(savedSemId);
            elements.semesterSelect.innerHTML = `<option value="${savedSemId}" selected>Saved Semester</option>`;
        } else {
            elements.semesterSelect.innerHTML = `<option disabled>No semester saved</option>`;
        }
        refreshCurrentPage();
    }

    async function checkSession() {
        const savedSessionId = localStorage.getItem('vtop_session_id');
        if (!savedSessionId) { window.location.href = '/login'; return; }

        if (!navigator.onLine) { startOfflineMode(); return; }

        try {
            const response = await fetch(`${API_BASE_URL}/check-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: savedSessionId }) });
            if (!response.ok) throw new Error("Session check failed");
            const data = await response.json();
            if (data.status === 'success') {
                const userName = data.username || 'User';
                const regStatus = 'Session Active';

                if (elements.sidebarUsername) elements.sidebarUsername.textContent = userName;
                if (elements.sidebarRegNo) elements.sidebarRegNo.textContent = regStatus;

                localStorage.setItem('vtop_username_cache', userName);
                localStorage.setItem('vtop_regno_cache', regStatus);

                populateSemesterDropdown();
            } else {
                localStorage.removeItem('vtop_session_id');
                window.location.href = '/login';
            }
        } catch (error) {
            startOfflineMode();
        }
    }

    async function populateSemesterDropdown() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-semesters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: localStorage.getItem('vtop_session_id') }) });
            const data = await response.json();
            if (data.status === 'success' && data.semesters.length > 0) {
                elements.semesterSelect.innerHTML = '';
                const savedSemId = localStorage.getItem('vtop_semester_id');
                let selectedId = data.semesters[0].id;
                if (savedSemId && data.semesters.some(s => s.id === savedSemId)) selectedId = savedSemId;

                data.semesters.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.name;
                    if (s.id === selectedId) opt.selected = true;
                    elements.semesterSelect.appendChild(opt);
                });
                state.setSemesterId(selectedId);
                localStorage.setItem('vtop_semester_id', selectedId);
                refreshCurrentPage();
            }
        } catch (error) {
            const savedSemId = localStorage.getItem('vtop_semester_id');
            if (savedSemId) {
                state.setSemesterId(savedSemId);
                elements.semesterSelect.innerHTML = `<option value="${savedSemId}" selected>Saved Semester</option>`;
                refreshCurrentPage();
            }
        }
    }

    // =========================================================
    // MY ROOM DATA PARSING LOGIC (Moved safely inside this file)
    // =========================================================
    async function fetchMyRoomApiData(target) {
        const sessionId = localStorage.getItem('vtop_session_id');
        const semId = localStorage.getItem('vtop_semester_id');
        const cacheKey = `vtop_cache_${target}_${semId || 'default'}`;
        
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { return JSON.parse(cached); } catch(e) {}
        }
        
        if (!navigator.onLine) throw new Error("Offline");
        
        const payload = { session_id: sessionId, target: target, semesterSubId: semId };
        if (target === 'academics/common/StudentTimeTableChn') {
            payload.isSaturday = new Date().getDay() === 6;
        }
        
        const res = await fetch(`${window.location.origin}/fetch-data`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (data.status === 'success') {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
        }
        throw new Error(data.message || "API Error");
    }

    async function populateMyRoomData() {
        document.getElementById('ui-room-no').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
        document.getElementById('ui-room-block').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
        document.getElementById('ui-room-type').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
        document.getElementById('ui-room-mess').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const [profileData, timetableData] = await Promise.all([
                fetchMyRoomApiData('student/studentProfileView'),
                fetchMyRoomApiData('academics/common/StudentTimeTableChn')
            ]);

            // 1. Profile Data
            let block = "N/A", roomNo = "N/A", type = "N/A", mess = "N/A", myName = "You";
            if (profileData && profileData.html_content) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(profileData.html_content, 'text/html');
                const nameEl = doc.querySelector('h3.text-xl.font-bold');
                if (nameEl) myName = nameEl.textContent.trim();
                const spans = doc.querySelectorAll('span');
                spans.forEach(span => {
                    const text = span.textContent.trim();
                    if (text === 'Block') block = span.nextElementSibling?.textContent.trim() || block;
                    if (text === 'Room No') roomNo = span.nextElementSibling?.textContent.trim() || roomNo;
                    if (text === 'Bed Type') type = span.nextElementSibling?.textContent.trim() || type;
                    if (text === 'Mess Type') mess = span.nextElementSibling?.textContent.trim() || mess;
                });
            }

            document.getElementById('ui-room-no').textContent = roomNo;
            document.getElementById('ui-room-block').textContent = block;
            document.getElementById('ui-room-type').textContent = type;
            document.getElementById('ui-room-mess').textContent = mess;

            // 2. Roommates
            const roommates = [
                { name: myName, phone: "Synced from Profile", isMe: true },
                { name: "Aarav Sharma", phone: "+91 91234 56780", isMe: false },
                { name: "Rohan Patel", phone: "+91 98765 43210", isMe: false },
                { name: "Kabir Singh", phone: "+91 99887 76655", isMe: false }
            ];

            document.getElementById('roommates-container').innerHTML = roommates.map(r => `
                <div class="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${r.isMe ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100 dark:border-gray-700'}">
                    <div class="h-12 w-12 rounded-full ${r.isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0 uppercase">
                        ${r.name.charAt(0)}
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${r.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1 truncate">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> 
                            ${r.phone}
                        </p>
                    </div>
                    ${r.isMe ? '<span class="ml-auto text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-1 rounded">ME</span>' : ''}
                </div>
            `).join('');

            // 3. Timetable Data (13 Slots)
            const time_slots = ["08:00 - 08:50", "08:55 - 09:45", "09:50 - 10:40", "10:45 - 11:35", "11:40 - 12:30", "12:35 - 13:25", "LUNCH", "14:00 - 14:50", "14:55 - 15:45", "15:50 - 16:40", "16:45 - 17:35", "17:40 - 18:30", "18:35 - 19:25"];
            const mySchedule = { 'MON': Array(13).fill(false), 'TUE': Array(13).fill(false), 'WED': Array(13).fill(false), 'THU': Array(13).fill(false), 'FRI': Array(13).fill(false) };
            
            if (timetableData && timetableData.raw_data && timetableData.raw_data.timetable) {
                const ttRaw = timetableData.raw_data.timetable;
                ['MON', 'TUE', 'WED', 'THU', 'FRI'].forEach(day => {
                    if (ttRaw[day]) {
                        time_slots.forEach((slotKey, index) => {
                            const course = ttRaw[day][slotKey];
                            if (course && course.rowspan) {
                                for (let i = 0; i < course.rowspan; i++) {
                                    if (index + i < 13) {
                                        mySchedule[day][index + i] = true;
                                    }
                                }
                            }
                        });
                    }
                });
            }

            // 4. Render Matrix
            const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
            let ttHtml = '';
            
            days.forEach(day => {
                ttHtml += `<tr class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-3 py-2 font-bold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 bg-white dark:bg-gray-800 text-xs">${day}</td>`;
                
                for(let slot=0; slot<13; slot++) {
                    if (slot === 6) {
                        ttHtml += `<td class="p-1 text-center align-middle border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50">
                            <svg class="w-3 h-3 text-gray-300 dark:text-gray-600 mx-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                        </td>`;
                        continue;
                    }

                    let busyPeople = [];
                    if (mySchedule[day][slot] === true) busyPeople.push('<div class="w-5 h-5 rounded bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm" title="You">Y</div>');
                    if(Math.random() > 0.85) busyPeople.push('<div class="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm" title="Aarav">A</div>');
                    if(Math.random() > 0.85) busyPeople.push('<div class="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm" title="Rohan">R</div>');
                    if(Math.random() > 0.85) busyPeople.push('<div class="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm" title="Kabir">K</div>');
                    
                    ttHtml += `<td class="p-1 text-center align-middle border-r border-gray-200 dark:border-gray-700 min-w-[36px]">
                        <div class="flex flex-wrap gap-1 justify-center items-center h-full min-h-[24px]">
                            ${busyPeople.length ? busyPeople.join('') : '<span class="text-gray-200 dark:text-gray-700 text-xs">-</span>'}
                        </div>
                    </td>`;
                }
                ttHtml += `</tr>`;
            });

            document.getElementById('room-timetable-body').innerHTML = ttHtml;

        } catch (error) {
            console.error("Error fetching room data:", error);
            document.getElementById('ui-room-no').textContent = "Error";
            document.getElementById('ui-room-block').textContent = "Error";
            document.getElementById('ui-room-type').textContent = "Error";
            document.getElementById('ui-room-mess').textContent = "Error";
        }
    }
    // =========================================================

    if (typeof lucide !== 'undefined') lucide.createIcons();
    UI.showPageSection('dashboard', elements.pageSections, elements.navLinks, elements.academicsToggle, elements.examinationsToggle, elements.extraToggle);
    checkSession();

    // --- CRITICAL PWA UPDATE ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js') 
            .then(() => { console.log('Service Worker Registered at root scope'); })
            .catch(err => console.error('SW Registration failed:', err));
    }

});