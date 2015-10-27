exports.index = function(req, res) {
    console.log('users.index');

    req.app.locals.clientManager.getListUsers(req.session.user.properties.login, function(data){
        res.render('users', {title:'Home', listUsers:data.users});
    });
};