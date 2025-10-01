function initUser() {
  const userData = localStorage.getItem("userData");
  if (!userData) return (window.location.href = "index.html");

  const user = JSON.parse(userData);
  const namaPegawai = document.getElementById("namaPegawai");
  const avatar = document.querySelector(".avatar");

  if (namaPegawai) namaPegawai.textContent = user.nama || "Pegawai";
  if (avatar) avatar.textContent = (user.nama || "P").charAt(0).toUpperCase();
}
