document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    if (!role) {
        window.location.href = 'login.html';
        return;
    }

    // Biến toàn cục cho Base URL
    const API_BASE_URL = 'http://localhost:3000/api';

    // ===== Pages & titles =====
    const pages = ['m-dashboard', 'm-schedules', 'm-routes', 'm-buses', 'm-tracking', 'm-messages', 'm-drivers', 'm-parents', 'd-schedules', 'd-users', 'd-reports', 'd-messages', 'p-tracking', 'p-messages', 'p-reports'];
    const titles = {
        'm-dashboard': 'Tổng quan hệ thống',
        'm-schedules': 'Lịch trình',
        'm-routes': 'Tuyến & Xe',
        'm-buses': 'Quản lý Xe buýt',
        'm-tracking': 'Theo dõi vị trí',
        'm-messages': 'Tin nhắn',
        'm-drivers': 'Quản lý tài xế',
        'm-parents': 'Quản lý phụ huynh',
        'd-schedules': 'Lịch làm việc',
        'd-users': 'Học sinh / Tài xế',
        'd-messages': 'Tin nhắn',
        'd-reports': 'Báo cáo',
        'p-tracking': 'Theo dõi xe của con',
        'p-messages': 'Thông báo xe đến gần',
        'p-reports': 'Báo cáo trễ chuyến'
    };

    // ===== Mock data =====
    const mockRoutes = [
        { id: 1, name: 'Tuyến A', stops: ['Cổng A', 'Điểm 1', 'Điểm 2'] },
        { id: 2, name: 'Tuyến B', stops: ['Cổng B', 'Điểm 3', 'Điểm 4'] }
    ];

    // Mock buses placed around Saigon University area (TP.HCM) for demo tracking
    const centerLat = 10.7633, centerLon = 106.6820;
    const buses = Array.from({ length: 8 }).map((_, i) => ({
        id: 100 + i,
        plate: `51B-${100 + i}`,
        route: mockRoutes[i % 2].name,
        lat: centerLat + (Math.random() - 0.5) * 0.006,
        lon: centerLon + (Math.random() - 0.5) * 0.008,
        status: Math.random() > 0.2 ? 'running' : 'stopped',
        driver: `Tài xế ${i + 1}`
    }));

    const state = {
        buses,
        routes: mockRoutes,
        inbox: [],
        activities: [],
        parents: [], // Dữ liệu thực tế từ API
        drivers: [],  // Dữ liệu thực tế từ API
        busesManaged: [] // Dữ liệu xe buýt từ API
    };
    // thêm state cho routes quản lý
    state.routesManaged = [];
    state.schedules = [];
    let simRunning = true;

    // ===== Role config =====
    const roleConfig = {
        manager: {
            name: 'Quản lý',
            pages: ['m-drivers', 'm-parents', 'm-dashboard', 'm-schedules', 'm-routes', 'm-buses', 'm-tracking', 'm-messages'],
            default: 'm-dashboard'
        },
        driver: {
            name: 'Tài xế',
            pages: ['d-schedules', 'd-users', 'd-reports', 'd-messages'],
            default: 'd-schedules'
        },
        parent: {
            name: 'Phụ huynh',
            pages: ['p-tracking', 'p-messages', 'p-reports'],
            default: 'p-tracking'
        }
    };

    const current = roleConfig[role];
    const roleIndicator = document.getElementById('role-indicator');
    if (roleIndicator) roleIndicator.textContent = current.name;

    // ===== Sidebar & Permissions =====
    function applyPermissions() {
        document.querySelectorAll('.sidebar li[data-page]').forEach(li => {
            const page = li.dataset.page;
            li.style.display = current.pages.includes(page) ? 'flex' : 'none';
        });

        pages.forEach(p => {
            const v = document.getElementById(p + '-view');
            if (v) {
                if (current.pages.includes(p)) v.classList.remove('hidden');
                else v.classList.add('hidden');
            }
        });
    }

    applyPermissions();

    // ===== Navigation =====
    function navigateTo(page) {
        pages.forEach(p => {
            const v = document.getElementById(p + '-view');
            if (v) v.classList.add('hidden');
        });
        const view = document.getElementById(page + '-view');
        if (view) view.classList.remove('hidden');
        const title = document.getElementById('page-title');
        if (title) title.textContent = titles[page] || page;
        const quickActions = document.getElementById('quick-actions-sidebar');
        const mainGrid = document.querySelector('.grid');

        if (quickActions) {
            if (page === 'm-dashboard') {
                quickActions.style.display = 'block';
                if (mainGrid) {
                    mainGrid.style.gridTemplateColumns = '1fr 320px';
                }
            } else {
                quickActions.style.display = 'none';
                if (mainGrid) {
                    mainGrid.style.gridTemplateColumns = '1fr';
                }
            }
        }
        // If navigating to tracking view, ensure Leaflet map is created and invalidated
        if (page === 'm-tracking') {
            try {
                if (window.ensureTrackingMap) window.ensureTrackingMap();
            } catch (e) { console.warn('ensureTrackingMap error', e); }
        }
    }

    document.querySelectorAll('.sidebar li[data-page]').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelectorAll('.sidebar li').forEach(x => x.classList.remove('active'));
            li.classList.add('active');
            navigateTo(li.dataset.page);
        });
    });

    // =========================================================
    //                    API UTILITY & MESSAGE
    // =========================================================

    /** Hiển thị thông báo thay cho alert() */
    function showMessage(text, type = 'success') {
        const msgBox = document.getElementById('custom-message-box');
        if (msgBox) {
            msgBox.textContent = text;
            msgBox.className = `custom-message-box fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white 
                ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
            msgBox.style.display = 'block';
            setTimeout(() => { msgBox.style.display = 'none'; }, 3000);
        } else {
            // Fallback (Nếu chưa có HTML cho message box)
            console.warn(`[Message] ${type.toUpperCase()}: ${text}`);
        }
    }

    /** Helper function cho Fetch API */
    async function fetchData(endpoint) {
        const url = `${API_BASE_URL}/${endpoint}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Lỗi khi tải dữ liệu từ ${endpoint}:`, error);
            showMessage(`Lỗi tải dữ liệu: ${error.message}`, 'error');
            return null;
        }
    }

    async function deleteData(endpoint, id) {
        const url = `${API_BASE_URL}/${endpoint}/${id}`;
        try {
            const response = await fetch(url, { method: 'DELETE' });
            const result = await response.json();

            if (!response.ok) {
                showMessage(result.message || `Lỗi khi xóa ID ${id}`, 'error');
                return false;
            }

            showMessage(result.message || 'Xóa thành công');
            return true;
        } catch (error) {
            console.error(`Lỗi khi xóa dữ liệu từ ${endpoint}/${id}:`, error);
            showMessage('Lỗi mạng hoặc server không phản hồi.', 'error');
            return false;
        }
    }

    // =========================================================
    //                    PARENT CRUD LOGIC
    // =========================================================

    async function handleDeleteParent(id) {
        if (!confirm(`Bạn có chắc chắn muốn xóa Phụ huynh ID ${id} này không?`)) {
            return;
        }

        const success = await deleteData('parents', id);
        if (success) {
            await renderParents(); // Tải lại bảng sau khi xóa thành công
        }
    }

    // =========================================================
    //                    DRIVER CRUD LOGIC
    // =========================================================

    async function handleDeleteDriver(id) {
        if (!confirm(`Bạn có chắc chắn muốn xóa Tài xế ID ${id} này không?`)) {
            return;
        }

        const success = await deleteData('drivers', id);
        if (success) {
            await renderDrivers(); // Tải lại bảng sau khi xóa thành công
        }
    }


    // =========================================================
    //                    RENDER HELPERS
    // =========================================================

    async function renderParents(filter = '') {
        const table = document.getElementById('parents-table');
        if (!table) return;

        const parentsData = await fetchData('parents');
        if (!parentsData) {
            table.innerHTML = '<tr><td colspan="7">Không thể tải dữ liệu phụ huynh.</td></tr>';
            return;
        }

        state.parents = parentsData;
        let filtered = state.parents;
        if (filter) {
            const f = filter.trim().toLowerCase();
            filtered = state.parents.filter(p =>
                String(p.id).toLowerCase().includes(f) ||
                (p.name && p.name.toLowerCase().includes(f))
            );
        }
        table.innerHTML = '';
        filtered.forEach(p => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.student || 'N/A'}</td>
                <td>${p.phone}</td>
                <td>${p.cccd || 'N/A'}</td>
                <td>${p.email || 'N/A'}</td>
                <td>
                    <button class="btn-icon btn-edit" data-id="${p.id}">✏️</button>
                    <button class="btn-icon btn-delete" data-id="${p.id}" data-type="parent">🗑️</button>
                </td>
            `;
            // make row clickable to open edit modal
            row.classList.add('clickable-row');
            row.dataset.id = p.id;
            row.addEventListener('click', (e) => {
                // avoid clicks on buttons inside row
                if (e.target.closest('button')) return;
                openFormModal('parent', p);
            });
        });
        // Gán sự kiện cho các nút Xóa
        table.querySelectorAll('.btn-delete[data-type="parent"]').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteParent(btn.dataset.id));
        });
        // Gán sự kiện cho các nút Sửa
        table.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const p = state.parents.find(x => String(x.id) === String(id));
                if (p) openFormModal('parent', p);
            });
        });
    }

    async function renderDrivers(filter = '') {
        const table = document.getElementById('drivers-table');
        if (!table) return;

        const driversData = await fetchData('drivers');
        if (!driversData) {
            table.innerHTML = '<tr><td colspan="6">Không thể tải dữ liệu tài xế.</td></tr>';
            return;
        }

        state.drivers = driversData;
        let filtered = state.drivers;
        if (filter) {
            const f = filter.trim().toLowerCase();
            filtered = state.drivers.filter(d =>
                String(d.id).toLowerCase().includes(f) ||
                (d.name && d.name.toLowerCase().includes(f))
            );
        }
        table.innerHTML = '';
        filtered.forEach(d => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${d.id}</td>
                <td>${d.name}</td>
                <td>${d.phone}</td>
                <td>${d.email || 'N/A'}</td>
                <td>${d.status || 'N/A'}</td>
                <td>
                    <button class="btn-icon btn-edit" data-id="${d.id}">✏️</button>
                    <button class="btn-icon btn-delete" data-id="${d.id}" data-type="driver">🗑️</button>
                </td>
            `;
            // clickable row to open edit modal
            row.classList.add('clickable-row');
            row.dataset.id = d.id;
            row.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                openFormModal('driver', d);
            });
        });
        // Gán sự kiện cho các nút Xóa
        table.querySelectorAll('.btn-delete[data-type="driver"]').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteDriver(btn.dataset.id));
        });
        // Gán sự kiện cho các nút Sửa
        table.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const d = state.drivers.find(x => String(x.id) === String(id));
                if (d) openFormModal('driver', d);
            });
        });
    }

    // =========================================================
    //                    BUS CRUD + RENDER
    // =========================================================
    async function renderBusesManaged(filter = '') {
        const table = document.getElementById('buses-table');
        if (!table) return;

        const data = await fetchData('buses');
        if (!data) { table.innerHTML = '<tr><td colspan="5">Không thể tải dữ liệu xe buýt.</td></tr>'; return; }

        state.busesManaged = data;
        let filtered = state.busesManaged;
        if (filter) {
            const f = filter.trim().toLowerCase();
            filtered = state.busesManaged.filter(b =>
                String(b.id).toLowerCase().includes(f) ||
                (b.plate && b.plate.toLowerCase().includes(f))
            );
        }

        table.innerHTML = '';
        filtered.forEach(b => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${b.id}</td>
                <td>${b.plate}</td>
                <td>${b.run}</td>
                <td>${b.status || 'N/A'}</td>
                <td>
                    <button class="btn-icon btn-edit" data-id="${b.id}" data-type="bus">✏️</button>
                    <button class="btn-icon btn-delete" data-id="${b.id}" data-type="bus">🗑️</button>
                </td>
            `;
            row.classList.add('clickable-row');
            row.addEventListener('click', (e) => { if (e.target.closest('button')) return; openFormModal('bus', b); });
        });

        // events
        table.querySelectorAll('.btn-delete[data-type="bus"]').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id; if (!confirm(`Bạn có chắc chắn muốn xóa Xe ID ${id}?`)) return; deleteData('buses', id).then(ok => { if (ok) renderBusesManaged(); });
        }));
        table.querySelectorAll('.btn-edit[data-type="bus"]').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id; const b = state.busesManaged.find(x => String(x.id) === String(id)); if (b) openFormModal('bus', b);
        }));
    }

    // =========================================================
    //                    SCHEDULES RENDER + LOGIC
    // =========================================================
    function getWeekOfMonth(d) {
        // returns 1..5
        const day = d.getDate();
        return Math.ceil(day / 7);
    }

    function formatScheduleId(type, date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2,'0');
        if (type === 'week') {
            const w = getWeekOfMonth(date);
            return `w${w}${m}${y}`; // e.g. w1022025
        } else if (type === 'month') {
            return `m${m}${y}`;
        } else {
            return `y${y}`;
        }
    }

    let schedulesEditing = false;

    // Trong renderSchedulesTable: Sửa logic tìm schedule dựa trên schedule_date
   function renderSchedulesTable() {
    const table = document.getElementById('schedules-table');
    if (!table) return;
    table.innerHTML = '';
    const runId = formatScheduleId('week', currentPeriod.date);
    console.log('Current runId (schedule_date):', runId);
    const activeDrivers = state.drivers.filter(d => String(d.status) === 'active' || (d.status && d.status.toLowerCase() === 'active'));
    console.log('Active drivers:', activeDrivers.map(d => ({ id: d.id, name: d.name, status: d.status }))); // Thêm: Log activeDrivers
    activeDrivers.forEach(drv => {
       const s = state.schedules.find(sch => 
    String(sch.driver).trim() === String(drv.id).trim() && 
    String(sch.schedule_date).trim() === String(runId).trim()
);
        console.log(`Driver ${drv.id} (${drv.name}): Found schedule?`, s ? 'Yes' : 'No', s); // Sửa: Log rõ hơn
           const row = table.insertRow();
           row.dataset.id = s?.id || '';
           row.dataset.driver = String(drv.id);

           // Driver column
           const tdDriver = row.insertCell(); tdDriver.textContent = drv.name || `#${drv.id}`;

           // Route column
           const tdRoute = row.insertCell();
           if (schedulesEditing) {
               const sel = document.createElement('select'); sel.name = 'route';
               state.routesManaged.forEach(r => {
                   const o = document.createElement('option'); o.value = r.id; o.textContent = `${r.id} • ${r.name}`;
                   if (s && (String(r.id) === String(s.run))) o.selected = true; // So sánh với s.run (route ID)
                   sel.appendChild(o);
               });
               tdRoute.appendChild(sel);
           } else {
               const r = s ? (state.routesManaged.find(x => String(x.id) === String(s.run))) : null;
               tdRoute.textContent = r ? `${r.id} • ${r.name}` : (s ? s.run : 'N/A');
           }

           // Bus column
           const tdBus = row.insertCell();
           if (schedulesEditing) {
               const busSel = document.createElement('select'); busSel.name = 'bus';
               const currentRouteVal = s ? s.run : tdRoute.querySelector('select')?.value; // Lấy route từ s.run hoặc select
               const candidates = state.busesManaged.filter(b => String(b.run) === String(currentRouteVal) || String(b.run) === String(getRouteNameById(currentRouteVal)));
               if (candidates.length === 0) {
                   const o = document.createElement('option'); o.value = ''; o.textContent = 'Không có xe cho tuyến này'; busSel.appendChild(o);
               } else {
                   candidates.forEach(b => {
                       const o = document.createElement('option'); o.value = b.id; o.textContent = `${b.id} • ${b.plate}`;
                       if (s && String(b.id) === String(s.bus)) o.selected = true;
                       busSel.appendChild(o);
                   });
               }
               tdBus.appendChild(busSel);
           } else {
               const bus = s ? (state.busesManaged.find(b => String(b.id) === String(s.bus)) || {}) : {};
               tdBus.textContent = bus.plate || (s ? s.bus : 'N/A');
           }

           // Shift column
           const tdShift = row.insertCell();
           if (schedulesEditing) {
               const sh = document.createElement('select'); sh.name = 'shift'; ['A','B','C','OFF'].forEach(x => {
                   const o = document.createElement('option'); o.value = x; o.textContent = x;
                   if (s && x === (s.shift || 'A')) o.selected = true;
                   sh.appendChild(o);
               });
               tdShift.appendChild(sh);
           } else {
               tdShift.textContent = s ? (s.shift || 'N/A') : 'N/A';
           }

           // Sự kiện cập nhật bus select khi route thay đổi (giữ nguyên)
           if (schedulesEditing) {
               const routeSel = tdRoute.querySelector('select');
               routeSel?.addEventListener('change', (e) => {
                   const selVal = e.target.value;
                   const busSel = tdBus.querySelector('select');
                   busSel.innerHTML = '';
                   const candidates2 = state.busesManaged.filter(b => String(b.run) === String(selVal) || String(b.run) === String(getRouteNameById(selVal)));
                   if (candidates2.length === 0) {
                       const o = document.createElement('option'); o.value = ''; o.textContent = 'Không có xe cho tuyến này'; busSel.appendChild(o);
                   } else {
                       candidates2.forEach(b => { const o = document.createElement('option'); o.value = b.id; o.textContent = `${b.id} • ${b.plate}`; busSel.appendChild(o); });
                   }
               });
           }
       });
   }

    async function loadSchedules() {
       const data = await fetchData('schedules');
       if (!data) return;
       console.log('API response data:', data); // Log dữ liệu từ API
       // Map đúng: id từ schedule_id, schedule_date từ schedule_date, run từ run (route ID), v.v.
       state.schedules = data.map(r => ({
    id: r.id,  // Dùng r.id thay r.schedule_id nếu alias sai
    schedule_date: r.schedule_date,
    run: r.run,
    driver: r.driver || r.driver_id,  // Thử r.driver nếu alias là AS driver
    shift: r.shift,
    bus: r.bus
}));

       console.log('Mapped state.schedules:', state.schedules); // Log sau map
       console.log('Sample schedules for w2122025:', state.schedules.filter(s => s.schedule_date === 'w2122025'));
       renderSchedulesTable();
   }

    function updatePeriodDisplay(type, date) {
        const display = document.getElementById('period-display');
        if (!display) return;
        if (type === 'week') {
            const w = getWeekOfMonth(date);
            display.textContent = `Tuần ${w} — Tháng ${date.getMonth()+1} — ${date.getFullYear()}`;
        } else if (type === 'month') {
            display.textContent = `Tháng ${date.getMonth()+1} — ${date.getFullYear()}`;
        } else {
            display.textContent = `Năm ${date.getFullYear()}`;
        }
    }

    function addMonths(d, n) { const dt = new Date(d); dt.setMonth(dt.getMonth() + n); return dt; }
    function addYears(d, n) { const dt = new Date(d); dt.setFullYear(dt.getFullYear() + n); return dt; }
    function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt; }

    function setScheduleEditing(enabled) {
        const toggle = document.getElementById('sched-edit-toggle');
        if (toggle) toggle.textContent = enabled ? 'Lưu' : 'Chỉnh sửa';
    }

    function getRouteNameById(id) {
        const r = state.routesManaged.find(x => String(x.id) === String(id));
        return r ? r.name : null;
    }

    // schedule controls wiring
    let currentPeriod = { type: 'week', date: new Date() };

    function changePeriod(delta) {
    if (currentPeriod.type === 'week') currentPeriod.date = addDays(currentPeriod.date, 7 * delta);
    else if (currentPeriod.type === 'month') currentPeriod.date = addMonths(currentPeriod.date, delta);
    else currentPeriod.date = addYears(currentPeriod.date, delta);
    updatePeriodDisplay(currentPeriod.type, currentPeriod.date);
    // Thêm: Tải lại dữ liệu schedules cho tuần mới
    loadSchedules().then(() => {
        renderSchedulesTable(); // Render lại sau khi tải xong
    });
}

    // init schedule controls inside init()

    // =========================================================
    //                    ROUTES CRUD + RENDER
    // =========================================================
    async function renderRoutesManaged(filter = '') {
        const table = document.getElementById('routes-table');
        if (!table) return;

        const data = await fetchData('routes');
        if (!data) { table.innerHTML = '<tr><td colspan="5">Không thể tải dữ liệu tuyến.</td></tr>'; return; }

        state.routesManaged = data;
        let filtered = state.routesManaged;
        if (filter) {
            const f = filter.trim().toLowerCase();
            filtered = state.routesManaged.filter(r =>
                String(r.id).toLowerCase().includes(f) ||
                (r.name && r.name.toLowerCase().includes(f))
            );
        }

        table.innerHTML = '';
        filtered.forEach(r => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${(r.description || '').substring(0,80)}</td>
                <td>${r.duration || 'N/A'}</td>
                <td>
                    <button class="btn-icon btn-edit" data-id="${r.id}" data-type="route">✏️</button>
                    <button class="btn-icon btn-delete" data-id="${r.id}" data-type="route">🗑️</button>
                </td>
            `;
            row.classList.add('clickable-row');
            row.addEventListener('click', (e) => { if (e.target.closest('button')) return; openFormModal('route', r); });
        });

        table.querySelectorAll('.btn-delete[data-type="route"]').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id; if (!confirm(`Bạn có chắc chắn muốn xóa Tuyến ID ${id}?`)) return; deleteData('routes', id).then(ok => { if (ok) renderRoutesManaged(); });
        }));
        table.querySelectorAll('.btn-edit[data-type="route"]').forEach(btn => btn.addEventListener('click', () => {
            const id = btn.dataset.id; const r = state.routesManaged.find(x => String(x.id) === String(id)); if (r) openFormModal('route', r);
        }));
    }

    // ===== Modal & Form handling =====
    const formModal = document.getElementById('form-modal');
    const driverFormCard = document.getElementById('driver-form-card');
    const parentFormCard = document.getElementById('parent-form-card');

    function openFormModal(type, data = null) {
        if (!formModal) return;
        formModal.classList.remove('hidden');
        clearFormErrors();
        if (type === 'driver') {
            driverFormCard.classList.remove('hidden');
            parentFormCard.classList.add('hidden');
            document.getElementById('driver-form-title').textContent = data ? 'Sửa Tài xế' : 'Thêm Tài xế';
            document.getElementById('dr-id').value = data?.id || '';
            document.getElementById('dr-name').value = data?.name || '';
            document.getElementById('dr-phone').value = data?.phone || '';
            document.getElementById('dr-email').value = data?.email || '';
            document.getElementById('dr-status').value = data?.status === 'inactive' ? 'inactive' : 'active';
        } else {
            parentFormCard.classList.remove('hidden');
            driverFormCard.classList.add('hidden');
            document.getElementById('parent-form-title').textContent = data ? 'Sửa Phụ huynh' : 'Thêm Phụ huynh';
            document.getElementById('pa-id').value = data?.id || '';
            document.getElementById('pa-name').value = data?.name || '';
            document.getElementById('pa-student-name').value = data?.student || '';
            document.getElementById('pa-phone').value = data?.phone || '';
            document.getElementById('pa-cccd').value = data?.cccd || '';
            document.getElementById('pa-email').value = data?.email || '';
        }
        if (type === 'bus') {
            // show bus form and hide others
            document.getElementById('bus-form-title').textContent = data ? 'Sửa Xe buýt' : 'Thêm Xe buýt';
            document.getElementById('bus-id').value = data?.id || '';
            document.getElementById('bus-plate').value = data?.plate || '';
            document.getElementById('bus-run').value = data?.run || '';
            document.getElementById('bus-status').value = data?.status === 'maintenance' ? 'maintenance' : 'active';
            driverFormCard.classList.add('hidden');
            parentFormCard.classList.add('hidden');
            const busCard = document.getElementById('bus-form-card'); if (busCard) busCard.classList.remove('hidden');
        }
        if (type === 'route') {
            // show route form and hide others
            const routeCard = document.getElementById('route-form-card');
            if (!routeCard) return;
            routeCard.classList.remove('hidden');
            driverFormCard.classList.add('hidden');
            parentFormCard.classList.add('hidden');
            const busCard = document.getElementById('bus-form-card'); if (busCard) busCard.classList.add('hidden');
            document.getElementById('route-form-title').textContent = data ? 'Sửa Tuyến' : 'Thêm Tuyến';
            document.getElementById('route-id').value = data?.id || '';
            document.getElementById('route-name-input').value = data?.name || '';
            document.getElementById('route-description').value = data?.description || '';
            document.getElementById('route-duration').value = data?.duration || '';
        }
    }

    function closeFormModal() {
        if (!formModal) return;
        formModal.classList.add('hidden');
        driverFormCard.classList.add('hidden');
        parentFormCard.classList.add('hidden');
    }

    // ===== Validation helpers =====
    function setError(id, msg) {
        const errEl = document.getElementById(id + '-error');
        const input = document.getElementById(id);
        if (errEl) errEl.textContent = msg || '';
        if (input) {
            if (msg) input.classList.add('invalid');
            else input.classList.remove('invalid');
        }
    }

    function clearFormErrors() {
        ['dr-name','dr-phone','dr-email','pa-name','pa-student-name','pa-phone','pa-cccd','pa-email','bus-plate','bus-run','route-name-input','route-description','route-duration'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('invalid');
            const err = document.getElementById(id + '-error');
            if (err) err.textContent = '';
        });
    }

    function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function isPhone(v){ return /^\+?\d{9,15}$/.test(v.replace(/\s|-/g,'')); }
    function isCCCD(v){ return /^\d{9,12}$/.test(v); }

    function validateDriverForm(){
        clearFormErrors();
        const name = document.getElementById('dr-name')?.value.trim() || '';
        const phone = document.getElementById('dr-phone')?.value.trim() || '';
        const email = document.getElementById('dr-email')?.value.trim() || '';
        let valid = true;
        if (name.length < 2) { setError('dr-name','Tên phải có ít nhất 2 ký tự'); valid = false; }
        if (!phone || !isPhone(phone)) { setError('dr-phone','SĐT không hợp lệ (9-15 chữ số, có thể +)'); valid = false; }
        if (email && !isEmail(email)) { setError('dr-email','Email không hợp lệ'); valid = false; }
        return valid;
    }

    function validateParentForm(){
        clearFormErrors();
        const name = document.getElementById('pa-name')?.value.trim() || '';
        const student = document.getElementById('pa-student-name')?.value.trim() || '';
        const phone = document.getElementById('pa-phone')?.value.trim() || '';
        const cccd = document.getElementById('pa-cccd')?.value.trim() || '';
        const email = document.getElementById('pa-email')?.value.trim() || '';
        let valid = true;
        if (name.length < 2) { setError('pa-name','Tên phải có ít nhất 2 ký tự'); valid = false; }
        if (student.length < 1) { setError('pa-student-name','Vui lòng nhập tên học sinh'); valid = false; }
        if (!phone || !isPhone(phone)) { setError('pa-phone','SĐT không hợp lệ (9-15 chữ số, có thể +)'); valid = false; }
        if (cccd && !isCCCD(cccd)) { setError('pa-cccd','CCCD phải là chữ số (9-12 ký tự)'); valid = false; }
        if (email && !isEmail(email)) { setError('pa-email','Email không hợp lệ'); valid = false; }
        return valid;
    }

    function validateBusForm(){
        clearFormErrors();
        const plate = document.getElementById('bus-plate')?.value.trim() || '';
        const run = document.getElementById('bus-run')?.value.trim() || '';
        let valid = true;
        if (plate.length < 2) { setError('bus-plate','Biển số không hợp lệ'); valid = false; }
        if (run.length < 1) { setError('bus-run','Vui lòng nhập tuyến chạy'); valid = false; }
        return valid;
    }

    function validateRouteForm(){
        clearFormErrors();
        const name = document.getElementById('route-name-input')?.value.trim() || '';
        const duration = document.getElementById('route-duration')?.value.trim() || '';
        let valid = true;
        if (name.length < 2) { setError('route-name-input','Tên tuyến phải có ít nhất 2 ký tự'); valid = false; }
        if (duration && !/^[0-9]+$/.test(duration)) { setError('route-duration','Thời gian phải là số nguyên (phút)'); valid = false; }
        return valid;
    }

    // Clear errors as user types
    ['dr-name','dr-phone','dr-email','pa-name','pa-student-name','pa-phone','pa-cccd','pa-email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => setError(id, ''));
    });

    // Click outside to close
    if (formModal) {
        formModal.addEventListener('click', (e) => {
            if (e.target === formModal) closeFormModal();
        });
    }

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeFormModal);

    async function saveData(endpoint, payload, id = null) {
        const url = id ? `${API_BASE_URL}/${endpoint}/${id}` : `${API_BASE_URL}/${endpoint}`;
        try {
            const res = await fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Lỗi server');
            return json;
        } catch (err) {
            console.error('Lỗi lưu dữ liệu:', err);
            showMessage(err.message || 'Lỗi lưu dữ liệu', 'error');
            return null;
        }
    }

    // Save buttons
    const drSave = document.getElementById('dr-save');
    if (drSave) drSave.addEventListener('click', async () => {
        if (!validateDriverForm()) return;
        const id = document.getElementById('dr-id')?.value || null;
        const payload = {
            name: document.getElementById('dr-name')?.value.trim() || '',
            phone: document.getElementById('dr-phone')?.value.trim() || '',
            email: document.getElementById('dr-email')?.value.trim() || '',
            status: document.getElementById('dr-status')?.value || 'active'
        };
        const result = await saveData('drivers', payload, id || null);
        if (result) {
            closeFormModal();
            await renderDrivers();
            showMessage('Lưu tài xế thành công');
        }
    });

    const paSave = document.getElementById('pa-save');
    if (paSave) paSave.addEventListener('click', async () => {
        if (!validateParentForm()) return;
        const id = document.getElementById('pa-id')?.value || null;
        const payload = {
            name: document.getElementById('pa-name')?.value.trim() || '',
            student: document.getElementById('pa-student-name')?.value.trim() || '',
            phone: document.getElementById('pa-phone')?.value.trim() || '',
            cccd: document.getElementById('pa-cccd')?.value.trim() || '',
            email: document.getElementById('pa-email')?.value.trim() || ''
        };
        const result = await saveData('parents', payload, id || null);
        if (result) {
            closeFormModal();
            await renderParents();
            showMessage('Lưu phụ huynh thành công');
        }
    });

    // Bus save/cancel
    const busSave = document.getElementById('bus-save');
    if (busSave) busSave.addEventListener('click', async () => {
        if (!validateBusForm()) return;
        const id = document.getElementById('bus-id')?.value || null;
        const payload = {
            plate: document.getElementById('bus-plate')?.value.trim() || '',
            run: document.getElementById('bus-run')?.value.trim() || '',
            status: document.getElementById('bus-status')?.value || 'active'
        };
        const result = await saveData('buses', payload, id || null);
        if (result) {
            closeFormModal();
            await renderBusesManaged();
            showMessage('Lưu xe buýt thành công');
        }
    });
    const busCancel = document.getElementById('bus-cancel'); if (busCancel) busCancel.addEventListener('click', closeFormModal);
    // Route save/cancel
    const routeSave = document.getElementById('route-save');
    if (routeSave) routeSave.addEventListener('click', async () => {
        if (!validateRouteForm()) return;
        const id = document.getElementById('route-id')?.value || null;
        const payload = {
            name: document.getElementById('route-name-input')?.value.trim() || '',
            description: document.getElementById('route-description')?.value.trim() || '',
            duration: document.getElementById('route-duration')?.value.trim() || null
        };
        const result = await saveData('routes', payload, id || null);
        if (result) {
            closeFormModal();
            await renderRoutesManaged();
            showMessage('Lưu tuyến thành công');
        }
    });
    const routeCancel = document.getElementById('route-cancel'); if (routeCancel) routeCancel.addEventListener('click', closeFormModal);

    // Cancel buttons
    const drCancel = document.getElementById('dr-cancel'); if (drCancel) drCancel.addEventListener('click', closeFormModal);
    const paCancel = document.getElementById('pa-cancel'); if (paCancel) paCancel.addEventListener('click', closeFormModal);

    function renderBuses() {
        const list = document.getElementById('bus-list'); if (!list) return;
        list.innerHTML = '';
        state.buses.forEach(b => {
            const el = document.createElement('div'); el.className = 'bus';
            el.innerHTML = `<div class='pin'>${b.id}</div>
                <div style='flex:1'>
                    <div style='font-weight:700'>
                        ${b.plate}
                        <span style='font-size:12px;color:${b.status === 'running' ? '#059669' : '#6b7280'}'>${b.status}</span>
                    </div>
                    <div class='muted' style='font-size:13px'>${b.route} • ${b.driver}</div>
                </div>`;
            list.appendChild(el);
        });
        const total = document.getElementById('total-buses');
        const running = document.getElementById('running-buses');
        if (total) total.textContent = state.buses.length;
        if (running) running.textContent = state.buses.filter(b => b.status === 'running').length;
    }

    function renderMapItems() {
        const el = document.getElementById('map-items'); if (!el) return;
        el.innerHTML = '';
        state.buses.forEach(b => {
            const d = document.createElement('div'); d.className = 'bus'; d.style.background = 'transparent';
            d.innerHTML = `<div class='pin' style='width:28px;height:28px;border-radius:6px'>🚌</div>
                <div style='flex:1'><div style='font-weight:700'>${b.plate}</div>
                <div class='muted' style='font-size:12px'>${b.route} • ${b.lat.toFixed(4)}, ${b.lon.toFixed(4)}</div></div>
                <div class='muted' style='font-size:12px'>${b.status}</div>`;
            el.appendChild(d);
        });
    }

    function renderActivity() {
        const el = document.getElementById('activity-log'); if (!el) return;
        el.innerHTML = state.activities.slice().reverse().map(a =>
            `<div style='font-size:13px;padding:6px;border-bottom:1px solid #f3f5f9'>${a}</div>`).join('');
    }

    function renderInbox() {
        const el = document.getElementById('inbox'); if (!el) return;
        el.innerHTML = state.inbox.slice().reverse().map(m =>
            `<div style='padding:6px;border-bottom:1px solid #f3f5f9;font-size:13px'>${m}</div>`).join('');
    }

    // ===== Simulation (real-time ≤3s) =====
    function tickSimulate() {
        if (!simRunning) return;
        state.buses.forEach(b => {
            if (Math.random() > 0.8) b.status = (b.status === 'running' ? 'stopped' : 'running');
            if (b.status === 'running') { b.lat += (Math.random() - 0.5) * 0.001; b.lon += (Math.random() - 0.5) * 0.001; }
        });
        const b = state.buses[Math.floor(Math.random() * state.buses.length)];
        const act = `${new Date().toLocaleTimeString()} — ${b.plate} (${b.route}) ${b.status === 'running' ? 'đang chạy' : 'dừng lại'}`;
        state.activities.push(act); if (state.activities.length > 200) state.activities.shift();
        renderBuses(); renderMapItems(); renderActivity();
        // Update tracking map markers if available
        try {
            if (window && window.trackingMap && typeof window.trackingMap.setBuses === 'function') {
                // Provide a simple mapping: buses with lat/lon near Saigon University
                window.trackingMap.setBuses(state.buses);
            }
        } catch (e) { console.warn('trackingMap update error', e); }
    }

    // ===== Init =====
    async function init() {
        // Tải lại các hàm render sau khi thêm xóa
        renderBuses(); renderMapItems(); renderActivity(); renderInbox(); 
        await renderParents(); 
        await renderDrivers(); 
        await renderBusesManaged();
        await renderRoutesManaged();
        // Provide static demo routes centered near Saigon University (ĐH Sài Gòn)
        const demoRoutes = [
            {
                id: 'R1', name: 'Tuyến Đại học Sài Gòn - 1', color: '#2b6cb0',
                coords: [
                    [10.7652, 106.6808],
                    [10.7640, 106.6820],
                    [10.7628, 106.6835],
                    [10.7615, 106.6848]
                ],
                stops: [
                    { lat: 10.7652, lon: 106.6808, label: 'Cổng chính' },
                    { lat: 10.7628, lon: 106.6835, label: 'Ký túc xá' }
                ]
            },
            {
                id: 'R2', name: 'Tuyến Đại học Sài Gòn - 2', color: '#dd6b20',
                coords: [
                    [10.7638, 106.6815],
                    [10.7630, 106.6829],
                    [10.7610, 106.6850]
                ],
                stops: [
                    { lat: 10.7638, lon: 106.6815, label: 'Trạm A' },
                    { lat: 10.7610, lon: 106.6850, label: 'Trạm B' }
                ]
            }
        ];
        // Normalize stops format for trackingMap.setRoutes
        const normalizedRoutes = demoRoutes.map(r => ({
            id: r.id,
            name: r.name,
            color: r.color,
            coords: r.coords,
            stops: r.stops.map(s => (Array.isArray(s) ? s : [s.lat, s.lon]))
        }));
        if (window && window.trackingMap && typeof window.trackingMap.setRoutes === 'function') {
            // Convert stops to objects with label when possible
            const conv = demoRoutes.map(r => ({
                id: r.id,
                name: r.name,
                color: r.color,
                coords: r.coords,
                stops: r.stops.map(s => ({ lat: s.lat, lon: s.lon, label: s.label }))
            }));
            window.trackingMap.setRoutes(conv.map(rr => ({ coords: rr.coords, color: rr.color, stops: rr.stops.map(s => [s.lat, s.lon]) })));
        }
        // initial bus markers
        if (window && window.trackingMap && typeof window.trackingMap.setBuses === 'function') {
            window.trackingMap.setBuses(state.buses);
        }
        // Gán sự kiện cho nút Thêm (mở popup chung)
        const btnAddParent = document.getElementById('btn-add-parent');
        if (btnAddParent) btnAddParent.addEventListener('click', () => openFormModal('parent'));
        const btnAddDriver = document.getElementById('btn-add-driver');
        if (btnAddDriver) btnAddDriver.addEventListener('click', () => openFormModal('driver'));
        // Hỗ trợ id khác (trang users view có id 'add-driver')
        const altAddDriver = document.getElementById('add-driver');
        if (altAddDriver) altAddDriver.addEventListener('click', () => openFormModal('driver'));
        // Đăng ký nút Thêm Xe buýt và Thêm Tuyến (trước đây bị thiếu)
        const btnAddBus = document.getElementById('btn-add-bus');
        if (btnAddBus) btnAddBus.addEventListener('click', () => openFormModal('bus'));
        const btnAddRoute = document.getElementById('btn-add-route');
        if (btnAddRoute) btnAddRoute.addEventListener('click', () => openFormModal('route'));

        // Sự kiện tìm kiếm phụ huynh
        const searchParent = document.getElementById('search-parent');
        if (searchParent) {
            searchParent.addEventListener('input', (e) => {
                renderParents(e.target.value);
            });
        }
        // Sự kiện tìm kiếm tài xế
        const searchDriver = document.getElementById('search-driver');
        if (searchDriver) {
            searchDriver.addEventListener('input', (e) => {
                renderDrivers(e.target.value);
            });
        }
        // Sự kiện tìm kiếm xe buýt
        const searchBus = document.getElementById('search-bus');
        if (searchBus) searchBus.addEventListener('input', (e) => renderBusesManaged(e.target.value));

        // ... (phần code init còn lại giữ nguyên) ...

        const fr = document.getElementById('filter-route'); const rr = document.getElementById('sched-route');
        if (fr && rr) {
            state.routes.forEach(r => {
                const o = document.createElement('option'); o.value = r.name; o.textContent = r.name;
                fr.appendChild(o); rr.appendChild(o.cloneNode(true));
            });
        }

        // schedule controls (period fixed to week)
        document.getElementById('period-prev')?.addEventListener('click', () => changePeriod(-1));
        document.getElementById('period-next')?.addEventListener('click', () => changePeriod(1));
         // Trong sched-edit-toggle event: Sửa payload save để khớp schema
   document.getElementById('sched-edit-toggle')?.addEventListener('click', async () => {
       if (!schedulesEditing) {
           schedulesEditing = true;
           setScheduleEditing(true);
           renderSchedulesTable();
       } else {
           const runId = formatScheduleId('week', currentPeriod.date); // schedule_date
           const table = document.getElementById('schedules-table');
           if (!table) return;
           const rows = Array.from(table.rows);
           for (const row of rows) {
               const id = row.dataset.id;
               const driverVal = row.dataset.driver || '';
               const routeSel = row.querySelector('select[name="route"]');
               const busSel = row.querySelector('select[name="bus"]');
               const shiftSel = row.querySelector('select[name="shift"]');
               const routeVal = routeSel ? routeSel.value : null; // Lấy route ID từ select
               const busVal = busSel ? busSel.value : null;
               const shiftVal = shiftSel ? shiftSel.value : null;
               if (!driverVal) { showMessage('Một hoặc nhiều hàng thiếu tài xế', 'error'); return; }
               const scheduleId = id || `${runId}-${driverVal}`; // Tạo schedule_id nếu thiếu
               const payload = {
                   schedule_id: scheduleId,
                   schedule_date: runId,  // Thêm schedule_date
                   run: routeVal,         // Route ID (từ select)
                   driver_id: driverVal,
                   bus_id: busVal,
                   shift: shiftVal
               };
               if (id) await saveData('schedules', payload, id); // PUT với id (schedule_id)
               else await saveData('schedules', payload, null);  // POST mới
           }
           schedulesEditing = false;
           setScheduleEditing(false);
           await loadSchedules(); // Tải lại sau save
           renderSchedulesTable();
           showMessage('Lưu lịch thành công');
       }
   });

        updatePeriodDisplay(currentPeriod.type, currentPeriod.date);
        await loadSchedules();

        const btnSim = document.getElementById('btn-simulate');
        if (btnSim) btnSim.addEventListener('click', () => {
            simRunning = !simRunning;
            btnSim.textContent = simRunning ? 'Tắt mô phỏng' : 'Bật mô phỏng';
        });

        const send = document.getElementById('send-msg');
        if (send) send.addEventListener('click', () => {
            const to = document.getElementById('msg-to')?.value || 'Tất cả';
            const body = document.getElementById('msg-body')?.value || '—';
            state.inbox.push(`${new Date().toLocaleString()} — Gửi tới: ${to} — ${body}`);
            renderInbox();
        });

        navigateTo(current.default);
        setInterval(tickSimulate, 3000); // cập nhật mỗi 3s
    }

    // KHỞI TẠO
    init();

    window.logout = function () {
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    };
});




