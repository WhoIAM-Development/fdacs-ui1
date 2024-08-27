$(function(){

    function loadJS(file) {
        // DOM: Create the script element
        var jsElm = document.createElement("script");
        // set the type attribute
        jsElm.type = "application/javascript";
        // make the script element load file
        jsElm.src = file;
        // finally insert the element to the body element in order to load the script
        document.body.appendChild(jsElm);        
    }

    function LoadDfp() {

        if (typeof dfp != "undefined") {

            dfp.doFpt(this.document)
        }
        else {
            setTimeout(function () {
                LoadDfp();
            }, 1000);
        }
    }

    let resourceBaseUrl = "https://fpt.dfp.microsoft.com/mdt.js";

    let splitUrl = SETTINGS.remoteResource.split('?');
    if(splitUrl[1])
    {
        let urlParams = new URLSearchParams(splitUrl[1]);
        let sessionId = urlParams.get('SessionId');
        let instanceId = urlParams.get('InstanceId');

        let jsFileUrl = resourceBaseUrl +"?session_id="+ sessionId+"&instanceId="+ instanceId;

        loadJS(jsFileUrl);
        LoadDfp();
    }
});