# Indeks Changelog

Seluruh riwayat perubahan proyek diarsipkan dalam file terpisah per batas ukuran berkas (maksimal 250 KB per arsip) guna menjaga efisiensi pembacaan konteks AI dan mencegah duplikasi pekerjaan.

## Aturan Struktur
- **File Aktif**: File dengan nomor terbesar bertanda **(aktif)**. Seluruh entri baru wajib ditulis di bagian paling atas file aktif tepat di bawah `## Riwayat Perubahan`.
- **Urutan Kronologis Terbalik**: Riwayat perubahan selalu diurutkan dari waktu paling baru (atas) ke waktu paling lama (bawah).
- **Pencegahan Duplikasi**: Setiap entri mencatat file dan baris yang dimodifikasi (`file_path:baris_awal-baris_akhir`) serta status tuntas agar AI tidak mengulang modifikasi yang sudah sukses.

## Tabel Arsip Changelog

| Arsip | Rentang Tanggal | Jumlah Entri | Status | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| [`changelog/arsip-001.md`](changelog/arsip-001.md) | 2026-05-15 s/d 2026-10-09 | 37 entri | **(aktif)** | Inisialisasi awal, migrasi riwayat v0.4.46 s/d v0.5.99, serta penambahan fitur Agent Skills (@antislop-code) v1.0.3 |
