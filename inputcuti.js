function initInputcuti() {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzt6xv3yHqeRiTrNcmghTwAq5cgpJ873CF3S4t4XC5qQTa60fcUFILFIdOk9KFaO0o2/exec";

  // ambil data user dari localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  document.getElementById("namaKaryawan").value = userData.nama || "";
  document.getElementById("nip").value = userData.nip || "";
  document.getElementById("jabatan").value = userData.jabatan || "";

  // hitung lama cuti otomatis
  document.getElementById("tglMulai").addEventListener("change", hitungLama);
  document.getElementById("tglSelesai").addEventListener("change", hitungLama);

  function hitungLama() {
    const t1 = new Date(document.getElementById("tglMulai").value);
    const t2 = new Date(document.getElementById("tglSelesai").value);
    if (t1 && t2 && !isNaN(t1) && !isNaN(t2)) {
      const selisih = Math.floor((t2 - t1) / (1000 * 60 * 60 * 24)) + 1;
      document.getElementById("lamaCuti").value = selisih > 0 ? selisih : 0;
    }
  }

  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) loadingOverlay.style.display = "none";

  // submit form
  document
    .getElementById("cutiForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      let fileBase64 = "";
      let fileName = "";
      const file = document.getElementById("filePendukung").files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async function (evt) {
          fileBase64 = evt.target.result.split(",")[1];
          fileName = file.name;
          await kirimData(fileBase64, fileName);
        };
        reader.readAsDataURL(file);
      } else {
        await kirimData();
      }
    });

  async function kirimData(fileBase64 = "", fileName = "") {
    const data = {
      nip: document.getElementById("nip").value,
      namaPegawai: document.getElementById("namaKaryawan").value,
      jabatan: document.getElementById("jabatan").value,
      tglMulai: document.getElementById("tglMulai").value,
      tglSelesai: document.getElementById("tglSelesai").value,
      lamaCuti: document.getElementById("lamaCuti").value,
      jenisCuti: document.getElementById("jenisCuti").value,
      keterangan: document.getElementById("keterangan").value,
      alamat: document.getElementById("alamat").value,
      noTelp: document.getElementById("noTelp").value,
      fileBase64,
      fileName,
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.status === "success") {
        Swal.fire("✅ Sukses", "Pengajuan cuti berhasil disimpan!", "success");
        document.getElementById("cutiForm").reset();
      } else {
        Swal.fire("❌ Gagal", result.message, "error");
      }
    } catch (err) {
      Swal.fire("⚠️ Error", err.message, "error");
    }
  }
}

// 🔥 otomatis jalan begitu file dimuat
document.addEventListener("DOMContentLoaded", initInputcuti);
initInputcuti();
