global.extractUniform = function extractUniform(results) {
    var nodes = [];
    for(var i = 0, max = results.length; i < max; i++) {
        for(node in results[i]) {
            nodes.push(results[i][node]);
        }
    }
    return nodes;
}

global.detectTypeProperties = function detectTypeProperties(name, props, prop) {
    if(typeof props[prop] == 'string') {
        return name + '.' + prop + ' = "' + props[prop] + '"';
    }
    else if(typeof props[prop] == 'boolean' || typeof props[prop] == 'number') {
        return name + '.' + prop + ' = ' + props[prop];
    }
    else {
        var _query = [];
        for (p in props[prop]) {
            if(typeof props[prop][p] == 'string') {
                _query.push('"' + props[prop][p] + '" IN ' + name + '.' + prop);
            }
            else {
                _query.push(props[prop][p] + ' IN ' + name + '.' + prop);
            }
        }

        return _query.join(' AND ');
    }
}

function GraphManager(conf) {
    if(conf === undefined) {
        return;
    }

    this.conf = conf;
    this.neo4j = require('neo4j');
    this.db = new this.neo4j.GraphDatabase('http://'+conf.login+':'+conf.password+'@localhost:7474');
    this.error = '';
}

GraphManager.prototype.neo4jIsOnline = function(callback) {
    var http = require('http');
    http.get('http://'+this.conf.login+':'+this.conf.password+'@localhost:7474', function(res){
        callback(true);
    }).on('error', function(e) {
        callback(false);
    });
};

GraphManager.prototype.query = function(query, params, callback) {
    var that = this;
    that.db.cypher({
        query: query,
        params: params
    }, function(err, results) {
        if (err) {
            that.error = err;
        }
        callback(results);
    });
};

// NODE
// --- CREATE
GraphManager.prototype.addNode = function(label, props, callback) {
    var _label = "";
    if(label !== null && label.length > 0) {
        _label = ":"+label;
    }

    var that = this;
    that.query("CREATE (n"+_label+" {props}) RETURN n", {props:props}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

// --- SELECT
GraphManager.prototype.getNodeById = function(id, callback) {
    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} RETURN n", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

GraphManager.prototype.getNodesByLabel = function(label, callback) {
    var that = this;
    that.query("MATCH (n:"+label+") RETURN n", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getNodesByProperties = function(props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('n', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    that.query("MATCH (n) WHERE " + query + " RETURN n", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getNodesByLabelAndProperties = function(label, props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('n', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    that.query("MATCH (n:" + label + ") WHERE " + query + " RETURN n", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getAllNodes = function(callback) {
    var that = this;
    that.query("MATCH (n) RETURN n", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getAllLabelsByNode = function(callback) {
    var that = this;
    that.query("MATCH n RETURN DISTINCT LABELS(n)", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

// --- UPDATE
GraphManager.prototype.addNodeLabel = function(id, label, callback) {
    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} SET n:"+label+" RETURN n", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

GraphManager.prototype.replaceNodeLabel = function(id, oldLabel, newLabel, callback) {
    var that = this;
    that.removeNodeLabel(id, oldLabel, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        that.addNodeLabel(id, newLabel, function(results){
            if(that.error.neo4j !== undefined) {
                throw that.error.neo4j.code;
            }

            callback(results);
        });
    });
};

GraphManager.prototype.removeNodeLabel = function(id, label, callback) {
    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} REMOVE n:"+label+" RETURN n", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

GraphManager.prototype.updateNodeProperties = function(id, props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('n', props, prop));
    }
    query = query.join(', ');

    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} SET " + query + " RETURN n", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

GraphManager.prototype.replaceNodeProperties = function(id, props, callback) {
    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} SET n = {props} RETURN n", {id:id, props:props}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

GraphManager.prototype.removeNodeProperties = function(id, props, callback) {
    var query = "";

    if(typeof props !== 'string') {
        var _str = [];
        for (var i = 0, max = props.length; i < max; i++) {
            _str.push("n." + props[i]);
        }
        query = _str.join(", ");
    }
    else {
        query = "n." + props;
    }

    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} REMOVE "+query+" RETURN n", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

GraphManager.prototype.removeAllNodeProperties = function(id, callback) {
    var that = this;
    that.query("MATCH (n) WHERE id(n) = {id} SET n = {props} RETURN n", {id:id, props:{}}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].n);
        }
    });
};

// --- DELETE
GraphManager.prototype.deleteNodeById = function(id, callback) {
    var that = this;
    that.query("MATCH (n)-[r]-() WHERE id(n)={id} DELETE r", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        that.query("MATCH (n) WHERE id(n)={id} DELETE n", {id:id}, function(results){
            if(that.error.neo4j !== undefined) {
                throw that.error.neo4j.code;
            }

            callback(true);
        });
    });
};

GraphManager.prototype.deleteNodeByLabel = function(label, callback) {
    var that = this;
    that.query("MATCH (n:" + label + ")-[r]-() DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        that.query("MATCH (n:" + label + ") DELETE n", {}, function(results){
            if(that.error.neo4j !== undefined) {
                throw that.error.neo4j.code;
            }

            callback(true);
        });
    });
};

GraphManager.prototype.deleteNodesByProperties = function(props, callback) {
    if(Object.keys(props).length === 0) {
        callback(false);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push (detectTypeProperties('n', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    that.query("MATCH (n)-[r]-() WHERE " + query + " DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        that.query("MATCH (n) WHERE " + query + " DELETE n", {}, function(results){
            if(that.error.neo4j !== undefined) {
                throw that.error.neo4j.code;
            }

            callback(true);
        });
    });
};

GraphManager.prototype.deleteNodesByLabelAndProperties = function(label, props, callback) {
    if(Object.keys(props).length === 0) {
        callback(false);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push (detectTypeProperties('n', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    that.query("MATCH (n:" + label + ")-[r]-() WHERE " + query + " DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        that.query("MATCH (n:" + label + ") WHERE " + query + " DELETE n", {}, function(results){
            if(that.error.neo4j !== undefined) {
                throw that.error.neo4j.code;
            }

            callback(true);
        });
    });
};

GraphManager.prototype.deleteAllNodes = function(callback) {
    var that = this;
    that.query("MATCH (n)-[r]-() DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        that.query("MATCH (n) DELETE n", {}, function(results){
            if(that.error.neo4j !== undefined) {
                throw that.error.neo4j.code;
            }

            callback(true);
        });
    });
};

// RELATION
// --- CREATE
GraphManager.prototype.addRelation = function(idFrom, idTo, options, callback) {
    var cypher = "MATCH (n),(m) WHERE id(n) = {idFrom} AND id(m) = {idTo} CREATE UNIQUE (n)-[r]->(m) SET r={props} RETURN r";
    var params = {idFrom: idFrom, idTo: idTo, props:{}};
    var opts = {
        type: false,
        unique: true,
        props: {}
    };

    opts = extend(opts, options);

    params.props = opts.props;

    if(opts.type !== false && opts.type.trim().length > 0) {
        cypher = cypher.replace('[r]', '[r:'+opts.type.trim()+']');
    }
    else {
        callback(false);
        return;
    }

    if(opts.unique === false) {
        cypher = cypher.replace(' UNIQUE', '');
    }

    var that = this;
    that.query(cypher, params, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].r);
        }
    });
};

// --- SELECT
GraphManager.prototype.getRelationById = function(id, callback) {
    var that = this;
    that.query("MATCH ()-[r]->() WHERE id(r) = {id} RETURN r", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getRelations = function(idFrom, idTo, options, callback) {
    var cypher = "MATCH (n)-[r]->(m) WHERE id(n) = {idFrom} AND id(m) = {idTo} RETURN r";
    var params = {idFrom: idFrom, idTo: idTo};
    var opts = {
        type: false
    };

    opts = extend(opts, options);

    if(opts.type !== false && opts.type.trim().length > 0) {
        cypher = cypher.replace('[r]', '[r:'+opts.type.trim()+']');
    }

    var that = this;
    that.query(cypher, params, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getRelationsByType = function(type, callback) {
    var that = this;
    that.query("MATCH ()-[r:"+type+"]->() RETURN r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getRelationsByProperties = function(props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('r', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    that.query("MATCH ()-[r]->() WHERE " + query + " RETURN r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getRelationsByTypeAndProperties = function(type, props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('r', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    that.query("MATCH ()-[r:" + type + "]->() WHERE " + query + " RETURN r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.getAllRelations = function(callback) {
    var that = this;
    that.query("MATCH ()-[r]->() RETURN r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

// --- UPDATE
GraphManager.prototype.replaceRelationType = function(id, oldType, newType, callback) {
    var that = this;
    that.query('MATCH (n)-[r:' + oldType + ']->(m) CREATE (n)-[r2:' + newType + ']->(m) SET r2 = r WITH r DELETE r', {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.updateRelationProperties = function(id, props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('r', props, prop));
    }
    query = query.join(', ');

    var that = this;
    that.query("MATCH ()-[r]->() WHERE id(r) = {id} SET " + query + " RETURN r", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].r);
        }
    });
};

GraphManager.prototype.replaceRelationProperties = function(id, props, callback) {
    var that = this;
    that.query("MATCH ()-[r]->() WHERE id(r) = {id} SET r = {props} RETURN r", {id:id, props:props}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].r);
        }
    });
};

GraphManager.prototype.removeRelationProperties = function(id, props, callback) {
    var query = "";

    if(typeof props !== 'string') {
        var _str = [];
        for (var i = 0, max = props.length; i < max; i++) {
            _str.push("r." + props[i]);
        }
        query = _str.join(", ");
    }
    else {
        query = "r." + props;
    }

    var that = this;
    that.query("MATCH ()-[r]->() WHERE id(r) = {id} REMOVE "+query+" RETURN r", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].r);
        }
    });
};

GraphManager.prototype.removeAllRelationProperties = function(id, callback) {
    var that = this;
    that.query("MATCH ()-[r]->() WHERE id(r) = {id} SET r = {props} RETURN r", {id:id, props:{}}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(results[0].r);
        }
    });
};

// --- DELETE
GraphManager.prototype.deleteRelation = function(idFrom, idTo, options, callback) {
    var cypher = "MATCH (n)-[r]->(m) WHERE id(n) = {idFrom} AND id(m) = {idTo} DELETE r";
    var params = {idFrom: idFrom, idTo: idTo};
    var opts = {
        type: false
    };

    opts = extend(opts, options);

    if(opts.type !== false && opts.type.trim().length > 0) {
        cypher = cypher.replace('[r]', '[r:'+opts.type.trim()+']');
    }

    var that = this;
    that.query(cypher, params, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteRelationById = function(id, callback) {
    var that = this;
    that.query("MATCH ()-[r]->() WHERE id(r) = {id} DELETE r", {id:id}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteRelationByType = function(type, callback) {
    var that = this;
    that.query("MATCH ()-[r:"+type+"]->() DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteRelationByProperties = function(props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('r', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    this.query("MATCH ()-[r]->() WHERE " + query + " DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteRelationByTypeAndProperties = function(type, props, callback) {
    if(Object.keys(props).length === 0) {
        callback(null);
        return;
    }

    var query = [];
    for (prop in props) {
        query.push(detectTypeProperties('r', props, prop));
    }
    query = query.join(' AND ');

    var that = this;
    this.query("MATCH ()-[r:" + type + "]->() WHERE " + query + " DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteAllRelations = function(callback) {
    var that = this;
    that.query("MATCH ()-[r]->() DELETE r", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

// LABEL
GraphManager.prototype.getAllLabels = function(callback) {
    var that = this;
    that.query("MATCH n RETURN DISTINCT LABELS(n)", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            var labels = extractUniform(results);
            var labelsArray = [];
            for (var i = 0, max = labels.length; i < max; i++) {
                labelsArray = labelsArray.concat(labels[i]);
            };
            callback(labelsArray);
        }
    });
};

GraphManager.prototype.replaceLabel = function(oldLabel, newLabel, callback) {
    var that = this;
    this.query('MATCH (n:' + oldLabel + ') REMOVE n:' + oldLabel + ' SET n:' + newLabel, {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

// TYPE
GraphManager.prototype.getAllTypes = function(callback) {
    var that = this;
    that.query("MATCH ()-[r]->() RETURN DISTINCT TYPE(r)", {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }

        if(results.length === 0) {
            callback(null);
        }
        else {
            callback(extractUniform(results));
        }
    });
};

GraphManager.prototype.replaceType = function(oldType, newType, callback) {
    var that = this;
    that.query('MATCH ()-[r:' + oldType + ']->() CREATE ()-[r2:' + newType + ']->() SET r2 = r WITH r DELETE r', {}, function(results){
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

// INDEX
GraphManager.prototype.addIndex = function(label, property, callback) {
    var that = this;
    that.query('CREATE INDEX ON :' + label + '(' + property + ')', {}, function(results) {
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteIndex = function(label, property, callback) {
    var that = this;
    that.query('DROP INDEX ON :' + label + '(' + property + ')', {}, function(results) {
        if(that.error.neo4j !== undefined) {
            if(that.error.neo4j.code === 'Neo.DatabaseError.Schema.IndexDropFailure') {
                that.error = '';
                callback(false);
                return;
            }
            else {
                throw that.error.neo4j.code;
            }
        }

        callback(true);
        return;
    });
};

// CONSTRAINT
GraphManager.prototype.addConstraint = function(label, property, callback) {
    var that = this;
    that.query('CREATE CONSTRAINT ON (n:' + label + ') ASSERT n.' + property + ' IS UNIQUE', {}, function(results) {
        if(that.error.neo4j !== undefined) {
            throw that.error.neo4j.code;
        }
        callback(true);
    });
};

GraphManager.prototype.deleteConstraint = function(label, property, callback) {
    var that = this;
    that.query('DROP CONSTRAINT ON (n:' + label + ') ASSERT n.' + property + ' IS UNIQUE', {}, function(results) {
        if(that.error.neo4j !== undefined) {
            if(that.error.neo4j.code === 'Neo.DatabaseError.Schema.ConstraintDropFailure') {
                that.error = '';
                callback(false);
                return;
            }
            else {
                throw that.error.neo4j.code;
            }
        }
        callback(true);
    });
};

module.exports = GraphManager;