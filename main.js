var child_process = require('child_process');

var songRequests = [];

var clients = [
    {
        room: 'rancoud@chat.livecoding.tv',
        proc: undefined
    }
];

for (var i = 0; i < clients.length; i++) {
    clients[i].proc = child_process.fork(__dirname + '/clt.js');

    clients[i].proc.on('message', function(m) {
        console.log('PARENT a got message:', m);
        songRequests.push(m.songrequest);
    });

    clients[i].proc.send({ room: clients[i].room });
};

var express = require('express');
var app = new express();
var server = require('http').createServer(app);

app.use(express.static('public'));

app.get('/', function(req,res){
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/song-request', function(req,res){
    if(songRequests.length > 0) {
        var id = songRequests.pop();
        res.json({youtubeid: id});
    }
    else {
        res.json({youtubeid: null});
    }
});

app.get ('/kill', function(req,res){process.exit(1);} );

server.listen(8080, function() {
    console.log("Express server listening on port 8080");
});