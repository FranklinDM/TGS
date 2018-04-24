var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;
var aios_inTab = (AiOS_HELPER.mostRecentWindow.aiosLastSelTab) ? true : false;

// Add listener for automatic update and remove
if (aios_inSidebar) {
    window.addEventListener("load", function (e) {
        top.gBrowser.addProgressListener(aiosProgListener);
    }, false);

    window.addEventListener("unload", function (e) {
        top.gBrowser.removeProgressListener(aiosProgListener);
    }, false);
}

var AiOS_PageInfo = {
    init: function () {
        // Hide the menu bar on Mac OS X.
        aios_hideMacMenubar();

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(document.getElementById('main-window'));

        try {
            var enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("pi.layout");
            var enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("pi.layoutall");
            if ((enable_layout && aios_inSidebar) || enable_layoutall)
                AiOS_PageInfo.sidebarLayout();
        } catch (e) {}

        // Remove keyboard short to avoid blocking the main browser
        if (aios_inSidebar)
            aios_removeAccesskeys();
    },

    sidebarLayout: function () {
        var vbox;

        // Enable CSS for sidebar optimizations
        aios_addCSS("pageinfo.css", "main-window");

        // Hide the label of the radio buttons => only if there are icons
        var cStyle = document.defaultView.getComputedStyle(document.getElementById('generalTab'), '');
        if (cStyle.listStyleImage && cStyle.listStyleImage != "none") {
            if (document.getElementById('viewGroup'))
                document.getElementById('viewGroup').setAttribute("hideLabel", true);
        }

        // Radio buttons with tooltip
        if (document.getElementById('viewGroup')) {
            var radioChilds = document.getElementById('viewGroup').childNodes;
            for (var i = 0; i < radioChilds.length; i++) {
                if (radioChilds[i].tagName == "radio")
                    radioChilds[i].setAttribute('tooltiptext', radioChilds[i].label);
            }
        }

        // Media Panel: Save as ... button break
        var hbox = document.getElementById('mediaPreviewBox').getElementsByTagName('hbox')[0];
        hbox.setAttribute('align', 'start');
        hbox.setAttribute('orient', 'vertical');
        hbox.removeChild(hbox.getElementsByTagName('spacer')[0]);
        hbox.appendChild(hbox.getElementsByTagName('vbox')[0]);

        // Security Panel: Breaking Texts and Buttons
        // Identity
        var groupbox = document.getElementById('security-identity-groupbox');
        groupbox.removeChild(groupbox.getElementsByTagName('spacer')[0]);
        groupbox.getElementsByTagName('hbox')[0].setAttribute('orient', 'vertical');
        groupbox.getElementsByTagName('hbox')[0].setAttribute('align', 'start');

        // History
        var historyrow = document.getElementById('security-privacy-history-label').parentNode;
        vbox = document.createElement("vbox");
        while (historyrow.childNodes.length != 0) {
            vbox.appendChild(historyrow.firstChild);
        }
        vbox.setAttribute('flex', '100');
        historyrow.appendChild(vbox);

        // Cookies
        var cookierow = document.getElementById('security-privacy-cookies-label').parentNode;
        vbox = document.createElement("vbox");
        while (cookierow.childNodes.length != 0) {
            vbox.appendChild(cookierow.firstChild);
        }
        vbox.setAttribute('flex', '100');
        cookierow.appendChild(vbox);

        // Passwords
        var pwdrow = document.getElementById('security-privacy-passwords-label').parentNode;
        vbox = document.createElement("vbox");
        while (pwdrow.childNodes.length != 0) {
            vbox.appendChild(pwdrow.firstChild);
        }
        vbox.setAttribute('flex', '100');
        pwdrow.appendChild(vbox);
    },

    // Remember the last selected tab
    persistSelTab: function () {
        document.getElementById('main-window').setAttribute("seltab", document.getElementById('viewGroup').selectedIndex);
    }
}

// Automatic update => call by aiosProgListener (_helper.js)
function aios_onLocationChange() {
    if (aios_inSidebar) {
        AiOS_PageInfo.persistSelTab();
        location.reload();
    }
}

function aios_onStateChange() {
    aios_onLocationChange();
}

/* Called when PageInfo window is loaded.  Arguments are:
 *  window.arguments[0] - (optional) an object consisting of
 *                         - doc: (optional) document to use for source. if not provided,
 *                                the calling window's document will be used
 *                         - initialTab: (optional) id of the inital tab to display
 */
function onLoadPageInfo() {
    gBundle = document.getElementById("pageinfobundle");
    gStrings.unknown = gBundle.getString("unknown");
    gStrings.notSet = gBundle.getString("notset");
    gStrings.mediaImg = gBundle.getString("mediaImg");
    gStrings.mediaBGImg = gBundle.getString("mediaBGImg");
    gStrings.mediaBorderImg = gBundle.getString("mediaBorderImg");
    gStrings.mediaListImg = gBundle.getString("mediaListImg");
    gStrings.mediaCursor = gBundle.getString("mediaCursor");
    gStrings.mediaObject = gBundle.getString("mediaObject");
    gStrings.mediaEmbed = gBundle.getString("mediaEmbed");
    gStrings.mediaLink = gBundle.getString("mediaLink");
    gStrings.mediaInput = gBundle.getString("mediaInput");
    gStrings.mediaVideo = gBundle.getString("mediaVideo");
    gStrings.mediaAudio = gBundle.getString("mediaAudio");

    var args = "arguments" in window &&
        window.arguments.length >= 1 &&
        window.arguments[0];

    // Checks for sidebar/tab
    if (aios_inSidebar) {
        gDocument = AiOS_HELPER.mostRecentWindow.content.document;
        gWindow = AiOS_HELPER.mostRecentWindow.content.window;
    } else if (aios_inTab) {
        gDocument = AiOS_HELPER.mostRecentWindow.aiosLastSelTab.document;
        gWindow = AiOS_HELPER.mostRecentWindow.content.window;
    }
    // Original part
    else {
        if (!args || !args.doc) {
            gWindow = window.opener.content;
            gDocument = gWindow.document;
        }
    }

    // init media view
    var imageTree = document.getElementById("imagetree");
    imageTree.view = gImageView;

    /* Select the requested tab, if the name is specified */
    loadTab(args);
    Components.classes["@mozilla.org/observer-service;1"]
    .getService(Components.interfaces.nsIObserverService)
    .notifyObservers(window, "page-info-dialog-loaded", null);
}

// Override certain functions inside the 'security' variable of Page Info
(function () {
    // Display the server certificate (static)
    this.viewCert = function () {
        var cert = security._cert;

        // Checks for sidebar/tab
        if (aios_inSidebar)
            viewCertHelper(AiOS_HELPER.mostRecentWindow.content.window, cert);
        else if (aios_inTab)
            viewCertHelper(AiOS_HELPER.mostRecentWindow.aiosLastSelTab.window, cert);
        else
            viewCertHelper(window, cert);
    };

    // Find the secureBrowserUI object (if present)
    this._getSecurityUI = function () {
        // Checks for sidebar/tab
        if (aios_inSidebar) {
            if ("gBrowser" in top)
                return top.gBrowser.securityUI;
            return null;
        } else if (aios_inTab) {
            return AiOS_HELPER.mostRecentWindow.aiosLastSelTab.securityUI;
        }
        // Original part
        else {
            if (window.opener.gBrowser)
                return window.opener.gBrowser.securityUI;
            return null;
        }
    };
}).apply(security);
