console.log('START app.js %d', Date.now());

require('./src/extensions.js');

var configurations = {};
configurations.neo4j = require('./configurations/neo4j.js');
configurations.server = require('./configurations/server.js');

var express = require('express'),
    app = new express(),
    server = require('http').createServer(app),
    ent = require('ent'),
    session = require('cookie-session'),
    bodyParser = require('body-parser'),
    urlencodedParser = bodyParser.urlencoded({ extended: false });

configurations.server.setupSettings(app, configurations.server.settings);
configurations.server.setupLocals(app, configurations.server.locals);

// Utilisation des fichiers statiques du dossier public (img, css, js)
app.use(express.static('public'));

// Definition du chemin absolu de l'app
app.locals.dirname = __dirname;

// Clients XMPP
var ClientManager = require('./src/clients/client-manager.js');
app.locals.clientManager = new ClientManager();

// Utilisation des sessions (middleware)
app.use(session({secret: 'app'}));

// Vérification que c'est un utilisateur qui accède au backoffice (l'api est public)
app.use(function (req, res, next) {
    if(req.session.user === undefined) {
        var publicUrls = ['/', '/login', '/register', '/kill'];
        if(publicUrls.indexOf(req.url) === -1) {
            res.redirect('/');
            return;
        }
    }

    next();
});

// Routes
var home = require('./routes/home.js');
app.get ('/',         home.index);
app.get ('/login',    home.showLogin);
app.post('/login',    urlencodedParser, home.doLogin);
app.get ('/register', home.showRegister);
app.post('/register', urlencodedParser, home.doRegister);
app.get ('/logout',   home.logout);
app.get ('/kill',     function(req,res){process.exit(1);});

var dashboard = require('./routes/dashboard.js');
app.get ('/dashboard', dashboard.index);
app.post('/join',      dashboard.join);
app.post('/leave',     dashboard.leave);

var users = require('./routes/users.js');
app.get ('/users',   users.index);

var infos = require('./routes/infos.js');
app.get ('/infos',   infos.index);

var commands = require('./routes/commands.js');
app.get ('/commands',   commands.index);

var songs = require('./routes/song.js');
app.get ('/song',   songs.index);

// Initialisation de la base de données
var warehouse = require('./src/db/warehouse.js');
warehouse = new warehouse(configurations.neo4j);
app.locals.warehouse = warehouse;

function startServer() {
    server.listen(app.locals.port, function() {
        console.log("Express server listening on port " + app.locals.port);
    });
}

// Lancement du serveur une fois init prêt
warehouse.dataInitialize(startServer);