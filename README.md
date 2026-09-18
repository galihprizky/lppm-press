# Sistem Manajemen Mahasiswa

Aplikasi frontend Next.js + Tailwind CSS untuk mengelola data pengguna dan mahasiswa.

---

## Cara Menjalankan

### Prasyarat
- Node.js >= 18
- npm atau yarn

### Langkah-langkah

1. **Salin file-file ini ke project Next.js Anda**  
   Pastikan struktur folder sesuai dengan yang tertera di bawah.

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

4. **Buka browser** dan akses `http://localhost:3000`

5. **Login dengan akun demo:**
   - Email: `admin@kampus.ac.id`
   - Password: `admin123`

---

## Struktur Folder

```
src/
├── app/
│   ├── layout.js              # Root layout + font
│   ├── page.js                # Redirect otomatis
│   ├── globals.css            # Design tokens & global styles
│   ├── login/
│   │   └── page.js            # Halaman login
│   ├── register/
│   │   └── page.js            # Halaman registrasi
│   └── dashboard/
│       ├── layout.js          # Sidebar + auth guard
│       ├── page.js            # Dashboard (statistik)
│       ├── profil/
│       │   └── page.js        # Manajemen profil
│       └── mahasiswa/
│           ├── page.js        # Daftar + search + pagination
│           ├── tambah/
│           │   └── page.js    # Form tambah mahasiswa
│           └── [id]/
│               ├── page.js    # Detail mahasiswa
│               └── edit/
│                   └── page.js # Form edit mahasiswa
├── context/
│   └── AppContext.js          # Global state (Context API)
└── data/
    └── dummy.js               # Data dummy JSON
```

---

## Keputusan Arsitektur

### State Management — Context API
Dipilih **Context API** (bawaan React) karena skala aplikasi ini tidak membutuhkan solusi eksternal seperti Redux/Zustand. Semua state (pengguna, sesi, data mahasiswa) dikelola di satu `AppContext` yang mudah dibaca dan di-maintain.

### Persistensi — localStorage
Data disimpan di `localStorage` agar tidak hilang saat refresh halaman, mensimulasikan perilaku yang mirip dengan API nyata. Data dummy di-seed otomatis jika belum ada di storage.

### Routing — Next.js App Router
Menggunakan Next.js 13+ App Router dengan folder `app/`. Setiap halaman dibuat sebagai Client Component (`"use client"`) karena membutuhkan interaktivitas penuh (state, event handler).

### Autentikasi — Session sederhana
Login memeriksa email + password terhadap data dummy. Session disimpan di localStorage. Dashboard layout memiliki auth guard yang redirect ke login jika belum login.

### Styling — CSS Custom Properties + Tailwind
Design system dibangun dengan CSS variables (`--color-primary`, dll.) di `globals.css` untuk konsistensi warna dan theming. Tailwind digunakan untuk layout dan spacing. Class utility seperti `.card`, `.btn-primary`, `.input-base` mengurangi repetisi.

### Validasi Form
Validasi dilakukan di sisi client sebelum submit. Error ditampilkan per field secara real-time setelah form pertama kali disubmit.

---

## Fitur yang Diimplementasikan

| Fitur |
|-------|
| Login dengan email & password |
| Registrasi akun baru |
| Auth guard & redirect |
| Dashboard dengan statistik |
| Daftar mahasiswa (tabel responsif) |
| Pencarian real-time (NIM, nama, email) |
| Paginasi |
| Tambah mahasiswa |
| Detail mahasiswa |
| Edit mahasiswa |
| Hapus mahasiswa (konfirmasi modal) |
| Manajemen profil |
| Ubah password |
| Responsif (mobile & desktop) |
| Validasi form & error handling |
| Persistensi data (localStorage) |