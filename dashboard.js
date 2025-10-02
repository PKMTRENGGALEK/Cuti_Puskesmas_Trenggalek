function initDashboard() {
  const userData = localStorage.getItem("userData");
  if (!userData) return (window.location.href = "index.html");

  const user = JSON.parse(userData);
  console.log("User data:", user);

  // --- Elemen DOM ---
  const namaPegawai = document.getElementById("namaPegawai");
  const avatar = document.querySelector(".avatar");
  const namaPegawaiCard = document.getElementById("namaPegawaiCard");
  const fotoProfilCard = document.getElementById("fotoProfilCard");

  // --- Foto Profil ---
  let picUrl = "assets/user/Profile.png";
  if (user.pic && user.pic.trim() !== "") {
    picUrl = `assets/user/${user.pic}`;
  }
  if (namaPegawai) namaPegawai.textContent = user.nama || "Pegawai";
  if (avatar) avatar.textContent = (user.nama || "P").charAt(0).toUpperCase();
  if (namaPegawaiCard) namaPegawaiCard.textContent = user.nama || "Pegawai";
  if (fotoProfilCard) fotoProfilCard.src = picUrl;

  // --- Role & Menu ---
  const role = (user.role || "").toLowerCase();
  const menuPengajuan = document.getElementById("menuPengajuan");
  const menuPengajuanMobile = document.getElementById("menuPengajuanMobile");
  const menuRiwayat = document.getElementById("menuRiwayat");
  const menuRiwayatMobile = document.getElementById("menuRiwayatMobile");

  const bolehAksesPengajuan = role === "admin" || role === "supervisi";

  if (!bolehAksesPengajuan) {
    [
      menuPengajuan,
      menuPengajuanMobile,
      menuRiwayat,
      menuRiwayatMobile,
    ].forEach((el) => {
      if (el) el.remove();
    });
  }

  const cacheKey = "cutiDashboardCache";

  // --- Render Dashboard ---
  function renderDashboard(data) {
    if (!Array.isArray(data)) {
      console.warn("Data tidak valid:", data);
      return;
    }

    // Menu sesuai role
    if (bolehAksesPengajuan) {
      [
        menuPengajuan,
        menuPengajuanMobile,
        menuRiwayat,
        menuRiwayatMobile,
      ].forEach((el) => {
        if (el) el.style.display = "flex";
      });
    }

    // Filter cuti user
    const semuaCutiPegawai = data.filter(
      (c) =>
        (c["Nama Pegawai"] || "").trim().toLowerCase() ===
        (user.nama || "").trim().toLowerCase()
    );

    // Status terakhir
    let statusTerakhir = "Belum ada pengajuan";
    let tanggalPengajuanTerakhir = "-";
    if (semuaCutiPegawai.length > 0) {
      semuaCutiPegawai.sort(
        (a, b) => new Date(b["Tanggal Mulai"]) - new Date(a["Tanggal Mulai"])
      );
      statusTerakhir = semuaCutiPegawai[0]["Status"] || "Belum ada status";
      const tglRaw = semuaCutiPegawai[0]["Tanggal Pengajuan"] || "-";
      if (tglRaw !== "-") {
        const tgl = new Date(tglRaw);
        tanggalPengajuanTerakhir = tgl.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    // Status badge
    const statusMap = {
      Menunggu: "bg-warning text-dark",
      Disetujui: "bg-success",
      Ditolak: "bg-danger",
    };
    let badgeClass = "bg-secondary";
    Object.keys(statusMap).forEach((k) => {
      if (statusTerakhir.includes(k)) badgeClass = statusMap[k];
    });

    const statusEl = document.getElementById("statusPengajuan");
    if (statusEl) {
      statusEl.innerHTML = `<span class="badge ${badgeClass}">${statusTerakhir}</span>
        <small class="d-block mt-1">Tanggal Pengajuan: ${tanggalPengajuanTerakhir}</small>`;
    }

    // Hitung cuti tahunan
    const userCutiTahunan = data.filter(
      (c) =>
        (c["Nama Pegawai"] || "").trim().toLowerCase() ===
          (user.nama || "").trim().toLowerCase() &&
        (c["Jenis Cuti"] || "").trim() === "Cuti Tahunan" &&
        (c["Status"] || "").trim() === "Disetujui"
    );

    let totalTerpakai = userCutiTahunan.reduce(
      (sum, c) => sum + (parseFloat(c["Lama Cuti"]) || 0),
      0
    );
    const totalCutiTahunan = 12;
    const sisa = Math.max(totalCutiTahunan - totalTerpakai, 0);

    const sisaCutiEl = document.getElementById("sisaCuti");
    const cutiTerpakaiEl = document.getElementById("cutiTerpakai");
    const cutiProgressEl = document.getElementById("cutiProgress");

    if (sisaCutiEl) sisaCutiEl.textContent = sisa;
    if (cutiTerpakaiEl)
      cutiTerpakaiEl.textContent = `Cuti Terpakai: ${totalTerpakai}`;
    if (cutiProgressEl)
      cutiProgressEl.style.width =
        (totalTerpakai / totalCutiTahunan) * 100 + "%";

    // Badge realtime pengajuan
    if (bolehAksesPengajuan) {
      const pengajuanMenunggu = data.filter((c) =>
        (c["Status"] || "").toLowerCase().includes("menunggu")
      ).length;
      function setBadge(el) {
        if (!el) return;
        const oldBadge = el.querySelector(".badge-baru");
        if (oldBadge) oldBadge.remove();
        if (pengajuanMenunggu > 0) {
          const span = document.createElement("span");
          span.className = "badge bg-danger badge-baru ms-auto";
          span.textContent = pengajuanMenunggu;
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "space-between";
          el.appendChild(span);
        }
      }
      setBadge(menuPengajuan);
      setBadge(menuPengajuanMobile);
    }
  }

  // --- Ambil Data dari API ---
  function ambilData() {
    window.handleCutiData = function (res) {
      const finalData = Array.isArray(res) ? res : res.data || [];
      if (finalData.length > 0) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data: finalData, timestamp: Date.now() })
        );
        renderDashboard(finalData);
      } else {
        console.warn("Data kosong, pakai cache lama");
        const cache = localStorage.getItem(cacheKey);
        if (cache) {
          const parsed = JSON.parse(cache);
          renderDashboard(parsed.data || []);
        }
      }
    };

    const oldScript = document.getElementById("jsonpDashboard");
    if (oldScript) oldScript.remove();

    const scriptURL =
      "https://script.google.com/macros/s/AKfycbzt6xv3yHqeRiTrNcmghTwAq5cgpJ873CF3S4t4XC5qQTa60fcUFILFIdOk9KFaO0o2/exec?callback=handleCutiData&_t=" +
      Date.now();
    const s = document.createElement("script");
    s.id = "jsonpDashboard";
    s.src = scriptURL;
    s.async = true;
    document.body.appendChild(s);
  }

  // --- Load dari cache dulu ---
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    try {
      const parsed = JSON.parse(cache);
      renderDashboard(parsed.data || []);
    } catch (e) {
      console.error("Cache rusak:", e);
    }
  }

  ambilData(); // langsung panggil
}

// --- Logout Global ---
function logout() {
  localStorage.removeItem("userData");
  localStorage.removeItem("cutiDashboardCache");
  window.location.href = "index.html";
}

// ✅ Panggil langsung
initDashboard();
