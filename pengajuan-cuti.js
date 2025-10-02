function initPengajuanCuti() {
  const SCRIPT_BASE =
    "https://script.google.com/macros/s/AKfycbzt6xv3yHqeRiTrNcmghTwAq5cgpJ873CF3S4t4XC5qQTa60fcUFILFIdOk9KFaO0o2/exec";
  const cacheKey = "pengajuanCutiCache";

  const tabel = document.querySelector("#tabelPengajuan");
  if (!tabel) {
    console.warn("initPengajuanCuti: #tabelPengajuan tidak ditemukan");
    return;
  }
  const tbody = tabel.querySelector("tbody");
  const loadingOverlay = document.getElementById("loadingOverlay");

  function showLoading() {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
  }
  function hideLoading() {
    if (loadingOverlay) loadingOverlay.style.display = "none";
  }

  // Format tanggal dd/mm/yyyy
  function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function renderRow(row, i) {
    let statusBadge = `<span class="badge bg-secondary">Menunggu</span>`;
    if (row["Status"] === "Disetujui")
      statusBadge = `<span class="badge bg-success">Disetujui</span>`;
    if (row["Status"] === "Ditolak")
      statusBadge = `<span class="badge bg-danger">Ditolak</span>`;
    if (row["Status"] === "Menunggu Persetujuan")
      statusBadge = `<span class="badge bg-warning text-dark">Menunggu Persetujuan</span>`;

    let actionBtn = "";
    if (row["Status"] === "Menunggu Persetujuan") {
      actionBtn = `
        <button class="btn btn-success btn-sm me-1" onclick="updateStatus('${row["No"]}','Disetujui')"><i class="fa fa-check"></i></button>
        <button class="btn btn-danger btn-sm" onclick="showModalTolak('${row["No"]}')"><i class="fa fa-times"></i></button>
      `;
    }
    if (row["Status"] === "Ditolak" && row["Alasan"]) {
      actionBtn = `<button class="btn btn-info btn-sm" onclick="lihatAlasan('${row["Keterangan Status"]}')"><i class="fa fa-eye"></i> Alasan</button>`;
    }

    return `
      <tr id="row-${row["No"]}">
        <td>${i + 1}</td>
        <td>${row["Nama Pegawai"]}</td>
        <td>${row["Jenis Cuti"]}</td>
        <td>${formatDate(row["Tanggal Mulai"])} s/d ${formatDate(
      row["Tanggal Selesai"]
    )}</td>
        <td>${row["Lama Cuti"]} Hari</td>
        <td>${statusBadge}</td>
        <td>${row["Keterangan"] || "-"}</td>
        <td>${
          row["File Pendukung"]
            ? `<a href="${row["File Pendukung"]}" target="_blank"><i class="fa fa-file-pdf text-danger"></i></a>`
            : "-"
        }</td>
        <td>${formatDate(row["Tanggal Pengajuan"])}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }

  function renderCuti(data) {
    tbody.innerHTML = "";

    // Hanya tampilkan "Menunggu Persetujuan"
    const filtered = data.filter(
      (row) => row["Status"] === "Menunggu Persetujuan"
    );
    filtered.sort(
      (a, b) =>
        new Date(b["Tanggal Pengajuan"]) - new Date(a["Tanggal Pengajuan"])
    );

    filtered.forEach((row, i) => {
      tbody.innerHTML += renderRow(row, i);
    });

    // === perbaikan di sini ===
    // jangan hancurkan DataTable dulu sebelum isi ulang
    if ($.fn.DataTable.isDataTable("#tabelPengajuan")) {
      const dt = $("#tabelPengajuan").DataTable();
      dt.clear().destroy();
    }

    // baru inisialisasi ulang
    $("#tabelPengajuan").DataTable({
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50],
      responsive: true,
      order: [],
    });

    // === update badge menu ===
    const pengajuanMenunggu = filtered.length;

    function setBadge(el) {
      if (!el) return;
      const oldBadge = el.querySelector(".badge-baru");
      if (oldBadge) oldBadge.remove();
      if (pengajuanMenunggu > 0) {
        const span = document.createElement("span");
        span.className = "badge bg-danger badge-baru ms-auto";
        span.textContent = pengajuanMenunggu;
        el.appendChild(span);
      }
    }
    setBadge(document.getElementById("menuPengajuan"));
    setBadge(document.getElementById("menuPengajuanMobile"));

    hideLoading();
  }

  // === fix di bagian cache agar tidak flicker ===
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    try {
      const parsed = JSON.parse(cache);
      renderCuti(parsed.data);
      // tampilkan loading dulu biar data cache tidak "hilang muncul"
      showLoading();
      fetchJsonp(false);
    } catch {
      fetchJsonp(true);
    }
  } else {
    fetchJsonp(true);
  }

  function fetchJsonp(showLoadingFlag = false) {
    if (showLoadingFlag) showLoading();

    const cbName = "handlePengajuanCuti_" + Date.now();
    window[cbName] = function (data) {
      const finalData = Array.isArray(data) ? data : data.data || [];
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: finalData, timestamp: Date.now() })
      );
      renderCuti(finalData);
      delete window[cbName];
    };

    const s = document.createElement("script");
    s.src = SCRIPT_BASE + "?callback=" + cbName + "&_t=" + Date.now();
    s.async = true;
    s.onload = () => s.remove();
    s.onerror = () => {
      console.error("Gagal load JSONP");
      hideLoading();
      s.remove();
    };
    document.body.appendChild(s);
  }
}

// === fungsi tambahan tetap dipakai ===
function updateStatus(no, status, alasan = "") {
  Swal.fire({
    title: "Memproses...",
    text: "Mohon tunggu sebentar",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
    showConfirmButton: false,
  });

  $.post(
    "https://script.google.com/macros/s/AKfycbzt6xv3yHqeRiTrNcmghTwAq5cgpJ873CF3S4t4XC5qQTa60fcUFILFIdOk9KFaO0o2/exec",
    { action: "updateStatus", no, status, alasan }
  )
    .done(() => {
      Swal.fire("Berhasil", "Status cuti diperbarui", "success");
      // reload tabel
      initPengajuanCuti();
    })
    .fail(() => {
      Swal.fire("Error", "Gagal memperbarui status", "error");
    });
}

function showModalTolak(no) {
  $("#tolakNo").val(no);
  $("#alasanTolak").val("");
  new bootstrap.Modal(document.getElementById("modalTolak")).show();
}

function submitTolak() {
  const no = $("#tolakNo").val();
  const alasan = $("#alasanTolak").val().trim();
  if (!alasan) {
    Swal.fire("Peringatan", "Alasan penolakan harus diisi!", "warning");
    return;
  }
  updateStatus(no, "Ditolak", alasan);
  bootstrap.Modal.getInstance(document.getElementById("modalTolak")).hide();
}

function lihatAlasan(alasan) {
  Swal.fire("Alasan Penolakan", alasan, "info");
}

// langsung jalan
initPengajuanCuti();
