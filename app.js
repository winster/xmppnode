var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
var GCM = require('node-gcm-ccs');
var gcm = GCM('415730801579', 'AIzaSyCt-ul4GBpRr2-F0tnp4HwYAWGTO8pimLo');
 
gcm.on('message', function(messageId, from, category, data) {
    console.log('message received::'+data)
    data.messageId = messageId
    var post_data = JSON.stringify(data)
    var post_options = {
        host: 'surcle.herokuapp.com',
        port: '443',
        path: '/v1.0/message',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
    var post_req = http.request(post_options, (res) => {
    	var json = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            json+=chunk
        });
        res.on('end', () => {
            console.log('Response: ' + json);
            json=JSON.parse(json)
            gcm.send(json.token, { message: json.message }, { delivery_receipt_requested: true }, (err, messageId, to) => {
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
    console.log('received message', arguments);
});
 
gcm.on('receipt', function(messageId, from, category, data) {
    console.log('received receipt', arguments);
});

var server = http.createServer(app)
server.listen(process.env.PORT || 5000)
console.log("http server listening on %d", process.env.PORT || 5000)
