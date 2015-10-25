exports.index = function(req, res) {
    console.log('songs.index');
    res.render('songs', {title:'Home'});
};