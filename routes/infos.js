exports.index = function(req, res) {
    console.log('infos.index');
    res.render('infos', {title:'Home'});
};