const sharp = require('sharp');
const path = require('path');

const inputPath = path.resolve('./public/favicon.jpg');
const outputPath = path.resolve('./public/favicon.png');

sharp(inputPath)
  .resize(64, 64)
  .png({ quality: 80, compressionLevel: 9 })
  .toFile(outputPath)
  .then(() => {
    console.log('Successfully resized and compressed favicon to 64x64 PNG.');
  })
  .catch(err => {
    console.error('Error resizing favicon:', err);
  });
