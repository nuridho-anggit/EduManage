const loginHandler = require('./handler/auth/login');
const registerHandler = require('./handler/auth/register');
const getProfileHandler = require('./handler/auth/getProfile');
const updateProfileHandler = require('./handler/auth/update');
const { inputIzinHandler, getIzinSiswaHandler, getIzinGuruHandler } = require('./handler/izin/handlerIzin');


const routes = [

  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return 'EduManage Backend us Running!';
    },
  },
  {

    method: 'GET',
    path: '/profile',
    handler: getProfileHandler,
    options: {
      auth: 'jwt',
    }
  },
  // Routes for user authentication and profile handling
  {

    method: 'POST',
    path: '/login',
    handler: loginHandler,
  },
  {
    method: 'POST',
    path: '/register',
    handler: registerHandler,
  },
  {
    method: 'POST',
    path: '/izin',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // batas 10MB (opsional)
      },
      auth: 'jwt', // atau sesuai strategi yang kamu pakai
      handler: inputIzinHandler,
    }
  },
  {
    method: 'GET',
    path: '/izin/siswa',
    handler: getIzinSiswaHandler,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'GET',
    path: '/izin/guru',
    handler: getIzinGuruHandler,
    options: {
      auth: 'jwt',
    },
  },
]

module.exports = routes;