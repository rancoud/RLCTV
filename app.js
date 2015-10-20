var Client = require('node-xmpp-client')
var confLogin = require('./conf.login.js');
var ltx = require('ltx');

var client = new Client({
    jid: confLogin.jid,
    password: confLogin.password
});

var users = [];
var isInitlistUsers = false;

function sendPresence(client) {
    client.send(new ltx.Element('presence', {to: confLogin.roomJid + '/' + confLogin.username}));
}

function sendMessage(client, message) {
    client.send(new ltx.Element('message', {to: confLogin.roomJid, type:"groupchat"}).c('body').t(message));
}

function readMessage(stanza) {
    var author = stanza.attrs.from.replace(confLogin.roomJid + '/', '');
    var msg = stanza.children[0].children.toString();
    console.log(author + ': ' + msg);
}

function updateListUsers(client, stanza) {
    var user = stanza.attrs.from.replace(confLogin.roomJid + '/', '');
    var role = undefined;
    if(stanza.children[1].children[0] !== undefined) {
        role = stanza.children[1].children[0].attrs.role;
    }
    else {
        role = stanza.children[2].children[0].attrs.role;
    }

    if(user === confLogin.username && role === undefined && isInitlistUsers === false) {
        isInitlistUsers = true;
        return;
    }

    if(role === undefined) {
        //out
        var _tmp = [];
        for (var i = 0; i < users.length; i++) {
            if(users[i].name != user) {
                _tmp.push(users[i]);
            }
        }
        users = _tmp;
        console.log(user + ' left!');
        sendMessage(client, "Oh non "+user+" est parti!");
    }
    else {
        //in
        for (var i = 0; i < users.length; i++) {
            if(users[i].name == user) {
                return;
            }
        }

        users.push({name:user, role:role});
        if(isInitlistUsers === true) {
            console.log(user + ' enter!');
            sendMessage(client, "OUIIII "+user+" est parmi nous!");
        }
    }
}

client.on('online', function(data) {
    console.log('online');
    sendPresence(client);
    //sendMessage(client, "Bonsoir / Hello, le streameur que vous regardez actuellement est fournit sans aucune drogue. Bonne soirée !");
});

client.on('stanza', function(stanza) {
    if(stanza.name == 'message') {
        readMessage(stanza);
    }
    else if(stanza.name == 'presence') {
        //console.log(stanza.toString());
        updateListUsers(client, stanza);
    }
    else {
        console.log(stanza.name);
    }
});