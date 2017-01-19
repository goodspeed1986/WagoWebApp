window.onload = function () {
    var sdbUrl = '../../plc/download.sdb'; // PLC 750-880
    var webvisuUrl = '../../plc/webvisu.htm'; // PLC 750-880
    getPlcVars(sdbUrl, function (err, varsJson) {
        if (!err) {
            CreateDom(varsJson);
            startPoll(varsJson, webvisuUrl);
        } else {
            alert(err)
            setTimeout(function () { getPlcVars(sdbUrl) }, 10000);
        }
    })

}

function CreateDom(varsJson) {
    var tbody = document.getElementById('varsTable').getElementsByTagName("TBODY")[0];
    //alert(JSON.stringify(varsJson));
    for (var i = 0; i < varsJson.length; i++) {
        var row = document.createElement("TR");
        var tdName = document.createElement("TD");
        tdName.appendChild(document.createTextNode(varsJson[i].Name));
        var tdValue = document.createElement("TD");
        tdValue.id = varsJson[i].Name;
        tdValue.appendChild(document.createTextNode(''));
        var tdAction = document.createElement("TD");
        var data = {
            RefId: varsJson[i].RefId,
            Offset: varsJson[i].Offset,
            Type: varsJson[i].Type,
            Size: varsJson[i].Size
        };
        if (varsJson[i].Access === 98) {
            if (varsJson[i].Type === 0) {
                var tdButtonOn = document.createElement("button");
                tdButtonOn.data = data;
                tdButtonOn.addEventListener("mouseup", function () { WriteValue(this.data, 1) }, false);
                tdButtonOn.appendChild(document.createTextNode('On'));
                var tdButtonOff = document.createElement("button");
                tdButtonOff.data = data;
                tdButtonOff.addEventListener("mouseup", function () { WriteValue(this.data, 0) }, false);
                tdButtonOff.appendChild(document.createTextNode('Off'));
                tdAction.appendChild(tdButtonOn);
                tdAction.appendChild(tdButtonOff);
            }
            if (varsJson[i].Type >= 1 && varsJson[i].Type <= 8) {
                var tdInput = document.createElement("input");
                tdInput.placeholder = 'write here'
                tdInput.data = data;
                tdInput.addEventListener("keydown", function (e) {
                    if (e.which == 13) {
                        WriteValue(this.data, this.value);
                    }
                }, false);
                tdInput.appendChild(document.createTextNode(''));
                tdAction.appendChild(tdInput);
            }
        }
        else {
            tdAction.appendChild(document.createTextNode('read only'));
        }
        row.appendChild(tdName);
        row.appendChild(tdValue);
        row.appendChild(tdAction);
        tbody.appendChild(row);
    }
}

function WriteValue(obj, Value) {
    var req = null;
    if (window.XMLHttpRequest) {
        try {
            req = new XMLHttpRequest();
        } catch (e) { }
    } else if (window.ActiveXObject) {
        try {
            req = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e) {
            try {
                req = new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) { }
        }
    }

    if (req) {
        req.open("POST", '/webvisu/webvisu.htm', true);
        req.send('|1|1|0|' + obj.RefId + '|' + obj.Offset + '|' + obj.Size + '|' + obj.Type + '|' + Value + '|');
    }
}

function bin2String(array) {
    return String.fromCharCode.apply(String, array);
}

function sdb2Json(buf) {
    let sdb = {};
    var dv = new DataView(buf);
    let typesCnt = dv.getUint32(36, true);
    let aTypes = [];
    let aVars = [];
    let offset = 40;
    let ix = 0;
    while (ix <= typesCnt - 1) {
        offset += 8;
        aTypes[ix] = {};
        //Тип переменной
        aTypes[ix].Type = dv.getUint32(offset, true);
        offset += 4;
        //Размер типа
        aTypes[ix].Size = dv.getUint32(offset, true);
        offset += 4;
        let nameLen = dv.getUint16(offset, true);
        offset += 2;
        //Имя Типа
        let aName = [];
        for (let i = 0; i < nameLen; i++) {
            if (dv.getUint8(offset) !== 0) {
                aName[i] = dv.getUint8(offset);
            }
            offset++;
        }
        let sName = bin2String(aName);
        aTypes[ix].Name = sName;
        if (aTypes[ix].Type == 9) {
            offset += 16
        }
        if (aTypes[ix].Name === 'DATA') {
            let typesCntData = dv.getUint32(offset, true);
            offset += 4;
            let jx = 0;
            while (jx <= typesCntData - 1) {
                offset += 24;
                let nameLenData = dv.getUint16(offset, true);
                offset += 2;
                for (let i = 0; i < nameLenData; i++) {
                    offset++;
                }
                jx++;
            }
        }
        ix++;
    }
    offset += 12;
    let varsCnt = dv.getUint32(offset, true);
    offset += 4;
    ix = 0
    // let jx = 1;
    while (ix <= varsCnt - 1) {
        offset += 8;
        aVars[ix] = {};
        let desc = dv.getUint32(offset, true);
        aVars[ix].Type = aTypes[desc].Type;
        aVars[ix].Size = aTypes[desc].Size;
        offset += 8;
        aVars[ix].Access = dv.getUint16(offset, true);
        offset += 2;
        aVars[ix].RefId = dv.getUint16(offset, true);
        offset += 2;
        aVars[ix].Offset = dv.getUint32(offset, true);
        offset += 4;
        let nameLen = dv.getUint16(offset, true);
        offset += 2;
        let aName = [];
        for (let i = 0; i < nameLen; i++) {
            if (dv.getUint8(offset) !== 0) {
                aName[i] = dv.getUint8(offset);
            }
            offset++;
        }
        let sName = bin2String(aName);
        aVars[ix].Name = sName;
        ix++;
    }
    sdb.types = aTypes;
    sdb.vars = aVars;
    return sdb
}

function getPlcValues(plcVars, webvisuUrl, cb) {
    var cnt = plcVars.length;
    var postData = '|0|' + cnt;
    var ix = 0;

    plcVars.forEach(function (item) {
        var out = '|' + ix + '|' + item.RefId + '|' + item.Offset + '|' + item.Size + '|' + item.Type;
        ix++;
        postData += out;
    }, this);
    postData += '|';

    var req = null;
    if (window.XMLHttpRequest) {
        try {
            req = new XMLHttpRequest();
        } catch (e) { }
    } else if (window.ActiveXObject) {
        try {
            req = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e) {
            try {
                req = new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) { }
        }
    }

    var arr = [];
    req.open("post", webvisuUrl, true);
    req.overrideMimeType("text/html; charset=windows-1251");
    req.setRequestHeader("Content-type", "text/html; charset=windows-1251");
    req.timeout = 3000;
    req.send(postData);

    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
                arr = req.responseText.split('|');
                arr.splice(0, 1);
                for (var i = 0; i < plcVars.length; i++) {
                    plcVars[i].Value = arr[i];
                }
                return cb(null, plcVars);
            }
            else {
                return cb('PLC_NOT_RESPONSE_VALUES');
            }
        }
    }
}

function getPlcVars(sdbUrl, cb) {

    var req = null;
    if (window.XMLHttpRequest) {
        try {
            req = new XMLHttpRequest();
        } catch (e) { }
    } else if (window.ActiveXObject) {
        try {
            req = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e) {
            try {
                req = new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) { }
        }
    }

    req.open("get", sdbUrl, true);
    req.timeout = 3000;
    req.responseType = "arraybuffer";
    try {
        req.send(null);
    }
    catch (e) {
        req.abort();
    }
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
                let buf = req.response;
                if (buf) {
                    let varsJson = sdb2Json(buf).vars;
                    return cb(null, varsJson);
                }
            }
            else {
                return cb('PLC_NOT_RESPONSE_VARS');
            }
        }
    }
}

function startPoll(plcVars, webvisuUrl) {
    getPlcValues(plcVars, webvisuUrl, function (err, plcVarsValues) {
        if (!err) {
            for (var i = 0; i < plcVarsValues.length; i++) {
                document.getElementById(plcVarsValues[i].Name).innerHTML = plcVarsValues[i].Value;
            }
            setTimeout(function () { startPoll(plcVars, webvisuUrl) }, 200);
        } else {
            alert(err);
            setTimeout(function () { startPoll(plcVars, webvisuUrl) }, 10000);
        }
    }
    )
}
