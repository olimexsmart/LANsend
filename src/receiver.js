
// This server listens for start file transfer requests
const httpServer = http.createServer((request, response) => {

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
        const nFiles = data.nFiles
        const totSize = data.totSize

        // Check if there is enough space to receive the file
        // TODO we need to know where we are saving the file first



        // Create HTTP server that will handle this transfer
        // Count how many file we have received so far
        let t = 0
        const transferServer = http.createServer((request, response) => {
            // Collect fileName from POST body 
            let body = [];
            request.on('error', err => {
                console.error(err);
            })
            request.on('data', chunk => {
                body.push(chunk);
            })
            request.on('end', () => {

                let fileName = JSON.parse(Buffer.concat(body).toString()).fileName
                // saveFolder is a global variable
                let filePath = saveFolder + '/' + fileName

                // Create the server that will listen for the incoming file
                const server = net.createServer()

                // Write on file received data
                server.on('connection', socket => {
                    // saveFolder is a global variable defined in logic.js
                    let fileStream = fs.createWriteStream(filePath);
                    let progressChecker = null
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
                        clearInterval(progressChecker)
                        server.close(() => {
                            t++
                            if (t == nFiles)
                                transferServer.close()
                        });
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

        // Init this server and tell its port to the sender
        let tranHandle = null
        transferServer.listen(() => {
            response.writeHead(200);
            response.end(transferServer.address().port.toString());

            // Set a callback to close server if no file were sent
            // TODO 
            //tranHandle = setInterval(checkInactiveServer, 3000, server)
        })

        transferServer.on('close', () => {
            clearInterval(tranHandle)
        })
    });
});

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


