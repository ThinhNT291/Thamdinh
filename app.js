// ==========================================
// CẤU HÌNH API VÀ BIẾN TOÀN CỤC
// ==========================================
const SHEET_ID = "1DBYrAObOLR7jtj74B_jBHVDf2I07UXc8zpgppvbabbs";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&t=${new Date().getTime()}`;

const API_DAO_TAO = "VUI_LONG_DAN_LINK_WEBAPP_MOI_VAO_DAY"; 
const API_TRUNG_TUYEN = "https://script.google.com/macros/s/AKfycbxENuP4trkPcG24rnZEyHDFAk3FyNaaWA3NCBOyxfV-HB1Wv7t3JDlRg54JD9qNb_XtXg/exec";
const API_BAO_THIEU = "https://script.google.com/macros/s/AKfycbye3sn6obd4jGD746BsP4Lc0TORJSLVv7pRen9itwzmj4C16bge-ek36EsU6jOr97h_/exec";
const API_LUU_KETQUA = "https://script.google.com/macros/s/AKfycbziIyPUBk9lA6WnnI0W7U5xZ2X6_kIACnPlHLQPkuN0Bp6B776_pflfKsryfqfgBlRO/exec"; 

const SUBJ_MAP = {
    "diem_toan": "TOÁN", "diem_vatli": "VẬT LÍ", "diem_hoahoc": "HÓA HỌC", "diem_sinhhoc": "SINH HỌC",
    "diem_nguvan": "NGỮ VĂN", "diem_lichsu": "LỊCH SỬ", "diem_dialy": "ĐỊA LÝ", "diem_tienganh": "TIẾNG ANH",
    "diem_tiengtrung": "TIẾNG TRUNG", "diem_tinhoc": "TIN HỌC", "diem_gdktpl": "GDKTPL"
};

const MAP_HE_DAO_TAO = { "Cao đẳng": "01", "Đại học chính quy": "02", "Liên thông ĐH - ĐH (Văn bằng 2)": "03", "Thường xuyên: Phương thức ĐTTX": "04", "Liên thông từ CĐ lên ĐH": "05", "Thường xuyên: Phương thức VLVH": "06", "Thạc sĩ": "07", "Khóa ngắn hạn cấp chứng chỉ": "08" };
const MAP_HINH_THUC = { "Chính quy đại trà": "1", "Liên thông ĐH - ĐH chính quy (VB 2)": "2", "Thường xuyên: Phương thức ĐTTX": "3", "Thường xuyên: Phương thức VLVH": "4" };

let rawData = []; let filteredData = []; let currentCandidateIndex = -1;

window.onload = () => {
    document.getElementById('filter-from').value = "2026-01-01";
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('filter-to').value = `${yyyy}-${mm}-${dd}`;
    
    fetchCSVData();
    const crossCheckSelect = document.getElementById('ws-other-major');
    if (typeof DICT_NGANH !== 'undefined') {
        Object.keys(DICT_NGANH).forEach(nganh => crossCheckSelect.appendChild(new Option(nganh, nganh)));
    }
};

// ==========================================
// ĐỌC VÀ LỌC DỮ LIỆU TỪ GOOGLE SHEET
// ==========================================
function fetchCSVData() {
    Papa.parse(CSV_URL, {
        download: true, header: true, skipEmptyLines: true,
        complete: function(results) {
            rawData = results.data.map(row => { 
                let trangThaiThamDinh = getVal(row, ["TRẠNG THÁI THẨM ĐỊNH", "TRẠNG THÁI"]);
                let state = "Đang chờ duyệt"; let saved = false;
                
                if(trangThaiThamDinh.includes("Đã duyệt")) { state = "Đã duyệt"; saved = true; }
                else if(trangThaiThamDinh.includes("Đã báo thiếu")) { state = "Đã báo thiếu"; }
                else if(trangThaiThamDinh.includes("Mới bổ sung")) { state = "Mới bổ sung"; }
                
                row._appState = state; row._saved = saved; 
                return row; 
            });
            filteredData = [...rawData];
            populateFilters(); applyFilters();
            document.getElementById('last-updated').innerText = `✔ Đồng bộ: ${new Date().toLocaleTimeString('vi-VN')}`;
        }
    });
}

function getVal(row, keys) {
    for (let k of keys) {
        let searchKey = k.trim().toUpperCase().replace(/\s+/g, ' ');
        for (let rowKey in row) { 
            let cleanRowKey = rowKey.trim().toUpperCase().replace(/\s+/g, ' ');
            if (cleanRowKey === searchKey) {
                let val = (row[rowKey] || "").trim();
                if(val.startsWith("'")) val = val.substring(1); 
                return val;
            }
        } 
    } 
    return "";
}

function getMissingDocs(row) {
    if (typeof DICT_HO_SO === 'undefined') return [];
    const dtDauVao = getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]);
    const dsTienQuyet = DICT_HO_SO.tien_quyet[dtDauVao] || [];
    const dsChung = DICT_HO_SO.chung || [];
    let missing = [];
    
    [...dsChung, ...dsTienQuyet].forEach(doc => {
        let keysToCheck = [doc.name];
        if(doc.id === 'doc_cccd') keysToCheck = ["BẢN SAO ID", "BẢN SAO CCCD", "BẢN SAO CĂN CƯỚC"];
        if(doc.id === 'doc_phieu_dk') keysToCheck = ["PHIẾU ĐĂNG KÝ DỰ TUYỂN", "PHIẾU ĐK"];
        if(doc.id === 'doc_syll') keysToCheck = ["SƠ YẾU LÝ LỊCH", "SYLL"];
        if(doc.id === 'doc_khaisinh') keysToCheck = ["BẢN SAO GIẤY KHAI SINH", "KHAI SINH"];

        let val = getVal(row, keysToCheck).toUpperCase();
        if (val !== "TRUE" && val !== "1" && val !== "V" && val !== "X" && val !== "CÓ") {
            missing.push(doc.name);
        }
    });
    return missing;
}

function generateMaSV(row) {
    const namTuyen = getVal(row, ["NĂM XÉT TUYỂN", "Năm xét tuyển"]) || new Date().getFullYear();
    const heDaoTao = getVal(row, ["HỆ ĐÀO TẠO", "Hệ đào tạo"]);
    const hinhThuc = getVal(row, ["HÌNH THỨC ĐÀO TẠO", "Hình thức đào tạo"]);
    const cccd = getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]) || "";
    const maNam = String(namTuyen).slice(-2); 
    const maHe = MAP_HE_DAO_TAO[heDaoTao] || "00"; 
    const maHinhThuc = MAP_HINH_THUC[hinhThuc] || "0"; 
    const maCCCD = cccd.slice(-6);
    return `${maNam}${maHe}${maHinhThuc}${maCCCD}`;
}

function getBestScoreText(row) {
    const dtDauVao = getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]);
    if (dtDauVao === "Tốt nghiệp THPT") {
        const nganh = getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]);
        const diemCong = parseFloat(getVal(row, ["ĐIỂM CỘNG"]).replace(',','.')) || 0;
        const kvVal = getVal(row, ["KHU VỰC ƯU TIÊN"]); const dtVal = getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"]);
        
        let uTienBanDau = 0;
        if (typeof DICT_KHU_VUC !== 'undefined' && typeof DICT_DOI_TUONG !== 'undefined') {
            uTienBanDau = (DICT_KHU_VUC[kvVal] || 0) + (DICT_DOI_TUONG[dtVal] || 0);
        }
        
        let combos = (typeof DICT_NGANH !== 'undefined' ? DICT_NGANH[nganh] : []) || [];
        let maxScore = 0; let bestCombo = "";
        
        combos.forEach(maToHop => {
            let subjects = DICT_TO_HOP[maToHop];
            if(subjects) {
                let s1 = parseFloat(getVal(row, [SUBJ_MAP[subjects[0]]]).replace(',','.')) || 0;
                let s2 = parseFloat(getVal(row, [SUBJ_MAP[subjects[1]]]).replace(',','.')) || 0;
                let s3 = parseFloat(getVal(row, [SUBJ_MAP[subjects[2]]]).replace(',','.')) || 0;
                let total = s1 + s2 + s3;
                if (s1 > 0 && s2 > 0 && s3 > 0 && total > maxScore) { maxScore = total; bestCombo = maToHop; }
            }
        });
        
        if (maxScore > 0) {
            let finalUTien = maxScore >= 22.5 ? ((30 - maxScore) / 7.5) * uTienBanDau : uTienBanDau;
            let finalTotalScore = (maxScore + finalUTien + diemCong).toFixed(2);
            return `<b style="color:#d84315;">${finalTotalScore}</b> <span style="font-size:10px; color:#555;">(${bestCombo})</span>`;
        } else { return `<span style="color:#999; font-size:10px;">Chưa đủ điểm</span>`; }
    } else {
        let h4 = getVal(row, ["ĐIỂM TB TOÀN KHÓA HỆ 4"]); let h10 = getVal(row, ["ĐIỂM TB TOÀN KHÓA HỆ 10"]);
        if(h4) return `<b style="color:#d84315;">${h4}</b> <span style="font-size:10px; color:#555;">(Hệ 4)</span>`;
        if(h10) return `<b style="color:#d84315;">${h10}</b> <span style="font-size:10px; color:#555;">(Hệ 10)</span>`;
        return `<span style="color:#999; font-size:10px;">Chưa có điểm</span>`;
    }
}

function getRawScoreNumber(row) {
    let text = getBestScoreText(row);
    let match = text.match(/>([\d\.]+)<\/b>/);
    if (match) return parseFloat(match[1]);
    return 0;
}

function getRawDateNumber(row) {
    const timeStr = getVal(row, ["TIME", "NGÀY NỘP", "NGÀY XỬ LÝ"]).split(' ')[0];
    if(timeStr.includes('-')){ const p=timeStr.split('-'); return new Date(p[0],p[1]-1,p[2]).getTime(); }
    else if(timeStr.includes('/')){ const p=timeStr.split('/'); return new Date(p[2],p[1]-1,p[0]).getTime(); }
    return 0;
}

function populateFilters() {
    const nganhSet = new Set(); 
    rawData.forEach(r => { const ng = getVal(r, ["NGÀNH", "NGÀNH ĐÀO TẠO"]); if(ng) nganhSet.add(ng); });
    const selectNganh = document.getElementById('filter-nganh'); nganhSet.forEach(ng => selectNganh.appendChild(new Option(ng, ng)));
}

function applyFilters() {
    const fromVal = document.getElementById('filter-from').value;
    const toVal = document.getElementById('filter-to').value;
    const fDate = fromVal ? new Date(fromVal) : null; if(fDate) fDate.setHours(0,0,0,0);
    const tDate = toVal ? new Date(toVal) : null; if(tDate) tDate.setHours(23,59,59,999);
    
    const nVal = document.getElementById('filter-nganh').value;
    const hVal = document.getElementById('filter-hoso').value.toLowerCase();
    const sortVal = document.getElementById('sort-by').value;

    filteredData = rawData.filter(row => {
        if (fDate || tDate) { 
            let rowDateMs = getRawDateNumber(row);
            if (rowDateMs === 0) return false;
            if (fDate && rowDateMs < fDate.getTime()) return false; 
            if (tDate && rowDateMs > tDate.getTime()) return false; 
        }
        if (nVal && getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]) !== nVal) return false;
        let missingCount = getMissingDocs(row).length;
        if (hVal === "đủ" && missingCount > 0) return false;
        if (hVal === "thiếu" && missingCount === 0) return false;
        return true;
    });

    if (sortVal === "date_desc") { filteredData.sort((a, b) => getRawDateNumber(b) - getRawDateNumber(a)); } 
    else if (sortVal === "date_asc") { filteredData.sort((a, b) => getRawDateNumber(a) - getRawDateNumber(b)); } 
    else if (sortVal === "score_desc") { filteredData.sort((a, b) => getRawScoreNumber(b) - getRawScoreNumber(a)); } 
    else if (sortVal === "status") {
        const statusRank = { "Đang chờ duyệt": 1, "Mới bổ sung": 2, "Đã báo thiếu": 3, "Đã duyệt": 4 };
        filteredData.sort((a, b) => (statusRank[a._appState] || 5) - (statusRank[b._appState] || 5));
    }
    
    document.getElementById('kpi-total').innerText = filteredData.length;
    document.getElementById('kpi-docs').innerText = filteredData.filter(r => getMissingDocs(r).length === 0).length;
    document.getElementById('row-count').innerText = filteredData.length;
    renderTable(); 
}

function resetFilters() { document.querySelectorAll('.filter-box select, .filter-box input').forEach(s => s.value = ''); applyFilters(); }

function renderTable() {
    const tbody = document.getElementById('table-body'); tbody.innerHTML = '';
    if (filteredData.length === 0) { tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:25px;">❌ Không có hồ sơ nào thỏa điều kiện!</td></tr>`; return; }

    filteredData.forEach((row, index) => {
        const tr = document.createElement('tr');
        let btnText = "🔍 Thẩm định"; let btnClass = "btn-review";
        if (row._appState === "Đã duyệt") { btnText = "✅ Đã duyệt"; btnClass = "btn-review pass-state"; }
        else if (row._appState === "Đã báo thiếu") { btnText = "⚠️ Đã yêu cầu BS"; btnClass = "btn-review warn-state"; }
        else if (row._appState === "Mới bổ sung") { btnText = "🔄 Mới bổ sung"; btnClass = "btn-review update-state"; }

        let missing = getMissingDocs(row);
        let badge = missing.length > 0 ? `<span class="badge badge-warning" style="white-space:normal;text-align:left;">Thiếu: ${missing.join(', ')}</span>` : `<span class="badge badge-success">Đủ hồ sơ</span>`;

        tr.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;"><b>${getVal(row, ["TIME"]).split(' ')[0]}</b></td>
            <td style="color:#d84315; font-weight:bold;">${generateMaSV(row)}</td>
            <td><b>${getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"])}</b></td>
            <td><b>${getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"])}</b></td>
            <td>${getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"])}</td>
            <td>${getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"])}</td>
            <td style="text-align: center;">${getBestScoreText(row)}</td>
            <td>${badge}</td>
            <td style="text-align: center;"><button class="${btnClass}" onclick="openWorkspace(${index})">${btnText}</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// CÁC CHỨC NĂNG NÚT BẤM VÀ XUẤT DATA
// ==========================================

// 1. TÍNH NĂNG XUẤT EXCEL (Đã thêm Mã SV và Sửa lỗi)
function exportExcel() {
    if (filteredData.length === 0) { alert("Không có dữ liệu để xuất!"); return; }
    if (typeof XLSX === 'undefined') { alert("Thư viện Excel chưa được tải, vui lòng kiểm tra lại mạng!"); return; }

    let exportData = filteredData.map((row, index) => {
        return {
            "STT": index + 1,
            "MÃ SINH VIÊN": generateMaSV(row),
            "CĂN CƯỚC": getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]),
            "HỌ VÀ TÊN": getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]),
            "NGÀY SINH": getVal(row, ["NGÀY SINH"]),
            "NGÀNH ĐÀO TẠO": getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]),
            "ĐỐI TƯỢNG ĐẦU VÀO": getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]),
            "TRẠNG THÁI HỒ SƠ": getMissingDocs(row).length > 0 ? "Thiếu hồ sơ" : "Đủ hồ sơ",
            "ĐIỂM TRÚNG TUYỂN": getRawScoreNumber(row),
            "TRẠNG THÁI THẨM ĐỊNH": row._appState
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach");
    XLSX.writeFile(wb, `Danh_Sach_Tham_Dinh_${new Date().getTime()}.xlsx`);
}

// 2. TÍNH NĂNG ĐẨY ĐÀO TẠO (Đã thêm Mã SV)
async function syncToDaoTao() {
    if (!API_DAO_TAO.includes("script.google.com")) { alert("⚠️ Ông chưa dán Link API Đào tạo vào code!"); return; }
    let approvedRows = rawData.filter(r => r._appState === "Đã duyệt");
    if(approvedRows.length === 0) { alert("❌ Không tìm thấy hồ sơ nào có trạng thái 'Đã duyệt'!"); return; }
    if(!confirm(`Bàn giao danh sách ${approvedRows.length} hồ sơ TRÚNG TUYỂN sang file của Phòng Đào tạo/CTSV?`)) return;

    let btn = document.getElementById('btnSyncDaoTao'); let oldText = btn.innerText;
    btn.innerText = "⏳ Đang chuyển giao..."; btn.disabled = true;

    let payload = approvedRows.map((row, index) => {
        return {
            "TT": index + 1,
            "MÃ SINH VIÊN": generateMaSV(row), 
            "CĂN CƯỚC": getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]),
            "TÊN SINH VIÊN": getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]),
            "NGÀY SINH": getVal(row, ["NGÀY SINH"]),
            "NGÀNH": getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]),
            "KHÓA": getVal(row, ["KHÓA"]),
            "NĂM XÉT TUYỂN": getVal(row, ["NĂM XÉT TUYỂN"]),
            "HỆ ĐÀO TẠO": getVal(row, ["HỆ ĐÀO TẠO"]),
            "HÌNH THỨC ĐÀO TẠO": getVal(row, ["HÌNH THỨC ĐÀO TẠO"]),
            "GIẤY TỜ ƯU TIÊN": getVal(row, ["GIẤY TỜ ƯU TIÊN"]),
            "ĐIỂM TRÚNG TUYỂN": getRawScoreNumber(row),
            "LINK HỒ SƠ": getVal(row, ["LINK HỒ SƠ", "Link hồ sơ"])
        }
    });

    try {
        const resp = await fetch(API_DAO_TAO, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const result = await resp.json();
        if(result.status === "success") alert(`🎉 Bàn giao thành công ${result.added} hồ sơ MỚI!`);
        else alert("❌ Lỗi API máy chủ: " + result.message);
    } catch (e) { alert("❌ Lỗi kết nối mạng: " + e); }
    btn.innerText = oldText; btn.disabled = false;
}

// ==========================================
// WORKSPACE: KHUNG DUYỆT HỒ SƠ CHI TIẾT
// ==========================================
function openWorkspace(index) {
    currentCandidateIndex = index; let row = filteredData[index];
    document.getElementById('ws-fullname-title').innerText = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]).toUpperCase();
    document.getElementById('ws-cccd').innerText = getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]);
    document.getElementById('ws-fullname').innerText = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    document.getElementById('ws-masv').innerText = generateMaSV(row);
    document.getElementById('ws-hedt').innerText = getVal(row, ["HỆ ĐÀO TẠO"]);
    document.getElementById('ws-hinhthuc').innerText = getVal(row, ["HÌNH THỨC ĐÀO TẠO"]);
    document.getElementById('ws-nganh').innerText = getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]);
    
    let kv = getVal(row, ["KHU VỰC ƯU TIÊN"]); let dt = getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"]);
    document.getElementById('ws-kvdt').innerText = (kv ? kv : 'Không KV') + ' / ' + (dt ? dt : 'Không ĐT');

    let missing = getMissingDocs(row);
    let stEl = document.getElementById('ws-hoso-status');
    if (missing.length > 0) { stEl.innerHTML = `<span style="color:#d32f2f;">❌ Thiếu: ${missing.join(', ')}</span>`; } 
    else { stEl.innerHTML = `<span style="color:#2e7d32;">✅ Đủ hồ sơ</span>`; }

    calculateAndRenderScores(row, getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]));
    document.getElementById('ws-other-major').value = ""; updateModalActionButtons();
    document.getElementById('workspaceModal').style.display = 'flex';
}

function closeWorkspace() { document.getElementById('workspaceModal').style.display = 'none'; }
function openDriveLink() { let link = getVal(filteredData[currentCandidateIndex], ["LINK HỒ SƠ"]); if(link) { if(!link.startsWith('http')) link = 'https://' + link; window.open(link, '_blank'); } else alert("Thí sinh này không có link thư mục đính kèm!"); }
function prevWorkspace() { if (currentCandidateIndex > 0) openWorkspace(currentCandidateIndex - 1); }
function nextWorkspace() { if (currentCandidateIndex < filteredData.length - 1) openWorkspace(currentCandidateIndex + 1); }

function updateModalActionButtons() {
    let row = filteredData[currentCandidateIndex];
    document.getElementById('btnPrevWS').disabled = (currentCandidateIndex === 0);
    document.getElementById('btnNextWS').disabled = (currentCandidateIndex === filteredData.length - 1);
    
    let isApproved = row._appState === "Đã duyệt";
    document.getElementById('btnApprove').style.display = isApproved ? 'none' : 'block';
    document.getElementById('btnMissing').style.display = isApproved ? 'none' : 'block';
    document.getElementById('btnSaveToResult').style.display = isApproved ? 'block' : 'none';
}

function handleCrossCheckChange() {
    let altMajor = document.getElementById('ws-other-major').value; let row = filteredData[currentCandidateIndex];
    let majorToCalculate = altMajor ? altMajor : getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]);
    calculateAndRenderScores(row, majorToCalculate);
}

function calculateAndRenderScores(row, targetNganh) {
    const dtDauVao = getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]);
    const summaryEl = document.getElementById('ws-score-summary');
    const comboEl = document.getElementById('ws-combo-list-container');
    summaryEl.innerHTML = ''; comboEl.innerHTML = '';

    if (dtDauVao === "Tốt nghiệp THPT") {
        const diemCong = parseFloat(getVal(row, ["ĐIỂM CỘNG"]).replace(',','.')) || 0;
        const kvVal = getVal(row, ["KHU VỰC ƯU TIÊN"]); const dtVal = getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"]);
        let uTienBanDau = (DICT_KHU_VUC[kvVal] || 0) + (DICT_DOI_TUONG[dtVal] || 0);
        
        let combos = DICT_NGANH[targetNganh] || [];
        let htmlTable = '<table class="combo-table"><tr><th>Tổ hợp</th><th>Môn 1</th><th>Môn 2</th><th>Môn 3</th><th>Tổng điểm</th></tr>';
        
        let maxScore = 0; let bestCombo = "";
        let validCombos = [];

        combos.forEach(maToHop => {
            let subjects = DICT_TO_HOP[maToHop];
            if(subjects) {
                let s1 = parseFloat(getVal(row, [SUBJ_MAP[subjects[0]]]).replace(',','.')) || 0;
                let s2 = parseFloat(getVal(row, [SUBJ_MAP[subjects[1]]]).replace(',','.')) || 0;
                let s3 = parseFloat(getVal(row, [SUBJ_MAP[subjects[2]]]).replace(',','.')) || 0;
                if(s1 > 0 && s2 > 0 && s3 > 0) {
                    let total = s1 + s2 + s3;
                    validCombos.push({ ma: maToHop, s1: s1, s2: s2, s3: s3, t: total, n1: subjects[0], n2: subjects[1], n3: subjects[2] });
                    if (total > maxScore) { maxScore = total; bestCombo = maToHop; }
                }
            }
        });

        validCombos.forEach(c => {
            let cls = (c.ma === bestCombo) ? 'class="best-combo"' : '';
            htmlTable += `<tr ${cls}><td>${c.ma}</td><td>${c.s1} (${c.n1})</td><td>${c.s2} (${c.n2})</td><td>${c.s3} (${c.n3})</td><td>${c.t}</td></tr>`;
        });
        htmlTable += '</table>';
        
        if (validCombos.length === 0) { comboEl.innerHTML = '<p style="color:#e65100; text-align:center; font-size:12px;">Thí sinh chưa nhập đủ điểm các môn thuộc tổ hợp của ngành này.</p>'; } 
        else { comboEl.innerHTML = htmlTable; }

        let finalUTien = maxScore >= 22.5 ? ((30 - maxScore) / 7.5) * uTienBanDau : uTienBanDau;
        let finalScore = (maxScore + finalUTien + diemCong).toFixed(2);
        
        summaryEl.innerHTML = `
            <div class="info-card"><span class="info-label">Điểm cộng thêm</span><span class="info-val">${diemCong}đ (Giải thưởng/CC Ngoại ngữ)</span></div>
            <div class="info-card"><span class="info-label">Điểm Ưu tiên</span><span class="info-val">${finalUTien.toFixed(2)}đ (KV: ${kvVal} - ĐT: ${dtVal})</span></div>
            <div class="info-card" style="background:#e8f5e9;"><span class="info-label">TỔNG ĐIỂM XÉT TUYỂN</span><span class="info-val highlight">${finalScore}</span></div>
        `;
    } else {
        let h4 = getVal(row, ["ĐIỂM TB TOÀN KHÓA HỆ 4"]); let h10 = getVal(row, ["ĐIỂM TB TOÀN KHÓA HỆ 10"]);
        summaryEl.innerHTML = `
            <div class="info-card"><span class="info-label">Trung bình hệ 4</span><span class="info-val">${h4 || 'Không nhập'}</span></div>
            <div class="info-card"><span class="info-label">Trung bình hệ 10</span><span class="info-val">${h10 || 'Không nhập'}</span></div>
            <div class="info-card" style="background:#e8f5e9;"><span class="info-label">ĐÁNH GIÁ CHUNG</span><span class="info-val highlight">Dùng điểm VB/CQ</span></div>
        `;
    }
}

// 3. TÍNH NĂNG BÁO THIẾU
async function triggerMissing() {
    let row = filteredData[currentCandidateIndex]; let hoTen = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    let missingArray = getMissingDocs(row); let defaultMissingText = missingArray.length > 0 ? missingArray.join(', ') : "";

    const hosoThieu = prompt(`Nhập tên hồ sơ thiếu cho ${hoTen}:`, defaultMissingText);
    if(!hosoThieu) return;
    
    let btn = document.getElementById('btnMissing'); btn.innerText = "⏳ Đang xử lý..."; btn.disabled = true;
    const payload = [{ soCCCD: getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]), hoTen: hoTen, nganh: getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]), hosoThieu: "Thiếu: " + hosoThieu, ngayCapNhat: new Date().toLocaleDateString('vi-VN') }];

    try {
        const resp = await fetch(API_BAO_THIEU, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const result = await resp.json();
        if(result.status === "success") { alert(`✅ Đã gửi yêu cầu bổ sung hồ sơ ${hoTen}.`); row._appState = "Đã báo thiếu"; renderTable(); updateModalActionButtons(); } 
        else { alert("Lỗi: " + result.message); }
    } catch (e) { alert("Lỗi: " + e); }
    btn.disabled = false; btn.innerText = "⚠️ Y/C BỔ SUNG HS";
}

// 4. TÍNH NĂNG DUYỆT TRÚNG TUYỂN
async function triggerApprove() {
    let row = filteredData[currentCandidateIndex];
    if (getMissingDocs(row).length > 0) { alert("⚠️ Không thể duyệt trúng tuyển vì thí sinh vẫn CÒN THIẾU HỒ SƠ!"); return; }
    
    let hoTen = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    if(!confirm(`Xác nhận Duyệt Trúng Tuyển cho thí sinh: ${hoTen}?`)) return;

    let btn = document.getElementById('btnApprove'); btn.innerText = "⏳ Đang xuất Biên nhận..."; btn.disabled = true;
    const payload = [{ soCCCD: getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]), hoTen: hoTen, nganh: getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]), ngaySinh: getVal(row, ["NGÀNH SINH", "NGÀY SINH"]), ngayCapNhat: new Date().toLocaleDateString('vi-VN') }];

    try {
        const resp = await fetch(API_TRUNG_TUYEN, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const result = await resp.json();
        if(result.status === "success") { alert(`✅ Đã Duyệt Trúng tuyển thành công!`); row._appState = "Đã duyệt"; renderTable(); updateModalActionButtons(); window.open(result.pdfUrl, '_blank'); } 
        else { alert("Lỗi hệ thống: " + result.message); }
    } catch (e) { alert("Lỗi mạng: " + e); }
    btn.disabled = false; btn.innerText = "✅ DUYỆT TRÚNG TUYỂN";
}

// 5. TÍNH NĂNG LƯU VÀO CSDL KETQUA (Đã thêm Mã SV)
async function triggerSaveToSheet() {
    let row = filteredData[currentCandidateIndex];
    let hoTen = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    if(!confirm(`Lưu hồ sơ của [${hoTen}] vào Cơ sở dữ liệu Backup (Sheet KETQUA)?`)) return;

    let btn = document.getElementById('btnSaveToResult'); let oldText = btn.innerText;
    btn.innerText = "⏳ Đang lưu..."; btn.disabled = true;

    // Gói riêng Mã Sinh Viên để đẩy đi
    let payloadData = { ...row };
    payloadData["MÃ SINH VIÊN"] = generateMaSV(row); 
    payloadData["ĐIỂM TRÚNG TUYỂN"] = getRawScoreNumber(row);

    try {
        const resp = await fetch(API_LUU_KETQUA, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify([payloadData]) });
        const result = await resp.json();
        if(result.status === "success") alert(result.skipped > 0 ? `⚠️ Hồ sơ này đã tồn tại trong CSDL!` : `✅ Lưu CSDL thành công!`);
        else alert("Lỗi: " + result.message);
    } catch (e) { alert("Lỗi kết nối mạng: " + e); }
    btn.innerText = oldText; btn.disabled = false;
}

window.addEventListener('keydown', function(event) {
    if (event.key === "Escape") { const wsModal = document.getElementById('workspaceModal'); if (wsModal && wsModal.style.display === 'flex') closeWorkspace(); }
});
