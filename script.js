const API_URL = "https://script.google.com/macros/s/AKfycbz0zSh6dzFcMN1_I7n5SfTlmaG6JBJwZzU-xnmPkRFn5OBBva4Yy_d_45ksZtMRd5CxAA/exec"; 

document.getElementById("customer-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    data[key] = value;
  });

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(result => {
      if (result.status === "success") {
        document.getElementById("status-msg").textContent = "Data berhasil disimpan.";
        form.reset();
      } else {
        document.getElementById("status-msg").textContent = "Gagal menyimpan data.";
      }
    })
    .catch(err => {
      console.error("Error:", err);
      document.getElementById("status-msg").textContent = "Terjadi kesalahan.";
    });
});
