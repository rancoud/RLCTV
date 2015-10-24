var child_process = require('child_process');

var clients = [
    {
        room: 'rancoud@chat.livecoding.tv',
        proc: undefined
    }
    ,
    {
        room: 'rlctv@chat.livecoding.tv',
        proc: undefined
    }
];

for (var i = 0; i < clients.length; i++) {
    clients[i].proc = child_process.fork(__dirname + '/clt.js');

    clients[i].proc.on('message', function(m) {
        console.log('PARENT a got message:', m);
    });

    clients[i].proc.send({ room: clients[i].room });
};