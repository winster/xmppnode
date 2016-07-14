var express = require('express'),
    https = require('https'),
    http = require('http'),    
    bodyParser = require('body-parser'),
    GCM = require('node-gcm-ccs'),
    WebSocketServer = require("ws").Server;

var app = express();
app.use(bodyParser.json());
var gcm = GCM('415730801579', 'AIzaSyCt-ul4GBpRr2-F0tnp4HwYAWGTO8pimLo');
 
gcm.on('message', function(messageId, from, category, data) {
    //var data = {"to":"driver@amadeus.com","from":"devi@amadeus.com", "message": {"type":"text","data":"hello"}}
    //var messageId = '12121212'
    //var from = 'cVIpH6npR3w:APA91bEYPMzCBOjALL1oRHBJOJ0nmXPDLvbZlJGHtyLx4cZuhwfD00iQTC3h0peL4gz0ZmtH9Ku4mlZ9MvS_CVkrsocycNWPVHP3XhBpY94CjczmlLSrrSGR-DAavaJOb8WQf2IXBVQA'
    console.log('message received::'+JSON.stringify(data))
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

wss.on("connection", function(ws) {
    var result = {'status':'connected'}
    ws.send(JSON.stringify(result), function() {  })
    console.log("websocket connection open");
    ws.on('message', function incoming(message) {
    console.log('received: %s', message);
        try{
            message = JSON.parse(message);
        } catch(e){
            message={"text":"send message in json format"};
        }
        var post_data = JSON.stringify(message)
        var auth = "Basic " + new Buffer(message.user + ":" + message.from).toString("base64");
        post_options.headers['Authorization'] = auth;
        post_options.headers['Content-Length'] = Buffer.byteLength(post_data);
        var post_req = https.request(post_options, (res) => {
            var json = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                json+=chunk
            });
            res.on('end', () => {
                //console.log('Response: ' + json);
                json=JSON.parse(json)
                var payload = {'user':message.user, 'message': message.content, 'id':message.messageId, 'time': message.time}
                gcm.send(json.token, payload, { delivery_receipt_requested: true }, (err, messageId, to) => {
                    if (!err) {
                        console.log('sent message to', to, 'with message_id =', messageId);
                    } else {
                        console.log('failed to send message');
                    }
                })
            });
        });
        post_req.write(post_data);
        post_req.end();    
    });
    ws.on("close", function() {
        console.log("websocket connection close");    
    });
});

exports = module.exports = app;