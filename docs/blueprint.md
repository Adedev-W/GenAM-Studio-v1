# **App Name**: AgentPulse

## Core Features:

- Dasbor Pemantauan Realtime: Menyediakan ikhtisar agen-agen yang berjalan (aktif, idle, error), throughput, dan tingkat keberhasilan dalam bentuk dasbor interaktif dan realtime.
- Tampilan Detail Agen: Menampilkan metrik performa mendalam untuk setiap agen individu, termasuk riwayat tindakan terakhir, antrean tugas, tujuan saat ini, dan penggunaan sumber daya.
- Panel Kontrol Agen: Memungkinkan operator untuk melakukan tindakan manajemen dasar pada agen, seperti memulai, menghentikan, menjeda, atau melanjutkan aktivitas.
- Konfigurasi Aturan & Peringatan: Membangun dan mengelola aturan peringatan berdasarkan ambang batas metrik atau anomali, dengan opsi notifikasi yang dapat disesuaikan (mis. email, Slack).
- Perancang Kebijakan Proaktif (dengan AI-Assist): Editor visual untuk mendefinisikan perilaku proaktif berbasis pemicu (jika X maka Y), dengan alat AI untuk menyarankan pola aturan atau membantu membangun kebijakan kompleks dari deskripsi bahasa alami.
- Mode Simulasi & Onboarding: Membuat agen dan tugas sintetis untuk tujuan pengujian, pengembangan, dan demonstrasi tanpa memengaruhi lingkungan produksi nyata.
- Audit Trail & Data Historis: Merekam log yang tidak dapat diubah dari semua aktivitas agen, perubahan kebijakan, dan tindakan pengguna untuk tujuan kepatuhan dan analisis.

## Style Guidelines:

- Palet warna gelap yang didominasi nuansa violet dan biru untuk mencerminkan lingkungan pemantauan berteknologi tinggi.
- Warna Primer: Ungu kebiruan terang (#6B5BF2) untuk elemen interaktif dan sorotan data penting, menciptakan kontras yang kuat pada latar belakang gelap.
- Warna Latar Belakang: Abu-abu keunguan yang sangat gelap (#211A29), konsisten dengan rona primer, namun sangat desaturasi untuk memberikan dasar yang tenang.
- Warna Aksen: Biru cerah (#87BBFF) yang melengkapi warna primer dan latar belakang, digunakan untuk penyorotan sekunder dan ikon notifikasi.
- Font untuk judul dan teks tubuh: 'Inter', sans-serif, untuk tampilan modern, bersih, dan mudah dibaca pada dasbor kaya data.
- Font untuk potongan kode: 'Source Code Pro', monospace, direkomendasikan untuk menampilkan aturan atau contoh skrip dalam Policy Designer.
- Menggunakan set ikon garis modern dan minimalis untuk indikator status (misalnya, hijau/merah/kuning untuk kesehatan agen) dan kontrol.
- Tata letak berbasis grid responsif yang mengoptimalkan tampilan metrik dan grafik. Komponen harus jelas dan terpisah, dengan fokus pada visualisasi data yang bersih.
- Transisi halus dan mikro-animasi saat pembaruan data, hover elemen, dan perubahan status komponen untuk meningkatkan pengalaman pengguna tanpa mengganggu.