
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
        const checksums = data.checksums
        const totSize = data.totSize
        const nFiles = fileBaseNames.length

        // Check if there is enough space to receive the file
        if (totSize > freeDiskSpace * 0.95) {
            alert("Not enough space to accept incoming data")
            response.writeHead(507)
            response.end()
            return
        }

        const pu = new ProgressUpdater(nFiles, totSize, 1)
        pu.transferStart()

        // Create the server that will listen for the incoming file
        const server = net.createServer()

        let f = 0 // Counter of how many file were received
        let checkInactiveHandle = 0
        // Write on file received data
        server.on('connection', socket => {
            // The connections must be incoming only from the sender
            // that made the HTTP request
            if (senderAddress != socket.remoteAddress) {
                socket.destroy()
                return
            }

            // No need to check server if there is a valid incoming connection
            clearTimeout(checkInactiveHandle)

            // saveFolder is a global variable defined in logic.js
            let filePath = saveFolder + '/' + fileBaseNames[f]
            let fileStream = fs.createWriteStream(filePath);
            let progressChecker = null
            f++

            fileStream.on('ready', () => {
                socket.pipe(fileStream);

                progressChecker = setInterval((fileStreamToCheck, pu) => {
                    const needToCancel = pu.updateProgress(fileStreamToCheck.bytesWritten)
                    if (needToCancel) {
                        socket.destroy()
                        clearInterval(progressChecker)
                        server.close(() => {
                            console.log("Server closed in cancellation")
                        })
                    }
                    console.log(pu.summaryString() + needToCancel.toString())
                }, 500, fileStream, pu)
            })

            // Close server when file is sent
            socket.on('end', async () => {
                clearInterval(progressChecker)

                pu.fileTransfered(fileStream.bytesWritten)

                // Checking file checksum
                let hash = await getChecksum(filePath)

                if (hash != checksums[f - 1]) {
                    console.error("Checksum error: " + hash + "!=" + checksums[f]);
                    // TODO tell something to the user
                    server.close(() => {
                        console.log("Server closed")
                    })
                }

                // If all the file were received, close server
                if (f >= nFiles) {
                    pu.transferDone()
                    console.log(pu.doneString())
                    server.close(() => {
                        console.log("Server closed")
                    })
                } else {
                    // Set a callback to close server if no file were sent
                    checkInactiveHandle = setTimeout(checkInactiveServer, 3000, server)
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
            response.writeHead(200)
            response.end(server.address().port.toString())

            // Set a callback to close server if no file were sent
            checkInactiveHandle = setTimeout(checkInactiveServer, 3000, server)
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





function generateChecksum(str, algorithm, encoding) {
    return
}