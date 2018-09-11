var Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/Services.jsm");
var compareResult = Services.vc.compare(AiOS_HELPER.appInfo.version, "28.*");

if (compareResult == 0 || compareResult == 1 || AiOS_HELPER.appInfo.ID == "ec8030f7-c20a-464f-9b0e-13a3a9e97384") {
    var NS_ERROR_MODULE_NETWORK = 2152398848;
    var NS_NET_STATUS_READ_FROM = NS_ERROR_MODULE_NETWORK + 8;
    var NS_NET_STATUS_WROTE_TO  = NS_ERROR_MODULE_NETWORK + 9;
}

/*
 * Modified original monitoring function from web-panels.js
 */
var panelProgressListener = {
    onProgressChange: function (aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress,
        aCurTotalProgress, aMaxTotalProgress) {},

    onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
        if (!aRequest)
            return;

        // Set sidebar/window title
        AiOS_MP.setSBLabel();

        // Ignore local/resource:/chrome: files
        if (aStatus == NS_NET_STATUS_READ_FROM || aStatus == NS_NET_STATUS_WROTE_TO)
            return;

        const nsIWebProgressListener = Ci.nsIWebProgressListener;
        const nsIChannel = Ci.nsIChannel;

        // Stop/reload command vars
        var stp = document.getElementById("Browser:Stop");
        var rld = document.getElementById("Browser:Reload");

        if (aStateFlags & nsIWebProgressListener.STATE_START && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
            if (window.parent.document.getElementById("sidebar-throbber"))
                window.parent.document.getElementById("sidebar-throbber").setAttribute("loading", "true");
            aios_setAttributes(stp, { disabled: false, hidden: false });
            aios_setAttributes(rld, { disabled: true, hidden: true });
        } else if (aStateFlags & nsIWebProgressListener.STATE_STOP && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
            if (window.parent.document.getElementById("sidebar-throbber"))
                window.parent.document.getElementById("sidebar-throbber").removeAttribute("loading");
            aios_setAttributes(stp, { disabled: true, hidden: true });
            aios_setAttributes(rld, { disabled: false, hidden: false });
        }

        AiOS_MP.setSSR();
    },

    onLocationChange: function (aWebProgress, aRequest, aLocation) {
        // Activate/deactivate buttons
        AiOS_MP.setOptions();
        let asc = aLocation;
        // Change urlbar link when browser panel location changes
        if (asc.spec == "about:blank")
            AiOS_MP.URLBar.value = "";
        else
            AiOS_MP.URLBar.value = asc.spec;
        // And set last valid URI also (for text reverted)
        AiOS_MP.lastValidURI = asc;
        // Work around for broken back/forward button states
        document.getElementById("Browser:Forward").setAttribute("disabled", !getPanelBrowser().canGoForward);
        document.getElementById("Browser:Back").setAttribute("disabled", !getPanelBrowser().canGoBack);
    },

    onStatusChange: function (aWebProgress, aRequest, aStatus, aMessage) {
        // Small Screen Rendering?
        AiOS_MP.setSSR();
    },

    onSecurityChange: function (aWebProgress, aRequest, aState) {
        // aState is defined as a bitmask that may be extended in the future.
        // We filter out any unknown bits before testing for known values.
        const wpl = Ci.nsIWebProgressListener;
        const wpl_security_bits = wpl.STATE_IS_SECURE |
            wpl.STATE_IS_BROKEN |
            wpl.STATE_IS_INSECURE |
            wpl.STATE_IDENTITY_EV_TOPLEVEL |
            wpl.STATE_SECURE_HIGH |
            wpl.STATE_SECURE_MED |
            wpl.STATE_SECURE_LOW;
        // Security level var
        var level;
        // Identify current security level
        switch (aState & wpl_security_bits) {
        case wpl.STATE_IS_SECURE | wpl.STATE_SECURE_HIGH | wpl.STATE_IDENTITY_EV_TOPLEVEL:
            level = "ev";
            break;
        case wpl.STATE_IS_SECURE | wpl.STATE_SECURE_HIGH:
            level = "high";
            break;
        case wpl.STATE_IS_SECURE | wpl.STATE_SECURE_MED:
        case wpl.STATE_IS_SECURE | wpl.STATE_SECURE_LOW:
            level = "low";
            break;
        case wpl.STATE_IS_BROKEN | wpl.STATE_SECURE_LOW:
            level = "mixed";
            break;
        case wpl.STATE_IS_BROKEN:
            level = "broken";
            break;
        default: // should not be reached
            level = null;
            break;
        }
        // Set padlock tooltip & icon
        this.setPadlockLevel(level);
    },

    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIWebProgressListener) ||
            aIID.equals(Ci.nsISupportsWeakReference) ||
            aIID.equals(Ci.nsISupports))
            return this;

        throw Components.results.NS_NOINTERFACE;
    },

    // Padlock code borrowed from browser's padlock module
    setPadlockLevel: function (level) {
        let secbut = document.getElementById("lock-icon");
        var sectooltip = "";

        if (level) {
            secbut.setAttribute("level", level);
            secbut.hidden = false;
        } else {
            secbut.hidden = true;
            secbut.removeAttribute("level");
        }
        // Should be localized browser-side
        switch (level) {
        case "ev":
            sectooltip = "Extended Validated";
            break;
        case "high":
            sectooltip = "Secure";
            break;
        case "low":
            sectooltip = "Weak security";
            break;
        case "mixed":
            sectooltip = "Mixed mode (partially encrypted)";
            break;
        case "broken":
            sectooltip = "Not secure";
            break;
        default:
            sectooltip = "";
        }
        secbut.setAttribute("tooltiptext", sectooltip);
    }
};

// Add automatic update listener & remove
window.addEventListener("load", AiOS_MP.init);

window.addEventListener("unload", function (e) {
    if (top.gBrowser && top.gBrowser.removeProgressListener)
        top.gBrowser.removeProgressListener(aiosProgListener);
    AiOS_MP.unload();
}, false);
