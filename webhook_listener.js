const express = require('express');
const bodyParser = require('body-parser');
const EventEmitter = require('events');

const PORT = process.env.PORT || 80;

const app = express();
app.use(bodyParser.json());

class WebhookListener extends EventEmitter {
	listen() {
		app.post('/kofi', (req, res) => {
			const data = req.body.data;
			const { message, timestamp } = data;
			const amount = parseFloat(data.amount);
			const senderName = data.from_name;
			const paymentId = data.message_id;
			const paymentSource = 'Ko-fi';

			// The OK is just for us to see in Postman. Ko-fi doesn't care
			// about the response body, it just wants a 200.
			res.sendStatus(200);

			this.emit(
				'donation',
				paymentSource,
				paymentId,
				timestamp,
				amount,
				message,
				senderName,
			);
		});

		app.listen(PORT);
	}
}

const listener = new WebhookListener();
listener.listen();

module.exports = listener;