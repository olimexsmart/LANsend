function scanPorts(selectElement) {

    const options = {
        target: '192.168.1.0/24',
        port: '11861',
        status: 'O', // Timeout, Refused, Open, Unreachable
        banner: true
    };

    let scanner = new evilscan(options);
    let nIP = 0


    scanner.on('result', data => {
        // Finding your own IP is useless
        if (data.ip == ipUtils.address()) {
            return
        }

        let tempIP = data.ip
        dns.reverse(data.ip, (err, hostname) => {
            // Empty options before adding new elements
            if (nIP == 0) {
                while (selectElement.firstChild) {
                    selectElement.removeChild(selectElement.firstChild)
                }
            }

            nIP++

            if (hostname != undefined) {
                if (hostname.length > 0) {
                    tempIP += ' ' + hostname[0]
                }
            }

            // Add option to select
            let tOpt = document.createElement('option');
            tOpt.value = tempIP
            tOpt.text = tempIP
            selectElement.appendChild(tOpt);
        })

        console.log("Found: " + tempIP)
    });

    scanner.on('error', err => {
        console.log(err)
    });

    scanner.on('done', () => {
        // If nothing found, replace with text
        if (nIP == 0) {
            while (selectElement.firstChild) {
                selectElement.removeChild(selectElement.firstChild)
            }

            selectElement.innerHTML = '<option value="nofound">No IPs found</option>'
        }
    });

    scanner.run();
}