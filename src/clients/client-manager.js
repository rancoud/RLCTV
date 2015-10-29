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
                that.clients[i].proc = child_process.fork(__dirname + '/../../clt.js');
                that.clients[i].proc.on('message', function(i) {
                    return function(msg) {
                        console.log('clt.js sent a message:', msg);
                        if(msg.hash !== undefined) {
                            for (var j = 0; j < that.clients[i].callbacks.length; j++) {
                                if(that.clients[i].callbacks[j].hash === msg.hash) {
                                    that.clients[i].callbacks[j].callback(msg.data);
                                    that.clients[i].callbacks.splice(j, 1);
                                    break;
                                }
                            };
                        }
                    };
                }(i));

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
        room: room,
        callbacks: []
    };

    client.proc.on('message', function(msg) {
        console.log('clt.js sent a message:', msg);
        if(msg.hash !== undefined) {
            for (var i = 0; i < client.callbacks.length; i++) {
                if(client.callbacks[i].hash === msg.hash) {
                    client.callbacks[i].callback(msg.data);
                    client.callbacks.splice(i, 1);
                    break;
                }
            };
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
            if(that.clients[i].proc != null) {
                that.clients[i].proc.kill();
                that.clients[i].proc = null;
                that.clients[i].callbacks = [];
            }
            return true;
        }
    }

    return true;
};

ClientManager.prototype.getListUsers = function(room, callback) {
    var that = this;
    var listUsers = [];

    var hash = this.getHash();

    var client = that.getClient(room);
    client.callbacks.push({hash:hash, callback:callback});
    client.proc.send({
        req: 'LIST-USERS',
        hash: hash
    });

    return listUsers;
};

ClientManager.prototype.getHash = function() {
    return Date.now();
};

module.exports = ClientManager;