const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 }, () => {
    console.log("Signalling server is now listening on port 8081");
});

wss.broadcast = (ws, data) => {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', ws => {
    console.log(`Client connected. Total connected clients: ${wss.clients.size}`);
    ws.on("message", function message(data, isBinary) {
        try {
          const message = isBinary ? data : data.toString();
          const jsonData = JSON.parse(message);
          console.log(jsonData);
          wss.broadcast(ws, message);
        } catch (error) {
          console.log("Invalid JSON:", message);
        }
      });
    ws.on('close', ws=> {
        console.log(`Client disconnected. Total connected clients: ${wss.clients.size}`);
    })

    ws.on('error', error => {
        console.log(`Client error. Total connected clients: ${wss.clients.size}`);
    });
});