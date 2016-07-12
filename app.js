var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
var GCM = require('node-gcm-ccs');
var gcm = GCM('415730801579', 'AIzaSyCt-ul4GBpRr2-F0tnp4HwYAWGTO8pimLo');
 
gcm.on('message', function(messageId, from, category, data) {
    //var data = {"to":"driver@amadeus.com","from":"devi@amadeus.com", "message": {"type":"text","data":"hello"}}
    //var messageId = '12121212'
    //var from = 'cVIpH6npR3w:APA91bEYPMzCBOjALL1oRHBJOJ0nmXPDLvbZlJGHtyLx4cZuhwfD00iQTC3h0peL4gz0ZmtH9Ku4mlZ9MvS_CVkrsocycNWPVHP3XhBpY94CjczmlLSrrSGR-DAavaJOb8WQf2IXBVQA'
    console.log('message received::'+JSON.stringify(data))
    data.messageId = messageId
    var post_data = JSON.stringify(data)
    var auth = "Basic " + new Buffer(data.user + ":" + from).toString("base64");
    var post_options = {
        host: 'surcle.herokuapp.com',
        port: '443',
        path: '/v1.0/message',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data),
            "Authorization" : auth
        }
    };
    var post_req = https.request(post_options, (res) => {
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
});
 
gcm.on('receipt', function(messageId, from, category, data) {
    console.log('received receipt', arguments);
});

app.listen(process.env.PORT || 5000, function() {
  console.log('GCM XMPP app is running on port', process.env.PORT || 5000);
});
exports = module.exports = app;
