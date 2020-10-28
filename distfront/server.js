import express from 'express';
import path from 'path';
const app = express();
let DIRNAME = path.resolve(path.dirname(''));

// app.use( '/src', express.static( DIRNAME + '/src' ));
app.get('*', (req, res) => {
  switch(req.url){
    case '/':
      res.sendFile(path.join(DIRNAME + '/distfront/index.html'));
      break;
    case '/index.js':
      express.static.mime.define({'application/javascript': ['js']});
      res.setHeader('content-type', 'application/javascript');
      res.sendFile(path.join(DIRNAME + '/distfront/index.js'));
      break;
  }
});


app.listen(8080, () => console.log('Listening on port 8080!'));