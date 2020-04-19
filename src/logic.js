const net = require('net')
const fs = require('fs')
const http = require('http')
var path = require('path');
const nodeDiskInfo = require('node-disk-info'); //=> Use this when install as a dependency
const { dialog } = require('electron').remote
const downloadsFolder = require('downloads-folder');

console.log("bomber")

// Used in other files too
var saveFolder = ""
var freeDiskSpace = 0
var progress

document.addEventListener('DOMContentLoaded', function () {
    const fileManagerBtn = document.getElementById('openFile')
    const sendBtn = document.getElementById('send')
    const IPInput = document.getElementById('destIP')
    const pathP = document.getElementById('savePath')
    const selectBtn = document.getElementById('selectFolder')

    var openFilesResult = []

    // Magically it works also on windows
    saveFolder = downloadsFolder() + '/LANsend'
    if (!fs.existsSync(saveFolder)) {
        fs.mkdirSync(saveFolder);
    }
    pathP.innerText = saveFolder

    // Select different saving folder
    selectBtn.addEventListener('click', () => {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(result => {
            if (!result.canceled) {
                saveFolder = result.filePaths
                pathP.innerText = saveFolder
            }
        }).catch(err => {
            console.log(err)
        })
    })

    // Open choose file dialog
    fileManagerBtn.addEventListener('click', () => {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }).then(result => {
            if (!result.canceled) {
                openFilesResult = result.filePaths
            }
        }).catch(err => {
            console.log(err)
        })
    })

    // Send file
    sendBtn.addEventListener('click', () => {
        const IP = IPInput.value
        if (net.isIPv4(IP)) {
            openFilesResult.forEach(fileName => {
                sendFile(IP, fileName)
            })
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

    // Update available disk space
    setInterval(() => {
        nodeDiskInfo.getDiskInfo()
            .then(disks => {
                for (let d = 0; d < disks.length; d++) {
                    const element = disks[d];
                    if (saveFolder[0] == disks[d].mounted[0]) {
                        freeDiskSpace = disks[d].available
                    }
                }
            })
            .catch(reason => {
                console.error(reason);
            })
    }, 1000)

}, false);
