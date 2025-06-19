const API_URL = "https://script.google.com/macros/s/AKfycbwL_KW2TcdZJmzQs8j50VeQaCVjmWfStUjYJGUmZ2gdaiBi1tQ2XkHdEAzbqbcKePUCNA/exec"; // Ganti URL ini

function showSection(id) {
  document.querySelectorAll("section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "list") loadCustomerList();
  if (id === "tagihan") loadTagihan();
  if (id === "laporan") loadLaporan();
}

document.getElementById("customer-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const data = {};
  formData.forEach((v, k) => data[k] = v);

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  }).then(res => res.json()).then(res => {
    document.getElementById("status-msg").textContent = "Data berhasil disimpan!";
    this.reset();
  }).catch(() => {
    document.getElementById("status-msg").textContent = "Gagal menyimpan data.";
  });
});

function loadCustomerList() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#customer-table tbody");
      tbody.innerHTML = "";
      data.forEach(d => {
        const row = `<tr>
          <td>${d["No"] || ""}</td>
          <td>${d["Customer"]}</td>
          <td>${d["WhatsApp"]}</td>
          <td>${d["Alamat"]}</td>
          <td>${d["Tagihan"]}</td>
        </tr>`;
        tbody.innerHTML += row;
      });
    });
}

function loadTagihan() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const html = data.map(d => `<p><strong>${d["Customer"]}</strong> - Rp ${d["Tagihan"]} (Jatuh Tempo: ${d["Jatuh Tempo"]})</p>`).join("");
      document.getElementById("tagihan-list").innerHTML = html;
    });
}

function loadLaporan() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const total = data.reduce((sum, d) => sum + (parseFloat(d["Tagihan"]) || 0), 0);
      const count = data.length;
      document.getElementById("laporan-summary").innerHTML = `
        <p>Total Customer: <strong>${count}</strong></p>
        <p>Total Tagihan: <strong>Rp ${total.toLocaleString()}</strong></p>
      `;
    });
}