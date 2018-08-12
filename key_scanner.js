const tesseract = require('node-tesseract');

// https://www.npmjs.com/package/node-tesseract

function filterCdKeyText(cdKey) {
    console.log(("CD Key scanned: '" + cdKey.replace(/\n*/g, '').white + "'").verbose);

    cdKey = cdKey.replace(/[^\w—-]/g, '');
    cdKey = cdKey.replace(/[—-]/g, '-');

    console.log(("CD Key filtered: '" + cdKey.white + "'").verbose);
    return cdKey
}

exports.recognice = function (imgPath) {
    const options = {
        l: 'eng'
    };

    return new Promise(function (resolve, reject) {
        tesseract.process(imgPath, options, function (err, text) {
            if (err) {
                console.error(err.warn);
                reject(err);
            } else {
                const cdKey = filterCdKeyText(text);
                resolve(cdKey)
            }
        });
    })
};