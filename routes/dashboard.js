exports.index = function(req, res) {
    console.log('dashboard.dashboard');

    var status = req.app.locals.clientManager.getStatus(req.session.user.properties.login);

    res.render('dashboard', {title:'Dashboard', status:status});
};

exports.join = function(req, res) {
    console.log('dashboard.join');

    var status = req.app.locals.clientManager.join(req.session.user.properties.login);

    res.json({status:status});
};

exports.leave = function(req, res) {
    console.log('dashboard.leave');

    var status = req.app.locals.clientManager.leave(req.session.user.properties.login);

    res.json({status:status});
};