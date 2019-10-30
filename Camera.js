var webSocketVideoFrame;
var frameTime;
var videoFrameElement = document.querySelector("#videoFrame");
var lastImageUrl;
var blobUri = 'https://' + 'urbanfarming' + '.blob.core.windows.net';
var blobService = AzureStorage.Blob.createBlobServiceWithSas(blobUri, '?sv=2018-03-28&ss=bfqt&srt=sco&sp=rwdlacup&se=2029-07-16T13:12:09Z&st=2019-07-16T05:12:09Z&spr=https,http&sig=68T6LyNr7wLQyiEyk4lmxkrmMemhUSS2wKLCq3pZM1w%3D');
var lastblob;
var i = 1;
var x = 0;


function GetVideoFrames() {

    webSocketVideoFrame = new WebSocket('ws://' + location.host + "/VideoFrame");
    webSocketVideoFrame.binaryType = "arraybuffer";

    webSocketVideoFrame.onopen = function () {
        webSocketHelper.waitUntilWebsocketReady(function () {
            webSocketVideoFrame.send(JSON.stringify({ command: "VideoFrame" }));
        }, webSocketVideoFrame, 0);
    };

    webSocketVideoFrame.onmessage = function () {
        if (x % 10 != 0) {
            x++;
            return;

        }
        var bytearray = new Uint8Array(event.data);

        var blob = new Blob([event.data], { type: "image/jpeg" });
        lastblob = blob;
        lastImageUrl = createObjectURL(blob);
        videoFrameElement.src = lastImageUrl;
        
        frameTime = new Date().getTime();
        x++;
    };
}

videoFrameElement.addEventListener("load", function (e) {
    //URL.revokeObjectURL(lastImageUrl);

    webSocketHelper.waitUntilWebsocketReady(function () {
        webSocketVideoFrame.send(JSON.stringify({ command: "VideoFrame" }));
    }, webSocketVideoFrame, 100);
});

function createObjectURL(blob) {
    var URL = window.URL || window.webkitURL;
    if (URL && URL.createObjectURL) {
        return URL.createObjectURL(blob);
    } else {
        return null;
    }
}

function KeepAliveGetVideoFrames() {

    var duration = 0;
    if (frameTime !== undefined) {
        duration = new Date().getTime() - frameTime
    }

    if (frameTime !== undefined
        && duration <= 10000) {

        setTimeout(function () {
            KeepAliveGetVideoFrames();
        }, 10000);
    } else {

        if (webSocketVideoFrame !== undefined) {
            try {
                webSocketVideoFrame.close();
            } catch (e) { }
        }

        GetVideoFrames();

        setTimeout(function () {
            KeepAliveGetVideoFrames();
        }, 10000);
    }
}

function uploadBlobFromText() {
    
    var containername = 'urbanfarmingtest1';
    var blobname = 'urbanfarmingblob' + i;
    if (lastImageUrl == null) {
        setTimeout(function () {
            KeepAliveGetVideoFrames();
        },  1000);
    }

    
    //downloadIamge("#videoFrame", name);

    if (lastImageUrl != null) {
        if (blobService.doesBlobExist(containername, blobname, function (error, result, response) { })) {
            blobService.appendFromText(containername, blobname, lastImageUrl, function (error, result, response) {
                if (error) {
                    alert('Upload filed, open browser console for more detailed info.');
                    console.log(error);
                } else {
                    console.log('Upload successfully!');
                }
            });
        } else {
            blobService.createAppendBlobFromText(containername, blobname, lastImageUrl, function (error, result, response) {
                if (error) {
                    alert('Upload filed, open browser console for more detailed info.');
                    console.log(error);
                } else {
                    console.log('Upload successfully!');
                }
            });
        }
    }
    setTimeout(function () {
        i++;
        uploadBlobFromText();
    }, 600000);
}


uploadBlobFromText();
