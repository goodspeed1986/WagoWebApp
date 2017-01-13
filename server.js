var express = require('express'),
    app = express();
var cnt=0;
app.use(express.static(__dirname + '/public'));
app.post("/webvisu.htm", function (req, res) {
  cnt++;
  if (cnt > 100) {
    cnt = 0;
  }
  res.send('|0|' + cnt + '|12.0|')
})
app.listen(8080);