// Mengimpor handler untuk berbagai rute (endpoints) yang ada di aplikasi
const loginHandler = require('./handler/auth/login');
const registerHandler = require('./handler/auth/register');
const getProfileHandler = require('./handler/auth/getProfile');
const updateProfileHandler = require('./handler/auth/update');
const { inputIzinHandler, getIzinSiswaHandler, getIzinGuruHandler, getIzinHandler } = require('./handler/izin/handlerIzin');
const { inputArsipAkademikHandler, getArsipAkademikHandler } = require('./handler/arsipAkademik/arsip.js');

// Mendefinisikan rute-rute untuk API
const routes = [
  {
    // Rute untuk metode GET pada path '/'
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return 'EduManage Backend us Running!'; // Menampilkan pesan ketika server berjalan
    },
  },
  {
    // Rute untuk mendapatkan profil pengguna (GET /profile)
    method: 'GET',
    path: '/profile',
    handler: getProfileHandler, // Menangani permintaan untuk mendapatkan profil
    options: {
      auth: 'jwt', // Menggunakan otentikasi JWT
    }
  },
  {
    // Rute untuk login (POST /login)
    method: 'POST',
    path: '/login',
    handler: loginHandler, // Menangani permintaan login
  },
  {
    // Rute untuk registrasi pengguna (POST /register)
    method: 'POST',
    path: '/register',
    handler: registerHandler, // Menangani permintaan registrasi
  },
  {
    // Rute untuk memperbarui profil pengguna (PUT /profile)
    method: 'PUT',
    path: '/profile',
    handler: updateProfileHandler, // Menangani permintaan untuk memperbarui profil
    options: {
      auth: 'jwt', // Menggunakan otentikasi JWT
    }
  },
  {
    // Rute untuk pengajuan izin (POST /izin)
    method: 'POST',
    path: '/izin',
    options: {
      payload: {
        output: 'stream', // Output payload sebagai stream
        parse: true,      // Memungkinkan parsing body
        allow: 'multipart/form-data', // Membolehkan form-data multipart untuk file upload
        multipart: true,  // Mengaktifkan multipart parsing
        maxBytes: 10 * 1024 * 1024, // Membatasi ukuran file maksimum 10MB
      },
      auth: 'jwt', // Menggunakan otentikasi JWT
      handler: inputIzinHandler, // Menangani pengajuan izin
    }
  },
  {
    // Rute untuk mendapatkan riwayat izin (GET /izin/history)
    method: 'GET',
    path: '/izin/history',
    handler: getIzinHandler, // Menangani permintaan untuk mengambil riwayat izin
    options: {
      auth: 'jwt', // Menggunakan otentikasi JWT
    },
  },
  {
    // Rute untuk pengajuan arsip akademik (POST /arsip-akademik)
    method: 'POST',
    path: '/arsip-akademik',
    options: {
      payload: {
        output: 'stream', // Output payload sebagai stream
        parse: true,      // Memungkinkan parsing body
        allow: 'multipart/form-data', // Membolehkan form-data multipart untuk file upload
        multipart: true,  // Mengaktifkan multipart parsing
        maxBytes: 10 * 1024 * 1024, // Membatasi ukuran file maksimum 10MB
      },
      auth: 'jwt', // Menggunakan otentikasi JWT
      handler: inputArsipAkademikHandler, // Menangani pengajuan arsip akademik
    }
  },
  {
    // Rute untuk mendapatkan riwayat arsip akademik (GET /arsip-akademik/history)
    method: 'GET',
    path: '/arsip-akademik/history',
    handler: getArsipAkademikHandler, // Menangani permintaan untuk mengambil riwayat arsip akademik
    options: {
      auth: 'jwt', // Menggunakan otentikasi JWT
    },
  },
];

// Mengekspos rute-rute untuk digunakan dalam server
module.exports = routes;
