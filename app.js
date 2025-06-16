class BillingSystem {
  constructor() {
    // Inisialisasi data dari localStorage
    this.customers = JSON.parse(localStorage.getItem('customers')) || [];
    this.bills = JSON.parse(localStorage.getItem('bills')) || [];
    this.payments = JSON.parse(localStorage.getItem('payments')) || [];
    this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    this.komplainList = JSON.parse(localStorage.getItem('komplainList')) || [];
    
    // Tanggal saat ini
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth() + 1;
    this.currentYear = this.currentDate.getFullYear();
    
    // State aplikasi
    this.currentCustomerId = null;
    this.currentBillId = null;
    this.currentExpenseId = null;
    
    // Inisialisasi komponen
    this.toast = new Toast();
    this.initEventListeners();
    this.loadInitialData();
  }
  
  initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.showTab(item.dataset.tab));
    });
    
    // Form submission
    document.getElementById('customerForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCustomerFormSubmit();
    });
    
    document.getElementById('formKomplain')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addKomplain();
    });
    
    document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addExpense();
    });
    
    // Backup/Restore
    document.getElementById('fabButton')?.addEventListener('click', () => this.toggleBackupMenu());
    document.getElementById('backupBtn')?.addEventListener('click', () => this.backupData());
    document.getElementById('restoreBtn')?.addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile')?.addEventListener('change', (e) => this.importData(e));
    
    // Modal buttons
    document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
    });
    
    // Event delegation for dynamic elements
    document.addEventListener('click', (e) => {
      // Edit customer
      if (e.target.closest('.edit-customer-btn')) {
        const customerId = e.target.closest('tr').dataset.id;
        this.editCustomer(customerId);
      }
      
      // Delete customer
      if (e.target.closest('.delete-customer-btn')) {
        const customerId = e.target.closest('tr').dataset.id;
        this.deleteCustomer(customerId);
      }
      
      // View customer detail
      if (e.target.closest('.view-customer-btn')) {
        const customerId = e.target.closest('tr').dataset.id;
        this.showCustomerDetail(customerId);
      }
      
      // Process payment
      if (e.target.closest('.process-payment-btn')) {
        const billId = e.target.closest('tr').dataset.id;
        this.showPaymentModal(billId);
      }
      
      // View payment detail
      if (e.target.closest('.view-payment-btn')) {
        const billId = e.target.closest('tr').dataset.id;
        this.showPaymentDetail(billId);
      }
      
      // Delete expense
      if (e.target.closest('.delete-expense-btn')) {
        const expenseId = e.target.closest('tr').dataset.id;
        this.deleteExpensePrompt(expenseId);
      }
      
      // Toggle komplain detail
      if (e.target.closest('.toggle-komplain-btn')) {
        const customerId = e.target.closest('.komplain-group').dataset.customerId;
        this.toggleKomplainDetail(customerId);
      }
      
      // Delete komplain group
      if (e.target.closest('.delete-komplain-group-btn')) {
        const customerId = e.target.closest('.komplain-group').dataset.customerId;
        this.deleteAllKomplains(customerId);
      }
    });
    
    // Search functionality
    document.getElementById('searchCustomer')?.addEventListener('input', () => this.searchCustomers());
    document.getElementById('searchTagihan')?.addEventListener('input', () => this.searchTagihan());
    document.getElementById('searchExpense')?.addEventListener('input', () => this.searchExpenses());
    document.getElementById('searchLaporan')?.addEventListener('input', () => this.searchLaporan());
    document.getElementById('searchKomplain')?.addEventListener('input', () => this.searchKomplain());
    
    // Filter changes
    document.getElementById('bulanTagihan')?.addEventListener('change', () => this.filterTagihan());
    document.getElementById('bulanLaporan')?.addEventListener('change', () => this.filterLaporan());
    document.getElementById('tahunRekapan')?.addEventListener('change', () => this.loadAnnualReport());
    
    // Payment modal
    document.getElementById('confirmPaymentBtn')?.addEventListener('click', () => this.processPayment());
    
    // Delete expense confirmation
    document.getElementById('confirmDeleteExpenseBtn')?.addEventListener('click', () => this.confirmDeleteExpense());
    
    // Cancel edit customer
    document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelEdit());
    
    // Toggle nominal lain
    document.getElementById('paket')?.addEventListener('change', () => this.toggleNominalLain());
    
    // Select expense category
    document.querySelectorAll('.expense-category-item').forEach(item => {
      item.addEventListener('click', () => this.selectExpenseCategory(item, item.dataset.category));
    });
  }
  
  loadInitialData() {
    // Set nilai default
    if (this.currentMonth >= 1 && this.currentMonth <= 12) {
      const bulanTagihan = document.getElementById('bulanTagihan');
      const bulanLaporan = document.getElementById('bulanLaporan');
      if (bulanTagihan) bulanTagihan.value = this.currentMonth;
      if (bulanLaporan) bulanLaporan.value = this.currentMonth;
    }
    
    const tahunRekapan = document.getElementById('tahunRekapan');
    if (tahunRekapan) tahunRekapan.value = this.currentYear;
    
    // Set tanggal default
    const paymentDate = document.getElementById('paymentDate');
    const expenseDate = document.getElementById('expenseDate');
    if (paymentDate) paymentDate.valueAsDate = this.currentDate;
    if (expenseDate) expenseDate.valueAsDate = this.currentDate;
    
    // Muat data
    this.loadCustomers();
    this.loadBills();
    this.loadPayments();
    this.loadExpenses();
    this.loadKomplainGroups();
    
    // Filter data
    this.filterTagihan();
    this.filterLaporan();
    
    // Hitung saldo
    this.calculateCompanyBalance();
    
    // Muat laporan tahunan
    this.loadAnnualReport();
  }
  
  // ==================== FUNGSI TAB NAVIGASI ====================
  showTab(tabId) {
    // Sembunyikan semua tab
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Nonaktifkan semua item navigasi
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Aktifkan tab yang dipilih
    const tabElement = document.getElementById(tabId);
    if (tabElement) tabElement.classList.add('active');
    
    const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Segarkan data saat beralih tab
    switch(tabId) {
      case 'daftar':
        this.loadCustomers();
        break;
      case 'tagihan':
        this.filterTagihan();
        break;
      case 'pengeluaran':
        this.loadExpenses();
        break;
      case 'laporan':
        this.filterLaporan();
        break;
      case 'rekapan':
        this.loadAnnualReport();
        break;
      case 'komplain':
        this.loadKomplainGroups();
        break;
    }
  }
  
  // ==================== FUNGSI CUSTOMER ====================
  handleCustomerFormSubmit() {
    const form = document.getElementById('customerForm');
    if (form.dataset.editMode === 'true') {
      this.updateCustomer(form.dataset.editId);
    } else {
      this.addCustomer();
    }
  }
  
  addCustomer() {
    const nama = document.getElementById('nama').value.trim();
    const alamat = document.getElementById('alamat').value.trim();
    const kontak = document.getElementById('kontak').value.trim();
    const paketSelect = document.getElementById('paket');
    const paketValue = paketSelect.value;
    const ip = document.getElementById('ip').value.trim();
    const jatuhTempo = document.getElementById('jatuhTempo').value;
    const keterangan = document.getElementById('keterangan').value.trim();
    let amount;
    
    // Handle Free customer
    if (paketValue === '0') {
      amount = 0;
    } 
    // Handle custom amount
    else if (paketValue === 'lain') {
      amount = parseInt(document.getElementById('nominalLain').value);
      if (isNaN(amount) || amount < 1000) {
        this.toast.show('error', 'Error', 'Masukkan nominal yang valid (minimal Rp 1.000)');
        return;
      }
    } 
    // Handle standard amounts
    else if (paketValue) {
      amount = parseInt(paketValue);
    } else {
      this.toast.show('error', 'Error', 'Pilih nominal tagihan');
      return;
    }
    
    // Validasi input
    if (!nama || !alamat || !kontak || !ip || !jatuhTempo) {
      this.toast.show('error', 'Error', 'Harap lengkapi semua data yang diperlukan');
      return;
    }
    
    // Buat customer baru
    const newCustomer = {
      id: Date.now().toString(),
      nama,
      alamat,
      kontak,
      amount,
      ip,
      jatuhTempo,
      keterangan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFree: amount === 0
    };
    
    this.customers.push(newCustomer);
    this.saveCustomers();
    
    // Buat tagihan untuk customer (kecuali free)
    if (amount > 0) {
      for (let month = 1; month <= 12; month++) {
        const bill = {
          id: (Date.now() + month).toString(),
          customerId: newCustomer.id,
          month,
          year: this.currentYear,
          jatuhTempo: jatuhTempo,
          status: 'Belum Bayar',
          amount: amount,
          createdAt: new Date().toISOString()
        };
        this.bills.push(bill);
      }
      this.saveBills();
    }
    
    // Reset form
    document.getElementById('customerForm').reset();
    document.getElementById('nominalLainGroup').style.display = 'none';
    
    // Tampilkan notifikasi
    this.toast.show('success', 'Berhasil', 'Data customer berhasil ditambahkan');
    
    // Muat ulang data
    this.loadCustomers();
    this.calculateCompanyBalance();
  }
  
  loadCustomers() {
    const customerList = document.getElementById('customerList');
    if (!customerList) return;
    
    customerList.innerHTML = '';
    
    let totalTagihan = 0;
    let totalCustomers = 0;
    
    // Urutkan customer berdasarkan jatuh tempo
    this.customers.sort((a, b) => a.jatuhTempo - b.jatuhTempo);
    
    this.customers.forEach((customer, index) => {
      // Hitung hanya customer non-free
      if (customer.amount > 0) {
        totalTagihan += customer.amount;
        totalCustomers++;
      }
      
      // Hitung status pembayaran
      const customerBills = this.bills.filter(bill => bill.customerId === customer.id);
      const paidBills = customerBills.filter(bill => {
        return this.payments.some(payment => payment.billId === bill.id);
      });
      
      let status;
      if (customer.amount === 0) {
        status = '<span class="badge badge-info">Free</span>';
      } else if (customerBills.length === paidBills.length) {
        status = '<span class="badge badge-success">Lengkap</span>';
      } else {
        status = `<span class="badge badge-warning">${paidBills.length}/${customerBills.length}</span>`;
      }
      
      // Buat link WhatsApp
      const whatsappLink = customer.kontak.startsWith('0') ? 
        `https://wa.me/62${customer.kontak.substring(1)}` : 
        `https://wa.me/${customer.kontak}`;
      
      // Tambahkan row ke tabel
      const row = document.createElement('tr');
      row.dataset.id = customer.id;
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <strong>${this.escapeHtml(customer.nama)}</strong><br>
          <small class="text-muted">${this.escapeHtml(customer.alamat)}</small>
        </td>
        <td>
          <a href="${whatsappLink}" class="whatsapp-link" target="_blank" title="Kirim pesan WhatsApp">
            ${this.escapeHtml(customer.kontak)}
          </a>
        </td>
        <td>${customer.amount === 0 ? 'Free' : 'Rp ' + customer.amount.toLocaleString('id-ID')}</td>
        <td>${customer.amount === 0 ? '-' : 'Tgl ' + customer.jatuhTempo}</td>
        <td>${status}</td>
        <td class="action-buttons">
          <button class="btn btn-warning btn-sm edit-customer-btn">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm delete-customer-btn">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn btn-primary btn-sm view-customer-btn">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      customerList.appendChild(row);
    });
    
    // Update total customer dan tagihan
    const totalCustomerCount = document.getElementById('totalCustomerCount');
    const totalTagihanAmount = document.getElementById('totalTagihanAmount');
    
    if (totalCustomerCount) totalCustomerCount.textContent = totalCustomers;
    if (totalTagihanAmount) totalTagihanAmount.textContent = `Rp ${totalTagihan.toLocaleString('id-ID')}`;
    
    // Update dropdown customer di form komplain
    this.updateCustomerDropdown();
  }
  
  updateCustomerDropdown() {
    const select = document.getElementById('selectCustomer');
    if (!select) return;
    
    select.innerHTML = '';
    
    // Tambahkan opsi default
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Pilih Customer --';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    // Tambahkan semua customer
    this.customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = this.escapeHtml(customer.nama);
      select.appendChild(option);
    });
  }
  
  editCustomer(id) {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return;
    
    // Set mode edit
    const form = document.getElementById('customerForm');
    form.dataset.editMode = 'true';
    form.dataset.editId = id;
    
    // Ubah judul form
    const cardTitle = document.querySelector('#input .card-title');
    if (cardTitle) cardTitle.innerHTML = '<i class="fas fa-user-edit"></i> Edit Data Customer';
    
    // Tampilkan tombol batal
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
    
    // Isi form dengan data customer
    document.getElementById('nama').value = this.escapeHtml(customer.nama);
    document.getElementById('alamat').value = this.escapeHtml(customer.alamat);
    document.getElementById('kontak').value = this.escapeHtml(customer.kontak);
    
    // Set nilai amount
    const paketSelect = document.getElementById('paket');
    const nominalLainGroup = document.getElementById('nominalLainGroup');
    const standardAmounts = [100000, 120000, 150000, 200000];
    
    if (customer.amount === 0) {
      paketSelect.value = '0';
      nominalLainGroup.style.display = 'none';
    } else if (standardAmounts.includes(customer.amount)) {
      paketSelect.value = customer.amount.toString();
      nominalLainGroup.style.display = 'none';
    } else {
      paketSelect.value = 'lain';
      nominalLainGroup.style.display = 'block';
      document.getElementById('nominalLain').value = customer.amount;
    }
    
    document.getElementById('ip').value = this.escapeHtml(customer.ip);
    document.getElementById('jatuhTempo').value = customer.jatuhTempo;
    document.getElementById('keterangan').value = this.escapeHtml(customer.keterangan || '');
    
    // Scroll ke form
    this.showTab('input');
    
    // Tampilkan notifikasi
    this.toast.show('info', 'Edit Mode', 'Data customer siap diedit. Silakan perbarui data dan klik Simpan.');
  }
  
  cancelEdit() {
    // Reset form
    document.getElementById('customerForm').reset();
    document.getElementById('customerForm').removeAttribute('data-edit-mode');
    document.getElementById('customerForm').removeAttribute('data-edit-id');
    document.getElementById('nominalLainGroup').style.display = 'none';
    
    // Sembunyikan tombol batal
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    // Kembalikan judul form
    const cardTitle = document.querySelector('#input .card-title');
    if (cardTitle) cardTitle.innerHTML = '<i class="fas fa-user-edit"></i> Form Input Customer Baru';
    
    this.toast.show('info', 'Edit Dibatalkan', 'Perubahan tidak disimpan');
  }
  
  updateCustomer(id) {
    const nama = document.getElementById('nama').value.trim();
    const alamat = document.getElementById('alamat').value.trim();
    const kontak = document.getElementById('kontak').value.trim();
    const paketSelect = document.getElementById('paket');
    const paketValue = paketSelect.value;
    const ip = document.getElementById('ip').value.trim();
    const jatuhTempo = document.getElementById('jatuhTempo').value;
    const keterangan = document.getElementById('keterangan').value.trim();
    let amount;
    
    // Handle Free customer
    if (paketValue === '0') {
      amount = 0;
    } 
    // Handle custom amount
    else if (paketValue === 'lain') {
      amount = parseInt(document.getElementById('nominalLain').value);
      if (isNaN(amount) || amount < 1000) {
        this.toast.show('error', 'Error', 'Masukkan nominal yang valid (minimal Rp 1.000)');
        return;
      }
    } 
    // Handle standard amounts
    else if (paketValue) {
      amount = parseInt(paketValue);
    } else {
      this.toast.show('error', 'Error', 'Pilih nominal tagihan');
      return;
    }
    
    // Validasi input
    if (!nama || !alamat || !kontak || !ip || !jatuhTempo) {
      this.toast.show('error', 'Error', 'Harap lengkapi semua data yang diperlukan');
      return;
    }
    
    // Update data customer
    const customerIndex = this.customers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      const oldAmount = this.customers[customerIndex].amount;
      this.customers[customerIndex] = {
        ...this.customers[customerIndex],
        nama,
        alamat,
        kontak,
        amount,
        ip,
        jatuhTempo,
        keterangan,
        updatedAt: new Date().toISOString(),
        isFree: amount === 0
      };
      
      if (oldAmount > 0 && amount === 0) {
        // Jika sebelumnya bayar sekarang jadi free, hapus semua tagihan
        this.bills = this.bills.filter(bill => bill.customerId !== id);
      } else if (oldAmount === 0 && amount > 0) {
        // Jika sebelumnya free sekarang jadi bayar, buat tagihan
        for (let month = 1; month <= 12; month++) {
          const bill = {
            id: (Date.now() + month).toString(),
            customerId: id,
            month,
            year: this.currentYear,
            jatuhTempo: jatuhTempo,
            status: 'Belum Bayar',
            amount: amount,
            createdAt: new Date().toISOString()
          };
          this.bills.push(bill);
        }
      } else if (oldAmount > 0 && amount > 0) {
        // Update amount dan jatuh tempo tagihan
        this.bills.forEach(bill => {
          if (bill.customerId === id) {
            bill.jatuhTempo = jatuhTempo;
            bill.amount = amount;
          }
        });
      }
      
      this.saveCustomers();
      this.saveBills();
      
      // Reset form dan keluar dari mode edit
      document.getElementById('customerForm').reset();
      document.getElementById('customerForm').removeAttribute('data-edit-mode');
      document.getElementById('customerForm').removeAttribute('data-edit-id');
      document.getElementById('nominalLainGroup').style.display = 'none';
      document.getElementById('cancelEditBtn').style.display = 'none';
      
      // Kembalikan judul form
      const cardTitle = document.querySelector('#input .card-title');
      if (cardTitle) cardTitle.innerHTML = '<i class="fas fa-user-edit"></i> Form Input Customer Baru';
      
      // Muat ulang data
      this.loadCustomers();
      this.filterTagihan();
      this.calculateCompanyBalance();
      
      // Tampilkan notifikasi
      this.toast.show('success', 'Berhasil', 'Data customer berhasil diperbarui');
    }
  }
  
  showCustomerDetail(id) {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return;
    
    // Hitung tagihan dan pembayaran
    const customerBills = this.bills.filter(bill => bill.customerId === customer.id);
    const paidBills = customerBills.filter(bill => {
      return this.payments.some(payment => payment.billId === bill.id);
    });
    
    // Buat link WhatsApp
    const whatsappLink = customer.kontak.startsWith('0') ? 
      `https://wa.me/62${customer.kontak.substring(1)}` : 
      `https://wa.me/${customer.kontak}`;
    
    const detailHTML = `
      <div class="payment-detail">
        <div class="payment-detail-label">Nama Customer</div>
        <div class="payment-detail-value">${this.escapeHtml(customer.nama)}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Alamat</div>
        <div class="payment-detail-value">${this.escapeHtml(customer.alamat)}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Kontak</div>
        <div class="payment-detail-value">
          ${this.escapeHtml(customer.kontak)}
        </div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">IP Internet</div>
        <div class="payment-detail-value">${this.escapeHtml(customer.ip)}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Jatuh Tempo</div>
        <div class="payment-detail-value">${customer.amount === 0 ? 'Free (Tidak ada tagihan)' : 'Tanggal ' + customer.jatuhTempo}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Nominal Tagihan</div>
        <div class="payment-detail-value amount">${customer.amount === 0 ? 'Free' : 'Rp ' + customer.amount.toLocaleString('id-ID')}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Status Pembayaran</div>
        <div class="payment-detail-value">
          ${customer.amount === 0 ? 
            '<span class="badge badge-info">Free - Tidak ada tagihan</span>' : 
            paidBills.length === customerBills.length ? 
              '<span class="badge badge-success">Semua tagihan lunas</span>' : 
              `<span class="badge badge-warning">${paidBills.length} dari ${customerBills.length} tagihan lunas</span>`}
        </div>
      </div>
      ${customer.keterangan ? `
      <div class="payment-detail">
        <div class="payment-detail-label">Keterangan</div>
        <div class="payment-detail-value">${this.escapeHtml(customer.keterangan)}</div>
      </div>
      ` : ''}
    `;
    
    document.getElementById('paymentDetailBody').innerHTML = detailHTML;
    this.showModal('paymentDetailModal');
  }
  
  deleteCustomer(id) {
    if (confirm('Apakah Anda yakin? Data customer dan semua tagihannya akan dihapus permanen!')) {
      this.customers = this.customers.filter(c => c.id !== id);
      this.bills = this.bills.filter(bill => bill.customerId !== id);
      this.payments = this.payments.filter(payment => {
        const bill = this.bills.find(b => b.id === payment.billId);
        return !bill || bill.customerId !== id;
      });
      
      // Hapus komplain terkait
      this.komplainList = this.komplainList.filter(k => k.customerId !== id);
      this.saveKomplain();
      
      this.saveCustomers();
      this.saveBills();
      this.savePayments();
      this.loadCustomers();
      this.calculateCompanyBalance();
      
      this.toast.show('success', 'Berhasil', 'Customer berhasil dihapus');
    }
  }
  
  // ==================== FUNGSI TAGIHAN ====================
  filterTagihan() {
    const monthSelect = document.getElementById('bulanTagihan');
    if (!monthSelect) return;
    
    const month = parseInt(monthSelect.value);
    
    const tagihanList = document.getElementById('tagihanList');
    if (!tagihanList) return;
    
    tagihanList.innerHTML = '';
    
    let totalTagihan = 0;
    let totalSudahBayar = 0;
    let totalBelumBayar = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    
    // Filter dan urutkan tagihan (exclude free customers)
    const filteredBills = this.bills
      .filter(bill => {
        const customer = this.customers.find(c => c.id === bill.customerId);
        return bill.month === month && bill.year === this.currentYear && customer && customer.amount > 0;
      })
      .sort((a, b) => {
        const customerA = this.customers.find(c => c.id === a.customerId);
        const customerB = this.customers.find(c => c.id === b.customerId);
        return customerA.jatuhTempo - customerB.jatuhTempo;
      });
    
    filteredBills.forEach((bill, index) => {
      const customer = this.customers.find(c => c.id === bill.customerId);
      if (!customer) return;
      
      const payment = this.payments.find(p => p.billId === bill.id);
      const status = payment ? 'Lunas' : 'Belum Bayar';
      
      totalTagihan += bill.amount;
      
      if (payment) {
        totalSudahBayar += bill.amount;
        paidCount++;
      } else {
        totalBelumBayar += bill.amount;
        unpaidCount++;
      }
      
      const jatuhTempoDate = new Date(bill.year, bill.month - 1, bill.jatuhTempo);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let statusBadge = '';
      if (status === 'Lunas') {
        statusBadge = '<span class="badge badge-success">Lunas</span>';
      } else if (jatuhTempoDate < today) {
        statusBadge = '<span class="badge badge-danger">Terlambat</span>';
      } else {
        statusBadge = '<span class="badge badge-warning">Belum Bayar</span>';
      }
      
      const row = document.createElement('tr');
      row.dataset.id = bill.id;
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <strong>${this.escapeHtml(customer.nama)}</strong><br>
          <small class="text-muted">${this.escapeHtml(customer.kontak)}</small>
        </td>
        <td>Rp ${bill.amount.toLocaleString('id-ID')}</td>
        <td>${jatuhTempoDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
        <td>${statusBadge}</td>
        <td class="action-buttons">
          ${status === 'Belum Bayar' ? 
            `<button class="btn btn-success btn-sm process-payment-btn">
              <i class="fas fa-money-bill-wave"></i> Bayar
            </button>` : 
            `<button class="btn btn-primary btn-sm view-payment-btn">
              <i class="fas fa-eye"></i> Detail
            </button>`}
        </td>
      `;
      tagihanList.appendChild(row);
    });
    
    // Update total
    const totalTagihanBulan = document.getElementById('totalTagihanBulan');
    const totalSudahBayarElement = document.getElementById('totalSudahBayar');
    const totalBelumBayarElement = document.getElementById('totalBelumBayar');
    const paidCustomerCount = document.getElementById('paidCustomerCount');
    const unpaidCustomerCount = document.getElementById('unpaidCustomerCount');
    
    if (totalTagihanBulan) totalTagihanBulan.textContent = `Rp ${totalTagihan.toLocaleString('id-ID')}`;
    if (totalSudahBayarElement) totalSudahBayarElement.textContent = `Rp ${totalSudahBayar.toLocaleString('id-ID')}`;
    if (totalBelumBayarElement) totalBelumBayarElement.textContent = `Rp ${totalBelumBayar.toLocaleString('id-ID')}`;
    if (paidCustomerCount) paidCustomerCount.textContent = paidCount;
    if (unpaidCustomerCount) unpaidCustomerCount.textContent = unpaidCount;
  }
  
  showPaymentModal(billId) {
    this.currentBillId = billId;
    this.showModal('paymentModal');
    
    // Set focus ke metode pembayaran
    document.getElementById('paymentMethod').focus();
  }
  
  processPayment() {
    const method = document.getElementById('paymentMethod').value;
    const date = document.getElementById('paymentDate').value;
    const note = document.getElementById('paymentNote').value.trim();
    
    if (!date) {
      this.toast.show('error', 'Error', 'Silakan pilih tanggal pembayaran!');
      return;
    }
    
    const bill = this.bills.find(b => b.id === this.currentBillId);
    if (bill) {
      bill.status = 'Lunas';
      this.saveBills();
      
      const payment = {
        id: Date.now().toString(),
        billId: this.currentBillId,
        method,
        date,
        amount: bill.amount,
        note,
        processedAt: new Date().toISOString()
      };
      
      this.payments.push(payment);
      this.savePayments();
      
      this.closeModal(document.getElementById('paymentModal'));
      this.filterTagihan();
      this.filterLaporan();
      this.calculateCompanyBalance();
      
      // Tampilkan notifikasi
      this.toast.show('success', 'Pembayaran Berhasil', `Tagihan sebesar Rp ${bill.amount.toLocaleString('id-ID')} telah dicatat.`);
    }
  }
  
  showPaymentDetail(billId) {
    const payment = this.payments.find(p => p.billId === billId);
    if (!payment) return;
    
    const bill = this.bills.find(b => b.id === billId);
    if (!bill) return;
    
    const customer = this.customers.find(c => c.id === bill.customerId);
    if (!customer) return;
    
    const paymentDate = new Date(payment.date);
    const formattedDate = paymentDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const processedDate = new Date(payment.processedAt);
    const formattedProcessedDate = processedDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const jatuhTempoDate = new Date(bill.year, bill.month - 1, bill.jatuhTempo);
    const formattedJatuhTempo = jatuhTempoDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Hitung status pembayaran
    const isOnTime = paymentDate <= jatuhTempoDate;
    
    const detailHTML = `
      <div class="payment-detail">
        <div class="payment-detail-label">Nama Customer</div>
        <div class="payment-detail-value">${this.escapeHtml(customer.nama)}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Periode Tagihan</div>
        <div class="payment-detail-value">${this.getMonthName(bill.month)} ${bill.year}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Jatuh Tempo</div>
        <div class="payment-detail-value">${formattedJatuhTempo}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Tanggal Bayar</div>
        <div class="payment-detail-value">${formattedDate}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Status Pembayaran</div>
        <div class="payment-detail-value">
          <span class="badge ${isOnTime ? 'badge-success' : 'badge-danger'}">
            ${isOnTime ? 'Tepat Waktu' : 'Terlambat'}
          </span>
        </div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Metode Pembayaran</div>
        <div class="payment-detail-value">${this.escapeHtml(payment.method)}</div>
      </div>
      <div class="payment-detail">
        <div class="payment-detail-label">Nominal Pembayaran</div>
        <div class="payment-detail-value amount">Rp ${payment.amount.toLocaleString('id-ID')}</div>
      </div>
      ${payment.note ? `
      <div class="payment-detail">
        <div class="payment-detail-label">Catatan</div>
        <div class="payment-detail-value">${this.escapeHtml(payment.note)}</div>
      </div>
      ` : ''}
      <div class="payment-detail">
        <div class="payment-detail-label">Dicatat Pada</div>
        <div class="payment-detail-value">${formattedProcessedDate}</div>
      </div>
    `;
    
    document.getElementById('paymentDetailBody').innerHTML = detailHTML;
    this.showModal('paymentDetailModal');
  }
  
  // ==================== FUNGSI PENGELUARAN ====================
  addExpense() {
    const date = document.getElementById('expenseDate').value;
    const amount = parseInt(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value.trim();
    
    // Validasi input
    if (!date || isNaN(amount) || amount < 1000 || !category || !description) {
      this.toast.show('error', 'Error', 'Harap lengkapi semua data dengan benar (minimal Rp 1.000)');
      return;
    }
    
    const newExpense = {
      id: Date.now().toString(),
      date,
      amount,
      category,
      description,
      createdAt: new Date().toISOString()
    };
    
    this.expenses.push(newExpense);
    this.saveExpenses();
    
    // Reset form
    document.getElementById('expenseForm').reset();
    document.querySelectorAll('.expense-category-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Muat ulang data
    this.loadExpenses();
    this.calculateCompanyBalance();
    
    // Tampilkan notifikasi
    this.toast.show('success', 'Berhasil', 'Pengeluaran berhasil ditambahkan');
  }
  
  loadExpenses() {
    const expenseList = document.getElementById('expenseList');
    if (!expenseList) return;
    
    expenseList.innerHTML = '';
    
    let totalExpense = 0;
    const currentMonth = new Date().getMonth() + 1;
    
    // Urutkan pengeluaran (terbaru dulu)
    const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach((expense, index) => {
      const expenseDate = new Date(expense.date);
      const formattedDate = expenseDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      // Hitung total untuk bulan ini
      if (expenseDate.getMonth() + 1 === currentMonth && expenseDate.getFullYear() === this.currentYear) {
        totalExpense += expense.amount;
      }
      
      const row = document.createElement('tr');
      row.dataset.id = expense.id;
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${formattedDate}</td>
        <td>${this.escapeHtml(expense.category)}</td>
        <td>Rp ${expense.amount.toLocaleString('id-ID')}</td>
        <td>${this.escapeHtml(expense.description)}</td>
        <td class="action-buttons">
          <button class="btn btn-danger btn-sm delete-expense-btn">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      expenseList.appendChild(row);
    });
    
    const totalExpenseAmount = document.getElementById('totalExpenseAmount');
    if (totalExpenseAmount) totalExpenseAmount.textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
  }
  
  selectExpenseCategory(element, category) {
    // Hapus active dari semua kategori
    document.querySelectorAll('.expense-category-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Tambahkan active ke kategori yang dipilih
    element.classList.add('active');
    document.getElementById('expenseCategory').value = category;
  }
  
  deleteExpensePrompt(id) {
    this.currentExpenseId = id;
    this.showModal('deleteExpenseModal');
  }
  
  confirmDeleteExpense() {
    if (!this.currentExpenseId) return;
    
    this.expenses = this.expenses.filter(e => e.id !== this.currentExpenseId);
    this.saveExpenses();
    
    this.closeModal(document.getElementById('deleteExpenseModal'));
    this.loadExpenses();
    this.calculateCompanyBalance();
    
    this.toast.show('success', 'Berhasil', 'Pengeluaran berhasil dihapus');
  }
  
  // ==================== FUNGSI KOMPLAIN ====================
  addKomplain() {
    const customerId = document.getElementById('selectCustomer').value;
    const isi = document.getElementById('komplainText').value.trim();
    
    if (!customerId || !isi) {
      this.toast.show('error', 'Error', 'Harap pilih customer dan isi komplain');
      return;
    }
    
    const newKomplain = {
      id: Date.now().toString(),
      customerId,
      isi,
      tanggal: new Date().toISOString(),
      status: 'Baru'
    };
    
    this.komplainList.unshift(newKomplain); // Tambahkan di awal array
    this.saveKomplain();
    
    // Reset form
    document.getElementById('komplainText').value = '';
    
    // Muat ulang komplain
    this.loadKomplainGroups();
    
    // Tampilkan notifikasi
    this.toast.show('success', 'Berhasil', 'Komplain berhasil ditambahkan');
  }

  loadKomplainGroups() {
    const komplainGroupsElement = document.getElementById('komplainGroups');
    if (!komplainGroupsElement) return;
    
    komplainGroupsElement.innerHTML = '';
    
    if (this.komplainList.length === 0) {
      komplainGroupsElement.innerHTML = '<div class="no-komplain">Tidak ada komplain yang tercatat.</div>';
      return;
    }
    
    // Kelompokkan komplain berdasarkan customerId
    const komplainByCustomer = {};
    this.komplainList.forEach(komplain => {
      if (!komplainByCustomer[komplain.customerId]) {
        komplainByCustomer[komplain.customerId] = [];
      }
      komplainByCustomer[komplain.customerId].push(komplain);
    });
    
    // Urutkan berdasarkan jumlah komplain (terbanyak dulu)
    const sortedGroups = Object.entries(komplainByCustomer)
      .map(([customerId, komplains]) => {
        const customer = this.customers.find(c => c.id === customerId);
        return {
          customer,
          komplains: komplains.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)) // Urutkan komplain terbaru dulu
        };
      })
      .sort((a, b) => b.komplains.length - a.komplains.length); // Urutkan group by jumlah komplain
    
    // Buat tampilan komplain
    sortedGroups.forEach(group => {
      const groupElement = document.createElement('div');
      groupElement.className = 'komplain-group';
      groupElement.dataset.customerId = group.customer?.id || 'unknown';
      
      // Header dengan nama customer dan jumlah komplain
      const header = document.createElement('div');
      header.className = 'komplain-group-header';
      header.innerHTML = `
        <div class="komplain-group-title">
          ${group.customer ? this.escapeHtml(group.customer.nama) : 'Customer Tidak Ditemukan'}
          <span class="komplain-group-count">${group.komplains.length} komplain</span>
        </div>
        <div>
          <button class="btn btn-primary btn-sm toggle-komplain-btn">
            <i class="fas fa-eye"></i> Detail
          </button>
          <button class="btn btn-danger btn-sm delete-komplain-group-btn">
            <i class="fas fa-trash"></i> Hapus Semua
          </button>
        </div>
      `;
      
      // Body dengan daftar komplain (awalnya disembunyikan)
      const body = document.createElement('div');
      body.className = 'komplain-group-body';
      body.id = `komplain-detail-${group.customer?.id || 'unknown'}`;
      body.style.display = 'none';
      
      group.komplains.forEach(komplain => {
        const komplainDate = new Date(komplain.tanggal);
        const formattedDate = komplainDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const komplainItem = document.createElement('div');
        komplainItem.className = 'komplain-item';
        komplainItem.innerHTML = `
          <div class="komplain-content">${this.escapeHtml(komplain.isi)}</div>
          <div class="komplain-meta">
            <span>${formattedDate}</span>
            <span>${komplain.status}</span>
          </div>
        `;
        body.appendChild(komplainItem);
      });
      
      groupElement.appendChild(header);
      groupElement.appendChild(body);
      komplainGroupsElement.appendChild(groupElement);
    });
  }

  toggleKomplainDetail(customerId) {
    const detailElement = document.getElementById(`komplain-detail-${customerId}`);
    if (detailElement) {
      detailElement.style.display = detailElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  deleteAllKomplains(customerId) {
    if (confirm(`Apakah Anda yakin ingin menghapus semua komplain untuk customer ini?`)) {
      this.komplainList = this.komplainList.filter(k => k.customerId !== customerId);
      this.saveKomplain();
      this.loadKomplainGroups();
      this.toast.show('success', 'Berhasil', 'Semua komplain untuk customer ini telah dihapus');
    }
  }

  searchKomplain() {
    const searchTerm = document.getElementById('searchKomplain').value.toLowerCase();
    const groups = document.querySelectorAll('.komplain-group');
    
    groups.forEach(group => {
      const customerName = group.querySelector('.komplain-group-title').textContent.toLowerCase();
      const komplainItems = group.querySelectorAll('.komplain-item');
      let hasMatch = customerName.includes(searchTerm);
      
      // Jika nama customer tidak cocok, cek isi komplain
      if (!hasMatch) {
        komplainItems.forEach(item => {
          const content = item.querySelector('.komplain-content').textContent.toLowerCase();
          if (content.includes(searchTerm)) {
            hasMatch = true;
          }
        });
      }
      
      group.style.display = hasMatch ? '' : 'none';
    });
  }
  
  // ==================== FUNGSI LAPORAN ====================
  filterLaporan() {
    const monthSelect = document.getElementById('bulanLaporan');
    if (!monthSelect) return;
    
    const month = parseInt(monthSelect.value);
    
    const laporanList = document.getElementById('laporanList');
    if (!laporanList) return;
    
    laporanList.innerHTML = '';
    
    let totalSaldo = 0;
    
    // Urutkan pembayaran (terbaru dulu) dan exclude free customers
    const sortedPayments = [...this.payments]
      .filter(payment => {
        const bill = this.bills.find(b => b.id === payment.billId);
        const customer = this.customers.find(c => c.id === bill.customerId);
        return bill.month === month && bill.year === this.currentYear && customer && customer.amount > 0;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedPayments.forEach((payment, index) => {
      const bill = this.bills.find(b => b.id === payment.billId);
      if (!bill) return;
      
      const customer = this.customers.find(c => c.id === bill.customerId);
      if (!customer) return;
      
      totalSaldo += payment.amount;
      
      const paymentDate = new Date(payment.date);
      const formattedDate = paymentDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      const jatuhTempoDate = new Date(bill.year, bill.month - 1, bill.jatuhTempo);
      const isOnTime = paymentDate <= jatuhTempoDate;
      
      const row = document.createElement('tr');
      row.dataset.id = bill.id;
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${this.escapeHtml(customer.nama)}</td>
        <td>Rp ${payment.amount.toLocaleString('id-ID')}</td>
        <td>${formattedDate}</td>
        <td>${this.escapeHtml(payment.method)}</td>
        <td>
          <span class="badge ${isOnTime ? 'badge-success' : 'badge-danger'}">
            ${isOnTime ? 'Tepat Waktu' : 'Terlambat'}
          </span>
        </td>
        <td class="action-buttons">
          <button class="btn btn-primary btn-sm view-payment-btn">
            <i class="fas fa-eye"></i> Detail
          </button>
        </td>
      `;
      laporanList.appendChild(row);
    });
    
    const totalSaldoAmount = document.getElementById('totalSaldoAmount');
    if (totalSaldoAmount) totalSaldoAmount.textContent = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
  }
  
  // ==================== FUNGSI REKAPAN TAHUNAN ====================
  loadAnnualReport() {
    const yearSelect = document.getElementById('tahunRekapan');
    if (!yearSelect) return;
    
    const year = parseInt(yearSelect.value);
    
    const reportDetails = document.getElementById('annualReportDetails');
    if (!reportDetails) return;
    
    reportDetails.innerHTML = '';
    
    let annualIncome = 0;
    let annualExpense = 0;
    
    // Hitung pemasukan dan pengeluaran per bulan
    const monthlyData = Array(12).fill().map((_, monthIndex) => {
      const month = monthIndex + 1;
      
      // Hitung pemasukan bulan ini
      const monthlyIncome = this.payments.reduce((sum, payment) => {
        const bill = this.bills.find(b => b.id === payment.billId);
        if (!bill) return sum;
        
        const paymentDate = new Date(payment.date);
        if (paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month) {
          return sum + payment.amount;
        }
        return sum;
      }, 0);
      
      // Hitung pengeluaran bulan ini
      const monthlyExpense = this.expenses.reduce((sum, expense) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month) {
          return sum + expense.amount;
        }
        return sum;
      }, 0);
      
      // Hitung laba bulan ini
      const monthlyProfit = monthlyIncome - monthlyExpense;
      
      // Tambahkan ke total tahunan
      annualIncome += monthlyIncome;
      annualExpense += monthlyExpense;
      
      return {
        month,
        income: monthlyIncome,
        expense: monthlyExpense,
        profit: monthlyProfit
      };
    });
    
    // Tampilkan data bulanan
    monthlyData.forEach(data => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${this.getMonthName(data.month)}</td>
        <td class="income-cell">Rp ${data.income.toLocaleString('id-ID')}</td>
        <td class="expense-cell">Rp ${data.expense.toLocaleString('id-ID')}</td>
        <td class="profit-cell">Rp ${data.profit.toLocaleString('id-ID')}</td>
      `;
      reportDetails.appendChild(row);
    });
    
    // Hitung laba tahunan
    const annualProfit = annualIncome - annualExpense;
    
    // Update total tahunan
    const annualIncomeElement = document.getElementById('annualIncome');
    const annualExpenseElement = document.getElementById('annualExpense');
    const annualProfitElement = document.getElementById('annualProfit');
    
    if (annualIncomeElement) annualIncomeElement.textContent = `Rp ${annualIncome.toLocaleString('id-ID')}`;
    if (annualExpenseElement) annualExpenseElement.textContent = `Rp ${annualExpense.toLocaleString('id-ID')}`;
    if (annualProfitElement) annualProfitElement.textContent = `Rp ${annualProfit.toLocaleString('id-ID')}`;
  }
  
  // ==================== FUNGSI UTILITAS ====================
  calculateCompanyBalance() {
    // Hitung total pemasukan dari pembayaran
    const totalIncome = this.payments.reduce((sum, payment) => {
      return sum + payment.amount;
    }, 0);
    
    // Hitung total pengeluaran
    const totalExpense = this.expenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);
    
    // Hitung saldo
    const balance = totalIncome - totalExpense;
    
    // Update tampilan saldo
    const balanceElement = document.getElementById('companyBalance');
    if (balanceElement) {
      balanceElement.innerHTML = `<i class="fas fa-wallet"></i> Saldo Perusahaan: Rp ${balance.toLocaleString('id-ID')}`;
      
      // Update warna berdasarkan saldo
      if (balance > 0) {
        balanceElement.style.color = '#4cc9f0';
      } else if (balance < 0) {
        balanceElement.style.color = '#f72585';
      } else {
        balanceElement.style.color = '#f8961e';
      }
    }
    
    return balance;
  }
  
  getMonthName(monthNumber) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1];
  }
  
  // ==================== FUNGSI BACKUP & RESTORE ====================
  toggleBackupMenu() {
    const menu = document.getElementById('backupMenu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
  }
  
  backupData() {
    const data = {
      customers: this.customers,
      bills: this.bills,
      payments: this.payments,
      expenses: this.expenses,
      komplainList: this.komplainList,
      exportedAt: new Date().toISOString(),
      system: 'Billing System KH1992'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `Data-${new Date().toISOString().slice(0,10)}-Billing_KH1992.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.toast.show('success', 'Backup Berhasil', 'Data telah berhasil di-backup');
    this.toggleBackupMenu();
  }
  
  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (confirm('Apakah Anda yakin ingin mengimpor data? Data saat ini akan diganti!')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.customers && data.bills && data.payments && data.expenses && data.komplainList) {
            this.customers = data.customers;
            this.bills = data.bills;
            this.payments = data.payments;
            this.expenses = data.expenses;
            this.komplainList = data.komplainList;

            this.saveCustomers();
            this.saveBills();
            this.savePayments();
            this.saveExpenses();
            this.saveKomplain();

            this.toast.show('success', 'Import Berhasil', 'Data berhasil diimpor');
            this.loadInitialData();
          } else {
            this.toast.show('error', 'Format Tidak Valid', 'File backup tidak valid');
          }
        } catch (err) {
          this.toast.show('error', 'Error', 'Terjadi kesalahan saat membaca file');
        }
      };
      reader.readAsText(file);
    }
    
    // Reset input file
    event.target.value = '';
  }
  
  // ==================== FUNGSI EKSPOR DATA ====================
  exportToExcel(type) {
    let data = [];
    let fileName = '';
    let sheetName = '';
    
    switch(type) {
      case 'customers':
        data = this.customers.map(customer => {
          const customerBills = this.bills.filter(bill => bill.customerId === customer.id);
          const paidBills = customerBills.filter(bill => {
            return this.payments.some(payment => payment.billId === bill.id);
          });
          
          return {
            'Nama Customer': customer.nama,
            'Alamat': customer.alamat,
            'Kontak': customer.kontak,
            'IP Internet': customer.ip,
            'Nominal Tagihan': customer.amount === 0 ? 'Free' : 'Rp ' + customer.amount.toLocaleString('id-ID'),
            'Jatuh Tempo': customer.amount === 0 ? '-' : 'Tgl ' + customer.jatuhTempo,
            'Status': customer.amount === 0 ? 'Free' : 
                     (customerBills.length === paidBills.length ? 'Lengkap' : 
                     `${paidBills.length}/${customerBills.length}`),
            'Keterangan': customer.keterangan || '-'
          };
        });
        fileName = `Data_Customer_${new Date().toISOString().slice(0,10)}.xlsx`;
        sheetName = 'Customer';
        break;
        
      case 'bills':
        const month = parseInt(document.getElementById('bulanTagihan').value);
        data = this.bills
          .filter(bill => {
            const customer = this.customers.find(c => c.id === bill.customerId);
            return bill.month === month && bill.year === this.currentYear && customer && customer.amount > 0;
          })
          .map(bill => {
            const customer = this.customers.find(c => c.id === bill.customerId);
            const payment = this.payments.find(p => p.billId === bill.id);
            const jatuhTempoDate = new Date(bill.year, bill.month - 1, bill.jatuhTempo);
            
            let status = payment ? 'Lunas' : 
                        (jatuhTempoDate < new Date() ? 'Terlambat' : 'Belum Bayar');
            
            return {
              'Nama Customer': customer.nama,
              'Kontak': customer.kontak,
              'Bulan': this.getMonthName(bill.month) + ' ' + bill.year,
              'Nominal': 'Rp ' + bill.amount.toLocaleString('id-ID'),
              'Jatuh Tempo': jatuhTempoDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
              'Status': status,
              'Tanggal Bayar': payment ? new Date(payment.date).toLocaleDateString('id-ID') : '-',
              'Metode Bayar': payment ? payment.method : '-'
            };
          });
        fileName = `Data_Tagihan_${this.getMonthName(month)}_${this.currentYear}.xlsx`;
        sheetName = 'Tagihan';
        break;
        
      case 'payments':
        const paymentMonth = parseInt(document.getElementById('bulanLaporan').value);
        data = this.payments
          .filter(payment => {
            const bill = this.bills.find(b => b.id === payment.billId);
            const customer = this.customers.find(c => c.id === bill.customerId);
            return bill.month === paymentMonth && bill.year === this.currentYear && customer && customer.amount > 0;
          })
          .map(payment => {
            const bill = this.bills.find(b => b.id === payment.billId);
            const customer = this.customers.find(c => c.id === bill.customerId);
            const paymentDate = new Date(payment.date);
            const jatuhTempoDate = new Date(bill.year, bill.month - 1, bill.jatuhTempo);
            
            return {
              'Nama Customer': customer.nama,
              'Kontak': customer.kontak,
              'Bulan': this.getMonthName(bill.month) + ' ' + bill.year,
              'Nominal': 'Rp ' + payment.amount.toLocaleString('id-ID'),
              'Tanggal Bayar': paymentDate.toLocaleDateString('id-ID'),
              'Metode Bayar': payment.method,
              'Status': paymentDate <= jatuhTempoDate ? 'Tepat Waktu' : 'Terlambat',
              'Catatan': payment.note || '-'
            };
          });
        fileName = `Data_Pembayaran_${this.getMonthName(paymentMonth)}_${this.currentYear}.xlsx`;
        sheetName = 'Pembayaran';
        break;
        
      case 'expenses':
        data = this.expenses.map(expense => {
          const expenseDate = new Date(expense.date);
          return {
            'Tanggal': expenseDate.toLocaleDateString('id-ID'),
            'Kategori': expense.category,
            'Nominal': 'Rp ' + expense.amount.toLocaleString('id-ID'),
            'Keterangan': expense.description
          };
        });
        fileName = `Data_Pengeluaran_${new Date().toISOString().slice(0,10)}.xlsx`;
        sheetName = 'Pengeluaran';
        break;
        
      case 'komplain':
        data = this.komplainList.map(komplain => {
          const customer = this.customers.find(c => c.id === komplain.customerId);
          const komplainDate = new Date(komplain.tanggal);
          return {
            'Customer': customer ? customer.nama : 'Customer Tidak Ditemukan',
            'Kontak': customer ? customer.kontak : '-',
            'Isi Komplain': komplain.isi,
            'Tanggal & Jam Komplain': komplainDate.toLocaleString('id-ID')
          };
        });
        fileName = `Data_Komplain_${new Date().toISOString().slice(0,10)}.xlsx`;
        sheetName = 'Komplain';
        break;
    }
    
    if (data.length === 0) {
      this.toast.show('warning', 'Data Kosong', 'Tidak ada data yang bisa diekspor');
      return;
    }
    
    // Buat workbook dan worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Ekspor ke file Excel
    XLSX.writeFile(wb, fileName);
    
    this.toast.show('success', 'Ekspor Berhasil', `Data telah berhasil diekspor ke ${fileName}`);
  }

  exportAnnualReport() {
    const yearSelect = document.getElementById('tahunRekapan');
    if (!yearSelect) return;
    
    const year = parseInt(yearSelect.value);
    
    // Hitung total pemasukan, pengeluaran, dan laba per bulan
    const monthlyData = Array(12).fill().map((_, monthIndex) => {
      const month = monthIndex + 1;
      
      // Hitung pemasukan bulan ini
      const monthlyIncome = this.payments.reduce((sum, payment) => {
        const bill = this.bills.find(b => b.id === payment.billId);
        if (!bill) return sum;
        
        const paymentDate = new Date(payment.date);
        if (paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month) {
          return sum + payment.amount;
        }
        return sum;
      }, 0);
      
      // Hitung pengeluaran bulan ini
      const monthlyExpense = this.expenses.reduce((sum, expense) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month) {
          return sum + expense.amount;
        }
        return sum;
      }, 0);
      
      // Hitung laba bulan ini
      const monthlyProfit = monthlyIncome - monthlyExpense;
      
      return {
        month,
        income: monthlyIncome,
        expense: monthlyExpense,
        profit: monthlyProfit
      };
    });
    
    // Hitung total tahunan
    const annualIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
    const annualExpense = monthlyData.reduce((sum, month) => sum + month.expense, 0);
    const annualProfit = annualIncome - annualExpense;
    
    // Format data untuk Excel
    const excelData = [
      // Header
      ['Bulan', 'Pemasukan', 'Pengeluaran', 'Laba'],
      // Data bulanan
      ...monthlyData.map(month => [
        this.getMonthName(month.month),
        'Rp ' + month.income.toLocaleString('id-ID'),
        'Rp ' + month.expense.toLocaleString('id-ID'),
        'Rp ' + month.profit.toLocaleString('id-ID')
      ]),
      ['', ''],
      // Total tahunan
      ['TOTAL TAHUNAN', 
       'Rp ' + annualIncome.toLocaleString('id-ID'), 
       'Rp ' + annualExpense.toLocaleString('id-ID'), 
       'Rp ' + annualProfit.toLocaleString('id-ID')]
    ];
    
    // Buat workbook dan worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Tahunan');
    
    // Ekspor ke file Excel
    const fileName = `Rekap_Tahunan_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    this.toast.show('success', 'Ekspor Berhasil', `Rekap tahunan ${year} telah berhasil diekspor ke ${fileName}`);
  }
  
  // ==================== FUNGSI PENCARIAN ====================
  searchCustomers() {
    const input = document.getElementById('searchCustomer').value.toLowerCase();
    const rows = document.getElementById('customerList').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let found = false;
      
      for (let j = 1; j < 6; j++) {
        if (cells[j] && cells[j].textContent.toLowerCase().includes(input)) {
          found = true;
          break;
        }
      }
      
      rows[i].style.display = found ? '' : 'none';
    }
  }
  
  searchTagihan() {
    const input = document.getElementById('searchTagihan').value.toLowerCase();
    const rows = document.getElementById('tagihanList').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let found = false;
      
      for (let j = 1; j < 5; j++) {
        if (cells[j] && cells[j].textContent.toLowerCase().includes(input)) {
          found = true;
          break;
        }
      }
      
      rows[i].style.display = found ? '' : 'none';
    }
  }
  
  searchExpenses() {
    const input = document.getElementById('searchExpense').value.toLowerCase();
    const rows = document.getElementById('expenseList').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let found = false;
      
      for (let j = 2; j < 5; j++) {
        if (cells[j] && cells[j].textContent.toLowerCase().includes(input)) {
          found = true;
          break;
        }
      }
      
      rows[i].style.display = found ? '' : 'none';
    }
  }
  
  searchLaporan() {
    const input = document.getElementById('searchLaporan').value.toLowerCase();
    const rows = document.getElementById('laporanList').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let found = false;
      
      for (let j = 1; j < 6; j++) {
        if (cells[j] && cells[j].textContent.toLowerCase().includes(input)) {
          found = true;
          break;
        }
      }
      
      rows[i].style.display = found ? '' : 'none';
    }
  }
  
  // ==================== FUNGSI MODAL ====================
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }
  
  closeModal(modalElement) {
    if (modalElement) modalElement.style.display = 'none';
  }
  
  // ==================== FUNGSI UTILITAS LAINNYA ====================
  toggleNominalLain() {
    const nominalLainGroup = document.getElementById('nominalLainGroup');
    if (!nominalLainGroup) return;
    
    if (document.getElementById('paket').value === 'lain') {
      nominalLainGroup.style.display = 'block';
      document.getElementById('nominalLain').required = true;
    } else {
      nominalLainGroup.style.display = 'none';
      document.getElementById('nominalLain').required = false;
    }
  }
  
  escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // ==================== FUNGSI PENYIMPANAN DATA ====================
  saveCustomers() {
    localStorage.setItem('customers', JSON.stringify(this.customers));
  }
  
  saveBills() {
    localStorage.setItem('bills', JSON.stringify(this.bills));
  }
  
  savePayments() {
    localStorage.setItem('payments', JSON.stringify(this.payments));
  }
  
  saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(this.expenses));
  }
  
  saveKomplain() {
    localStorage.setItem('komplainList', JSON.stringify(this.komplainList));
  }
}

class Toast {
  constructor() {
    this.toastElement = document.getElementById('toast');
    this.timeout = null;
    
    // Event listener untuk tombol close
    this.toastElement.querySelector('.toast-close').addEventListener('click', () => this.hide());
  }
  
  show(type, title, message, duration = 3000) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    // Update icon
    const iconElement = this.toastElement.querySelector('.toast-icon i');
    iconElement.className = `fas ${icons[type] || 'fa-info-circle'}`;
    
    // Update konten
    this.toastElement.querySelector('.toast-title').textContent = title;
    this.toastElement.querySelector('.toast-message').textContent = message;
    
    // Update kelas untuk styling
    this.toastElement.className = `toast toast-${type} show`;
    
    // Auto hide
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.hide(), duration);
  }
  
  hide() {
    this.toastElement.classList.remove('show');
  }
}

// Inisialisasi aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const billingSystem = new BillingSystem();
  window.billingSystem = billingSystem; // Ekspos ke global scope untuk debugging
});
