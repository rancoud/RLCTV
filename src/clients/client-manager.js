function ClientManager() {
    this.clients = [];
}

ClientManager.prototype.getClient = function(room) {
    var that = this;

    for(var i = 0, max = that.clients.length; i < max; i++) {
        if(that.clients[i].room === room) {
            return that.clients[i];
        }
    }

    return null;
};

ClientManager.prototype.getStatus = function(room) {
    var that = this;
    var status = {online: false};

    var client = that.getClient(room);
    if(client === null) {
        return status;
    }

    status.online = (client.proc !== null);

    return status;
};

ClientManager.prototype.join = function(room) {
    var that = this;
    var child_process = require('child_process');

    var found = false;
    for(var i = 0, max = that.clients.length; i < max; i++) {
        if(that.clients[i].room === room) {
            found = true;
            if(that.clients[i].proc === null) {
                that.clients[i].proc.on('message', function(m) {
                    console.log('clt.js sent a message:', m);
                });

                that.clients[i].proc.send({room:room+'@chat.livecoding.tv'});
                that.clients[i].callbacks = [];
            }
            else {
                return false;
            }
        }
    }

    if(found === true) {
        return true;
    }

    var client = {
        proc: child_process.fork(__dirname + '/../../clt.js'),
        room: room
    };

    client.proc.on('message', function(msg) {
        console.log('clt.js sent a message:', msg);
        if(msg.callback){
            msg.callback(msg.data);
        }
    });

    client.proc.send({
        req: 'CONF-ROOM',
        room: room + '@chat.livecoding.tv'
    });

    that.clients.push(client);

    return true;
};

ClientManager.prototype.leave = function(room, callback) {
    var that = this;

    for(var i = 0, max = that.clients.length; i < max; i++) {
        if(that.clients[i].room === room) {
            that.clients[i].proc.kill();
            that.clients[i].proc = null;
            that.clients[i].callbacks = [];
            return true;
        }
    }

    return true;
};

ClientManager.prototype.getListUsers = function(room, callback) {
    var that = this;
    var listUsers = [];
console.log(room);
console.log(callback);
    var client = that.getClient(room);
    client.proc.send({
        req: 'LIST-USERS',
        callback: callback
    });

    return listUsers;
};

module.exports = ClientManager;