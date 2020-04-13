console.log("bomber")

const { dialog } = require('electron').remote
const os = require('os')

document.addEventListener('DOMContentLoaded', function () {
    const fileManagerBtn = document.getElementById('openFile')

    fileManagerBtn.addEventListener('click', (event) => {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }).then(result => {
            console.log(result.canceled)
            console.log(result.filePaths)
        }).catch(err => {
            console.log(err)
        })
    })
}, false);

