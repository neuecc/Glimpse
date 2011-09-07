var glimpse = (function () {
    var //Private
        elements = {},
        data = {},
        settings = {},
        util = { 
            cookie : function (key, value, expiresIn) {
                key = encodeURIComponent(key);
                //Set Cookie
                if (arguments.length > 1) {
                    var t = new Date();
                    t.setDate(t.getDate() + expiresIn || 1000);

                    value = $.isPlainObject(value) ? JSON.stringify(value) : String(value);
                    return (document.cookie = key + '=' + encodeURIComponent(value) + '; expires=' + t.toUTCString() + '; path=/');
                }

                //Get cookie 
                var result = new RegExp("(?:^|; )" + key + "=([^;]*)").exec(document.cookie);
                if (result) {
                    result = decodeURIComponent(result[1]);
                    if (result.substr(0, 1) == '{') {
                        result = JSON.parse(result);
                    }
                    return result;
                }
                return null;
            }
        },

        //Public
        pubsub = (function () {
            var //Private
                registry = {},
                lastUid = -1,
                publishCore = function (message, data, sync) {
                    // if there are no subscribers to this message, just return here
                    if (!registry.hasOwnProperty(message)) {
                        return false;
                    }
        
                    var deliverMessage = function () {
                        var subscribers = registry[message];
                        var throwException = function (e) {
                            return function () {
                                throw e;
                            };
                        }; 
                        for (var i = 0, j = subscribers.length; i < j; i++) {
                            try {
                                subscribers[i].func(message, data);
                            } catch(e) {
                                setTimeout(throwException(e), 0);
                            }
                        }
                    };
        
                    if (sync === true) {
                        deliverMessage();
                    } else {
                        setTimeout(deliverMessage, 0);
                    }
                    return true;
                },
        
                //Public
                publish = function (message, data) {
                    return publishCore(message, data, false);
                },
                publishSync = function (message, data) {
                    return publishCore(message, data, true);
                },
                subscribe = function (message, func) { 
                    var token = (++lastUid).toString();

                    if (!registry.hasOwnProperty(message)) {
                        registry[message] = [];
                    } 
                    registry[message].push({ token : token, func : func });
         
                    return token;
                },
                unsubscribe = function (token) {
                    for (var m in registry) {
                        if (registry.hasOwnProperty(m)) {
                            for (var i = 0, j = registry[m].length; i < j; i++) {
                                if (registry[m][i].token === token) {
                                    registry[m].splice(i, 1);
                                    return token;
                                }
                            }
                        }
                    }
                    return false;
                };

            return {
                publish : publish,
                publishSync : publishSync,
                subscribe : subscribe,
                unsubscribe : unsubscribe
            };
        }()),
        plugin = (function () {
            var //Private
                plugins = {}, 
                startPlugin = function (pluginId) {
                    pluginData[pluginId].instance = pluginData[pluginId].creator();   //TODO: What to pass the plugin 
                    pluginData[pluginId].instance.init();
                },
                stopPlugin = function (pluginId) {
                    var data = pluginData[pluginId];
                    if (data.instance) {
                        data.instance.destroy();
                        data.instance = null;
                    } 
                },
                startAllPlugins = function () {
                    for (var pluginId in pluginData) { startPlugin(pluginId); }
                },
                stopAllPlugins = function () {
                    for (var pluginId in pluginData) { stopPlugin(pluginId); }
                },
                init = function() {
                    pubsub.subscribe('state.init', startAllPlugins);  
                },

                //Public
                registerPlugin = function (pluginId, creator) {
                    plugins[pluginId] = { creator : creator, instance : null };
                };
    
            return {
                register : registerPlugin
            };
        }()),
        init = function () {
            pubsub.publish('state.init');
            pubsub.publish('state.build'); 
        };
        
    (function () {
        var //Private  
            processData = (function () {  
                data.css = '.glimpse, .glimpse *, .glimpse a, .glimpse td, .glimpse th, .glimpse table {font-family: Helvetica, Arial, sans-serif;background-color: transparent;font-size: 11px;line-height: 14px;border: 0px;color: #232323;text-align: left;}.glimpse table {min-width: 0;}.glimpse a, .glimpse a:hover, .glimpse a:visited {color: #2200C1;text-decoration: underline;font-weight: normal;}.glimpse a:active {color: #c11;text-decoration: underline;font-weight: normal;}.glimpse th {font-weight: bold;}.glimpse-open {z-index: 100010;position: fixed;right: 0;bottom: 0;height: 27px;width: 28px;background: #cfcfcf;background: -moz-linear-gradient(top, #cfcfcf 0%, #dddddd 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#cfcfcf), color-stop(100%,#dddddd));background: -webkit-linear-gradient(top, #cfcfcf 0%,#dddddd 100%);background: -o-linear-gradient(top, #cfcfcf 0%,#dddddd 100%);background: -ms-linear-gradient(top, #cfcfcf 0%,#dddddd 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#cfcfcf\', endColorstr=\'#dddddd\',GradientType=0 );background: linear-gradient(top, #cfcfcf 0%,#dddddd 100%);-webkit-box-shadow: inset 0px 1px 0px 0px #E2E2E2;-moz-box-shadow: inset 0px 1px 0px 0px #E2E2E2;box-shadow: inset 0px 1px 0px 0px #E2E2E2;border-top: 1px solid #7A7A7A;border-left: 1px solid #7A7A7A;}.glimpse-icon {background: url() 0px -16px;height: 20px;width: 20px;margin: 3px 4px 0;cursor: pointer;}.glimpse-holder {display: none;z-index: 100010 !important;height: 0;position: fixed;bottom: 0;left: 0;width: 100%;background-color: #fff;}.glimpse-bar {background: #cfcfcf;background: -moz-linear-gradient(top, #cfcfcf 0%, #dddddd 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#cfcfcf), color-stop(100%,#dddddd));background: -webkit-linear-gradient(top, #cfcfcf 0%,#dddddd 100%);background: -o-linear-gradient(top, #cfcfcf 0%,#dddddd 100%);background: -ms-linear-gradient(top, #cfcfcf 0%,#dddddd 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#cfcfcf\', endColorstr=\'#dddddd\',GradientType=0 );background: linear-gradient(top, #cfcfcf 0%,#dddddd 100%);-webkit-box-shadow: inset 0px 1px 0px 0px #E2E2E2;-moz-box-shadow: inset 0px 1px 0px 0px #E2E2E2;box-shadow: inset 0px 1px 0px 0px #E2E2E2;border-top: 1px solid #7A7A7A;height: 27px;}.glimpse-bar .glimpse-icon {margin-top: 4px;float: left;}.glimpse-buttons {text-align: right;float: right;height: 17px;width: 150px;padding: 6px;}.glimpse-title {margin: 0 0 0 15px;padding-top: 5px;font-weight: bold;display: inline-block;width: 75%;overflow: hidden;}.glimpse-title .glimpse-snapshot-type {display: inline-block;height: 20px;}.glimpse-title .glimpse-enviro {padding-left: 10px;white-space: nowrap;height: 20px;}.glimpse-title .glimpse-url .glimpse-drop {padding-left: 10px;}.glimpse-title .glimpse-url .loading {margin: 5px 0 0;font-weight: normal;display: none;}.glimpse-title .glimpse-url .glimpse-drop-over {padding-left: 20px;padding-right: 20px;text-align: center;}.glimpse .glimpse-drop {padding: 1px 1px 1px 8px;height: 14px;font-size: 0.9em;}.glimpse .glimpse-drop, .glimpse .glimpse-drop-over {font-weight: normal;font-weight: normal;background: #f7f7f7;background: -moz-linear-gradient(top, #f7f7f7 0%, #e6e6e6 29%, #e2e2e2 31%, #c9c9c9 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#f7f7f7), color-stop(29%,#e6e6e6), color-stop(31%,#e2e2e2), color-stop(100%,#c9c9c9));background: -webkit-linear-gradient(top, #f7f7f7 0%,#e6e6e6 29%,#e2e2e2 31%,#c9c9c9 100%);background: -o-linear-gradient(top, #f7f7f7 0%,#e6e6e6 29%,#e2e2e2 31%,#c9c9c9 100%);background: -ms-linear-gradient(top, #f7f7f7 0%,#e6e6e6 29%,#e2e2e2 31%,#c9c9c9 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#f7f7f7\', endColorstr=\'#c9c9c9\',GradientType=0 );background: linear-gradient(top, #f7f7f7 0%,#e6e6e6 29%,#e2e2e2 31%,#c9c9c9 100%);-webkit-box-shadow: inset 0px 1px 0px 0px #F9F9F9;-moz-box-shadow: inset 0px 1px 0px 0px #F9F9F9;box-shadow: inset 0px 1px 0px 0px #F9F9F9;border: 1px solid #A7A7A7;-webkit-border-radius: 3px;-moz-border-radius: 3px;border-radius: 3px;margin: 0 5px 0 0;}.glimpse .glimpse-drop-over {position: absolute;display: none;top: 4px;padding: 1px 10px 10px 10px;z-index: 100;-webkit-box-shadow: 0px 0px 8px 0px #696969;-moz-box-shadow: 0px 0px 8px 0px #696969;box-shadow: 0px 0px 8px 0px #696969;}.glimpse .glimpse-drop-over div {text-align: center;font-weight: bold;margin: 5px 0;}.glimpse .glimpse-drop-arrow-holder {margin: 3px 3px 3px 5px;padding-left: 3px;border-left: 1px solid #A7A7A7;font-size: 9px;height: 9px;width: 10px;}.glimpse .glimpse-drop-arrow {background: url() no-repeat -22px -18px;width: 7px;height: 4px;display: inline-block;}.glimpse-button, .glimpse-button:hover {cursor: pointer;background-image: url();background-repeat: no-repeat;height: 14px;width: 14px;margin-left: 2px;display: inline-block;}.glimpse-meta-warning {background-position: -168px -1px;display: none;}.glimpse-meta-warning:hover {background-position: -183px -1px;}.glimpse-meta-help {background-position: -138px -1px;margin-right: 15px;}.glimpse-meta-help:hover {background-position: -153px -1px;margin-right: 15px;}.glimpse-meta-update {background-position: -198px -1px;display: none;}.glimpse-meta-update:hover {background-position: -213px -1px;}.glimpse-close {background-position: -1px -1px;}.glimpse-close:hover {background-position: -17px -1px;}.glimpse-terminate {background-position: -65px -1px;}.glimpse-terminate:hover {background-position: -81px -1px;}.glimpse-popout {background-position: -96px -1px;}.glimpse-popout:hover {background-position: -111px -1px;}.glimpse-tabs {background: #afafaf;background: -moz-linear-gradient(top, #afafaf 0%, #cfcfcf 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#afafaf), color-stop(100%,#cfcfcf));background: -webkit-linear-gradient(top, #afafaf 0%,#cfcfcf 100%);background: -o-linear-gradient(top, #afafaf 0%,#cfcfcf 100%);background: -ms-linear-gradient(top, #afafaf 0%,#cfcfcf 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#afafaf\', endColorstr=\'#cfcfcf\',GradientType=0 );background: linear-gradient(top, #afafaf 0%,#cfcfcf 100%);border-bottom: 1px solid #A4A4A4;border-top: 1px solid #F9F9F9;-webkit-box-shadow: inset 0px 1px 0px 0px #8b8b8b;-moz-box-shadow: inset 0px 1px 0px 0px #8b8b8b;box-shadow: inset 0px 1px 0px 0px #8b8b8b;font-weight: bold;height: 24px;}.glimpse-tabs ul {margin: 4px 0px 0 0;padding: 0px;}.glimpse-tabs li {display: inline;margin: 0 2px 3px 2px;height: 22px;padding: 4px 9px 3px;color: #565656;cursor: pointer;border-radius: 0px 0px 3px 3px;-moz-border-radius: 0px 0px 3px 3px;-webkit-border-bottom-right-radius: 3px;-webkit-border-bottom-left-radius: 3px;-webkit-transition: color 0.3s ease;-moz-transition: color 0.3s ease;-o-transition: color 0.3s ease;transition: color 0.3s ease;}.glimpse-tabs li.glimpse-hover {padding: 4px 8px 3px;background: #dddddd;background: -moz-linear-gradient(top, #dddddd 0%, #ffffff 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#dddddd), color-stop(100%,#ffffff));background: -webkit-linear-gradient(top, #dddddd 0%,#ffffff 100%);background: -o-linear-gradient(top, #dddddd 0%,#ffffff 100%);background: -ms-linear-gradient(top, #dddddd 0%,#ffffff 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#dddddd\', endColorstr=\'#ffffff\',GradientType=0 );background: linear-gradient(top, #dddddd 0%,#ffffff 100%);-webkit-box-shadow: inset 1px -1px 0px #F9F9F9, inset -1px 0px 0px #F9F9F9;-moz-box-shadow: inset 1px -1px 0px #F9F9F9, inset -1px 0px 0px #F9F9F9;box-shadow: inset 1px -1px 0px #F9F9F9, inset -1px 0px 0px #F9F9F9;border-bottom: 1px solid #8B8B8B;border-left: 1px solid #8B8B8B;border-right: 1px solid #8B8B8B;border-top: 2px solid #DDD;}.glimpse-tabs li.glimpse-active {background: #dddddd;background: -moz-linear-gradient(top, #dddddd 0%, #efefef 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#dddddd), color-stop(100%,#efefef));background: -webkit-linear-gradient(top, #dddddd 0%,#efefef 100%);background: -o-linear-gradient(top, #dddddd 0%,#efefef 100%);background: -ms-linear-gradient(top, #dddddd 0%,#efefef 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#dddddd\', endColorstr=\'#efefef\',GradientType=0 );background: linear-gradient(top, #dddddd 0%,#efefef 100%);-webkit-box-shadow: inset 1px -1px 0px #F9F9F9, inset -1px 0px 0px #F9F9F9;-moz-box-shadow: inset 1px -1px 0px #F9F9F9, inset -1px 0px 0px #F9F9F9;box-shadow: inset 1px -1px 0px #F9F9F9, inset -1px 0px 0px #F9F9F9;border-bottom: 1px solid #8b8b8b;border-left: 1px solid #8b8b8b;border-right: 1px solid #8b8b8b;border-top: 2px solid #DDD;color: #000;padding: 4px 8px 3px;}.glimpse-tabs li.glimpse-disabled {color: #AAA;cursor: default;}.glimpse-panel-holder {}.glimpse-panel {display: none;overflow: auto;position: relative;}.glimpse-panel-message {text-align: center;padding-top: 40px;font-size: 1.1em;color: #AAA;}.glimpse-panel table {border-spacing: 0;width: 100%;}.glimpse-panel table td, .glimpse-panel table th {padding: 3px 4px;text-align: left;vertical-align: top;}.glimpse-panel table td .glimpse-cell {vertical-align: top;}.glimpse-panel tbody .mono {font-family: Consolas, monospace, serif;font-size: 1.1em;}.glimpse-panel tr.glimpse-row-header-0 {height: 19px;}.glimpse-panel .glimpse-row-header-0 th {background: #DFDFDF;background: -moz-linear-gradient(top, #f3f3f3 0%, #f3f3f3 5%, #e6e6e6 6%, #d1d1d1 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#f3f3f3), color-stop(5%,#f3f3f3), color-stop(6%,#e6e6e6), color-stop(100%,#d1d1d1));background: -webkit-linear-gradient(top, #f3f3f3 0%,#f3f3f3 5%,#e6e6e6 6%,#d1d1d1 100%);background: -o-linear-gradient(top, #f3f3f3 0%,#f3f3f3 5%,#e6e6e6 6%,#d1d1d1 100%);background: -ms-linear-gradient(top, #f3f3f3 0%,#f3f3f3 5%,#e6e6e6 6%,#d1d1d1 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#f3f3f3\', endColorstr=\'#d1d1d1\',GradientType=0 );background: linear-gradient(top, #f3f3f3 0%,#f3f3f3 5%,#e6e6e6 6%,#d1d1d1 100%);border-bottom: 1px solid #9C9C9C;font-weight: bold;}.glimpse-panel .glimpse-row-header-0 th {border-left: 1px solid #D9D9D9;border-right: 1px solid #9C9C9C;}.glimpse-panel .glimpse-soft {color: #999;}.glimpse-panel .glimpse-cell-key {font-weight: bold;}.glimpse-panel th.glimpse-cell-key {width: 30%;max-width: 150px;}.glimpse-panel table table {border: 1px solid #D9D9D9;}.glimpse-panel table table thead th {background: #f3f3f3;background: -moz-linear-gradient(top, #f3f3f3 0%, #e6e6e6 100%);background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#f3f3f3), color-stop(100%,#e6e6e6));background: -webkit-linear-gradient(top, #f3f3f3 0%,#e6e6e6 100%);background: -o-linear-gradient(top, #f3f3f3 0%,#e6e6e6 100%);background: -ms-linear-gradient(top, #f3f3f3 0%,#e6e6e6 100%);filter: progid:DXImageTransform.Microsoft.gradient( startColorstr=\'#f3f3f3\', endColorstr=\'#e6e6e6\',GradientType=0 );background: linear-gradient(top, #f3f3f3 0%,#e6e6e6 100%);border-bottom: 1px solid #9C9C9C;}.glimpse-panel table table thead tr th {border-left: 1px solid #C6C6C6;border-right: 1px solid #D9D9D9;padding: 1px 4px 2px 4px;}.glimpse-panel table table thead tr th:first-child {border-left: 0px;}.glimpse-panel table table thead tr th:last-child {border-right: 0px;}.glimpse-panel .even, .glimpse-panel .even > td, .glimpse-panel .even > th, .glimpse-panel .even > tr > td, .glimpse-panel .even > tr > th, .even > td > .glimpse-preview-table > tbody > tr > td, .even > tr > td > .glimpse-preview-table > tbody > tr > td {background-color: #F2F5F9;}.glimpse-panel .odd, .glimpse-panel .odd > td, .glimpse-panel .odd > th, .glimpse-panel .odd > tr > td, .glimpse-panel .odd > tr > th, .odd > td > .glimpse-preview-table > tbody > tr > td, .odd > tr > td > .glimpse-preview-table > tbody > tr > td {background-color: #FEFFFF;}.glimpse-panel table table tbody th {font-weight: normal;font-style: italic;}.glimpse-panel table table thead th {font-weight: bold;font-style: normal;}.glimpse-panel .glimpse-side-sub-panel {right: 0;z-index: 10;background-color: #FAFCFC;height: 100%;width: 25%;border-left: 1px solid #ACA899;position: absolute;}.glimpse-panel .glimpse-side-main-panel {position: relative;height: 100%;width: 75%;float: left;}.glimpse-panel-holder .glimpse-active {display: block;}.glimpse-resizer {height: 4px;cursor: n-resize;width: 100%;position: absolute;top: -1px;}li.glimpse-permanent {font-style: italic;}.glimpse-preview-object {color: #006400;}.glimpse-preview-string, .glimpse-preview-object .glimpse-preview-string {color: #006400;font-weight: normal !important;}.glimpse-preview-string span {padding-left: 1px;}.glimpse-preview-object span {font-weight: bold;color: #444;}.glimpse-preview-object span.start {margin-right: 5px;}.glimpse-preview-object span.end {margin-left: 5px;}.glimpse-preview-object span.rspace {margin-right: 4px;}.glimpse-preview-object span.mspace {margin: 0 4px;}.glimpse-preview-object span.small {font-size: 0.95em;}.glimpse-panel .glimpse-preview-table {border: 0;}.glimpse-panel .glimpse-preview-table .glimpse-preview-cell {padding-left: 0;padding-right: 2px;width: 11px;}.glimpse-expand {height: 11px;width: 11px;display: inline-block;float: left;margin: 1px 0 0 0;cursor: pointer;background-image: url();background-repeat: no-repeat;background-position: -126px 0;}.glimpse-collapse {background-position: -126px -11px;}.glimpse-preview-show {display: none;font-weight: normal !important;}.glimpse-panel .quiet *, .glimpse-panel .ms * {color: #AAA;}.glimpse-panel .suppress {text-decoration: line-through;}.glimpse-panel .suppress * {color: #AAA;}.glimpse-panel .selected, .glimpse-panel .selected > td, .glimpse-panel .selected > th, .glimpse-panel .selected > tr > td, .glimpse-panel .selected > tr > th, .selected > td > .glimpse-preview-table > tbody > tr > td, .selected > tr > td > .glimpse-preview-table > tbody > tr > td {background-color: #FFFF99;}.glimpse-panel .selected * {color: #409B3B;}.glimpse .info .icon, .glimpse .warn .icon, .glimpse .loading .icon, .glimpse .error .icon, .glimpse .fail .icon, .glimpse .ms .icon {width: 14px;height: 14px;background-image: url();background-repeat: no-repeat;display: inline-block;margin-right: 5px;}.glimpse .info .icon {background-position: -22px -22px;}.glimpse .warn .icon {background-position: -36px -22px;}.glimpse .loading .icon {background-position: -78px -22px;}.glimpse .error .icon {background-position: -50px -22px;}.glimpse .ms .icon {background-position: -181px -22px;}.glimpse .fail .icon {background-position: -64px -22px;}.glimpse .info * {color: #067CE5;}.glimpse .warn * {color: #FE850C;}.glimpse .error * {color: #B40000;}.glimpse .fail * {color: #B40000;font-weight: bold;}.glimpse-panelitem-Ajax .loading .icon {float: right;}.glimpse-panelitem-Remote .glimpse-side-sub-panel .loading, .glimpse-panelitem-Remote .glimpse-side-main-panel .loading, .glimpse-clear {position: fixed;bottom: 5px;right: 10px;color: #777;}.glimpse-panelitem-Remote .glimpse-side-main-panel .loading {right: 27%;}.glimpse-clear {background-color: white;padding: 0.3em 1em 0.5em 1em;border: #CCC solid 1px;bottom: 25px;-webkit-border-radius: 3px;-moz-border-radius: 3px;border-radius: 3px;}.glimpse-panel table .glimpse-head-message td {text-align: center;background-color: #DDD;}.glimpse-panelitem-GlimpseInformation div {text-align: center;}.glimpse-panelitem-GlimpseInformation .glimpse-panel-message {padding-top: 5px;}.glimpse-panelitem-GlimpseInformation strong {font-weight: bold;}.glimpse-panelitem-GlimpseInformation .glimpse-info-more {font-size: 1.5em;margin: 1em 0;}.glimpse-panelitem-GlimpseInformation .glimpse-info-quote {font-style: italic;margin: 0.75em 0 3em;}.glimpse-pager {background: #C6C6C6;padding: 3px 4px;font-weight: bold;text-align: center;vertical-align: top;}.glimpse-pager .glimpse-pager-message {margin-left: 5px;margin-right: 5px;}.glimpse-pager .glimpse-button {margin-top: 0px;}.glimpse-pager .glimpse-pager-link, .glimpse-pager .glimpse-pager-link:hover {font-weight: bold;}.glimpse-pager .glimpse-pager-link-firstPage {background-position: -2px -38px;}.glimpse-pager .glimpse-pager-link-firstPage-disabled {background-position: -17px -38px;}.glimpse-pager .glimpse-pager-link-previousPage {background-position: -33px -38px;}.glimpse-pager .glimpse-pager-link-previousPage-disabled {background-position: -49px -38px;}.glimpse-pager .glimpse-pager-link-nextPage {background-position: -65px -38px;}.glimpse-pager .glimpse-pager-link-nextPage-disabled {background-position: -81px -38px;}.glimpse-pager .glimpse-pager-link-lastPage {background-position: -96px -38px;}.glimpse-pager .glimpse-pager-link-lastPage-disabled {background-position: -111px -38px;}.glimpse-panel table.glimpse-pager-separator {border-bottom: 3px solid #C6C6C6;}@media screen and (-webkit-min-device-pixel-ratio:0) {.glimpse-tabs li.glimpse-hover, .glimpse-tabs li.glimpse-active {border-top: 1px solid #DDD;}}',
                data.html = '<div class="glimpse-open"><div class="glimpse-icon"></div></div><div class="glimpse-holder glimpse"><div class="glimpse-resizer"></div><div class="glimpse-bar"><div class="glimpse-icon" title="About Glimpse?"></div><div class="glimpse-title"></div><div class="glimpse-buttons"><a class="glimpse-meta-warning glimpse-button" href="#" title="Glimpse has some warnings!"></a><a class="glimpse-meta-update glimpse-button" href="http://www.nuget.org/List/Packages/Glimpse" title="New version of Glimpse available" target="_blank"></a><a class="glimpse-meta-help glimpse-button" href="#" title="Need some help?"></a><a class="glimpse-close glimpse-button" href="#" title="Close/Minimize"></a><a class="glimpse-popout glimpse-button" href="#" title="Pop Out"></a><a class="glimpse-terminate glimpse-button" href="#" title="Shutdown/Terminate"></a></div></div><div class="glimpse-content"><div class="glimpse-tabs"><ul></ul></div><div class="glimpse-panel-holder"></div></div></div>'
            }),
            findElements = (function () { 
                elements.scope = scope;
                elements.holder = elements.scope.find('.glimpse-holder');
                elements.opener = elements.scope.find('.glimpse-open');
                elements.spacer = elements.scope.find('.glimpse-spacer');  
            }),
        
            //Private
            init = function () {
                pubsub.subscribe('state.renderPreview', processData); 
                pubsub.subscribe('state.render', findElements); 
            };
    
        init(); 
    }());
    //pubsub
    //util
    (function () {
        var //Public
            persist = function () { 
                util.cookie('glimpseOptions', settings);
            },
            restore = function () {
                $.extend(settings, util.cookie('glimpseOptions'));
            },
            terminate = function () {
                util.cookie('glimpseState', null);
            },
        
            //Private
            init = function () {
                pubsub.subscribe('state.persist', persist);
                pubsub.subscribe('state.restore', restore);
                pubsub.subscribe('state.terminate', terminate);
            };
    
        init(); 
    }());
    //settings
    //elements
    (function () {
        var //Public 
            open = function () {
                settings.open = true;
                pubsub.publish('state.persist');

                elements.opener.hide(); 
                $.fn.add.call(elements.holder, elements.spacer).show().animate({ height : settings.height }, 'fast');  
            },
            close = function (remove) {
                settings.open = false;
                pubsub.publish('state.persist');

                var panelElements = $.fn.add.call(elements.holder, elements.spacer).animate({ height : '0' }, 'fast', function() {
                        panelElements.hide();

                        if (remove) {
                            elements.scope.remove();
                            pubsub.publish('state.persist');
                        }
                        else
                            elements.opener.show(); 
                    });
            }, 
            resize = function (height) {
                settings.height = height;
                pubsub.publish('state.persist');
             
                elements.spacer.height(height);
                elements.holder.find('.glimpse-panel').height(height - 54); 
            },
        
            //Private
            _init = function () {
                pubsub.subscribe('action.open', open);
                pubsub.subscribe('action.close', close);
                pubsub.subscribe('action.terminate', function() { close(true); });
                pubsub.subscribe('action.resize', resize);
            };
    
        _init(); 
    }());  
    (function () {
        var //Private 
            getCss = function() {
                return data.css.replace(/url\(\)/gi, 'url(' + settings.path + 'sprite.png)'); 
            },
            getHtml = function() {
                return data.html;
            },
        
            //Public
            build = function () {
                pubsub.publish('state.renderPreview');  

                //Add css to head
                $('<style type="text/css"> ' + getCss() + ' </style>').appendTo("head");      //http://stackoverflow.com/questions/1212500/jquery-create-css-rule-class-runtime
                
                //Add html to body
                $('body').append(getHtml());

                pubsub.publish('state.render'); 
            },
        
            //Private
            _init = function () {
                pubsub.subscribe('state.build', build); 
            };
    
        _init(); 
    }()); 




    return { 
        init : init,
        pubsub : pubsub,
        plugin : plugin,
        elements : elements
    };
}());
