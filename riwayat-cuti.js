function initStatusCutiAll() {
  const SCRIPT_BASE =
    "https://script.google.com/macros/s/AKfycbzt6xv3yHqeRiTrNcmghTwAq5cgpJ873CF3S4t4XC5qQTa60fcUFILFIdOk9KFaO0o2/exec";
  const cacheKey = "cutiDataCacheAll";

  const tabel = document.querySelector("#tabelCuti");
  if (!tabel) {
    console.warn("initStatusCutiAll: #tabelCuti tidak ditemukan");
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

  function renderCuti(data) {
    // tbody.innerHTML = "";

    const rows = Array.isArray(data) ? data : [];

    // urutkan berdasarkan tanggal pengajuan terbaru
    rows.sort((a, b) => {
      const ta = a["Tanggal Pengajuan"]
        ? new Date(a["Tanggal Pengajuan"]).getTime()
        : 0;
      const tb = b["Tanggal Pengajuan"]
        ? new Date(b["Tanggal Pengajuan"]).getTime()
        : 0;
      return tb - ta;
    });

    rows.forEach((c, i) => {
      let statusClass = "badge bg-secondary";
      if (c.Status?.includes("Menunggu Persetujuan"))
        statusClass = "badge bg-warning text-dark";
      else if (c.Status?.includes("Disetujui"))
        statusClass = "badge bg-success";
      else if (c.Status?.includes("Ditolak")) statusClass = "badge bg-danger";

      const tglPengajuan = c["Tanggal Pengajuan"]
        ? new Date(c["Tanggal Pengajuan"]).toLocaleDateString("id-ID")
        : "-";
      const tglMulai = c["Tanggal Mulai"]
        ? new Date(c["Tanggal Mulai"]).toLocaleDateString("id-ID")
        : "-";
      const tglSelesai = c["Tanggal Selesai"]
        ? new Date(c["Tanggal Selesai"]).toLocaleDateString("id-ID")
        : "-";

      tbody.innerHTML += `
          <tr>
            <td>${i + 1}</td>
            <td>${c["Nama Pegawai"] || "-"}</td>
            <td>${c["Jenis Cuti"] || "-"}</td>
            <td>${c["Lama Cuti"] ?? "-"} Hari</td>
            <td>${tglMulai}</td>
            <td>${tglSelesai}</td>
            <td><span class="${statusClass}">${c.Status || "-"}</span></td>
            <td>${tglPengajuan}</td>
            <td>${c["Keterangan"] || "-"}</td>
            <td>${
              c["File Pendukung"]
                ? `<a href="${c["File Pendukung"]}" target="_blank"><i class="fa-solid fa-file-pdf text-danger"></i></a>`
                : "-"
            }</td>
            <td>${
              c.Status?.includes("Ditolak")
                ? `<button class="btn btn-sm btn-danger" onclick="lihatAlasan('${
                    c["Alasan"] || ""
                  }')">View</button>`
                : "-"
            }</td>
          </tr>`;
    });

    // re-init DataTable
    if ($.fn.DataTable.isDataTable("#tabelCuti")) {
      $("#tabelCuti").DataTable().clear().destroy();
    }
    $("#tabelCuti").DataTable();

    hideLoading();
  }

  function fetchJsonp(showLoadingFlag = false) {
    if (showLoadingFlag) showLoading();

    const cbName = "handleCutiDataAll_" + Date.now();
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

  // pertama kali load
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    try {
      const parsed = JSON.parse(cache);
      renderCuti(parsed.data);
      fetchJsonp(false);
    } catch {
      fetchJsonp(true);
    }
  } else {
    fetchJsonp(true);
  }
}

// modal alasan global
function lihatAlasan(alasan) {
  document.getElementById("alasanModalBody").textContent =
    alasan || "Tidak ada alasan";
  const m = new bootstrap.Modal(document.getElementById("alasanModal"));
  m.show();
}

// langsung jalan
initStatusCutiAll();
