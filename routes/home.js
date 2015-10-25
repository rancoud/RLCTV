exports.index = function(req, res) {
    console.log('home.index');
    res.render('index', {title:'Home'});
};

exports.showLogin = function (req, res) {
    console.log('home.showLogin');
    res.render('login', {title:'Login'});
};

exports.doLogin = function (req, res) {
    console.log('home.doLogin');
    req.app.locals.warehouse.findUser(req.body.login, req.body.password, function(user){
        if(user !== null) {
            req.session.user = user;
            res.redirect('/dashboard');
        }
        else {
            res.render('login', {title:'Login'});
        }
    });
};

exports.showRegister = function (req, res) {
    console.log('home.showRegister');
    res.render('register', {title:'Register', error: ''});
};

exports.doRegister = function (req, res) {
    console.log('home.doRegister');
    var httpsLivecoding = require('https');
    httpsLivecoding.get('https://www.livecoding.tv/'+req.body.login+'/', function(resultFromLivecoding) {
        if(resultFromLivecoding.statusCode === 404) {
            res.render('register', {title:'Register', error: 'User not found on livecoding.tv'});
        }
        else if(resultFromLivecoding.statusCode === 200) {
            req.app.locals.warehouse.findUserByLogin(req.body.login, function(user){
                if(user !== null){
                    res.render('register', {title:'Register', error: 'User already registered'});
                }
                else {
                    req.app.locals.warehouse.addUser(req.body.login, req.body.password, function(user){
                        if(user !== null){
                            req.session.user = user;
                            res.redirect('/dashboard');
                        }
                        else {
                            res.render('register', {title:'Register', error: 'Error while register User'});
                        }
                    });
                }
            });
        }
    });
};

exports.logout = function (req, res) {
    console.log('home.logout');
    req.session = null;
    res.redirect('/');
};