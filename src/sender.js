function sendFile(IP, fileName) {

  // Preparing data to be sent
  const stats = fs.statSync(fileName)
  const fileSizeInBytes = stats['size']
  const data = JSON.stringify({
    filename: path.basename(fileName),
    size: fileSizeInBytes
  })

  // Create HTTP POST request
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
    response.on('end', () => {
      body = Buffer.concat(body).toString()
      const socket = net.connect(parseInt(body), IP)

      socket.on('error', error => {
        console.log(error)
      })

      // Open file to send
      const fileStream = fs.createReadStream(fileName);

      // Send file
      fileStream.on('open', () => {
        // This just pipes the read stream to the socket, closing it too
        fileStream.pipe(socket);
      });

      // Socket closed automagically upon receiving FIN
      socket.on('close', () => {
        console.log("Socket closed")
      })
    })
  })

  httpClient.on('error', error => {
    console.error(error)
  })


  // Send request
  httpClient.write(data)
  httpClient.end()
}


