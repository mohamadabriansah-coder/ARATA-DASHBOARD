# ARATA Executive Dashboard

## Deskripsi Aplikasi

ARATA Executive Dashboard adalah aplikasi mobile berbasis React Native yang digunakan untuk memantau kinerja pekerja las (welder). Aplikasi memanfaatkan Axios untuk mengambil data dari API dan Firebase untuk autentikasi pengguna serta penyimpanan laporan ke database cloud.

## Anggota Kelompok dan Pembagian Tugas

1. MOHAMAD ABRIANSAH 0923040061 (Backend, State & Firebase Specialist)
2. FAJAR RAHMAT SETIAWAN 0923040073 (Frontend & Axios Specialist)

## Teknologi yang Digunakan

* React Native
* Expo
* Axios
* Firebase Authentication
* Firebase Firestore

## API yang Digunakan

### JSONPlaceholder API

Endpoint:

https://jsonplaceholder.typicode.com/users

Fungsi:
Mengambil data pengguna yang kemudian diolah menjadi data pekerja pada dashboard.

## Fitur Utama

### 1. Login Authentication

* Login menggunakan Firebase Authentication.
* Hanya pengguna yang terdaftar yang dapat mengakses aplikasi.

### 2. Sinkronisasi Data

* Mengambil data menggunakan Axios dari API.
* Menampilkan data pekerja pada dashboard.

### 3. Arsip Laporan

* Menyimpan laporan kinerja ke Firebase Firestore.
* Data tersimpan secara cloud dan dapat diakses kembali.

## Alur Sistem

User Login → Firebase Authentication → Dashboard → Axios Request ke API → Data Ditampilkan → Simpan Laporan ke Firestore
