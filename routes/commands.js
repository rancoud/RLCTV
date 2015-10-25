exports.index = function(req, res) {
    console.log('commands.index');
    res.render('commands', {title:'Home'});
};