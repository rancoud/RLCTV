var child_process = require('child_process');

var a = child_process.fork(__dirname + '/clt.js');
var b = child_process.fork(__dirname + '/clt.js');

a.on('message', function(m) {
    console.log('PARENT a got message:', m);
});

b.on('message', function(m) {
    console.log('PARENT b got message:', m);
});

a.send({ room: 'rancoud@chat.livecoding.tv' });
b.send({ room: 'rlctv@chat.livecoding.tv' });