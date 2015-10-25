exports.index = function(req, res) {
    console.log('users.index');
    res.render('users', {title:'Home'});
};