var express = require('express');
var http = require('http');
var app = express();
var GCM = require('node-gcm-ccs');
var gcm = GCM('562766010128', 'AIzaSyBUEVVKBM3L93C92QMKDY7lfEEzNYTQuas');
 
gcm.on('message', function(messageId, from, category, data) {
	console.log('received message', arguments);
});
 
gcm.on('receipt', function(messageId, from, category, data) {
	console.log('received receipt', arguments);
});
 
gcm.send('e3zFrvuRPeo:APA91bHHmsZXAjvsXD-fvnEnjh-fKqLAWStbHf3GXmIKIESKDmBQ_Hcm4WTteHtyQNVuRHyaBkaeAhiSvbRG-RrEoPW49Yd_2-Cmdli-qMcHI5Pg5vCqkIkbSvUc3ruN1uGTZU8U_B9P', { message: 'hello world' }, { delivery_receipt_requested: true }, function(err, messageId, to) {
	if (!err) {
		console.log('sent message to', to, 'with message_id =', messageId);
	} else {
		console.log('failed to send message');
	}
})

var server = http.createServer(app)
server.listen(process.env.PORT || 5000)
console.log("http server listening on %d", port)