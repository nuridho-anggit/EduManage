const loginHandler = require('./handler/auth/login');
const registerHandler = require('./handler/auth/register');
const getProfileHandler = require('./handler/auth/getProfile');
const updateProfileHandler = require('./handler/auth/update');
const { inputIzinHandler, getIzinSiswaHandler, getIzinGuruHandler, getIzinHandler } = require('./handler/izin/handlerIzin');
const { inputArsipAkademikHandler, getArsipAkademikHandler } = require('./handler/arsipAkademik/arsip.js');


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
    method: 'PUT',
    path: '/profile',
    handler: updateProfileHandler,
    options: {
      auth: 'jwt',
    }
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
    path: '/izin/history',
    handler: getIzinHandler,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'POST',
    path: '/arsip-akademik',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // batas 10MB (opsional)
      },
      auth: 'jwt', // atau sesuai strategi yang kamu pakai
      handler: inputArsipAkademikHandler,
    }
  },
  {
    method: 'GET',
    path: '/arsip-akademik/history',
    handler: getArsipAkademikHandler,
    options: {
      auth: 'jwt',
    },
  },
]

module.exports = routes;