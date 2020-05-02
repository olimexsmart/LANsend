function sendFiles(IP, fileNames, totSize) {

  const pu = new ProgressUpdater(fileNames.length, totSize, 0)

  // Preparing request notifing receiver that we want 
  let fileBaseNames = []
  for (let f = 0; f < fileNames.length; ++f) {
    fileBaseNames.push(path.basename(fileNames[f]))
  }
  const data = JSON.stringify({
    fileBaseNames: fileBaseNames,
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
    // Intercept errors
    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 507:
          alert("Selected device has not enough space")
          return
      }
    }

    // Intercept response data
    let body = []
    response.on('data', chunk => {
      body.push(chunk);
    })
    response.on('end', async () => {
      // TODO this string could contain some errors
      let port = parseInt(Buffer.concat(body).toString())
      pu.transferStart()

      // Send file one by one
      for (let f = 0; f < fileNames.length; ++f) {
        // Wait until this file is sent
        await new Promise((resolve, reject) => {
          const socket = net.connect(port, IP)

          socket.on('error', error => {
            console.log(error)
            reject(error)
          })

          // Open file to send
          const fileStream = fs.createReadStream(fileNames[f]);
          let progressChecker = null

          // Send file
          fileStream.on('open', () => {
            // This just pipes the read stream to the socket, closing it too
            fileStream.pipe(socket);
            progressChecker = setInterval((fileStreamToCheck, pu) => {
              pu.updateProgress(fileStreamToCheck.bytesRead)
              console.log(pu.summaryString())
            }, 1000, fileStream, pu)
          });

          // Socket closed automagically upon receiving FIN
          socket.on('close', () => {
            console.log("Socket closed")
            clearInterval(progressChecker)
            pu.fileTransfered(fileStream.bytesRead)
            resolve()
          })
        })
      }

      pu.transferDone()
      console.log(pu.doneString())
    })
  })

  httpClient.on('error', error => {
    console.error(error)
  })


  // Send request
  httpClient.write(data)
  httpClient.end()
}


