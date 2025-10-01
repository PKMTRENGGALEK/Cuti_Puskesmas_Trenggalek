function initDashboard() {
  const userData = localStorage.getItem("userData");
  if (!userData) return (window.location.href = "index.html");

  const user = JSON.parse(userData);
  console.log("User data:", user);
  console.log("Isi kolom pic:", user.pic);
  const namaPegawai = document.getElementById("namaPegawai");
  const avatar = document.querySelector(".avatar");

  const namaPegawaiCard = document.getElementById("namaPegawaiCard");
  const fotoProfilCard = document.getElementById("fotoProfilCard");

  let picUrl = "assets/user/Profile.png"; // default fallback
  if (user.pic && user.pic.trim() !== "") {
    picUrl = `assets/user/${user.pic}`;
  }
  if (namaPegawai) namaPegawai.textContent = user.nama || "Pegawai";
  if (avatar) avatar.textContent = (user.nama || "P").charAt(0).toUpperCase();
  // untuk card profil di dashboard
  if (namaPegawaiCard) namaPegawaiCard.textContent = user.nama || "Pegawai";
  if (fotoProfilCard) fotoProfilCard.src = picUrl;

  const role = (user.role || "").toLowerCase();
  const menuPengajuan = document.getElementById("menuPengajuan");
  const menuPengajuanMobile = document.getElementById("menuPengajuanMobile");
  const menuRiwayat = document.getElementById("menuRiwayat");
  const menuRiwayatMobile = document.getElementById("menuRiwayatMobile");

  const bolehAksesPengajuan = role === "admin" || role === "supervisi";

  if (!bolehAksesPengajuan) {
    if (menuPengajuan) menuPengajuan.remove();
    if (menuPengajuanMobile) menuPengajuanMobile.remove();
    if (menuRiwayat) menuRiwayat.remove();
    if (menuRiwayatMobile) menuRiwayatMobile.remove();
  }

  const cacheKey = "cutiDashboardCache";

  function renderDashboard(data) {
    if (!Array.isArray(data)) data = data.data || [];

    // === Tampilkan menu sesuai role ===
    if (bolehAksesPengajuan) {
      if (menuPengajuan) menuPengajuan.style.display = "flex";
      if (menuPengajuanMobile) menuPengajuanMobile.style.display = "flex";
      if (menuRiwayat) menuRiwayat.style.display = "flex";
      if (menuRiwayatMobile) menuRiwayatMobile.style.display = "flex";
    }

    // Data milik user
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
    let totalTerpakai = 0;
    userCutiTahunan.forEach((c) => {
      const lama = parseFloat(c["Lama Cuti"]);
      totalTerpakai += isNaN(lama) ? 0 : lama;
    });

    const totalCutiTahunan = 12;
    const sisa = Math.max(totalCutiTahunan - totalTerpakai, 0);
    document.getElementById("sisaCuti").textContent = sisa;
    document.getElementById(
      "cutiTerpakai"
    ).textContent = `Cuti Terpakai: ${totalTerpakai}`;
    document.getElementById("cutiProgress").style.width =
      (totalTerpakai / totalCutiTahunan) * 100 + "%";

    // ===== Badge Pengajuan (Realtime) =====
    if (bolehAksesPengajuan) {
      const pengajuanMenunggu = data.filter((c) => {
        const st = (c["Status"] || "").toLowerCase();
        return st.includes("menunggu");
      }).length;

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

    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.style.display = "none";
  }

  function ambilData() {
    window.handleCutiData = function (data) {
      const finalData = Array.isArray(data) ? data : data.data || [];
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: finalData, timestamp: Date.now() })
      );
      renderDashboard(finalData);
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

  // Render dari cache
  const cache = localStorage.getItem(cacheKey);
  if (cache) {
    try {
      const parsed = JSON.parse(cache);
      renderDashboard(parsed.data || []);
    } catch (e) {
      console.error("Cache rusak:", e);
    }
  }

  ambilData();
  setInterval(() => ambilData(), 10000);
}

// Logout global
function logout() {
  localStorage.removeItem("userData");
  localStorage.removeItem("cutiDashboardCache");
  window.location.href = "index.html";
}

// ✅ panggil langsung biar jalan walaupun diload dinamis
initDashboard();
