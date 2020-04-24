
// This server listens for start file transfer requests
const httpServer = http.createServer((request, response) => {

    const senderAddress = request.socket.remoteAddress

    // Collect data from POST body 
    let body = [];
    request.on('error', err => {
        console.error(err);
    })
    request.on('data', chunk => {
        body.push(chunk);
    })
    request.on('end', () => {
        // Number of file sent and total size
        const data = JSON.parse(Buffer.concat(body).toString())
        const fileBaseNames = data.fileBaseNames
        const totSize = data.totSize
        const nFiles = fileBaseNames.length

        // Check if there is enough space to receive the file
        // TODO we need to know where we are saving the file first

        // Create HTTP server that will handle this transfer
        // Count how many file we have received so far



        // Create the server that will listen for the incoming file
        const server = net.createServer()

        let f = 0 // Counter of how many file were received
        // Write on file received data
        server.on('connection', socket => {
            // The connections must be incoming only from the sender
            // that made the HTTP request
            if (senderAddress != socket.remoteAddress) {
                socket.destroy()
                return
            }

            // saveFolder is a global variable
            let filePath = saveFolder + '/' + fileBaseNames[f]
            f++
            // saveFolder is a global variable defined in logic.js
            let fileStream = fs.createWriteStream(filePath);
            //let progressChecker = null

            fileStream.on('ready', () => {
                socket.pipe(fileStream);

                // progressChecker = setInterval(fileStreamToCheck => {
                //     progress = fileStreamToCheck.bytesWritten / size
                //     // This needs to be updated in GUI
                //     console.log(progress)
                // }, 200, fileStream)
            })

            // Close server when file is sent
            socket.on('end', () => {
                //clearInterval(progressChecker)

                // If all the file were received, close server
                if (f >= nFiles) {
                    server.close(() => {
                        console.log("Server closed")
                    })
                }
            })
        })

        server.on('error', error => {
            console.log(error)
        })

        server.listen({
            port: 0
        }, () => {
            // When the server is initialized
            // send the HTTP response with the port choosen
            response.writeHead(200);
            response.end(server.address().port.toString());

            // Set a callback to close server if no file were sent
            setTimeout(checkInactiveServer, 3000, server)
        });
    })
})

// Bind HTTP server to a know port
httpServer.listen({
    port: 11861
}, () => {
    console.log("HTTP server launched")
});


function checkInactiveServer(serverToClose) {
    serverToClose.getConnections((err, count) => {
        if (count == 0 && serverToClose.listening)
            serverToClose.close()
    })
}


