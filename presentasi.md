# Script Presentasi: Analisis Struktur Kode Project Topup Game Application

---

## 1. Pembukaan & Pengenalan Tech Stack (MERN + Next.js)

"Halo semuanya, pada kesempatan kali ini saya akan menjelaskan struktur teknis dari aplikasi Topup Game yang telah kami bangun. Aplikasi ini menggunakan arsitektur modern berbasis **MERN Stack**, namun dengan upgrade signifikan pada sisi Frontend menggunakan **Next.js**. Mari kita bedah satu per satu."

### Mengapa MERN Stack?
Stack ini dipilih karena menggunakan **JavaScript** secara menyeluruh (Fullstack JavaScript), memudahkan integrasi data dan pengembangan yang lebih cepat.

1.  **MongoDB (Database):** Database NoSQL yang fleksibel, menyimpan data dalam format JSON-like (BSON). Sangat cocok untuk produk game yang memiliki atribut dinamis (seperti spesifikasi akun/item yang beda-beda).
2.  **Express.js (Backend Framework):** Framework minimalis untuk Node.js yang menangani logika server, routing, dan API.
3.  **React (Frontend Library - via Next.js):** Library UI untuk membangun antarmuka yang interaktif. Kita menggunakan **Next.js** sebagai framework React untuk performa lebih baik (Server-Side Rendering) dan routing yang mudah (App Router).
4.  **Node.js (Runtime):** Lingkungan eksekusi JavaScript di sisi server.

---

## 2. Analisis Backend (Server-Side)

"Kita mulai dari belakang layar, yaitu Backend. Backend bertugas menyediakan API untuk frontend, mengelola database, dan menangani logika bisnis seperti transaksi."

### Struktur Folder Backend
"Struktur backend kita terorganisir dengan pola MVC (Model-View-Controller) yang dimodifikasi untuk API."

### A. Konfigurasi & Database
File-file ini adalah fondasi agar server bisa berjalan dan terhubung ke layanan lain.

| Nama File | Fungsi & Deskripsi |
| :--- | :--- |
| `server.js` | **Entry Point Utama.** File ini menjalankan server express, menghubungkan middleware (CORS, JSON parser), menghubungkan database, dan mendaftarkan semua route API (`/api/...`). |
| `config/index.js` | **Pusat Konfigurasi.** Menyimpan variabel lingkungan (Environment Variables) seperti Port server, MongoDB URI, JWT Secret, dan kredensial Email (Brevo) agar tidak hardcoded. |
| `db/mongoose.js` | **Koneksi Database.** Berisi fungsi `connect()` yang menggunakan library Mongoose untuk membuka koneksi ke MongoDB. |
| `middleware/auth.js` | **Keamanan (Satpam).** Fungsi middleware yang memeriksa apakah request memiliki **Token JWT** yang valid. Jika tidak, request akan ditolak (Unauthorized). Digunakan untuk melindungi route admin. |

### B. Models (Skema Database)
"Blueprint atau cetakan untuk data yang kita simpan di MongoDB."

| Nama File | Entitas | Deskripsi Field (Kolom) |
| :--- | :--- | :--- |
| `models/user.model.js` | **Admin** | `username`, `password_hash` (disimpan terenkripsi), `role` (hak akses). |
| `models/category.model.js` | **Kategori** | `name` (Nama kategori), `slug` (URL friendly name, misal: 'high-tier-accounts'). |
| `models/product.model.js` | **Produk** | `name`, `price`, `stock`, `image_url`, `category_id` (Relasi ke kategori), `specifications` (Objek fleksibel untuk detail item), `is_active`. |
| `models/transaction.model.js` | **Transaksi** | `invoice_number`, `email`, `user_roblox_username` (Opsional), `items` (Array produk yang dibeli), `total_transfer` (Harga + Kode Unik), `unique_code`, `status` (Pending/Success), `payment_deadline`. |

### C. Services & Utils
"Fungsi pembantu untuk logika khusus."

| Nama File | Fungsi Utama | Deskripsi |
| :--- | :--- | :--- |
| `services/email.service.js` | `sendInvoiceEmail` | Mengirim email invoice HTML otomatis ke pembeli menggunakan layanan SMTP (Brevo). Berisi template HTML email yang rapi. |
| `routes/upload.routes.js` | `upload.single('file')` | Menangani upload gambar produk menggunakan library **Multer**. Menyimpan file fisik di folder `/uploads` dan mengembalikan URL gambarnya. |

### D. Routes & Controllers (Logika Bisnis Utama)
"Disinilah otak dari aplikasi bekerja. Routes menentukan alamat URL, Controllers menangani logikanya."

#### 1. Produk & Kategori
| File Route | Endpoint (URL) | Method | Fungsi & Penjelasan |
| :--- | :--- | :--- | :--- |
| `routes/product.routes.js` | `/api/products` | **GET** | Mengambil semua produk aktif untuk ditampilkan di halaman utama (Public). |
| | `/api/products/:id` | **GET** | Mengambil detail satu produk berdasarkan ID. |
| | `/api/products` | **POST** | **(Admin Only)** Menambah produk baru ke database. |
| | `/api/products/:id` | **PUT** | **(Admin Only)** Mengupdate data produk (harga, stok, nama). |
| | `/api/products/:id` | **DELETE** | **(Admin Only)** Menghapus produk dan file gambarnya dari server. |
| `routes/category.routes.js` | `/api/categories` | **GET** | Mengambil daftar kategori untuk filter di frontend. |

#### 2. Transaksi (Pembelian)
Diatur di `controllers/transaction.controller.js`.

| File Route | Endpoint | Fungsi Controller | Deskripsi Proses |
| :--- | :--- | :--- | :--- |
| `routes/transaction.routes.js` | `/` (POST) | `createTransaction` | 1. Cek stok produk (kalo habis, error).<br>2. Hitung total harga.<br>3. Generate **Kode Unik** (3 digit acak).<br>4. Generate **Invoice Number**.<br>5. Kurangi stok produk.<br>6. Simpan transaksi status 'Pending'.<br>7. Kirim Email Invoice. |
| | `/search` (POST) | `searchTransactions` | Mencari transaksi berdasarkan Nomor Invoice atau Email pembeli untuk fitur "Check Order". |
| | `/analytics` (GET) | `getAnalytics` | **(Admin Only)** Menghitung total pendapatan, total order, success rate, dan grafik penjualan 7 hari terakhir (Agregasi Data). |

#### 3. Autentikasi & Admin
| File Route | Endpoint | Fungsi | Penjelasan |
| :--- | :--- | :--- | :--- |
| `routes/auth.routes.js` | `/login` (POST) | Login Admin | Memverifikasi username & password. Jika benar, memberikan **JWT Token** untuk akses dashboard. |
| `routes/admin.routes.js` | `/transactions` | List Transaksi | Mengambil SEMUA data transaksi untuk ditampilkan di tabel dashboard admin. |
| | `/transactions/:id` | Update Status | Mengubah status transaksi (Approve/Verify/Cancel). Jika Cancel, **Stok dikembalikan** otomatis ke produk. |

---

## 3. Analisis Frontend (Client-Side)

"Beralih ke Frontend, wajah dari aplikasi ini. Kita menggunakan **Next.js 16 (App Router)** yang modern."

### A. Utilitas & State Management (Penyimpanan Data Sementara)
Sebelum ke halaman, kita lihat dulu alat bantunya.

| Nama File | Tipe | Fungsi |
| :--- | :--- | :--- |
| `lib/api.ts` | **Axios Instance** | Mengatur koneksi ke Backend. Otomatis menyisipkan Token JWT di header jika user sedang login. |
| `store/cart.ts` | **Zustand Store** | Mengelola **Keranjang Belanja**. Data keranjang disimpan di *Local Storage* agar tidak hilang saat di-refresh. Fungsi: `addItem`, `removeItem`, `total`. |
| `store/auth.ts` | **Zustand Store** | Menyimpan Token Login Admin di memori aplikasi. |
| `hooks/useProducts.ts`| **Custom Hook** | Hook React reusable untuk mengambil data produk dari API, menangani loading state dan error handling. |

### B. Halaman Publik (User Biasa)
Struktur folder `frontend/app`.

| Path Halaman | File Utama | Fitur & Komponen Penting |
| :--- | :--- | :--- |
| `/` (Homepage) | `app/page.tsx` | - Menampilkan Hero Banner.<br>- **Search & Filter**: Mencari game/produk secara real-time.<br>- **Grid Produk**: Menampilkan kartu produk (`GameCard.tsx`). |
| `/game/[id]` | `app/game/[id]/page.tsx` | - Halaman **Detail Produk** dinamis.<br>- Menampilkan spesifikasi (Level, Rarity, dll) dengan ikon yang sesuai.<br>- Tombol **Add to Cart** (mengecek stok). |
| `/check-order` | `app/check-order/page.tsx` | - Form pencarian status pesanan.<br>- Menampilkan status real-time (Pending, Success, Failed).<br>- Menampilkan detail item yang dibeli. |
| `/about` | `app/about/page.tsx` | - Halaman profil tim pengembang.<br>- Animasi aesthetic untuk kartu profil. |
| Layout Utama | `app/layout.tsx` | - Membungkus seluruh aplikasi.<br>- Memasang **Navbar** dan **Footer** agar muncul di setiap halaman. |

### C. Halaman Admin (Protected)
Halaman ini butuh login.

| Path Halaman | File Utama | Fitur Utama |
| :--- | :--- | :--- |
| `/admin/login` | `app/admin/login/page.tsx` | - Form login aman dengan visual modern.<br>- Menyimpan token saat sukses login. |
| `/admin/dashboard`| `app/admin/dashboard/page.tsx` | - **Pusat Kontrol.**<br>- Menampilkan Grafik Analitik (`AnalyticsCharts.tsx`).<br>- Tabel Transaksi lengkap dengan tombol aksi (Approve/Cancel).<br>- Sidebar navigasi admin (`AdminSidebar.tsx`). |
| `/admin/products` | `app/admin/products/page.tsx` | - Manajemen Inventori.<br>- Tabel daftar produk (CRUD).<br>- Tombol Edit dan Hapus produk. |
| `/admin/products/new` | `.../new/page.tsx` | - Form tambah produk.<br>- Fitur **Dynamic Specifications**: Admin bisa menambah kolom spesifikasi kustom sebebasnya.<br>- Upload Gambar. |

### D. Komponen UI (User Interface)
Komponen kecil yang menyusun halaman.

| Nama Komponen | Lokasi | Fungsi |
| :--- | :--- | :--- |
| `Navbar.tsx` | `components/ui` | Navigasi atas, logo, dan tombol cart. Transparan dengan efek blur (glassmorphism). |
| `CartDrawer.tsx` | `components/ui` | Keranjang belanja model *drawer* (muncul dari samping). User bisa checkout dari sini. |
| `GameCard.tsx` | `components/ui` | Kartu produk individu, menampilkan gambar, harga, dan label stok. |
| `FileUpload.tsx` | `components/ui` | Komponen input file khusus yang menangani preview gambar sebelum di-upload dan mengirim file ke API upload. |
| `AnalyticsCharts.tsx`| `components/admin` | Visualisasi data penjualan (Revenue Trend & Top Products) menggunakan library **Recharts**. |

---

## 4. Fitur Unggulan: Transaksi Tanpa Login (Guest Checkout)

"Salah satu keunggulan utama aplikasi ini adalah kemudahan bertransaksi. User **TIDAK WAJIB Login** untuk membeli produk. Ini meningkatkan konversi penjualan karena mengurangi hambatan (friction) bagi pembeli."

### Bagaimana Alurnya Bekerja?
Fitur ini dimungkinkan oleh kerjasama antara Frontend dan Backend yang didesain fleksibel.

| Komponen | File Terkait | Penjelasan Logika |
| :--- | :--- | :--- |
| **Frontend UI** | `components/ui/CartDrawer.tsx` | Form checkout hanya meminta **Email** (wajib) dan **Roblox Username** (opsional, tergantung jenis item). Tidak ada form login/register yang memaksa. |
| **API Route** | `backend/routes/transaction.routes.js` | **Baris Kode:** `router.post('/', transactionController.createTransaction);` <br> **Penjelasan:** Perhatikan bahwa pada baris ini, kita **TIDAK** menyisipkan middleware `auth` sebagai parameter kedua (tidak seperti route `/analytics`). Inilah yang membuat endpoint ini **Public** dan bisa diakses oleh siapa saja tanpa token JWT. |
| **Controller** | `controllers/transaction.controller.js` | **Baris Kode:** <br> ```javascript \n const { items, email } = req.body; \n if (!email) return res.status(400)... \n ``` <br> **Penjelasan:** Fungsi `createTransaction` langsung mengambil `email` dari `req.body` (data yang dikirim frontend). Ia **TIDAK** mengecek `req.user` (data login), sehingga validasi hanya fokus pada apakah email ada atau tidak untuk keperluan pengiriman invoice. |

"Dengan mekanisme ini, pembeli bisa *sat-set* belanja tanpa ribet bikin akun, tapi tetap aman karena bukti transaksi dikirim ke email."

---

## 5. Penutup

"Demikian penjelasan struktur kode Project Topup Game ini. Kita telah membangun sistem yang **End-to-End**:
1.  **Backend** yang kokoh dengan validasi stok, manajemen transaksi aman, dan notifikasi email.
2.  **Frontend** yang cepat, responsif, dan memiliki UI modern (Glassmorphism) serta fitur Admin yang lengkap (Analitik & Manajemen Produk).

Semua fungsi telah terintegrasi dengan baik untuk memastikan pengalaman pengguna yang mulus dari memilih game hingga pembayaran selesai."
