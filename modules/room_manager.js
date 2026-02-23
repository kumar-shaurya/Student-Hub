// Centralized internal API fetcher
async function fetchApiData(target) {
    const sessionId = localStorage.getItem('vtop_session_id');
    const semId = localStorage.getItem('vtop_semester_id');
    const cacheKey = `vtop_cache_${target}_${semId || 'default'}`;
    
    // 1. Check local storage cache first to save network requests
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
    }
    
    // 2. Fetch from VTOP backend dynamically if not cached
    if (!navigator.onLine) throw new Error("Offline");
    
    const payload = { session_id: sessionId, target: target, semesterSubId: semId };
    
    // Specific parameter required by the Timetable API
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

export async function populateMyRoomData() {
    // Initial Loading State
    document.getElementById('ui-room-no').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
    document.getElementById('ui-room-block').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
    document.getElementById('ui-room-type').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
    document.getElementById('ui-room-mess').innerHTML = '<i class="animate-spin" data-lucide="loader"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        // Fetch Profile HTML and Timetable JSON concurrently
        const [profileData, timetableData] = await Promise.all([
            fetchApiData('student/studentProfileView'),
            fetchApiData('academics/common/StudentTimeTableChn')
        ]);

        // ==========================================
        // 1. PARSE PROFILE HTML
        // ==========================================
        let block = "N/A", roomNo = "N/A", type = "N/A", mess = "N/A", myName = "You";
        
        if (profileData && profileData.html_content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(profileData.html_content, 'text/html');
            
            // Grab name from Profile Header
            const nameEl = doc.querySelector('h3.text-xl.font-bold');
            if (nameEl) myName = nameEl.textContent.trim();

            // Search through all spans to find specific labels, then take the next sibling value
            const spans = doc.querySelectorAll('span');
            spans.forEach(span => {
                const text = span.textContent.trim();
                if (text === 'Block') block = span.nextElementSibling?.textContent.trim() || block;
                if (text === 'Room No') roomNo = span.nextElementSibling?.textContent.trim() || roomNo;
                if (text === 'Bed Type') type = span.nextElementSibling?.textContent.trim() || type;
                if (text === 'Mess Type') mess = span.nextElementSibling?.textContent.trim() || mess;
            });
        }

        // Update the DOM Cards
        document.getElementById('ui-room-no').textContent = roomNo;
        document.getElementById('ui-room-block').textContent = block;
        document.getElementById('ui-room-type').textContent = type;
        document.getElementById('ui-room-mess').textContent = mess;

        // ==========================================
        // 2. RENDER ROOMMATES
        // ==========================================
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

        // ==========================================
        // 3. PARSE TIMETABLE DATA (13 Precise Slots)
        // ==========================================
        const time_slots = ["08:00 - 08:50", "08:55 - 09:45", "09:50 - 10:40", "10:45 - 11:35", "11:40 - 12:30", "12:35 - 13:25", "LUNCH", "14:00 - 14:50", "14:55 - 15:45", "15:50 - 16:40", "16:45 - 17:35", "17:40 - 18:30", "18:35 - 19:25"];
        
        const mySchedule = { 
            'MON': Array(13).fill(false), 
            'TUE': Array(13).fill(false), 
            'WED': Array(13).fill(false), 
            'THU': Array(13).fill(false), 
            'FRI': Array(13).fill(false) 
        };
        
        if (timetableData && timetableData.raw_data && timetableData.raw_data.timetable) {
            const ttRaw = timetableData.raw_data.timetable;
            ['MON', 'TUE', 'WED', 'THU', 'FRI'].forEach(day => {
                if (ttRaw[day]) {
                    time_slots.forEach((slotKey, index) => {
                        const course = ttRaw[day][slotKey];
                        if (course && course.rowspan) {
                            // Fill exact number of blocks based on rowspan (e.g., lab = 2 blocks)
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

        // ==========================================
        // 4. RENDER TIMETABLE MATRIX (13 Columns)
        // ==========================================
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
        let ttHtml = '';
        
        days.forEach(day => {
            ttHtml += `<tr class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-3 py-2 font-bold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 bg-white dark:bg-gray-800 text-xs">${day}</td>`;
            
            // Loop through all 13 exact slots
            for(let slot=0; slot<13; slot++) {
                if (slot === 6) { // Index 6 is strictly LUNCH
                    ttHtml += `<td class="p-1 text-center align-middle border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50">
                        <svg class="w-3 h-3 text-gray-300 dark:text-gray-600 mx-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
                    </td>`;
                    continue;
                }

                let busyPeople = [];
                
                // Check exact slot availability for You
                if (mySchedule[day][slot] === true) {
                    busyPeople.push('<div class="w-5 h-5 rounded bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm" title="You">Y</div>');
                }
                
                // Dummy data: Roommates have ~15% chance of being in class during any specific slot
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