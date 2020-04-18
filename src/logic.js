const net = require('net')
const fs = require('fs')
const http = require('http')
var path = require('path');
const nodeDiskInfo = require('node-disk-info'); //=> Use this when install as a dependency
const { dialog } = require('electron').remote

console.log("bomber")

var openFilesResult = []

document.addEventListener('DOMContentLoaded', function () {
    const fileManagerBtn = document.getElementById('openFile')
    const sendBtn = document.getElementById('send')
    const IPInput = document.getElementById('destIP')


    // Open choose file dialog
    fileManagerBtn.addEventListener('click', (event) => {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }).then(result => {
            if(!result.canceled)
            openFilesResult = result.filePaths
        }).catch(err => {
            console.log(err)
        })
    })

    // Send file
    sendBtn.addEventListener('click', () => {
        const IP = IPInput.value
        // TODO check IP validity
        openFilesResult.forEach(fileName => {
            sendFile(IP, fileName)
        })
    })

}, false);



