// Fungsi load halaman dinamis + navbar
async function loadPage(page) {
  const main = document.querySelector(".content");
  main.innerHTML = `<div class="text-center p-5">
      <div class="spinner-border text-success"></div>
      <p class="mt-3">Memuat ${page}...</p>
    </div>`;

  try {
    // Ambil navbar
    const navRes = await fetch("navbar.html");
    const navbar = await navRes.text();

    // Ambil konten halaman
    const res = await fetch(page);
    if (!res.ok) throw new Error("Halaman tidak ditemukan");
    const html = await res.text();

    // Gabungkan navbar + isi halaman
    main.innerHTML = `
      <div class="navbar-container">${navbar}</div>
      <div class="page-container">${html}</div>
    `;

    localStorage.setItem("lastPage", page);

    // init user untuk navbar
    initUser();

    // cari nama script dari nama halaman
    const scriptName = page.replace(".html", ".js");
    loadInitScript(scriptName);
  } catch (err) {
    main.innerHTML = `<div class="alert alert-danger text-center">
        Gagal memuat <b>${page}</b><br>${err.message}
      </div>`;
  }
}

// Fungsi untuk load JS halaman
function loadInitScript(file) {
  // hapus script lama agar tidak dobel
  const old = document.getElementById("dynamicInit");
  if (old) old.remove();

  const s = document.createElement("script");
  s.src = file;
  s.id = "dynamicInit";
  s.onload = () => console.log(`${file} berhasil dimuat`);
  s.onerror = () => console.warn(`${file} tidak ditemukan`);
  document.body.appendChild(s);
}

// Event klik menu (desktop + mobile)
document.addEventListener("click", (e) => {
  const link = e.target.closest(".menu a[data-page]");
  if (!link) return;

  e.preventDefault();
  const page = link.getAttribute("data-page");

  // reset semua menu
  document
    .querySelectorAll(".menu a")
    .forEach((a) => a.classList.remove("active"));

  // aktifkan semua menu dengan data-page yang sama
  document
    .querySelectorAll(`.menu a[data-page="${page}"]`)
    .forEach((a) => a.classList.add("active"));

  loadPage(page);
});

// Default load halaman terakhir
document.addEventListener("DOMContentLoaded", () => {
  // const lastPage = localStorage.getItem("lastPage") || "dashboard.html";
  // loadPage(lastPage);
  loadPage("dashboard.html");
});

// Logout
function logout() {
  localStorage.removeItem("userData");
  localStorage.removeItem("lastPage");
  window.location.href = "index.html";
}
