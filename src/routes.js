const loginHandler = require('./handler/auth/login');
const registerHandler = require('./handler/auth/register');
const getProfileHandler = require('./handler/auth/getProfile');
const updateProfileHandler = require('./handler/auth/update');


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
        path: '/profile/{UserId}',
        handler: getProfileHandler,
        // options: {
        //   auth: 'jwt',
        // }
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
]

module.exports = routes;