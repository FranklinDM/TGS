var AiOS_HELPER = {

    init: function () {
        this.prefInterface = Components.interfaces.nsIPrefBranch;
        this.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);

        this.prefBranch.prefBranchInternal = this.prefService.getBranch(null);
        this.prefBranchAiOS = Object.assign({}, this.prefBranch);
        this.prefBranchAiOS.prefBranchInternal = this.prefService.getBranch("extensions.aios.");

        this.consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
        this.windowWatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
        this.windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        this.mostRecentWindow = this.windowMediator.getMostRecentWindow("navigator:browser");

        this.appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
        this.os = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
        this.osVersion = window.navigator.oscpu;
        this.defTheme = (this.prefBranch.getCharPref("general.skins.selectedSkin") == "classic/1.0") ? true : false;

        this.usingCUI = false;
        // If CustomizableUI object is present or using Firefox UUID
        if (AiOS_HELPER.mostRecentWindow.CustomizableUI || AiOS_HELPER.appInfo.ID == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}") {
            this.usingCUI = true;
        }
    },

    log: function (ex) {
        if (this.prefService.getBranch("extensions.aios.").getBoolPref("logging"))
            this.consoleService.logStringMessage("TGS: " + ex);
    },

    // nsIPrefBranch custom implementation
    prefBranch: {
        // Get preferences
        getBoolPref: function (pref) {
            try {
                return this.prefBranchInternal.getBoolPref(pref);
            } catch (e) {
                AiOS_HELPER.log(e);
                return false;
            }
        },
        getIntPref: function (pref) {
            try {
                return this.prefBranchInternal.getIntPref(pref);
            } catch (e) {
                AiOS_HELPER.log(e);
                return 0;
            }
        },
        getCharPref: function (pref) {
            try {
                return this.prefBranchInternal.getCharPref(pref);
            } catch (e) {
                AiOS_HELPER.log(e);
                return "";
            }
        },
        getComplexValue: function (pref, type) {
            try {
                return this.prefBranchInternal.getComplexValue(pref, type);
            } catch (e) {
                AiOS_HELPER.log(e);
            }
        },

        // Set preferences
        setBoolPref: function (pref, val) {
            try {
                this.prefBranchInternal.setBoolPref(pref, val);
            } catch (e) {
                AiOS_HELPER.log(e);
            }
        },
        setIntPref: function (pref, val) {
            try {
                this.prefBranchInternal.setIntPref(pref, val);
            } catch (e) {
                AiOS_HELPER.log(e);
            }
        },
        setCharPref: function (pref, val) {
            try {
                this.prefBranchInternal.setCharPref(pref, val);
            } catch (e) {
                AiOS_HELPER.log(e);
            }
        },
        setComplexValue: function (pref, type, val) {
            try {
                return this.prefBranchInternal.setComplexValue(pref, type, val);
            } catch (e) {
                AiOS_HELPER.log(e);
            }
        },

        // Others
        prefHasUserValue: function (pref) {
            return this.prefBranchInternal.prefHasUserValue(pref);
        },
        prefIsLocked: function (pref) {
            return this.prefBranchInternal.prefIsLocked(pref);
        },
        clearUserPref: function (pref) {
            this.prefBranchInternal.clearUserPref(pref);
        },
        getChildList: function (startingAt) {
            if (typeof startingAt === "undefined")
                startingAt = "";
            return this.prefBranchInternal.getChildList(startingAt);
        },
        getPrefType: function (pref) {
            return this.prefBranchInternal.getPrefType(pref);
        },

        // Observers
        addObserver: function (domain, observer, holdWeak) {
            this.prefBranchInternal.addObserver(domain, observer, holdWeak);
        },
        removeObserver: function (domain, observer) {
            this.prefBranchInternal.removeObserver(domain, observer);
        },

        // Preference locking
        lockPref: function (pref) {
            this.prefBranchInternal.lockPref(pref);
        },
        unlockPref: function (pref) {
            this.prefBranchInternal.unlockPref(pref);
        },

        // Deleting/resetting preferences
        deleteBranch: function (startingAt) {
            this.prefBranchInternal.deleteBranch(startingAt);
        },
        resetBranch: function (startingAt) {
            // This is not implemented in original prefBranch
            let prefArray = this.getChildList("");
            for (let i = 0; i < prefArray.length; i++) {
                if (this.prefHasUserValue(prefArray[i])) {
                    this.clearUserPref(prefArray[i]);
                }
            }
        }
    },

    rememberAppInfo: function (aObj) {
        aObj.setAttribute("aios-appVendor", this.appInfo.vendor);
        aObj.setAttribute("aios-appVersion", this.appInfo.version);
        aObj.setAttribute("aios-appOS", this.os);
        aObj.setAttribute("aios-appOSVersion", this.osVersion);
        aObj.setAttribute("aios-appDefTheme", this.defTheme);
    }

};

AiOS_HELPER.init();

// Progress listener to watch changes to page state, used by Page Info in sidebar
var AiOS_ProgressListener = {
    QueryInterface: function (aIID) {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
            return this;

        throw Components.results.NS_NOINTERFACE;
    },

    onStateChange: function (aProgress, aRequest, aFlag, aStatus) {
        if (aFlag & Components.interfaces.nsIWebProgressListener.STATE_STOP) {
            if (typeof AiOS_PageInfo == "object")
                AiOS_PageInfo.onStateChange();
        }
    },

    onLocationChange: function (aProgress, aRequest, aURI) {
        if (typeof AiOS_PageInfo == "object")
            AiOS_PageInfo.onLocationChange();
    },
};

/*
 * Opens a new tab with the given address in the foreground
 */
var aiosLastSelTab; // Required for Page Info/MultiPanel in the tab
function aios_addTab(aUrl) {
    var browser = AiOS_HELPER.mostRecentWindow.getBrowser();
    aiosLastSelTab = AiOS_HELPER.mostRecentWindow.content;

    var browserDoc;
    var existTab = null;
    var emptyTab = null;

    // Go through all open tabs
    for (var i = 0; i < browser.tabContainer.childNodes.length; i++) {
        browserDoc = browser.getBrowserAtIndex(i).contentWindow.document;

        var isPermaTab = (browser.tabContainer.childNodes[i].getAttribute("isPermaTab")) ? true : false;

        // If the tab is empty
        if (browserDoc.location.href == "about:blank" && browser.selectedTab.getAttribute("openBy") != "aios" && !isPermaTab && emptyTab == null)
            emptyTab = i;

        // If the tab already exists
        if (browserDoc.location.href == aUrl && !isPermaTab && existTab == null)
            existTab = i;
    }

    // If the tab already exists
    if (existTab != null) {
        browser.selectedTab = browser.tabContainer.childNodes[existTab];
        return browser.selectedTab;
    }

    // If the tab is empty
    if (emptyTab != null) {
        // Open URL and select tab
        browser.getBrowserAtIndex(emptyTab).contentWindow.document.location.href = aUrl;
        browser.selectedTab = browser.tabContainer.childNodes[emptyTab];
        browser.selectedTab.setAttribute("openBy", "aios");
        return browser.selectedTab;
    }

    // If there was no empty tab, a new one will be opened
    browser.selectedTab = browser.addTab(aUrl);
    browser.selectedTab.setAttribute("openBy", "aios");
    return browser.selectedTab;
}

/*
 * Dynamically adds a stylesheet to the document
 * => Called through aios_init() and aios_sidebarLayout() in the add-ons, Downloads
 */
function aios_addCSS(aURI, aBefore) {
    var path = "chrome://aios/skin/css/";

    var elem = (typeof aBefore == "object") ? aBefore : document.getElementById(aBefore);

    var css = document.createProcessingInstruction("xml-stylesheet", "href=\"" + path + aURI + "\" type=\"text/css\"");
    document.insertBefore(css, elem);
}

/*
 * Calculates the width of the browser excluding the AIOS toolbar
 * => Called by aios_setSidebarDefWidth() in aios.js and aios_setSidebarWidth() in general.js
 */
function aios_getBrowserWidth() {
    var cStyleSidebar = AiOS_HELPER.mostRecentWindow.document.defaultView.getComputedStyle(AiOS_HELPER.mostRecentWindow.document.getElementById("sidebar-box"), "");
    var cStyleSplitter = AiOS_HELPER.mostRecentWindow.document.defaultView.getComputedStyle(AiOS_HELPER.mostRecentWindow.document.getElementById("sidebar-splitter"), "");
    var cStyleContent = AiOS_HELPER.mostRecentWindow.document.defaultView.getComputedStyle(AiOS_HELPER.mostRecentWindow.document.getElementById("appcontent"), "");

    var widthSidebar = parseInt(cStyleSidebar.width) + parseInt(cStyleSidebar.paddingLeft) + parseInt(cStyleSidebar.paddingRight) + parseInt(cStyleSidebar.marginLeft) + parseInt(cStyleSidebar.marginRight);

    var widthSplitter = parseInt(cStyleSplitter.width) + parseInt(cStyleSplitter.paddingLeft) + parseInt(cStyleSplitter.paddingRight) + parseInt(cStyleSplitter.marginLeft) + parseInt(cStyleSplitter.marginRight);

    var widthContent = parseInt(cStyleContent.width) + parseInt(cStyleContent.paddingLeft) + parseInt(cStyleContent.paddingRight) + parseInt(cStyleContent.marginLeft) + parseInt(cStyleContent.marginRight);

    var compWidth = widthSidebar + widthSplitter + widthContent;

    var ret_arr = [widthSidebar, widthSplitter, widthContent, compWidth];
    return (ret_arr);
}

/*
 * Extends the "class" attribute of an element
 */
function aios_appendClass(elem, appClass) {
    if (typeof elem == "string")
        elem = document.getElementById(elem);

    var old_class = elem.getAttribute("class");
    if (old_class.indexOf(appClass) < 0)
        elem.setAttribute("class", old_class + " " + appClass);
}

/*
 * Deletes a class name in the "class" attribute of an element
 */
function aios_stripClass(elem, stripClass) {
    if (typeof elem == "string")
        elem = document.getElementById(elem);

    var old_class = elem.getAttribute("class");

    if (old_class.indexOf(stripClass) >= 0) {
        var pos = old_class.indexOf(stripClass);

        var slice1 = old_class.substring(0, pos);
        slice1 = slice1.replace(/ /, "");
        var slice2 = old_class.substring(pos + stripClass.length, old_class.length);
        slice2 = slice2.replace(/ /, "");

        elem.setAttribute("class", slice1 + " " + slice2);
    }
}

function aios_gElem(aID) {
    if (AiOS_HELPER.mostRecentWindow && AiOS_HELPER.mostRecentWindow.document.getElementById(aID))
        return AiOS_HELPER.mostRecentWindow.document.getElementById(aID);
    return false;
}

/*
 * Replaces the keyboard shortcuts in the tooltips for MacOS X
 */
function aios_replaceKey(aElem, aAttr, aKey) {
    var strings = document.getElementById("aiosProperties");

    var rep_elem = document.getElementById(aElem);
    var rep = rep_elem.getAttribute(aAttr);
    rep = rep.substr(rep.indexOf("+"), rep.length);
    rep_elem.setAttribute(aAttr, strings.getString("key.mac." + aKey) + rep);
}

/*
 * Returns the boolean value of a value
 * => getAttribute (val) only returns "true" or "false" as a string
 */
function aios_getBoolean(aElem, aVal) {
    var elem,
        bool;

    if (typeof aElem == "object") {
        elem = aElem;
    } else if (typeof aElem == "string" && document.getElementById(aElem)) {
        elem = document.getElementById(aElem);
    }

    if (elem) {
        if (typeof elem.getAttribute == "function")
            bool = elem.getAttribute(aVal);
    }

    if (bool == "true")
        return true;
    else
        return false;
}

/*
 * Opens dialogs
 */
function aios_openDialog(which, args) {
    var theUrl,
        theId,
        theFeatures;
    var theArgs = args;

    switch (which) {
    case "prefs":
        theUrl = "chrome://aios/content/prefs/prefs.xul";
        theId = "aiosPrefsDialog";
        theFeatures = "chrome,titlebar,toolbar,centerscreen,";
        theFeatures += (AiOS_HELPER.os == "Darwin") ? "dialog=no" : "modal";
        break;

    case "about":
        theUrl = "chrome://aios/content/about.xul";
        theId = "aiosAboutDialog";
        theFeatures = "chrome,modal";
        break;

    case "bookmarks":
        theUrl = "chrome://browser/content/bookmarks/bookmarksPanel.xul";
        theId = "aiosGlobal:Bookmarks";
        theFeatures = "width=640,height=480,chrome,resizable,centerscreen";
        break;

    case "history":
        theUrl = "chrome://browser/content/history/history-panel.xul";
        theId = "aiosGlobal:History";
        theFeatures = "width=640,height=480,chrome,resizable,centerscreen";
        break;

    case "cookies":
        theUrl = "chrome://browser/content/preferences/cookies.xul";
        theId = "Browser:Cookies";
        theFeatures = "";
        break;

    case "multipanel":
        theUrl = "chrome://browser/content/web-panels.xul";
        theId = "aiosGlobal:MultiPanel";
        theFeatures = "width=640,height=480,chrome,resizable,centerscreen";
        break;

    default:
        theUrl = which;
        theId = args;
        theFeatures = "width=640,height=480,chrome,resizable,centerscreen";
        break;
    }

    if (which == "prefs" || which == "about")
        openDialog(theUrl, theId, theFeatures, theArgs);
    else
        toOpenWindowByType(theId, theUrl, theFeatures);
}

/*
 * Toggles a menu item and/or its/their element(s)
 * => Called through the menuitems in the aios.xul
 */
function aios_toggleElement(aMenuitem) {
    var menuitem;

    if (typeof aMenuitem != "object")
        aMenuitem = document.getElementById(aMenuitem);

    if (aMenuitem.getAttribute("observes")) {
        menuitem = document.getElementById(aMenuitem.getAttribute("observes"));
    } else {
        menuitem = document.getElementById(aMenuitem.id);
    }

    var mode = aios_getBoolean(menuitem, "checked");
    var childElems = menuitem.getAttribute("aiosChilds");

    menuitem.setAttribute("checked", !mode);
    aios_toggleChilds(childElems, mode);
}

/*
 * Toggles child elements of a menu item
 * => Called by aios_toggleElement()
 */
function aios_toggleChilds(childElems, childMode) {
    var child_str,
        child;

    if (childElems != "") {
        var childElems_arr = childElems.split(",");

        for (var i = 0; i < childElems_arr.length; i++) {
            child_str = childElems_arr[i].replace(/ /, "");

            var idChilds_arr = document.getElementsByAttribute("id", child_str);

            // If there is only one element with the ID
            if (idChilds_arr.length == 1) {
                child = document.getElementById(child_str);
            }
            // If there are several elements with the ID
            else {
                for (var j = 0; j < idChilds_arr.length; j++) {
                    // Take that on the AIOS toolbar
                    if (idChilds_arr[j].parentNode.id == "aios-toolbar")
                        child = idChilds_arr[j];
                }
            }

            if (child)
                child.setAttribute("hidden", childMode);
        }
    }
}

/*
 * Set multiple attributes of one element
 */
function aios_setAttributes(elem, attrs) {
    for (var key in attrs) {
        elem.setAttribute(key, attrs[key]);
    }
}

/*
 * Remove keyboard shortcuts to avoid blocking the main browser
 * => Called in downloads.js, pageinfo.js, console.js
 */
function aios_removeAccesskeys() {
    var keys = document.getElementsByAttribute("accesskey", "*");
    for (var i = 0; i < keys.length; i++) {
        keys[i].removeAttribute("accesskey");
    }
}

/*
 * Hides the Mac menu bar in some cases
 */
function aios_hideMacMenubar() {
    if (document.getElementById("main-menubar"))
        document.getElementById("main-menubar").style.display = "none";
}
