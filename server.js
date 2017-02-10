var express = require('express'),
  app = express();
var cnt = 0;
var bool = 0;
app.use(express.static(__dirname + '/'));
app.post("/plc/webvisu.htm", function (req, res) {
  if (bool === 0) bool = 1; else bool = 0;
  cnt++;
  if (cnt > 100) {
    cnt = 0;
  }
  res.send('|1.001|' + bool + '|' + cnt + '|Text|')
})
app.listen(8080);