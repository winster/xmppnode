var GCM = require('node-gcm-ccs');
var gcm = GCM('562766010128', 'AIzaSyBUEVVKBM3L93C92QMKDY7lfEEzNYTQuas');
 
gcm.on('message', function(messageId, from, category, data) {
	console.log('received message', arguments);
});
 
gcm.on('receipt', function(messageId, from, category, data) {
	console.log('received receipt', arguments);
});
 
gcm.send('', { message: 'hello world' }, { delivery_receipt_requested: true }, function(err, messageId, to) {
	if (!err) {
		console.log('sent message to', to, 'with message_id =', messageId);
	} else {
		console.log('failed to send message');
	}
})