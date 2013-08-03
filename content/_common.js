
// globale Variablen fuer Preferences-Zugriff
var aios_pBranch = Components.interfaces.nsIPrefBranch;
var aios_gPref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
var aios_gPrefBranchN = aios_gPref.getBranch(null);
var aios_gPrefBranch = aios_gPref.getBranch("extensions.aios.");

// globale Variablen fuer Browser-Zugriff
var aios_WW = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
var aios_WM = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
var aios_WIN = aios_WM.getMostRecentWindow('navigator:browser');
var aios_APPCONTENT = aios_WIN.document.getElementById('appcontent');
aios_WIN.aiosIsWindow = false;


var aios_XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo);

// {ec8030f7-c20a-464f-9b0e-13a3a9e97384} => Firefox
var aios_appID = aios_XULAppInfo.ID;

// Mozilla, Flock
var aios_appVendor = aios_XULAppInfo.vendor;

// z.B. 11.0
var aios_appVersion = aios_XULAppInfo.version;

// WINNT, Darwin
var aios_appOS = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULRuntime).OS;

// z.B. Windows NT 5.1
var aios_appOSVersion = window.navigator.oscpu;

// true, false
var aios_appDefTheme = (aios_gPrefBranchN.getCharPref('general.skins.selectedSkin') == "classic/1.0") ? true : false;


function aios_appInfo(aObj) {
    aObj.setAttribute('aios-appVendor', aios_appVendor);
    aObj.setAttribute('aios-appVersion', aios_appVersion);
    aObj.setAttribute('aios-appOS', aios_appOS);
    aObj.setAttribute('aios-appOSVersion', aios_appOSVersion);
    aObj.setAttribute('aios-appDefTheme', aios_appDefTheme);
}


// globale Variablen und Funktionen zur Ueberwachung auf Progress-Veraenderungen
// Verwendung in pageInfo.xul
var aios_ProgListStart = Components.interfaces.nsIWebProgressListener.STATE_START;
var aios_ProgListStop = Components.interfaces.nsIWebProgressListener.STATE_STOP;

var aiosProgListener = {
    QueryInterface: function(aIID) {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
            return this;
        throw Components.results.NS_NOINTERFACE;
    },

    onStateChange: function(aProgress, aRequest, aFlag, aStatus) {
        //if(aFlag & aios_ProgListStart) { /* This fires when the load event is initiated */ }
        //if(aFlag & aios_ProgListStop) { /* This fires when the load finishes */ }
        if(aFlag & aios_ProgListStop) {
            if(typeof aios_onStateChange == "function") aios_onStateChange();
        }
        return 0;
    },

    onLocationChange: function(aProgress, aRequest, aURI) {
        // This fires when the location bar changes i.e load event is confirmed
        // or when the user switches tabs
        if(typeof aios_onLocationChange == "function") aios_onLocationChange();
        return 0;
    },

    // For definitions of the remaining functions see XulPlanet.com
    onProgressChange: function() {
        return 0;
    },
    onStatusChange: function() {
        return 0;
    },
    onSecurityChange: function() {
        return 0;
    },
    onLinkIconAvailable: function() {
        return 0;
    }
};


/*
	Variablen zur Verwendung der Erweiterung "DebugLogger" - http://mozmonkey.com/debuglogger/
*/
if(Components.classes["@mozmonkey.com/debuglogger/manager;1"]) {
    var aios_debugLogMngr = Components.classes["@mozmonkey.com/debuglogger/manager;1"].
    getService(Components.interfaces.nsIDebugLoggerManager);
    var aios_debugLogger = aios_debugLogMngr.registerLogger("aios");
}
//aios_debugLogger.log(3, "Hello World");


/*
	Debug-Funktion unter Verwendung der JavaScript-Konsole
*/
function aios_debug(aMsg) {
    var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
    getService(Components.interfaces.nsIConsoleService),

    msg = 'AIOS: ' + aMsg;
    aConsoleService.logStringMessage(msg);
}
//aios_debug('Hallo');


/*
	oeffnet ein neues Tab mit der uebergebenen Adresse im Vordergrund
*/
var aiosLastSelTab;		// wird fuer Page Info/MultiPanel im Tab benoetigt
function aios_addTab(aUrl) {

    var browser = aios_WIN.getBrowser();
    aiosLastSelTab = aios_WIN.content;

    var browserDoc;
    var existTab = null;
    var emptyTab = null;

    // alle geoeffneten Tabs durchgehen
    for(var i = 0; i < browser.tabContainer.childNodes.length; i++) {
        browserDoc = browser.getBrowserAtIndex(i).contentWindow.document;
        //alert(browser.getBrowserAtIndex(i).currentURI.spec);

        var isPermaTab = (browser.tabContainer.childNodes[i].getAttribute('isPermaTab')) ? true : false;
        //alert(isPermaTab);

        /*var attribs = browser.tabContainer.childNodes[i].attributes;
		//var attribs = browser.mCurrentTab.attributes;
		for(var a = 0; a < attribs.length; a++) {
			alert(attribs[a].name + ": " + attribs[a].value);
		}*/

        // wenn der Tab leer ist
        if(browserDoc.location.href == "about:blank" && browser.selectedTab.getAttribute('openBy') != "aios" && !isPermaTab && emptyTab == null)
            emptyTab = i;
        // wenn der Tab schon existiert
        if(browserDoc.location.href == aUrl && !isPermaTab && existTab == null)
            existTab = i;
    }

    // wenn der Tab schon existiert
    if(existTab != null) {
        browser.selectedTab = browser.tabContainer.childNodes[existTab];
        return browser.selectedTab;
    }

    // wenn der Tab leer ist
    if(emptyTab != null) {
        // URL oeffnen und Tab selektieren
        browser.getBrowserAtIndex(emptyTab).contentWindow.document.location.href = aUrl;
        browser.selectedTab = browser.tabContainer.childNodes[emptyTab];
        browser.selectedTab.setAttribute('openBy', 'aios');
        return browser.selectedTab;
    }

    // wenn kein leerer Tab vorhanden war, wird ein neuer geoeffnet
    browser.selectedTab = browser.addTab(aUrl);
    browser.selectedTab.setAttribute('openBy', 'aios');
    return browser.selectedTab;
}


/*
  fuegt dem Dokument dynamisch ein Stylesheet hinzu
    => Aufruf u.a. durch aios_init() und aios_sidebarLayout() bei den Add-ons, Downloads
*/
function aios_addCSS(aURI, aBefore) {
    var path = "chrome://aios/skin/css/";

    var elem = (typeof aBefore == "object") ? aBefore : document.getElementById(aBefore);

    var css = document.createProcessingInstruction("xml-stylesheet", 'href="' + path + aURI + '" type="text/css"');
    document.insertBefore(css, elem);
}


/*
	errechnet die Breite des Browsers exkl. der AIOS-Toolbar
		=> Aufruf durch aios_setSidebarDefWidth() in aios.js und aios_setSidebarWidth() in general.js
*/
function aios_getBrowserWidth() {
    var cStyleSidebar = aios_WIN.document.defaultView.getComputedStyle(aios_WIN.document.getElementById('sidebar-box'), '');
    var cStyleSplitter = aios_WIN.document.defaultView.getComputedStyle(aios_WIN.document.getElementById('sidebar-splitter'), '');
    var cStyleContent = aios_WIN.document.defaultView.getComputedStyle(aios_WIN.document.getElementById('appcontent'), '');

    var widthSidebar = parseInt(cStyleSidebar.width) + parseInt(cStyleSidebar.paddingLeft) + parseInt(cStyleSidebar.paddingRight) + parseInt(cStyleSidebar.marginLeft) + parseInt(cStyleSidebar.marginRight);

    var widthSplitter = parseInt(cStyleSplitter.width) + parseInt(cStyleSplitter.paddingLeft) + parseInt(cStyleSplitter.paddingRight) + parseInt(cStyleSplitter.marginLeft) + parseInt(cStyleSplitter.marginRight);

    var widthContent = parseInt(cStyleContent.width) + parseInt(cStyleContent.paddingLeft) + parseInt(cStyleContent.paddingRight) + parseInt(cStyleContent.marginLeft) + parseInt(cStyleContent.marginRight);

    var compWidth = widthSidebar + widthSplitter + widthContent;

    var ret_arr = new Array(widthSidebar, widthSplitter, widthContent, compWidth);
    return(ret_arr);
}


/*
	erweitert das Attribut "class" eines Elementes
*/
function aios_appendClass(elem, appClass) {
    if(typeof elem == "string") elem = document.getElementById(elem);

    var old_class = elem.getAttribute('class');
    if(old_class.indexOf(appClass) < 0) elem.setAttribute('class', old_class + " " + appClass);
}


/*
	loescht einen Klassennamen im Attribut "class" eines Elementes
*/
function aios_stripClass(elem, stripClass) {
    if(typeof elem == "string") elem = document.getElementById(elem);

    var old_class = elem.getAttribute('class');

    if(old_class.indexOf(stripClass) >= 0) {
        var pos = old_class.indexOf(stripClass);

        var slice1 = old_class.substring(0, pos);
        slice1 = slice1.replace(/ /, "");
        var slice2 = old_class.substring(pos + stripClass.length, old_class.length);
        slice2 = slice2.replace(/ /, "");

        elem.setAttribute('class', slice1 + " " + slice2);
    }

}


function aios_gElem(aID) {
    if(aios_WIN && aios_WIN.document.getElementById(aID)) return aios_WIN.document.getElementById(aID);
    return false;
}


/*
 *  ersetzt fuer MacOS X die Angaben zu Tastaturkuerzeln in den Tooltips
 *
 **/
function aios_replaceKey(aElem, aAttr, aKey) {
    var strings = document.getElementById("aiosProperties");

    var rep_elem = document.getElementById(aElem);
    var rep = rep_elem.getAttribute(aAttr);
    rep = rep.substr(rep.indexOf('+'), rep.length);
    rep_elem.setAttribute(aAttr, strings.getString('key.mac.' + aKey) + rep);
}


/*
	gibt den boolschen Wert eines Wertes zurueck
		=> getAttribute(val) liefert nur "true" oder "false" als String
*/
function aios_getBoolean(aElem, aVal) {
    var elem, bool;

    if(typeof aElem == "object") {
        elem = aElem;
    }
    else if(typeof aElem == "string" && document.getElementById(aElem)) {
        elem = document.getElementById(aElem);
    }

    if(elem) {
        if(typeof elem.getAttribute == "function") bool = elem.getAttribute(aVal);
    }

    if(bool == "true") return true;
    else return false;
}


/*
	Dialoge oeffnen
*/
function aios_openDialog(which, args) {
    var theUrl, theId, theFeatures;
    var theArgs = args;

    switch(which) {
        case "prefs":
            theUrl = "chrome://aios/content/prefs/prefs.xul";
            theId = "aiosPrefsDialog";
            theFeatures = "chrome,titlebar,toolbar,centerscreen,";
            theFeatures+= (aios_appOS == "Darwin") ? "dialog=no" : "modal";
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

        case "multipanel":
            theUrl = "chrome://browser/content/web-panels.xul";
            theId = "aiosGlobal:MultiPanel";
            theFeatures = "width=640,height=480,chrome,resizable,centerscreen";
            break;
    }

    if(which == "prefs" || which == "about") openDialog(theUrl, theId, theFeatures, theArgs);
    else toOpenWindowByType(theId, theUrl, theFeatures);
}


/*
	prueft welche Elemente angezeigt werden sollen
		=> Aufruf jeweils durch Initialisierung
*/
function aios_synchElements(aElems) {
    var elem, child, childElems, childMode;

    for(var i = 0; i < aElems.length; i++) {
        elem = document.getElementById(aElems[i]);

        if(elem) {

            childElems = elem.getAttribute('aiosChilds');

            if(childElems) {
                childMode = !aios_getBoolean(elem, 'checked');
                aios_toggleChilds(childElems, childMode);
            }
        }
    }
}


/*
	toggelt einen Menuepunkt und das/die zugehoerige/n Element/e
		=> Aufruf durch die menuitems in der aios.xul
*/
function aios_toggleElement(aMenuitem) {
    var menuitem;

    if(typeof aMenuitem != "object") aMenuitem = document.getElementById(aMenuitem);

    if(aMenuitem.getAttribute('observes')) {
        menuitem = document.getElementById(aMenuitem.getAttribute('observes'));
    }
    else {
        menuitem = document.getElementById(aMenuitem.id);
    }

    var mode = aios_getBoolean(menuitem, 'checked');
    var childElems = menuitem.getAttribute('aiosChilds');

    menuitem.setAttribute('checked', !mode);
    aios_toggleChilds(childElems, mode);
}


/*
	toggelt Kindelemente eines Menuepunkts
		=> Aufruf durch aios_toggleElement()
*/
function aios_toggleChilds(childElems, childMode) {
    var child_str, child;

    if(childElems != "") {
        var childElems_arr = childElems.split(",");

        for(var i = 0; i < childElems_arr.length; i++) {
            child_str = childElems_arr[i].replace(/ /, "");

            var idChilds_arr = document.getElementsByAttribute('id', child_str);

            // wenn es nur ein Element mit der ID gibt...
            if(idChilds_arr.length == 1) {
                child = document.getElementById(child_str);
            }
            // wenn es mehrere Elemente mit der ID gibt...
            else {
                for(var j = 0; j < idChilds_arr.length; j++) {
                    //... nimm das auf der AIOS-Toolbar
                    if(idChilds_arr[j].parentNode.id == "aios-toolbar") child = idChilds_arr[j];
                }
            }

            if(child) child.setAttribute('hidden', childMode);
        }
    }
}


/**
 *  Tastaturkuerzel entfernen, um nicht die des Hauptbrowsers zu blockieren
 *
 *      => Aufruf in downloads.js, pageinfo.js, console.js
 **/
function aios_removeAccesskeys() {
    var keys = document.getElementsByAttribute('accesskey', '*');
    for(var i = 0; i < keys.length; i++) {
        keys[i].removeAttribute('accesskey')
    }
}


/**
 *
 **/
function aios_hideMacMenubar() {
    if(document.getElementById('main-menubar'))
        document.getElementById('main-menubar').style.display = "none";
}