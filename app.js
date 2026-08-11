// ==========================================
// CẤU HÌNH API VÀ BIẾN TOÀN CỤC
// ==========================================
const API_LAY_DU_LIEU = "https://script.google.com/macros/s/AKfycbxzIuSm2Gn1tYzEv0A1GXLF72QLQl2ZbGjk1NcGymGLrE1vd5Hhf1vuF-5EqHlgU3k/exec";
const API_QUET_CCCD = "https://script.google.com/macros/s/AKfycbzWI0IHShoBfNSBZXw46lbNbhgKJRN-jP0ckQXdY3-yFBFTLu40id6_P9Ufn78Lx4xl/exec";
const API_DAO_TAO = "https://script.google.com/macros/s/AKfycbztZs8SS1dSB7TGRTAVI289Rno3IlkfecRLLFkQYsvUIyR3GLhE9AV210dR9ZVbXBVu6w/exec"; 
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
    
    fetchSheetData();
    const crossCheckSelect = document.getElementById('ws-other-major');
    if (typeof DICT_NGANH !== 'undefined') {
        Object.keys(DICT_NGANH).forEach(nganh => crossCheckSelect.appendChild(new Option(nganh, nganh)));
    }
};

// ==========================================
// HỆ THỐNG CUSTOM MODAL (THAY THẾ ALERT/CONFIRM/PROMPT)
// ==========================================
function closeCustomModal() {
    document.getElementById('customModal').style.display = 'none';
    document.getElementById('modalPromptContainer').style.display = 'none';
}

function showAlert(message, title = "Hệ thống Thẩm định", isWarn = true, onOkCallback = null) {
    const modal = document.getElementById('customModal');
    const header = document.getElementById('modalHeader');
    header.style.background = isWarn ? "#c62828" : "#00897b";
    header.innerHTML = `<span>${isWarn ? '⚠️' : '💡'} ${title}</span><span style="cursor:pointer;" onclick="closeCustomModal()">✖</span>`;
    document.getElementById('modalBody').innerHTML = `<b>${message}</b>`;
    document.getElementById('modalFooter').innerHTML = `<button class="btn-modal-ok" id="btnModalOk">Đồng ý</button>`;
    
    modal.style.display = 'flex';
    document.getElementById('btnModalOk').onclick = () => {
        closeCustomModal();
        if (onOkCallback) onOkCallback();
    };
}

function showConfirm(message, onYesCallback, title = "Xác nhận thao tác") {
    const modal = document.getElementById('customModal');
    const header = document.getElementById('modalHeader');
    header.style.background = "#0288d1";
    header.innerHTML = `<span>❓ ${title}</span><span style="cursor:pointer;" onclick="closeCustomModal()">✖</span>`;
    document.getElementById('modalBody').innerHTML = message;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-modal-cancel" onclick="closeCustomModal()">Hủy bỏ</button>
        <button class="btn-modal-ok" id="btnModalYes">Xác nhận</button>
    `;
    modal.style.display = 'flex';
    document.getElementById('btnModalYes').onclick = () => {
        closeCustomModal();
        if (onYesCallback) onYesCallback();
    };
}

function showPrompt(message, defaultVal, onYesCallback, title = "Yêu cầu nhập liệu") {
    const modal = document.getElementById('customModal');
    const header = document.getElementById('modalHeader');
    header.style.background = "#e65100";
    header.innerHTML = `<span>📝 ${title}</span><span style="cursor:pointer;" onclick="closeCustomModal()">✖</span>`;
    document.getElementById('modalBody').innerHTML = message;
    
    const promptContainer = document.getElementById('modalPromptContainer');
    promptContainer.style.display = 'block';
    const promptInput = document.getElementById('modalPromptInput');
    promptInput.value = defaultVal;
    
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-modal-cancel" onclick="closeCustomModal()">Hủy bỏ</button>
        <button class="btn-modal-ok" id="btnPromptOk">Xác nhận</button>
    `;
    modal.style.display = 'flex';
    promptInput.focus();

    document.getElementById('btnPromptOk').onclick = () => {
        const val = promptInput.value.trim();
        if (!val) {
            promptInput.style.borderColor = "red";
            return;
        }
        closeCustomModal();
        if (onYesCallback) onYesCallback(val);
    };
}


// ==========================================
// ĐỌC VÀ LỌC DỮ LIỆU
// ==========================================
async function fetchSheetData() {
    try {
        document.getElementById('last-updated').innerText = "⏳ Đang tải dữ liệu an toàn...";
        
        const response = await fetch(API_LAY_DU_LIEU);
        const result = await response.json();

        if (result.status === "success") {
            rawData = result.data.map(row => { 
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
            document.getElementById('last-updated').innerText = `✔ Đồng bộ an toàn: ${new Date().toLocaleTimeString('vi-VN')}`;
        } else {
            showAlert("Lỗi tải dữ liệu: " + result.message, "❌ LỖI HỆ THỐNG", true);
        }
    } catch (error) {
        showAlert("Không thể kết nối đến máy chủ hoặc sai cấu hình URL API: " + error, "❌ LỖI KẾT NỐI", true);
    }
}

function getVal(row, keys) {
    for (let k of keys) {
        let searchKey = k.trim().toUpperCase().replace(/\s+/g, ' ');
        for (let rowKey in row) { 
            let cleanRowKey = rowKey.trim().toUpperCase().replace(/\s+/g, ' ');
            if (cleanRowKey === searchKey) {
                // ĐÃ CHÍCH THUỐC: Bọc String(...) để ép mọi thứ (Số, Boolean) về dạng Chữ
                let rawValue = row[rowKey] !== undefined && row[rowKey] !== null ? row[rowKey] : "";
                let val = String(rawValue).trim();
                
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
// ==========================================
// HÀM MỚI: CHỈ QUÉT LỖI HỒ SƠ TIÊN QUYẾT 
// (Dùng để khóa nút Duyệt)
// ==========================================
function getMissingTienQuyet(row) {
    if (typeof DICT_HO_SO === 'undefined') return [];
    const dtDauVao = getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]);
    const dsTienQuyet = DICT_HO_SO.tien_quyet[dtDauVao] || [];
    let missingTQ = [];
    
    dsTienQuyet.forEach(doc => {
        let val = getVal(row, [doc.name]).toUpperCase();
        if (val !== "TRUE" && val !== "1" && val !== "V" && val !== "X" && val !== "CÓ") {
            missingTQ.push(doc.name);
        }
    });
    return missingTQ;
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
    const nganhSet = new Set(); const doituongSet = new Set();
    rawData.forEach(r => { 
        const ng = getVal(r, ["NGÀNH", "NGÀNH ĐÀO TẠO"]); if(ng) nganhSet.add(ng); 
        const dt = getVal(r, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]); if(dt) doituongSet.add(dt);
    });
    
    const selectNganh = document.getElementById('filter-nganh'); nganhSet.forEach(ng => selectNganh.appendChild(new Option(ng, ng)));
    const selectDoiTuong = document.getElementById('filter-doituong'); 
    if(selectDoiTuong) doituongSet.forEach(dt => selectDoiTuong.appendChild(new Option(dt, dt)));
}

function applyFilters() {
    const fromVal = document.getElementById('filter-from').value;
    const toVal = document.getElementById('filter-to').value;
    const fDate = fromVal ? new Date(fromVal) : null; if(fDate) fDate.setHours(0,0,0,0);
    const tDate = toVal ? new Date(toVal) : null; if(tDate) tDate.setHours(23,59,59,999);
    
    const nVal = document.getElementById('filter-nganh').value;
    const dVal = document.getElementById('filter-doituong') ? document.getElementById('filter-doituong').value : "";
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
        if (dVal && getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]) !== dVal) return false;
        
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

        let cccdStr = getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]).replace(/^['"]+|['"]+$/g, '');

        tr.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;"><b>${getVal(row, ["TIME"]).split(' ')[0]}</b></td>
            <td style="color:#d84315; font-weight:bold;">${generateMaSV(row)}</td>
            <td><b>${cccdStr}</b></td>
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

function exportExcel() {
    if (filteredData.length === 0) { showAlert("Không có dữ liệu!", "LỖI TRỐNG DỮ LIỆU", true); return; }
    if (typeof XLSX === 'undefined') { showAlert("Kết nối thất bại, vui lòng tải lại trang!", "LỖI KẾT NỐI", true); return; }

    let exportData = filteredData.map((row, index) => {
        let cleanLink = getVal(row, ["LINK HỒ SƠ", "Link hồ sơ"]).replace(/^['"]+|['"]+$/g, '');
        let cccdStr = getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]).replace(/^['"]+|['"]+$/g, '');
        let missing = getMissingDocs(row);
        let hsStatus = missing.length > 0 ? "Thiếu hồ sơ: " + missing.join(', ') : "Đủ hồ sơ hợp lệ";
        let rawScoreText = getBestScoreText(row).replace(/<[^>]+>/g, '');

        return {
            "STT": getVal(row, ["STT"]) || (index + 1), 
            "NGÀY NỘP": getVal(row, ["TIME"]).split(' ')[0],
            "MÃ SINH VIÊN": generateMaSV(row), 
            "CĂN CƯỚC": cccdStr,
            "HỌ VÀ TÊN": getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]),
            "NGÀNH ĐÀO TẠO": getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]), 
            "ĐỐI TƯỢNG ĐẦU VÀO": getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]),
            "ĐIỂM/ TỔ HỢP": rawScoreText,
            "HỒ SƠ": hsStatus, 
            "TRẠNG THÁI THẨM ĐỊNH": row._appState || "Đang chờ duyệt",
            "LINK HỒ SƠ": cleanLink
        };
    });

    let nowStr = new Date().toLocaleString('vi-VN');
    exportData.push({
        "STT": `Dữ liệu cập nhật đến ngày ${nowStr}`,
        "NGÀY NỘP": "", "MÃ SINH VIÊN": "", "CĂN CƯỚC": "", "HỌ VÀ TÊN": "", 
        "NGÀNH ĐÀO TẠO": "", "ĐỐI TƯỢNG ĐẦU VÀO": "", "ĐIỂM/ TỔ HỢP": "", 
        "HỒ SƠ": "", "TRẠNG THÁI THẨM ĐỊNH": "", "LINK HỒ SƠ": ""
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    if(!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({ s: {r: exportData.length, c: 0}, e: {r: exportData.length, c: 10} });
    worksheet['!cols'] = [{wch: 6}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 26}, {wch: 26}, {wch: 15}, {wch: 18}, {wch: 20}, {wch: 35}];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, "DanhSachThamDinh");
    XLSX.writeFile(wb, `Danh_Sach_Loc_${new Date().toISOString().slice(0,10)}.xlsx`);
}

async function syncToDaoTao() {
    if (!API_DAO_TAO.includes("script.google.com")) { showAlert("Không tìm thấy địa chỉ của Đào tạo!", "CẢNH BÁO", true); return; }
    let approvedRows = rawData.filter(r => r._appState === "Đã duyệt");
    if(approvedRows.length === 0) { showAlert("Chưa có hồ sơ mới được duyệt!", "KHÔNG CÓ DỮ LIỆU", true); return; }
    
    showConfirm(`Gửi danh sách <b>${approvedRows.length} hồ sơ TRÚNG TUYỂN</b> sang Phòng Đào tạo/CTSV.\nTiếp tục?`, async () => {
        let btn = document.getElementById('btnSyncDaoTao'); let oldText = btn.innerText;
        btn.innerText = "⏳ Processing..."; btn.disabled = true;

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
            if(result.status === "success") showAlert(`Bàn giao thành công! Có ${result.added} hồ sơ MỚI đã được gửi đi.`, "🎉 THÀNH CÔNG", false);
            else showAlert("Lỗi API máy chủ: \n" + result.message, "❌ LỖI", true);
        } catch (e) { showAlert("Lỗi kết nối mạng: " + e, "❌ LỖI", true); }
        btn.innerText = oldText; btn.disabled = false;
    }, "XÁC NHẬN BÀN GIAO");
}

// ==========================================
// WORKSPACE: KHUNG DUYỆT HỒ SƠ CHI TIẾT (ĐÃ PHỤC HỒI Y NHƯ CŨ)
// ==========================================
function openWorkspace(index) {
    currentCandidateIndex = index;
    const row = filteredData[index];
    document.getElementById('ws-other-major').value = ""; 
    
    document.getElementById('btnPrevWS').disabled = (index === 0);
    document.getElementById('btnNextWS').disabled = (index === filteredData.length - 1);
    
    const fullname = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    document.getElementById('ws-fullname-title').innerText = fullname;
    document.getElementById('ws-fullname').innerText = fullname;
    
    document.getElementById('ws-cccd').innerText = getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]).replace(/^['"]+|['"]+$/g, '') || "";
    document.getElementById('ws-masv').innerText = generateMaSV(row);
    
    document.getElementById('ws-hedt').innerText = getVal(row, ["HỆ ĐÀO TẠO", "Hệ đào tạo"]);
    document.getElementById('ws-hinhthuc').innerText = getVal(row, ["HÌNH THỨC ĐÀO TẠO", "Hình thức đào tạo"]);
    document.getElementById('ws-kvdt').innerText = `${getVal(row, ["KHU VỰC ƯU TIÊN"])} / ${getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"])}`;

    calculateAndRenderScores(row, getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]));
    updateModalActionButtons();
    document.getElementById('workspaceModal').style.display = 'flex';
}

function closeWorkspace() { document.getElementById('workspaceModal').style.display = 'none'; }

function openDriveLink() { 
    let link = getVal(filteredData[currentCandidateIndex], ["LINK HỒ SƠ", "Link hồ sơ"]); 
    if(link && link.includes("http")) { window.open(link, '_blank'); } 
    else { showAlert("Hồ sơ này không có đường link đính kèm hợp lệ.", "❌ KHÔNG TÌM THẤY LINK", true); } 
}

function prevWorkspace() { if (currentCandidateIndex > 0) openWorkspace(currentCandidateIndex - 1); }
function nextWorkspace() { if (currentCandidateIndex < filteredData.length - 1) openWorkspace(currentCandidateIndex + 1); }

function calculateAndRenderScores(row, targetNganh) {
    const dtDauVao = getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]);
    document.getElementById('ws-nganh').innerText = targetNganh;
    document.getElementById('ws-nganh').style.color = (targetNganh !== getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"])) ? "#e65100" : "#111";

    let summaryHTML = ""; let comboHTML = "";
    
    if (dtDauVao === "Tốt nghiệp THPT") {
        const diemCong = parseFloat(getVal(row, ["ĐIỂM CỘNG"]).replace(',','.')) || 0;
        const kvVal = getVal(row, ["KHU VỰC ƯU TIÊN"]); const dtVal = getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"]);
        let uTienBanDau = 0;
        if (typeof DICT_KHU_VUC !== 'undefined' && typeof DICT_DOI_TUONG !== 'undefined') {
            uTienBanDau = (DICT_KHU_VUC[kvVal] || 0) + (DICT_DOI_TUONG[dtVal] || 0);
        }
        
        let combos = DICT_NGANH[targetNganh] || [];
        let comboResults = []; let maxScore = 0; let bestCombo = ""; let finalTotalScore = 0; let finalUTien = 0;

        combos.forEach(maToHop => {
            let subjects = DICT_TO_HOP[maToHop];
            if(subjects) {
                let s1 = parseFloat(getVal(row, [SUBJ_MAP[subjects[0]]]).replace(',','.')) || 0;
                let s2 = parseFloat(getVal(row, [SUBJ_MAP[subjects[1]]]).replace(',','.')) || 0;
                let s3 = parseFloat(getVal(row, [SUBJ_MAP[subjects[2]]]).replace(',','.')) || 0;
                let total = s1 + s2 + s3;
                comboResults.push({ combo: maToHop, s1, s2, s3, total });
                if (s1 > 0 && s2 > 0 && s3 > 0 && total > maxScore) { maxScore = total; bestCombo = maToHop; }
            }
        });

        if (maxScore > 0) {
            finalUTien = maxScore >= 22.5 ? ((30 - maxScore) / 7.5) * uTienBanDau : uTienBanDau;
            finalTotalScore = (maxScore + finalUTien + diemCong).toFixed(2);
            let status = finalTotalScore >= 15.0 ? "<span style='color:#2e7d32;font-weight:bold'>ĐẠT</span>" : "<span style='color:#c62828;font-weight:bold'>TRƯỢT</span>";
            
            summaryHTML = `
                <div class="info-card"><span class="info-label">Điểm cộng/ Điểm ưu tiên</span><span class="info-val">${diemCong}đ / ${finalUTien.toFixed(2)}đ</span></div>
                <div class="info-card" style="background:#e8f5e9; border-color:#81c784;"><span class="info-label" style="color:#2e7d32">ĐIỂM TRÚNG TUYỂN / TỔ HỢP</span><span class="info-val" style="font-size:15px; color:#2e7d32;">${finalTotalScore} <span style="font-size:12px;color:#555">(${bestCombo})</span></span></div>
                <div class="info-card"><span class="info-label">Điểm Chuẩn (15 Đ)</span><span class="info-val">${status}</span></div>
            `;
        } else { 
            summaryHTML = `<div class="info-card" style="grid-column: span 3;"><i>Chưa đủ dữ liệu điểm để xét tổ hợp môn.</i></div>`; 
        }

        if (comboResults.length > 0) {
            comboHTML = `<div style="display:flex; justify-content:center; width:100%;"><table class="combo-table" style="width: max-content !important; min-width: unset; margin: 0 auto;"><thead><tr><th>Tổ hợp</th><th>Môn 1</th><th>Môn 2</th><th>Môn 3</th><th>Tổng điểm</th></tr></thead><tbody>`;
            comboResults.forEach(c => {
                let isBest = (c.combo === bestCombo);
                comboHTML += `<tr class="${isBest ? 'best-combo' : ''}">
                    <td>${c.combo} ${isBest ? '⭐' : ''}</td><td>${c.s1}</td><td>${c.s2}</td><td>${c.s3}</td>
                    <td style="${isBest ? 'color:#d84315; font-weight:bold;' : ''}">${c.total.toFixed(2)}</td></tr>`;
            });
            comboHTML += `</tbody></table></div>`;
        }

    } else {
        // ÁP DỤNG LOGIC MỚI CHO CÁC ĐỐI TƯỢNG KHÁC THPT
        const diemCong = parseFloat(getVal(row, ["ĐIỂM CỘNG"]).replace(',','.')) || 0;
        const kvVal = getVal(row, ["KHU VỰC ƯU TIÊN"]); const dtVal = getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"]);
        let uTienBanDau = 0;
        if (typeof DICT_KHU_VUC !== 'undefined' && typeof DICT_DOI_TUONG !== 'undefined') {
            uTienBanDau = (DICT_KHU_VUC[kvVal] || 0) + (DICT_DOI_TUONG[dtVal] || 0);
        }

        let h4 = getVal(row, ["ĐIỂM TB TOÀN KHÓA HỆ 4"]); let h10 = getVal(row, ["ĐIỂM TB TOÀN KHÓA HỆ 10"]);
        let diemChuanText = "-";
        
        let dtbLabel = "ĐTB Hệ 4 / Hệ 10";
        let dtbVal = "Chưa nhập điểm";
        
        if (h4 && !h10) { 
            dtbLabel = "ĐTB Hệ 4"; dtbVal = h4; diemChuanText = "02";
        } else if (h10 && !h4) { 
            dtbLabel = "ĐTB Hệ 10"; dtbVal = h10; diemChuanText = "05";
        } else if (h4 && h10) {
            dtbLabel = "ĐTB Hệ 4 / Hệ 10"; dtbVal = `${h4} / ${h10}`; diemChuanText = "Hệ 4: 02 | Hệ 10: 05";
        }

        summaryHTML = `
            <div class="info-card"><span class="info-label">Điểm cộng/ Điểm ưu tiên</span><span class="info-val">${diemCong}đ / ${uTienBanDau.toFixed(2)}đ</span></div>
            <div class="info-card"><span class="info-label">${dtbLabel}</span><span class="info-val highlight">${dtbVal}</span></div>
            <div class="info-card" style="background:#e8f5e9; border-color:#81c784;"><span class="info-label" style="color:#2e7d32">Điểm Chuẩn</span><span class="info-val" style="font-size:15px; color:#2e7d32;">${diemChuanText}</span></div>
        `;
    }
    document.getElementById('ws-score-summary').innerHTML = summaryHTML;
    document.getElementById('ws-combo-list-container').innerHTML = comboHTML;

    let missing = getMissingDocs(row);
    let htmlStatus = missing.length > 0 ? `<span style="color:#d84315;">⚠️ Thiếu: ${missing.join(', ')}</span>` : `<span style="color:#2e7d32;">✅ Đã nộp đủ hồ sơ hợp lệ</span>`;
    document.getElementById('ws-hoso-status').innerHTML = htmlStatus;
}

function handleCrossCheckChange() {
    const val = document.getElementById('ws-other-major').value;
    const row = filteredData[currentCandidateIndex];
    const targetNganh = val === "" ? getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]) : val;
    calculateAndRenderScores(row, targetNganh);
    updateModalActionButtons();
}

function updateModalActionButtons() {
    const row = filteredData[currentCandidateIndex];
    const isSurveying = document.getElementById('ws-other-major').value !== "";
    const btnA = document.getElementById('btnApprove'); 
    const btnM = document.getElementById('btnMissing'); 
    const btnS = document.getElementById('btnSaveToResult');

    if (isSurveying) {
        btnA.disabled = true; btnM.disabled = true; btnS.disabled = true; btnS.innerText = "🔒 Tắt Khảo sát để Thao tác"; return;
    }

    let isDuyet = (row._appState === "Đã duyệt");
    let isBaoThieu = (row._appState === "Đã báo thiếu");
    
    // GỌI MÁY QUÉT TIÊN QUYẾT ĐỂ XÉT ĐIỀU KIỆN KHÓA NÚT DUYỆT
    let missingTQ = getMissingTienQuyet(row);

    btnA.disabled = isDuyet || isBaoThieu || missingTQ.length > 0; 
    btnM.disabled = isDuyet || isBaoThieu; 

    // ĐỔI CHỮ THÔNG MINH TRÊN NÚT DUYỆT TRÚNG TUYỂN
    if (isDuyet) {
        btnA.innerText = "✅ Hồ sơ đã duyệt";
    } else if (missingTQ.length > 0) {
        btnA.innerText = "❌ Thiếu HS Tiên Quyết"; // Khóa nút & Cảnh báo ngầm
    } else {
        btnA.innerText = "✅ DUYỆT TRÚNG TUYỂN";
    }

    btnM.innerText = isBaoThieu ? "⚠️ Đã yêu cầu bổ sung HS" : "⚠️ Y/C BỔ SUNG HS";

    if (row._saved) { btnS.disabled = true; btnS.innerText = "💾 Đã lưu hồ sơ vào CSDL"; } 
    else { btnS.disabled = false; btnS.innerText = "💾 LƯU VÀO CSDL"; }
}

async function triggerApprove() {
    let row = filteredData[currentCandidateIndex];
    let missingTQ = getMissingTienQuyet(row);
    
    // LÁ CHẮN THÉP: CHỈ CHẶN KHI THIẾU HỒ SƠ TIÊN QUYẾT
    if (missingTQ.length > 0) { 
        showAlert(`Không được duyệt!\nThí sinh đang nợ HỒ SƠ TIÊN QUYẾT: ${missingTQ.join(', ')}`, "⚠️ LỖI DUYỆT HỒ SƠ", true); 
        return; 
    }
    
    let hoTen = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    showConfirm(`<b>DUYỆT TRÚNG TUYỂN</b> cho thí sinh: <span style="color:#d84315;">${hoTen}</span>?.`, async () => {
        let btnA = document.getElementById('btnApprove'); 
        let btnM = document.getElementById('btnMissing'); 
        let btnS = document.getElementById('btnSaveToResult');
        
        // 🔒 KHÓA TOÀN BỘ 3 NÚT TRONG LÚC XỬ LÝ
        btnA.innerText = "⏳ Đang xuất Biên nhận..."; 
        btnA.disabled = true; btnM.disabled = true; btnS.disabled = true;
        
        const payload = [{ 
            soCCCD: getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]).replace(/^['"]+|['"]+$/g, ''), 
            hoTen: hoTen, 
            nganh: getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]), 
            ngaySinh: getVal(row, ["NGÀNH SINH", "NGÀY SINH"]), 
            ngayCapNhat: new Date().toLocaleDateString('vi-VN') 
        }];

        try {
            const resp = await fetch(API_TRUNG_TUYEN, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
            const result = await resp.json();
            if(result.status === "success") { 
                showAlert(`Duyệt Trúng tuyển thành công!`, "🎉 THÀNH CÔNG", false); 
                row._appState = "Đã duyệt"; renderTable(); updateModalActionButtons(); window.open(result.pdfUrl, '_blank'); 
            } else { 
                showAlert("Lỗi hệ thống: " + result.message, "❌ LỖI", true); 
                updateModalActionButtons(); // 🔓 Mở khóa và khôi phục trạng thái nếu lỗi
            }
        } catch (e) { 
            showAlert("Lỗi mạng: " + e, "❌ LỖI", true); 
            updateModalActionButtons(); // 🔓 Mở khóa và khôi phục trạng thái nếu rớt mạng
        }
    }, "XÁC NHẬN TRÚNG TUYỂN");
}

async function triggerMissing() {
    let row = filteredData[currentCandidateIndex]; let hoTen = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    let missingArray = getMissingDocs(row); let defaultMissingText = missingArray.length > 0 ? missingArray.join(', ') : "Bản sao Học bạ THPT";

    showPrompt(`Thí sinh [${hoTen}] chưa nộp đủ hồ sơ. Kiểm tra lại thư mục hồ sơ và nhập tên hồ sơ yêu cầu bổ sung:`, defaultMissingText, async (hosoThieu) => {
        let btnA = document.getElementById('btnApprove'); 
        let btnM = document.getElementById('btnMissing'); 
        let btnS = document.getElementById('btnSaveToResult');
        
        // 🔒 KHÓA TOÀN BỘ 3 NÚT TRONG LÚC XỬ LÝ
        btnM.innerText = "⏳ Đang xử lý..."; 
        btnM.disabled = true; btnA.disabled = true; btnS.disabled = true;
        
        const payload = [{ 
            soCCCD: getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]).replace(/^['"]+|['"]+$/g, ''), 
            hoTen: hoTen, 
            nganh: getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]),
            hosoThieu: "Thiếu: " + hosoThieu, 
            ngayCapNhat: new Date().toLocaleDateString('vi-VN') 
        }];

        try {
            const resp = await fetch(API_BAO_THIEU, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
            const result = await resp.json();
            if(result.status === "success") { 
                showAlert(`Đã gửi yêu cầu bổ sung [${hosoThieu}] cho thí sinh ${hoTen}.`, "✅ THÀNH CÔNG", false); 
                row._appState = "Đã báo thiếu"; renderTable(); updateModalActionButtons(); 
            } else { 
                showAlert("Lỗi: " + result.message, "❌ LỖI", true); 
                updateModalActionButtons(); // 🔓
            }
        } catch (e) { 
            showAlert("Lỗi: " + e, "❌ LỖI", true); 
            updateModalActionButtons(); // 🔓
        }
    }, "YÊU CẦU BỔ SUNG HỒ SƠ");
}

async function triggerSaveToSheet() {
    let row = filteredData[currentCandidateIndex];
    let hoTen = getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]);
    
    showConfirm(`Lưu hồ sơ <b>${hoTen}</b> vào CSDL.\n\nTiếp tục?`, async () => {
        let btnA = document.getElementById('btnApprove'); 
        let btnM = document.getElementById('btnMissing'); 
        let btnS = document.getElementById('btnSaveToResult');
        
        // 🔒 KHÓA TOÀN BỘ 3 NÚT TRONG LÚC XỬ LÝ
        btnS.innerText = "⏳ Đang lưu..."; 
        btnS.disabled = true; btnA.disabled = true; btnM.disabled = true;

        let payloadData = { ...row };
        payloadData["MÃ SINH VIÊN"] = generateMaSV(row); 
        payloadData["ĐIỂM TRÚNG TUYỂN"] = getRawScoreNumber(row);
        payloadData["KẾT QUẢ ĐIỂM"] = "Trúng tuyển";
        payloadData["NGÀY CẬP NHẬT HỒ SƠ"] = new Date().toLocaleString('vi-VN');

        try {
            const resp = await fetch(API_LUU_KETQUA, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify([payloadData]) });
            const result = await resp.json();
            if(result.status === "success") {
                if (result.skipped > 0) { 
                    showAlert(`Hồ sơ này đã tồn tại từ trước trong CSDL!`, "⚠️ ĐÃ TỒN TẠI", true);
                } else {
                    showAlert(`Lưu thành công vào CSDL!`, "✅ LƯU THÀNH CÔNG", false);
                }
                row._saved = true; updateModalActionButtons();
            }
            else { 
                showAlert("Lỗi: " + result.message, "❌ LỖI", true); 
                updateModalActionButtons(); // 🔓
            }
        } catch (e) { 
            showAlert("Lỗi kết nối mạng: " + e, "❌ LỖI", true); 
            updateModalActionButtons(); // 🔓
        }
    }, "LƯU VÀO CSDL");
}

// KHÓA SỰ KIỆN NÚT ESC
window.addEventListener('keydown', function(event) {
    if (event.key === "Escape") { 
        const customModal = document.getElementById('customModal');
        if (customModal && customModal.style.display === 'flex') { closeCustomModal(); return; }
        
        const wsModal = document.getElementById('workspaceModal'); 
        if (wsModal && wsModal.style.display === 'flex') closeWorkspace(); 
    }
});

// ==========================================
// CỤM TÍNH NĂNG AI: ĐỌC BẢNG ĐIỂM, ĐỐI SÁNH CTĐT & XUẤT TEMPLATE EXCEL
// ==========================================
let currentTranscriptJSON = []; 
let currentTranscriptHTML = ""; 
let currentCompareResultJSON = null; 
let currentScanFileName = ""; 

async function processTranscriptImage(input) {
    const file = input.files[0];
    if (!file) return;

    currentScanFileName = file.name;
    const statusText = document.getElementById('transcript-scan-status');
    const btnReopen = document.getElementById('btnReopenTranscript');
    
    statusText.innerText = `⏳ Đang trích xuất dữ liệu: ${currentScanFileName}...`;
    statusText.style.color = "#f57c00";
    if(btnReopen) btnReopen.style.display = "none"; 

    const sendToBackend = async (base64String, mimeType) => {
        const payload = { imageBase64: base64String, mimeType: mimeType, type: "bangdiem" };

        try {
            const response = await fetch(API_QUET_CCCD, {
                method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let textResult = data.candidates[0].content.parts[0].text;
                textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
                
                try {
                    currentTranscriptJSON = JSON.parse(textResult); 
                    let tableHtml = `
                    <div style="display:flex; justify-content:center; width:100%; overflow-x: auto; padding: 10px 0;">
                        <table style="width: max-content !important; min-width: 80%; margin: 0 auto; border-collapse: collapse; background: #fff; box-shadow: 0 0 5px rgba(0,0,0,0.05); font-size: 13px; text-align: center;">
                            <thead style="background: #004d40; color: white; position: sticky; top: 0; z-index: 10;">
                                <tr>
                                    <th style="padding: 8px 15px; border: 1px solid #e0e0e0; white-space: nowrap;">STT</th>
                                    <th style="padding: 8px 15px; border: 1px solid #e0e0e0; text-align: left; white-space: nowrap;">Tên môn học</th>
                                    <th style="padding: 8px 15px; border: 1px solid #e0e0e0; white-space: nowrap;">TC</th>
                                    <th style="padding: 8px 15px; border: 1px solid #e0e0e0; white-space: nowrap;">Đ.Chữ</th>
                                    <th style="padding: 8px 15px; border: 1px solid #e0e0e0; white-space: nowrap;">Hệ 4</th>
                                    <th style="padding: 8px 15px; border: 1px solid #e0e0e0; white-space: nowrap;">Hệ 10</th>
                                </tr>
                            </thead>
                            <tbody>`;
                    
                    currentTranscriptJSON.forEach((item, idx) => {
                        tableHtml += `
                            <tr onmouseover="this.style.background='#f1f8e9'" onmouseout="this.style.background='none'">
                                <td style="padding: 6px 15px; border: 1px solid #e0e0e0;">${idx + 1}</td>
                                <td style="padding: 6px 15px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold;">${item.monhoc || ''}</td>
                                <td style="padding: 6px 15px; border: 1px solid #e0e0e0; color: #d84315; font-weight: bold;">${item.tinchi || ''}</td>
                                <td style="padding: 6px 15px; border: 1px solid #e0e0e0;">${item.diem_chu || ''}</td>
                                <td style="padding: 6px 15px; border: 1px solid #e0e0e0;">${item.diem_he4 || ''}</td>
                                <td style="padding: 6px 15px; border: 1px solid #e0e0e0; color: #2e7d32; font-weight: bold;">${item.diem_he10 || ''}</td>
                            </tr>`;
                    });
                    tableHtml += `</tbody></table></div>`;

                    currentTranscriptHTML = tableHtml; 
                    showTranscriptTable(); 

                    statusText.innerText = `✅ Đã xong! Vui lòng xem bảng.`;
                    statusText.style.color = "#2e7d32";
                    if(btnReopen) btnReopen.style.display = "inline-block"; 
                    
                } catch (e) {
                    statusText.innerText = "❌ Không tìm thấy dữ liệu điểm rõ ràng."; statusText.style.color = "#d32f2f";
                }
            } else {
                statusText.innerText = "❌ Lỗi trích xuất dữ liệu."; statusText.style.color = "#d32f2f";
            }
        } catch (error) { statusText.innerText = "❌ Lỗi máy chủ."; statusText.style.color = "#d32f2f"; }
        input.value = ""; 
    };

    if (file.type === 'application/pdf') {
        const reader = new FileReader(); reader.onloadend = () => { sendToBackend(reader.result.split(',')[1], 'application/pdf'); }; reader.readAsDataURL(file);
    } else {
        const img = new Image(); img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 1200; 
            let w = img.width; let h = img.height;
            if (w > MAX_WIDTH) { h = Math.round((h * MAX_WIDTH) / w); w = MAX_WIDTH; }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            sendToBackend(canvas.toDataURL('image/jpeg', 0.8).split(',')[1], 'image/jpeg');
        };
    }
}

function showTranscriptTable() {
    document.getElementById('largeModalTitle').innerHTML = `<span>📑</span> Kết quả quét: ${currentScanFileName}`;
    document.getElementById('largeModalContent').innerHTML = currentTranscriptHTML;
    document.getElementById('largeModalFooter').innerHTML = `
        <button class="btn-modal-cancel" style="background-color: #6c757d; color: white;" onclick="document.getElementById('largeTableModal').style.display='none'">Đóng lại</button>
        <button class="btn-modal-ok" style="background-color: #1976d2;" onclick="executeCompare()">⚖️ Phân tích & Đối sánh CTĐT</button>
    `;
    document.getElementById('largeTableModal').style.display = 'flex';
}

async function executeCompare() {
    // Tự động bám theo Ngành đang khảo sát trên Web 2
    const nganhChon = document.getElementById('ws-other-major').value || document.getElementById('ws-nganh').innerText;
    if (!nganhChon) { alert("⚠️ Chưa có dữ liệu ngành đào tạo!"); return; }

    const contentDiv = document.getElementById('largeModalContent');
    contentDiv.innerHTML = `<h3 style="text-align:center; color:#f57c00;">⏳ ĐANG ĐỐI SÁNH TÍN CHỈ VỚI NGÀNH [${nganhChon.toUpperCase()}]...</h3><p style="text-align:center; font-style:italic;">Không đóng hoặc refresh trang web...</p>`;
    
    document.getElementById('largeModalFooter').innerHTML = `<button class="btn-modal-cancel" style="background-color: #6c757d; color: white; opacity:0.5;" disabled>Đang xử lý...</button>`;

    const payload = { type: "doisanh", nganh: nganhChon, transcript: currentTranscriptJSON };

    try {
        const response = await fetch(API_QUET_CCCD, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let resultText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
            currentCompareResultJSON = JSON.parse(resultText);

            let html = `
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 5px;">✅ CÁC MÔN CÓ THỂ XÉT TƯƠNG ĐƯƠNG</h3>
                    <div style="display:flex; justify-content:center; width:100%; overflow-x: auto; padding: 10px 0;">
                        <table style="width: max-content !important; min-width: 90%; margin: 0 auto; border-collapse: collapse; font-size: 13px; text-align: center; box-shadow: 0 0 5px rgba(0,0,0,0.05);">
                            <thead style="background: #e8f5e9; color: #1b5e20;">
                                <tr>
                                    <th style="padding: 8px 15px; border: 1px solid #c8e6c9;">Nhóm môn</th>
                                    <th style="padding: 8px 15px; border: 1px solid #c8e6c9; text-align:left;">Môn CTĐT chuẩn</th>
                                    <th style="padding: 8px 15px; border: 1px solid #c8e6c9;">TC chuẩn</th>
                                    <th style="padding: 8px 15px; border: 1px solid #c8e6c9; text-align:left;">Môn SV đã học</th>
                                    <th style="padding: 8px 15px; border: 1px solid #c8e6c9;">TC đã học</th>
                                    <th style="padding: 8px 15px; border: 1px solid #c8e6c9;">Kết luận AI</th>
                                </tr>
                            </thead>
                            <tbody>`;
            currentCompareResultJSON.matched.forEach(m => {
                let color = m.ket_luan.includes("Đạt") ? "#2e7d32" : "#d84315";
                html += `<tr onmouseover="this.style.background='#f9fbe7'" onmouseout="this.style.background='none'">
                    <td style="padding: 6px 15px; border: 1px solid #c8e6c9; text-align:left;">${m.nhom_mon}</td>
                    <td style="padding: 6px 15px; border: 1px solid #c8e6c9; text-align:left;"><b>${m.mon_chuan}</b></td>
                    <td style="padding: 6px 15px; border: 1px solid #c8e6c9;">${m.tin_chi_chuan}</td>
                    <td style="padding: 6px 15px; border: 1px solid #c8e6c9; text-align:left; color:#1565c0;">${m.mon_da_hoc}</td>
                    <td style="padding: 6px 15px; border: 1px solid #c8e6c9;">${m.tin_chi_da_hoc}</td>
                    <td style="padding: 6px 15px; border: 1px solid #c8e6c9; font-weight:bold; color:${color};">${m.ket_luan}</td>
                </tr>`;
            });
            html += `</tbody></table></div></div>`;

            html += `
                <div>
                    <h3 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 5px;">⚠️ CÁC MÔN SINH VIÊN CHƯA HỌC (CHƯA ĐỐI SÁNH ĐƯỢC)</h3>
                    <div style="display:flex; justify-content:center; width:100%; overflow-x: auto; padding: 10px 0;">
                        <table style="width: max-content !important; min-width: 90%; margin: 0 auto; border-collapse: collapse; font-size: 13px; text-align: center; box-shadow: 0 0 5px rgba(0,0,0,0.05);">
                            <thead style="background: #ffebee; color: #b71c1c;">
                                <tr>
                                    <th style="padding: 8px 15px; border: 1px solid #ffcdd2;">Nhóm môn</th>
                                    <th style="padding: 8px 15px; border: 1px solid #ffcdd2; text-align:left;">Tên môn học chuẩn</th>
                                    <th style="padding: 8px 15px; border: 1px solid #ffcdd2;">TC yêu cầu</th>
                                </tr>
                            </thead>
                            <tbody>`;
            currentCompareResultJSON.unmatched.forEach(u => {
                html += `<tr onmouseover="this.style.background='#fff3e0'" onmouseout="this.style.background='none'">
                    <td style="padding: 6px 15px; border: 1px solid #ffcdd2; text-align:left;">${u.nhom_mon}</td>
                    <td style="padding: 6px 15px; border: 1px solid #ffcdd2; text-align:left; font-weight:bold;">${u.mon_chuan}</td>
                    <td style="padding: 6px 15px; border: 1px solid #ffcdd2; font-weight:bold; color:#d32f2f;">${u.tin_chi_chuan}</td>
                </tr>`;
            });
            html += `</tbody></table></div></div>`;

            contentDiv.innerHTML = html;
        } else { contentDiv.innerHTML = `<p style="color:red; text-align:center;">❌ Định dạng lỗi hoặc không tìm thấy dữ liệu.</p>`; }
    } catch (e) {
        contentDiv.innerHTML = `<p style="color:red; text-align:center;">❌ Lỗi kết nối.</p>`;
    }
    
    document.getElementById('largeModalFooter').innerHTML = `
        <button class="btn-modal-cancel" style="background-color: #6c757d; color: white;" onclick="showTranscriptTable()">⬅️ Quay lại bảng điểm</button>
        <button class="btn-modal-cancel" style="background-color: #d32f2f; color: white;" onclick="document.getElementById('largeTableModal').style.display='none'">Đóng lại</button>
    `;
}

// -------------------------------------------------------------
// SIÊU TÍNH NĂNG: GOM DATA & GỬI LỆNH XUẤT TEMPLATE EXCEL
// -------------------------------------------------------------
async function exportToTemplate() {
    if (currentCandidateIndex === -1) { showAlert("Vui lòng mở hồ sơ trước!", "❌ LỖI", true); return; }
    
    const row = filteredData[currentCandidateIndex];
    let scoreText = getBestScoreText(row).replace(/<[^>]+>/g, ''); 
    let dxt = "-", thxt = "-";
    let match = scoreText.match(/([\d\.]+)\s*\((.*?)\)/); // Tách riêng Điểm và Tổ hợp
    if(match) { dxt = match[1]; thxt = match[2]; } else { dxt = scoreText; }

    const mappingData = {
        "HO_TEN": getVal(row, ["TÊN SINH VIÊN", "HỌ VÀ TÊN"]),
        "CCCD": getVal(row, ["CĂN CƯỚC", "CCCD", "SỐ CCCD"]).replace(/^['"]+|['"]+$/g, ''),
        "NGAY_SINH": getVal(row, ["NGÀY SINH", "NGÀNH SINH"]),
        "NGANH_DANG_KY": getVal(row, ["NGÀNH", "NGÀNH ĐÀO TẠO"]),
        "KHOA": getVal(row, ["KHÓA"]),
        "HE_DAO_TAO": getVal(row, ["HỆ ĐÀO TẠO", "Hệ đào tạo"]),
        "HINH_THUC_DAO_TAO": getVal(row, ["HÌNH THỨC ĐÀO TẠO", "Hình thức đào tạo"]),
        "NAM_XET_TUYEN": getVal(row, ["NĂM XÉT TUYỂN"]),
        "DOI_TUONG_DAU_VAO": getVal(row, ["ĐỐI TƯỢNG ĐẦU VÀO", "ĐỐI TƯỢNG"]),
        "LINK_HO_SO": getVal(row, ["LINK HỒ SƠ", "Link hồ sơ"]),
        "KHU_VUC_UU_TIEN": getVal(row, ["KHU VỰC ƯU TIÊN"]),
        "DOI_TUONG_UU_TIEN": getVal(row, ["ĐỐI TƯỢ ƯU TIÊN", "ĐỐI TƯỢNG ƯU TIÊN"]),
        "GIAY_UU_TIEN": getVal(row, ["GIẤY TỜ ƯU TIÊN", "Giấy tờ ưu tiên"]),
        "DIEM_CONG": getVal(row, ["ĐIỂM CỘNG"]),
        "TO_HOP_XET_TUYEN": thxt,
        "DIEM_XET_TUYEN": dxt, 
        "TRANG_THAI_HO_SO": getMissingDocs(row).length > 0 ? "Thiếu hồ sơ" : "Đủ hồ sơ",
        "KET_QUA_SO_TUYEN": row._appState
    };

    const btn = document.getElementById('btnExportTemplate');
    const oldText = btn.innerText;
    btn.innerText = "⏳ Đang tạo Excel..."; btn.disabled = true; btn.style.opacity = "0.7";

    const payload = {
        type: "exportTemplate",
        mappingData: mappingData,
        compareMatched: currentCompareResultJSON ? currentCompareResultJSON.matched : [],
        compareUnmatched: currentCompareResultJSON ? currentCompareResultJSON.unmatched : []
    };

    try {
        const response = await fetch(API_QUET_CCCD, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const result = await response.json();
        
        if(result.status === "success") {
            const link = document.createElement('a');
            link.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + result.base64;
            link.download = `PhieuThamDinh_${mappingData.HO_TEN}_${mappingData.CCCD}.xlsx`;
            link.click();
            showAlert("Tải thành công", "✅ SUCCESSFUL !", false);
        } else { showAlert("Lỗi tạo file: " + result.message, "❌ LỖI", true); }
    } catch(e) { showAlert("Lỗi kết nối khi xuất Excel: " + e, "❌ LỖI MẠNG", true); }
    
    btn.innerText = oldText; btn.disabled = false; btn.style.opacity = "1";
}
