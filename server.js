var express = require('express'),
    app = express();
var cnt=0;
app.use(express.static(__dirname + '/'));
app.post("/plc/webvisu.htm", function (req, res) {
  cnt++;
  if (cnt > 100) {
    cnt = 0;
  }
  res.send('|1.001|0|' + cnt + '|Text|')
})
app.listen(8080);