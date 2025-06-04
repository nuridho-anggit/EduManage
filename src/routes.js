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
]

module.exports = routes;