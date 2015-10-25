function ClientManager() {
    this.clients = [];
}

ClientManager.prototype.getStatus = function(room, callback) {
    var that = this;
    var status = {online: false};

    that.clients.forEach(function(element) {
        if(element.room === room) {
            status.online = true;
            return true;
        }
    });

    return status;
};

ClientManager.prototype.join = function(room, callback) {
    var that = this;
    var child_process = require('child_process');

    var client = {
        proc: child_process.fork(__dirname + '/../../clt.js'),
        room: room
    };

    client.proc.on('message', function(m) {
        console.log('clt.js sent a message:', m);
    });

    client.proc.send({room:room+'@chat.livecoding.tv'});

    that.clients.push(client);

    return true;
};

ClientManager.prototype.leave = function(room, callback) {
    var that = this;

    for(var i = 0, max = that.clients.length; i < max; i++) {
        if(that.clients[i].room === room) {
            that.clients[i].proc.kill();
            that.clients[i].room = null;
            that.clients[i].proc = null;
            return true;
        }
    }

    return true;
};

module.exports = ClientManager;