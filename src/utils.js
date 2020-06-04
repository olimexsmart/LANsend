const crypto = require('crypto');

function getChecksum(path) {
    return new Promise((resolve, reject) => {
        // crypto.createHash('sha1');
        // crypto.createHash('sha256');
        const hash = crypto.createHash('md5');
        const input = fs.createReadStream(path);

        input.on('error', reject);

        input.on('data', function (chunk) {
            hash.update(chunk);
        });

        input.on('close', function () {
            resolve(hash.digest('hex'));
        });
    });
}