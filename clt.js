var Client = require('node-xmpp-client')
var confLogin = require('./conf.login.js');
var ltx = require('ltx');

var client = new Client({
    jid: confLogin.jid,
    password: confLogin.password
});

var users = [];
var allUsers = [];
var isInitlistUsers = false;

function sendPresence(client) {
    client.send(new ltx.Element('presence', {to: confLogin.roomJid + '/' + confLogin.username}));
}

function sendMessage(client, message) {
    client.send(new ltx.Element('message', {to: confLogin.roomJid, type:"groupchat"}).c('body').t(message));
}

function readMessage(client, stanza) {
    var author = stanza.attrs.from.replace(confLogin.roomJid + '/', '');
    var msg = stanza.children[0].children.toString();
    console.log(author + ': ' + msg);

    if(stanza.children[2] === undefined || stanza.children[2].attrs.xmlns !== 'urn:xmpp:delay' && stanza.children[2].attrs.xmlns !== 'jabber:x:delay') {
        if(author !== 'rlctv') {
            detectCommand(client, msg);
        }
    }
}

function detectCommand(client, message) {
    if(message.charAt(0) !== "!") {
        return;
    }

    if(message === "!commands" || message === "!help") {
        sendMessage(client, "Lists of commands:\n!song_request Yl9p_qGQJlk");
    }

    if(message.substr(0, 14) === "!song_request ") {
        //!song_request aeePeVUW6-k
        var youtubeid = message.substr(14);
        process.send({ songrequest: youtubeid });
        sendMessage(client, "Song request has been sent");
    }

}

function updateListUsers(client, stanza) {
    var user = stanza.attrs.from.replace(confLogin.roomJid + '/', '');
    var role = undefined;

    if(stanza.children[1] === undefined) {
        console.log(stanza.toString());
        return;
    }

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
        if(user !== "tasakasan"){
            sendMessage(client, "See you soon "+user+"!");
        }
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
            for (var i = 0; i < users.length; i++) {
                for (var j = 0; j < allUsers.length; j++) {
                    if(user == allUsers[j]) {
                        sendMessage(client, "Welcome back "+user+"!");
                        return;
                    }
                }
            }
            sendMessage(client, "Welcome "+user+"!");
        }
        allUsers.push(user);
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

client.on('online', function(data) {
    console.log('online');
    sendPresence(client);
});

client.on('stanza', function(stanza) {
    if(stanza.name == 'message') {
        readMessage(client, stanza);
    }
    else if(stanza.name == 'presence') {
        updateListUsers(client, stanza);
    }
    else {
        console.log("XMPP Unknown: " + stanza.name);
    }
});

process.on('message', function(m) {
    if(m['req'] !== undefined) {
        if(m.req === 'CONF-ROOM') {
            confLogin.roomJid = m.room;
            process.send({
                res: 'CONF-ROOM',
                status: 'GOOD'
            });
        }
        else if(m.req === 'LIST-USERS') {
            process.send({
                res: 'LIST-USERS',
                data: {users:users},
                hash: m.hash
            });
        }
    }

    if(m['room'] !== undefined) {
        confLogin.roomJid = m.room;
        process.send(m);
    }

    if(m['users'] !== undefined) {
        process.send(users);
    }
});

function toUnicode(theString) {
  var unicodeString = '';
  for (var i=0; i < theString.length; i++) {
    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
    while (theUnicode.length < 4) {
      theUnicode = '0' + theUnicode;
    }
    theUnicode = '\\u' + theUnicode;
    unicodeString += theUnicode;
  }
  return unicodeString;
}

process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    chunk = chunk.trim();
    if(chunk.length > 0) {
      sendMessage(client, chunk);
    }
  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});
