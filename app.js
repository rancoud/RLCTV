var Client = require('node-xmpp-client')
var confLogin = require('./conf.login.js');
var ltx = require('ltx');

var client = new Client({
    jid: confLogin.jid,
    password: confLogin.password
});

function sendPresence(client) {
    client.send(new ltx.Element('presence', {to: confLogin.roomJid + '/' + confLogin.username}));
}

function sendMessage(client, message) {
    client.send(new ltx.Element('message', {to: confLogin.roomJid, type:"groupchat"}).c('body').t(message));
}

function readMessage(stanza) {
    //
}

client.on('online', function(data) {
    console.log('online', data);
    sendPresence(client);
    sendMessage(client, "Bonsoir / Hello");
});

client.on('stanza', function(stanza) {
    console.log('Incoming stanza: ', stanza.toString());
    readMessage(stanza.toString());
});