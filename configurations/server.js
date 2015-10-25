module.exports = {
    settings : {
        'case sensitive routing' : false,
        'env' : undefined,
        'etag' : undefined,
        'jsonp callback name' : undefined,
        'json replacer' : undefined,
        'json spaces' : undefined,
        'query parser' : undefined,
        'strict routing' : undefined,
        'subdomain offset' : undefined,
        'trust proxy' : undefined,
        'views' : undefined,
        'view cache' : undefined,
        'view engine' : 'ejs',
        'x-powered-by' : false
    },
    setupSettings: function(app, conf) {
        for (var key in conf) {
            if(conf[key] !== undefined) {
                app.set(key, conf[key]);
            }
        }
    },
    locals : {
        port : 4040
    },
    setupLocals: function(app, conf) {
        for (var key in conf) {
            if(conf[key] !== undefined) {
                app.locals[key] = conf[key];
            }
        }
    },
};