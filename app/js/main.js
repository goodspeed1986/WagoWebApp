const SDB_URL = '../../plc/download.sdb'; // PLC 750-880
const WEB_VISU_URL = '../../plc/webvisu.htm'; // PLC 750-880

window.onload = function () {
    getPlcVars(SDB_URL, function (err, varsJson) {
        if (!err) {
            CreateDom(varsJson);
            startPoll(varsJson, WEB_VISU_URL);
        } else {
            alert(err)
            setTimeout(function () { getPlcVars(SDB_URL) }, 10000);
        }
    })

}

function getPlcVars(sdbUrl, cb) {
    let req = null;
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

function sdb2Json(buf) {
    let sdb = {};
    let dv = new DataView(buf);
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

function bin2String(array) {
    return String.fromCharCode.apply(String, array);
}

function CreateDom(varsJson) {
    var s = Snap('#mnemo');

    Snap.plugin(function (Snap, Element, Paper, global) {

        Element.prototype.altDrag = function () {
            this.drag(dragMove, dragStart, dragEnd);
            return this;
        }

        var dragStart = function (x, y, ev) {
            this.data('ot', this.transform().local);
        }


        var dragMove = function (dx, dy, ev, x, y) {
            var tdx, tdy;
            var snapInvMatrix = this.transform().diffMatrix.invert();
            snapInvMatrix.e = snapInvMatrix.f = 0;
            tdx = snapInvMatrix.x(dx, dy); tdy = snapInvMatrix.y(dx, dy);
            this.transform("t" + [tdx, tdy] + this.data('ot'));

        }

        var dragEnd = function () {
        }


    });

    Snap.load("./svg/lamp_opt.svg", function (f) {
        var g = f.select("svg");
        g.attr({

            height: "50px",
            weight: "50px",
            x: '0px',
            y: '0px'
        })
        // f.selectAll("polygon[fill='#09B39C']").attr({
        //     fill: "#fc0"
        // })
        s.append(g);
        g.altDrag();
    });

    let tbody = document.getElementById('varsTable').getElementsByTagName("TBODY")[0];
    //alert(JSON.stringify(varsJson));
    for (let i = 0; i < varsJson.length; i++) {
        let row = document.createElement("TR");
        let tdName = document.createElement("TD");
        tdName.appendChild(document.createTextNode(varsJson[i].Name));
        let tdValue = document.createElement("TD");
        let divValue = document.createElement("DIV");
        divValue.id = varsJson[i].Name;
        let MO = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        let observer = new MO(function (mutations) {
            mutations.forEach(function (mutation) {
                ChangeInnerHtml(mutation.target);
            });
        });
        let config = {
            'attributes': true,
            'attributeOldValue': true,
            'attributeFilter': ['data-value']
        };
        observer.observe(divValue, config);
        tdValue.appendChild(divValue);
        let tdAction = document.createElement("TD");
        let data = {
            RefId: varsJson[i].RefId,
            Offset: varsJson[i].Offset,
            Type: varsJson[i].Type,
            Size: varsJson[i].Size
        };
        if (varsJson[i].Access === 98) {
            if (varsJson[i].Type === 0) {
                let tdButtonOn = document.createElement("BUTTON");
                tdButtonOn.data = data;
                tdButtonOn.addEventListener("mouseup", function () { WriteValue(this.data, 1) }, false);
                tdButtonOn.appendChild(document.createTextNode('On'));
                let tdButtonOff = document.createElement("BUTTON");
                tdButtonOff.data = data;
                tdButtonOff.addEventListener("mouseup", function () { WriteValue(this.data, 0) }, false);
                tdButtonOff.appendChild(document.createTextNode('Off'));
                tdAction.appendChild(tdButtonOn);
                tdAction.appendChild(tdButtonOff);
            }
            if (varsJson[i].Type >= 1 && varsJson[i].Type <= 8) {
                let tdInput = document.createElement("INPUT");
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

function ChangeInnerHtml(mutationTarget) {
    document.getElementById(mutationTarget.id).innerHTML = mutationTarget.dataset.value;
}

function startPoll(plcVars, webvisuUrl) {
    getPlcValues(plcVars, webvisuUrl, function (err, plcVarsValues) {
        if (!err) {
            for (let i = 0; i < plcVarsValues.length; i++) {
                if (document.getElementById(plcVarsValues[i].Name).dataset.value !== plcVarsValues[i].Value) {
                    document.getElementById(plcVarsValues[i].Name).dataset.value = plcVarsValues[i].Value;
                    // document.getElementById('mycircle').setAttributeNS(null, "data-value", plcVarsValues[i].Value);
                }
            }
            setTimeout(function () { startPoll(plcVars, webvisuUrl) }, 200);
        } else {
            alert(err);
            setTimeout(function () { startPoll(plcVars, webvisuUrl) }, 10000);
        }
    }
    )
}

function getPlcValues(plcVars, webvisuUrl, cb) {
    let cnt = plcVars.length;
    let postData = '|0|' + cnt;
    let ix = 0;

    plcVars.forEach(function (item) {
        let out = '|' + ix + '|' + item.RefId + '|' + item.Offset + '|' + item.Size + '|' + item.Type;
        ix++;
        postData += out;
    }, this);
    postData += '|';

    let req = null;
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

    let arr = [];
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
                for (let i = 0; i < plcVars.length; i++) {
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

function WriteValue(obj, Value) {
    let req = null;
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
        req.open("POST", WEB_VISU_URL, true);
        req.send('|1|1|0|' + obj.RefId + '|' + obj.Offset + '|' + obj.Size + '|' + obj.Type + '|' + Value + '|');
    }
}










