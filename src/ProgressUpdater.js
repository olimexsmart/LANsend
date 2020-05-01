class ProgressUpdater {
    constructor(nFiles, totSize, direction) {
        this.nFiles = nFiles
        this.totSize = totSize
        if (direction == 0) {
            this.direction = "Sending"
            this.directed = "Sent"
        }
        else {
            this.direction = "Receiving"
            this.directed = "Received"
        }

        // Data to update
        this.currentBytes = null
        this.totBytes = null

        this.currentSpeed = null
        this.finalSpeed = null

        this.startTime = null
        this.lastUpdateTime = null
        this.totTime = null

        this.totProgress = null
        this.fileProgress = null
        this.ETA = null

        // HTML
        this.defaultParent = document.getElementById('status')
        this.childP = undefined
        this.line1P = undefined
        this.line2P = undefined
        this.progProg = undefined

        this.appendHTML()
    }



    // Update from file streams
    updateProgress(nBytes) {
        let deltaBytes = nBytes - this.currentBytes
        this.currentBytes = nBytes
        this.totBytes += deltaBytes

        let deltaTime = Date.now() - this.lastUpdateTime
        this.lastUpdateTime = Date.now()
        this.currentSpeed = (deltaBytes / deltaTime) * 1000

        this.ETA = Math.ceil((this.totSize - this.totBytes) / this.currentSpeed)
        this.totProgress = this.totBytes / this.totSize

        this.updateHTML(false)
    }

    // Called before transfer starts
    transferStart() {
        this.lastUpdateTime = Date.now();
        this.startTime = this.lastUpdateTime

        this.currentBytes = 0
        this.totBytes = 0

        this.totProgress = 0
        this.fileProgress = 0
    }

    // Called when transfer ends
    transferDone() {
        this.totTime = (Date.now() - this.startTime) / 1000
        this.finalSpeed = this.totBytes / this.totTime

        this.updateHTML(true)
    }

    // Confirm transfer of a file
    fileTransfered(finalBytes) {
        this.updateProgress(finalBytes)

        this.fileProgress++
        this.currentBytes = 0
    }

    // Reduce to bigger units
    static formatSize(nBytes) {
        if (nBytes > 1e9)
            return (nBytes / 1e9).toFixed(1).toString() + 'GB'

        if (nBytes > 1e6)
            return (nBytes / 1e6).toFixed(1).toString() + 'MB'

        if (nBytes > 1e3)
            return (nBytes / 1e3).toFixed(1).toString() + 'KB'

        return nBytes.toString() + 'B'
    }

    // To print on console
    summaryString() {
        return `${this.direction} ${this.totProgress} ${this.fileProgress}/${this.nFiles} ${ProgressUpdater.formatSize(this.currentSpeed)}/s ${this.ETA}s`
    }

    // Final print
    doneString() {
        return `${this.directed} ${ProgressUpdater.formatSize(this.totBytes)} ${ProgressUpdater.formatSize(this.finalSpeed)}/s`
    }

    //////////////////////////////////

    hashString(s) {
        var hash = 0;
        if (s.length == 0) {
            return hash;
        }
        for (var i = 0; i < s.length; i++) {
            var char = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Called internally to update HTML
    updateHTML(completed) {
        if (!completed) {
            this.line1P.innerText = `${this.direction} ${this.fileProgress} of ${this.nFiles}`
            this.line2P.innerText = `${ProgressUpdater.formatSize(this.totBytes)}/${ProgressUpdater.formatSize(this.totSize)}   ${ProgressUpdater.formatSize(this.currentSpeed)}/s   ${this.ETA}s`
            this.progProg.value = Math.floor(this.totProgress * 100)
        } else {
            this.line1P.innerText = `${this.directed} ${this.fileProgress} of ${this.nFiles}`
            this.line2P.innerText = `${ProgressUpdater.formatSize(this.totBytes)}/${ProgressUpdater.formatSize(this.totSize)}   ${ProgressUpdater.formatSize(this.finalSpeed)}/s   ${this.totTime}s`
            this.progProg.value = 100
        }
    }

    // Used ad construction to create HTML elements
    appendHTML() {
        //let hash = this.hashString(`${this.totSize}${Date.now()}`)
        let hash = Date.now().toString()
        this.childP = document.createElement('div');
        this.defaultParent.appendChild(this.childP);
        // TODO start with hidden status
        let htmlCode = `
            <p id="${hash}line1"></p>
            <p id="${hash}line2"></p>
            <progress id="${hash}prog" value="0" max="100"></progress>
        <hr>`

        this.childP.innerHTML = htmlCode

        this.line1P = document.getElementById(`${hash}line1`)
        this.line2P = document.getElementById(`${hash}line2`)
        this.progProg = document.getElementById(`${hash}prog`)
    }

    // Used to remove HTML elements
    removeHTML() {
        this.defaultParent.removeChild(this.childP)
    }
}