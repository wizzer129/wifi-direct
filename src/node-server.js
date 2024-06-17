// const express = require('express');
// const multer = require('multer');
// const path = require('path')
// const fs = require('fs');
// const cors = require('cors');
// const app = express();

// app.use(cors());
// app.use(express.json())
// const port = 8000;
// const UPLOAD_DIR = path.join(__dirname,'./uploads');

// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR);
// }
// // Configure multer for file storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log('???')
//     cb(null, UPLOAD_DIR); // Set the directory for uploads
//   },
//   filename: function (req, file, cb) {
//     const { chunkIndex } = req.body;
//     const originalName = file.originalname.split('.part')[0];

//     console.log('filename---------------------------------')
//     console.log(req.body)
//     console.log(chunkIndex, originalName)
//     cb(null, `${originalName}.part${chunkIndex}`);
//   }
// });

// const upload = multer({ storage: storage });

// // Route for file uploads
// app.post('/upload', upload.single('chunk'), async (req, res) => {
//   try {

//     console.log('0000000000000000')
//     console.log(req.body)

//     const { chunkIndex, totalChunks } = req.body;
//     console.log(chunkIndex, totalChunks)
//     const originalName = req.file.originalname.split('.part')[0];

//     // If it's the last chunk, combine all parts
//     if (parseInt(chunkIndex, 10) === parseInt(totalChunks, 10) - 1) {
//       const fileStream = fs.createWriteStream(path.join(UPLOAD_DIR, originalName));
//       fileStream.on('close', () => {
//         res.status(200).send('File uploaded successfully');
//       });

//       for (let i = 0; i < totalChunks; i++) {
//         console.log('chunk: ', i)
//         const chunkPath = path.join(UPLOAD_DIR, `${originalName}.part${i}`);
//         const chunkStream = fs.createReadStream(chunkPath);
//         chunkStream.pipe(fileStream, { end: false });
//         chunkStream.on('end', () => {
//           fs.unlinkSync(chunkPath); // Remove chunk file after appending
//         });
//       }

//       return fileStream.end();
//     } else {
//       console.log(`chunk ${chunkIndex} written, next.....`)
//       return res.status(200).send('Chunk uploaded successfully');
//     }
//   } catch (error) {
//         console.log(error)
//         return res.status(400)
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');

// const app = express();

// app.use(cors());
// app.use(express.json())

// const upload = multer({ storage: multer.memoryStorage() });

// app.post('/upload', upload.single('file'), (req, res) => {
//     console.log('received stuff')
//     const chunk = req.file.buffer;
//     const filePath = path.join(__dirname, 'uploads', 'large-file');

//     fs.appendFile(filePath, chunk, err => {
//         if (err) {
//             return res.status(500).send('Error saving chunk');
//         }
//         res.status(200).send('Chunk received');
//     });
// });

// app.listen(8000, () => {
//     console.log('Server started on port 8000');
// });

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

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

// Helper function to promisify the write method
function writeFileChunk(stream, chunk) {
    return new Promise((resolve, reject) => {
        if (!stream.write(chunk)) {
            // The write method returns false if the buffer is full
            stream.once('drain', resolve);
        } else {
            resolve();
        }
    });
}

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
					ws.send(JSON.stringify({ success: true }))
				});
			}
		} catch (error) {
			ws.send(JSON.stringify({ success: false, error }))
			console.error(error);
			throw error;
		}
	});

	ws.on('pong', () => {
		console.log('Received pong from client');
	});

	// Optionally send pings to the client
	// const pingInterval = setInterval(() => {
	// 	if (ws.readyState === WebSocket.OPEN) {
	// 		console.log('????');
	// 		ws.send('pong');
	// 	}
	// }, 15_000);

	ws.on('close', (errcode, result) => {
		if(errcode === 1000) {
			ws.send('error')
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
