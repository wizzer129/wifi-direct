const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Create an HTTP server
const server = http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end('Hello World\n');
});

// Increase timeout settings
server.timeout = 0; // This disables the timeout completely
server.keepAliveTimeout = 1200000;

const wss = new WebSocket.Server({ server });
let fileStream = null;

wss.on('connection', (ws) => {
	console.time('time-stamp');

	ws.on('message', (message) => {
		try {
			const key = message.length < 50 ? message.toString() : null;
			if (fileStream === null) {
				console.log('initializting file stream....');
				// First message contains the file name
				const { fileName } = JSON.parse(message);
				const filePath = path.join(__dirname, 'uploads', fileName);
				fileStream = fs.createWriteStream(filePath);
			} else if (key === 'END_OF_FILE') {
				console.log('finished');
				console.timeEnd('time-stamp');
				// End of file transmission
				fileStream.end();
				ws.send('File upload complete');
				ws.close();
			} else if (key === 'ping') {
				console.log('ping');
			} else {
				const res = JSON.parse(message);
				const { chunk, counter } = res;
				console.log('reading chunk: ', counter);
				// Writing file chunk
				const buffer = Buffer.from(chunk.toString(), 'base64');
				console.log('buffer length: ', buffer.length);
				fileStream.write(buffer, () => {
					ws.send(JSON.stringify({ success: true }));
				});
			}
		} catch (error) {
			ws.send(JSON.stringify({ success: false, error }));
			console.error(error);
			throw error;
		}
	});

	ws.on('pong', () => {
		console.log('Received pong from client');
	});

	ws.on('close', (errcode, result) => {
		if (errcode === 1000) {
			ws.send('error');
		}
		console.log(errcode, result.toString());
		console.log('WebSocket connection closed');
		// clearInterval(pingInterval);
	});

	ws.on('error', (error) => {
		console.error('WebSocket error:', error);
	});
});

// Start the server
server.listen(8000, () => {
	console.log('Server is listening on port 8000');
});

// console.log('WebSocket server running on ws://localhost:8000');
