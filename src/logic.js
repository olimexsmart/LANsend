const net = require('net')
const fs = require('fs')
const http = require('http')
var path = require('path');
const nodeDiskInfo = require('node-disk-info'); //=> Use this when install as a dependency
const { dialog } = require('electron').remote
const downloadsFolder = require('downloads-folder');
const ipUtils = require('ip');
const openExplorer = require('open-file-explorer');
const evilscan = require('evilscan');
const dns = require('dns')



console.log("bomber")

// Used in other files too
var saveFolder = ""
var freeDiskSpace = 0
// var progress

var nReceiving = 0
var nSending = 0

document.addEventListener('DOMContentLoaded', function () {
    const fileManagerBtn = document.getElementById('openFile')
    const sendBtn = document.getElementById('send')
    const IPInput = document.getElementById('destIP')
    const pathP = document.getElementById('savePath')
    const selectBtn = document.getElementById('selectFolder')
    const yourIPP = document.getElementById('yourIP')
    const showFolderBtn = document.getElementById('showFolder')
    const filesOpenedP = document.getElementById('filesOpened')
    const listDestIPSel = document.getElementById('listDestIP')
    const freeSpaceP = document.getElementById('freeSpace')


    var openFilesResult = []
    var totalSize = 0

    // Update IP address of this machine
    yourIPP.innerText = "Your IP is: " + ipUtils.address()

    // Magically it works also on windows
    saveFolder = downloadsFolder() + '/LANsend'
    if (!fs.existsSync(saveFolder)) {
        fs.mkdirSync(saveFolder);
    }
    pathP.innerText = "Saving in: " + saveFolder

    // Select different saving folder
    selectBtn.addEventListener('click', () => {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(result => {
            if (!result.canceled) {
                saveFolder = result.filePaths
                pathP.innerText = "Saving in: " + saveFolder
            }
        }).catch(err => {
            console.log(err)
        })
    })

    // Open in explorer saving folder
    showFolderBtn.addEventListener('click', () => {
        openExplorer(saveFolder, err => {
            console.log(err);
        })
    })

    // Open choose file dialog
    fileManagerBtn.addEventListener('click', () => {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }).then(result => {
            if (!result.canceled) {
                openFilesResult = result.filePaths

                // Updating info about opened files
                let infoString = "Opened " + result.filePaths.length + " file"
                if (result.filePaths.length > 1) {
                    infoString += 's'
                }

                totalSize = 0
                for (let k = 0; k < openFilesResult.length; ++k) {
                    totalSize += fs.statSync(openFilesResult[k])['size']
                }

                filesOpenedP.innerText = infoString + ". Total size: " + ProgressUpdater.formatSize(totalSize)
            }
        }).catch(err => {
            console.log(err)
        })
    })

    // Send file
    sendBtn.addEventListener('click', () => {
        const IP = IPInput.value
        if (net.isIPv4(IP)) {
            sendFiles(IP, openFilesResult, totalSize)
            openFilesResult = []
            filesOpenedP.innerText = ""
        } else {
            // TODO consider output to user
            console.log("Invalid IP")
        }
    })

    // Check if input is valid IP address
    IPInput.addEventListener('keyup', () => {
        // TODO switch CSS classes here
        if (net.isIP(IPInput.value)) {
            IPInput.style.backgroundColor = 'rgba(51, 103, 59, 1)'
        } else {
            IPInput.style.backgroundColor = 'rgba(204, 63, 12, 1)'
        }
    })
    // Check IP the first time manually
    IPInput.dispatchEvent(new Event('keyup'))

    // Write in input selected IP
    listDestIPSel.addEventListener('click', (ev) => {
        let selected = listDestIPSel.options[listDestIPSel.selectedIndex]
        if (selected.value == 'nofound') {
            return
        }
        IPInput.value = selected.text
        IPInput.dispatchEvent(new Event('keyup'))
    })

    // Periodic operations
    setInterval( () => {
        checkSpace(freeSpaceP)

        // Update list of active hosts
        scanPorts(listDestIPSel)
    }, 10000)
    // Do it once at launch
    scanPorts(listDestIPSel)
    checkSpace(freeSpaceP)


}, false);

function checkSpace(textBox) {
    // Update available disk space
    nodeDiskInfo.getDiskInfo()
    .then(disks => {
        for (let d = 0; d < disks.length; d++) {
            const element = disks[d];
            if (saveFolder[0] == disks[d].mounted[0] && disks[d].mounted.length < 3) {
                freeDiskSpace = disks[d].available * 1e3
                textBox.innerText = "Free space: " + ProgressUpdater.formatSize(freeDiskSpace)
            }
        }
    })
    .catch(reason => {
        console.error(reason);
    })
}