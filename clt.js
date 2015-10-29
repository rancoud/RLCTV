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
        sendMessage(client, "Lists of commands:\n!favorite_language\n!favorite_framework\n!favorite_ide\n!favorite_viewer\n!favorite_music\n!streamingguide\n!support\n!newfeatures\n!tools\n!current_task\n!song_request Yl9p_qGQJlk");
    }

    if(message === "!favorite_language") {
        sendMessage(client, "PHP");
    }

    if(message === "!favorite_framework") {
        sendMessage(client, "Wordpress");
    }

    if(message === "!favorite_ide") {
        sendMessage(client, "Sublime Text 3");
    }

    if(message === "!favorite_viewer") {
        sendMessage(client, "you");
    }

    if(message === "!favorite_music") {
        sendMessage(client, "Taylor Swift - White Horse > https://www.youtube.com/watch?v=D1Xr-JFLxik");
    }

    if(message === "!streamingguide") {
        sendMessage(client, "Livecoding.tv streaming guide for Mac, Windows and Linux is here: https://www.livecoding.tv/streamingguide/");
    }

    if(message === "!support") {
        sendMessage(client, "Livecoding.tv support page is here: http://support.livecoding.tv/hc/en-us/");
    }

    if(message === "!newfeatures") {
        sendMessage(client, "Here is a list of new features Livecoding.tv released: \n Hire a Streamer & Pay \n Reddit stream announcement");
    }

    if(message === "!song") {
        sendMessage(client, "Current song playing is “Taylor Swift - White Horse”");
    }

    if(message === "!tools") {
        sendMessage(client, "Only my brain");
    }

    if(message === "!current_task") {
        sendMessage(client, "Dev ChatBot");
    }

    if(message.substr(0, 14) === "!song_request ") {
        //!song_request aeePeVUW6-k
        var youtubeid = message.substr(14);
        process.send({ songrequest: youtubeid });
        sendMessage(client, "Song request has been sent");
    }

    if(message === "!github") {
        sendMessage(client, "https://github.com/rancoud/RLCTV");
    }

    if(message === "!github commits") {
        sendMessage(client, "2hours ago: add readme instructions for easier install");
    }

    if(message === "!github stats") {
        sendMessage(client, "Original repo\n2 subscribers\n0 open issues\n0 stargazers\n0 forks");
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
        sendMessage(client, "See you soon "+user+"!");
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

function createSmallTalk(client) {
    var messages = ["Have you built any project like this before?", "Are you a professional engineer or student?", "Am in Paris. Which city are you in?"];
    sendMessage(client, messages[getRandomInt(0,messages.length-1)]);

    setTimeout(function(){
        createSmallTalk(client);
    },10*60*1000);
}

client.on('online', function(data) {
    console.log('online');
    sendPresence(client);
    //sendMessage(client, "Hello, current streamer is crazy. Have a nice day!");

    setTimeout(function(){
        createSmallTalk(client);
    },10*60*1000);
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