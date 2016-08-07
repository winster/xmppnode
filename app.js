var express = require('express'),
    https = require('https'),
    http = require('http'),    
    bodyParser = require('body-parser'),
    GCM = require('node-gcm-ccs'),
    WebSocketServer = require("ws").Server,
    shortid = require('shortid');

var app = express();
app.use(bodyParser.json());
var gcm = GCM('640723155266', 'AIzaSyC6jFXGk50i1dEfP0GJn5exE29j6z8O4h0');
 
gcm.on('message', function(messageId, from, category, data) {
    console.log('message received::'+JSON.stringify(data))
    //Using Websocket instead of this event
});
 
gcm.on('receipt', function(messageId, from, category, data) {
    console.log('received receipt', arguments);
});

gcm.on('connected', function(){console.log('connected')});
gcm.on('disconnected', function(){console.log('disconnected')});
gcm.on('online', function(){console.log('online')});
gcm.on('error', function(){console.log('error')});
gcm.on('message-error', function(message){console.log('message-error::', message)});

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
    console.log("websocket connection open %s", connection_id);
    var result = {'status':'connected','connection_id': connection_id}
    ws.send(JSON.stringify(result), function() {  })
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        if(message=="ping")
            return;
        post_data = message;
        message = JSON.parse(message);
        var auth = "Basic " + new Buffer(message.user + ":" + message.token).toString("base64");
        post_options.headers['Authorization'] = auth;
        post_options.headers['Content-Length'] = Buffer.byteLength(post_data);
        var post_req = https.request(post_options, (res) => {
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
                var payload = {'product_id':message.product_id, 'user':message.user, 'data': message.data, 
                    'type':message.type, 'id':message.id, 'time': new Date().getTime()}
                var useGCM = true;
                if(user.online && user.connection_id) {
                    if(to_ws = clients[user.connection_id]) {
                        to_ws.send(JSON.stringify(payload), function() {  })
                        useGCM = false;
                    }
                }
                if(useGCM) {
                    var queue = messageQueue[user.token]
                    if(!queue) {
                        queue = []
                    }
                    queue.push(payload)
                    messageQueue[user.token] = queue
                    sendToGCM(user.token)
                }
            });
        });
        post_req.write(post_data);
        post_req.end();
    });
    ws.on("close", function() {
        delete clients[ws.connection_id];
        console.log("websocket connection closed ::", Object.keys(clients));            
    });
});

var messageQueue={}
function sendToGCM(token){
    var len = messageQueue[token].length-1
    var payload = messageQueue[token][len]
    gcm.send(token, payload, { delivery_receipt_requested: true }, (err, messageId, to) => {
        if (!err) {
            console.log('sent message to', to, 'with message_id =', messageId);
            messageQueue[token].shift()
        } else {
            console.log('failed to send message');
            setTimeout(function() {
                sendToGCM(token)
            }, 3000);
        }
    })
}

exports = module.exports = app;
