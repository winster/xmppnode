var express = require('express'),
    https = require('https'),
    http = require('http'),    
    bodyParser = require('body-parser'),
    GCM = require('node-gcm-ccs'),
    WebSocketServer = require("ws").Server,
    shortid = require('shortid');

var app = express();
app.use(bodyParser.json());
var gcm = GCM('415730801579', 'AIzaSyCt-ul4GBpRr2-F0tnp4HwYAWGTO8pimLo');
 
gcm.on('message', function(messageId, from, category, data) {
    console.log('message received::'+JSON.stringify(data))
    //Using Websocket instead of this event
});
 
gcm.on('receipt', function(messageId, from, category, data) {
    console.log('received receipt', arguments);
});

var post_options = {
    host: 'surcle.herokuapp.com',
    port: '443',
    path: '/v1.0/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};
    
var server = http.createServer();
var wss = new WebSocketServer({server: server})
server.on('request', app);
server.listen(process.env.PORT || 5000, function () { 
    console.log('Listening on ' + server.address().port) 
});

var clients = {}

wss.on("connection", function(ws) {
    var connection_id = shortid.generate();
    clients[connection_id] = ws;
    ws.connection_id = connection_id;
    console.log("websocket connection open");
    var result = {'connection_id': connection_id}
    ws.send(JSON.stringify(result), function() {  })
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        ws.send(message, function() {console.log('echo sent')  });
        /*post_data = message;
        message = JSON.parse(message);
        var auth = "Basic " + new Buffer(message.user + ":" + message.token).toString("base64");
        post_options.headers['Authorization'] = auth;
        post_options.headers['Content-Length'] = Buffer.byteLength(post_data);
        var post_req = http.request(post_options, (res) => {
            var json = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                json+=chunk
            });
            res.on('end', () => {
                console.log(json)
                user=JSON.parse(json)
                if(user.error){
                    ws.send(json, function() {  });
                    return;
                }
                var payload = {'user':message.user, 'data': message.data, 'id':message.id, 'time': new Date().getTime()}
                if(user.online) {
                    if(user.connection_id) {
                        to_ws = clients[user.connection_id]
                        to_ws.send(JSON.stringify(payload), function() {  })
                    } else {
                        console.error('connection_id missing for user: %s not sending any message', message.to);
                    }
                } else {
                    gcm.send(user.token, payload, { delivery_receipt_requested: true }, (err, messageId, to) => {
                        if (!err) {
                            console.log('sent message to', to, 'with message_id =', messageId);
                        } else {
                            console.log('failed to send message');
                        }
                    })
                }
            });
        });
        post_req.write(post_data);
        post_req.end();*/
    });
    ws.on("close", function() {
        delete clients[ws.connection_id];
        console.log("websocket connection closed ::", Object.keys(clients));            
    });
});

exports = module.exports = app;
