function sendFiles(IP, fileNames, totSize) {

  // Preparing request notifing receiver that we want 
  const data = JSON.stringify({
    nFiles: fileNames.length,
    totSize: totSize
  })

  // Create HTTP start POST request
  const httpClient = http.request({
    host: IP,
    port: 11861,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }, response => {
    // Intercept response data
    let body = []
    response.on('data', chunk => {
      body.push(chunk);
    })
    response.on('end', async () => {
      // TODO this string could contain some errors
      // HTTP port of our private server managing this transfer
      let transferServerPort = Buffer.concat(body).toString()

      // Send file one by one
      for (let f = 0; f < fileNames.length; ++f) {
        // Tell the receiver the name of the file we are about to send
        let transferData = JSON.stringify({
          fileName: path.basename(fileNames[f])
        })

        // Wait until this file is sent
        await new Promise((resolve, reject) => {
          // Ask for port where to send this file 
          const transferClient = http.request({
            host: IP,
            port: transferServerPort,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': transferData.length
            }
          }, response => {
            // Here we are receiving the port of the socket to send data to
            let body = []
            response.on('data', chunk => {
              body.push(chunk);
            })
            response.on('end', () => {
              // Port opened by the receiver listening for our data
              let port = parseInt(Buffer.concat(body).toString())
              
              const socket = net.connect(port, IP)

              socket.on('error', error => {
                console.log(error)
                reject(error)
              })

              // Open file to send
              const fileStream = fs.createReadStream(fileNames[f]);

              // Send file
              fileStream.on('open', () => {
                // This just pipes the read stream to the socket, closing it too
                fileStream.pipe(socket);
              });

              // Socket closed automagically upon receiving FIN
              socket.on('close', () => {
                console.log("Socket closed")
                resolve()
              })

            })
          })

          transferClient.on('error', error => {
            console.log(error)
          })

          // Send the request for this file
          transferClient.write(transferData)
          transferClient.end()
        })
      }
    })
  })

  httpClient.on('error', error => {
    console.error(error)
  })


  // Send request
  httpClient.write(data)
  httpClient.end()
}


