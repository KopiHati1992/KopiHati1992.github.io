// ================= DATA =================
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
    setupYear();
    renderTransactions();
});

// ================= SET TAHUN =================
function setupYear() {
    const select = document.getElementById('reportYear');
    const currentYear = new Date().getFullYear();

    select.innerHTML = '';

    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        if (i === currentYear) opt.selected = true;
        select.appendChild(opt);
    }
}

// ================= UTIL =================
function saveData() {
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function calculateDueDate(monthDate, regDate) {
    const day = Math.min(new Date(regDate).getDate(), 28);
    const d = new Date(monthDate);
    d.setDate(day);
    return d.toISOString().substring(0,10);
}

// ================= FIX UTAMA =================
function generateInitialTransactions(customer) {

    const start = new Date(customer.tanggalDaftar);
    start.setMonth(start.getMonth() + 1);
    start.setDate(1);

    let date = new Date(start);

    // 🔥 MAX 12 BULAN
    for (let i = 0; i < 12; i++) {

        const month = date.toISOString().substring(0,7);

        transactions.push({
            id: customer.id + '-' + month,
            customerId: customer.id,
            customerName: customer.nama,
            monthYear: month,
            amount: customer.tagihan,
            status: 'pending',
            dueDate: calculateDueDate(date, customer.tanggalDaftar)
        });

        date.setMonth(date.getMonth() + 1);
    }

    saveData();
}

// ================= RENDER =================
function renderTransactions() {
    const tbody = document.getElementById('transactionList');
    tbody.innerHTML = '';

    transactions.forEach(t => {
        const tr = `
        <tr>
            <td>${t.customerName}</td>
            <td>${t.monthYear}</td>
            <td>${t.amount}</td>
            <td>${t.status}</td>
        </tr>
        `;
        tbody.innerHTML += tr;
    });
}

// ================= TEST =================
function addDummyCustomer() {
    const c = {
        id: Date.now(),
        nama: "Customer Test",
        tanggalDaftar: "2026-01-15",
        tagihan: 100000
    };

    customers.push(c);
    generateInitialTransactions(c);
    renderTransactions();
}