class ProgressUpdater {
    constructor(nFiles, totSize) {
        this.nFiles = nFiles
        this.totSize = totSize

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
    }

    

    // Update from file streams
    updateProgress(nBytes) {
        let deltaBytes = nBytes - this.currentBytes
        this.currentBytes = nBytes
        this.totBytes += deltaBytes

        let deltaTime = Date.now() - this.lastUpdateTime
        this.lastUpdateTime = Date.now()
        this.currentSpeed = (deltaBytes / deltaTime) * 1000

        this.ETA = (this.totSize - this.totBytes) / this.currentSpeed
        this.totProgress = this.totBytes / this.totSize
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
        this.totTime = Date.now() - this.startTime
        this.finalSpeed = this.totBytes / this.totTime
    }

    // Confirm transfer of a file
    fileTransfered() {
        this.fileProgress++
        this.currentBytes = 0
    }

    // Reduce to bigger units
    formatSize(nBytes) {
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
        return `${this.totProgress} ${this.fileProgress}/${this.nFiles} ${this.formatSize(this.currentSpeed)}/s ${this.ETA}s`
    }

    // Final print
    doneString() {
        return `${this.formatSize(this.totBytes)} ${this.formatSize(this.finalSpeed)}/s`
    }

    //////////////////////////////////

    // Called internally to update HTML
    updateHTML() {

    }

    // Used ad construction to create HTML elements
    appendHTML() {

    }

    // Used to remove HTML elements
    removeHTML() {

    }
}