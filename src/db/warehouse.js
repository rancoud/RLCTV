var GraphManager = require(__dirname + '/graph-manager.js');

function Warehouse(conf) {
    GraphManager.call(this, conf);
}

Warehouse.prototype = Object.create(GraphManager.prototype);
Warehouse.prototype.constructor = Warehouse;

Warehouse.prototype.dataInitialize = function(callback) {
    var that = this;

    that.neo4jIsOnline(function(isOnline){
        if(!isOnline) {
            throw "Neo4j is down"; 
        }

        that.getNodesByProperties({login:"admin", password:"admin"}, function(results){
            if(results == null) {
                console.log("CREATE DEFAULT BO USER");
                that.addNode('BackofficeUser', {login:"admin", password:"admin", role:"superadmin"}, function(results){
                    that.addConstraint('User', 'login', function() {
                        callback();
                    });
                });
            }
            else {
                callback();
            }
        });

    });

};

Warehouse.prototype.addUser = function(login, password, callback) {
    this.addNode("User", {login:login, password:password}, function(results){
        callback(results);
    });
};

Warehouse.prototype.findUser = function(login, password, callback) {
    this.getNodesByLabelAndProperties("User", {login:login, password:password}, function(results){
        var user = null;
        if(results !== null && results.length > 0) {
            user = results[0];
        }
        callback(user);
    });
};

Warehouse.prototype.findUserByLogin = function(login, callback) {
    this.getNodesByLabelAndProperties("User", {login:login}, function(results){
        var user = null;
        if(results !== null && results.length > 0) {
            user = results[0];
        }
        callback(user);
    });
};

module.exports = Warehouse;