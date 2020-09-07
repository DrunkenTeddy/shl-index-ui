// Serve API Documentation
const path = require('path');
const fs = require('fs');

export default (req, res) => {
  const filePath = path.resolve('./public/docs.html');
  const stat = fs.statSync(filePath);
  res.statusCode = 200;
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': stat.size,
  });

  const readStream = fs.createReadStream(filePath);

  readStream.pipe(res);
};