
var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

var webPanel;
if(document.getElementById('web-panels-browser')) webPanel = document.getElementById('web-panels-browser');


/*
	Initialization
		=> Called by onload
*/
function aios_init() {
    // Set sidebar/window title
    aios_setSBLabel();

    // Activate/deactivate buttons
    aios_setOptions();

    window.setTimeout(function() {
        aios_setSSR();
    }, 50);
	
	// Set linked btn attribute
	document.getElementById("aios-linkedbtn").setAttribute("checked", webPanel.getAttribute("linkedopt")); 

    // For CSS purposes
    AiOS_HELPER.rememberAppInfo( document.getElementById('webpanels-window') );
}


/*
    Modified original monitoring function from web-panels.js
*/
var panelProgressListener = {
    onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress,
        aCurTotalProgress, aMaxTotalProgress) {
    },

    onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
        if(!aRequest) return;

        // Set sidebar/window title
        aios_setSBLabel();
		
        // Ignore local/resource:/chrome: files
        if(aStatus == NS_NET_STATUS_READ_FROM || aStatus == NS_NET_STATUS_WROTE_TO) return;

        const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
        const nsIChannel = Components.interfaces.nsIChannel;
		
		// Stop/reload command vars
		var stp = document.getElementById('Browser:Stop');
		var	rld = document.getElementById('Browser:Reload');

        if(aStateFlags & nsIWebProgressListener.STATE_START && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
            if(window.parent.document.getElementById('sidebar-throbber'))
                window.parent.document.getElementById('sidebar-throbber').setAttribute("loading", "true");
				stp.setAttribute('disabled', 'false');
				rld.setAttribute('disabled', 'true');
				stp.setAttribute('hidden', 'false');
				rld.setAttribute('hidden', 'true');
        }
        else if(aStateFlags & nsIWebProgressListener.STATE_STOP && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
            if(window.parent.document.getElementById('sidebar-throbber'))
                window.parent.document.getElementById('sidebar-throbber').removeAttribute("loading");
				stp.setAttribute('disabled', 'true');
				rld.setAttribute('disabled', 'false');
				stp.setAttribute('hidden', 'true');
				rld.setAttribute('hidden', 'false');
        }
    },

    onLocationChange: function(aWebProgress, aRequest, aLocation) {
		// Activate/deactivate buttons
        aios_setOptions();
		var asc = aLocation;
		// Change urlbar link when browser panel location changes
		document.getElementById("urlbar").value = asc.spec;
		// And set last valid URI also
		WebPanels.lastValidURI = asc;
		// Set vars for back/forward commands
		var bcb = document.getElementById('Browser:Back');
		var fwb = document.getElementById('Browser:Forward');
		// Work around for broken back/forward button states
		// TODO: Use diff. style w/o using if/else statements
		if (webPanel.canGoBack)
			bcb.setAttribute('disabled', 'false');
		else
			bcb.setAttribute('disabled', 'true');
		
		if (webPanel.canGoForward)
			fwb.setAttribute('disabled', 'false');
		else
			fwb.setAttribute('disabled', 'true');
    },

    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {
        // Small Screen Rendering?
        aios_setSSR();
    },

    onSecurityChange: function(aWebProgress, aRequest, aState) {
    },

    QueryInterface: function(aIID) {
        if(aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
            return this;

        throw Components.results.NS_NOINTERFACE;
    }
};


/*
	Opens the web page displayed in the browser in the MultiPanel
		=> Call by buttons, aios_panelTab()
*/
function aios_setMultiPanel(aMode) {
    var label, panelLoc;
    var aios_CONTENT = AiOS_HELPER.mostRecentWindow.document.getElementById('content');

    // about: entries
    if(aMode.indexOf("about:") == 0 && aMode != "about:blank") {
        panelLoc = (aMode == "about:config") ? "chrome://global/content/config.xul" : aMode;
        label = aMode;
    }
    // WebPanel-Page
    else {
        try {
            panelLoc = aios_CONTENT.currentURI.spec;
            label = aios_CONTENT.selectedTab.label;
        } catch(e) { }

        // I am the MultiPanel in the tab
        if(top.toString() == "[object Window]" && AiOS_HELPER.mostRecentWindow.aiosLastSelTab) {
            panelLoc = AiOS_HELPER.mostRecentWindow.aiosLastSelTab.document.location.href;
        }
    }

    // when "Page" is clicked, while in the tab the MultiPanel is loaded
    if(panelLoc == "chrome://browser/content/web-panels.xul") {
        panelLoc = aios_CONTENT.contentDocument.getElementById('web-panels-browser').getAttribute('cachedurl');
    }

    var newLabel = "";

	// Open MultiPanel or load contents
    if(top.document.getElementById('sidebar') && top.toString() != "[object Window]")   top.openWebPanel(newLabel, panelLoc);
    else webPanel.contentDocument.location.href = panelLoc;
}


/*
	Activates/deactivates the Toolbar Buttons and Radio-Menu Items (about)
		=> Calling onLocationChange() when MultiPanel URL changes (panelProgressListener)
*/
function aios_setOptions() {

    var mode, i;

    var aboutGroup = document.getElementById('aboutGroup').childNodes;
    var panelLoc = webPanel.contentDocument.location.href;

    if(panelLoc != "about:blank") {
        mode = "page";
        if(panelLoc.indexOf("about:") == 0 && panelLoc != "about:home") mode = "about";
        if(panelLoc == "chrome://global/content/config.xul") mode = "about";
    }

    if(!mode) return false;

    if(mode != "page") document.getElementById('page-button').setAttribute('checked', false);
    if(mode != "about") document.getElementById('about-button').setAttribute('checked', false);
    document.getElementById(mode + '-button').setAttribute('checked', true);

    if(mode == "page") {
        for(i = 0; i < aboutGroup.length; i++) {
            if(aboutGroup[i].tagName == "menuitem") aboutGroup[i].setAttribute('checked', false);
        }
    }
    else {
        for(i = 0; i < aboutGroup.length; i++) {
            var label = aboutGroup[i].getAttribute('label');
            var isActive = label == panelLoc;
            isActive = (label == "about:config" && panelLoc == "chrome://global/content/config.xul");
            if(aboutGroup[i].tagName == "menuitem" && isActive) aboutGroup[i].setAttribute('checked', true);
        }
    }

    webPanel.setAttribute('cachedurl', panelLoc);
    document.persist('web-panels-browser', "cachedurl");

    return true;
}


/*
	Sidebar label
		=> Invoked by onload event and onStateChange() when multiPanel URL changes (panelProgressListener)
*/
function aios_setSBLabel() {
    var newLabel = "";

    var mpLabel = AiOS_HELPER.mostRecentWindow.document.getElementById('viewWebPanelsSidebar').getAttribute('label');

    if(webPanel && webPanel.contentDocument) {
        var loc = webPanel.contentDocument.location.href;

        if(webPanel.contentDocument.title != "") newLabel = newLabel + webPanel.contentDocument.title;
    }

    if(newLabel != "") newLabel = newLabel + " - " + mpLabel;
    else newLabel = mpLabel;

    if(top.document.getElementById('sidebar-title'))
        top.document.getElementById('sidebar-title').setAttribute('value', newLabel);

    if(!top.document.getElementById('sidebar-title')) top.document.title = newLabel;
}


/*
	Small Screen Rendering on/off
		=> Invoked by onStateChange() when MultiPanel URL changes (panelProgressListener)
		Original code in parts of: Daniel Glazman <glazman@netscape.com>
*/
function aios_setSSR() {
    //if(!aios_getBoolean("ssr-mitem", "checked")) return false;

    var ssrURL = "chrome://aios/skin/css/multipanel_ssr.css";

    try {
        var doc = webPanel.contentDocument;
    //var docRoot = doc.documentElement;    // Abfrage verursacht bei einigen Seiten einen groesser skalierten Text ???
    //var docRootName = docRoot.nodeName.toLowerCase();
    } catch(e) { }

    //if(!doc || !docRoot || !docRootName || !doc.body || !aios_getBoolean("page-button", "checked")) return false;
    if(!doc || !doc.body || !aios_getBoolean("page-button", "checked")) return false;

    // is the document using frames ? we don't like frames for the moment
    //if(docRootName == "html" && doc.body.nodeName.toLowerCase() == "frameset") {
    if(doc.body.nodeName.toLowerCase() == "frameset") {
        dump("Small Screen Rendering, No frames allowed");
        return false;
    }

    var styleSheets = doc.styleSheets;
    for(var i = 0; i < styleSheets.length; ++i) {
        var currentStyleSheet = styleSheets[i];

        if(/multipanel_ssr/.test(currentStyleSheet.href)) {
            currentStyleSheet.disabled = !aios_getBoolean("ssr-mitem", "checked");
            var aiosSidebar = aios_getBoolean("ssr-mitem", "checked") && aios_getBoolean("ssrSidebar-mitem", "checked");
            doc.body.setAttribute('aiosSidebar', aiosSidebar);
            return true;
        }
    }

    // we have to attach the stylesheet to the document...
    // what's the document root ? html ?
    //if(docRootName == "html" && aios_getBoolean("ssr-mitem", "checked")) {
    if(aios_getBoolean("ssr-mitem", "checked")) {
        // let's create a link element
        var headElement = doc.getElementsByTagName("head")[0];
        var linkElement = doc.createElement("link");
        linkElement.setAttribute("rel", "stylesheet");
        linkElement.setAttribute("type", "text/css");
        linkElement.setAttribute("href", ssrURL);

        headElement.appendChild(linkElement);
    }

    return true;
}


/*
    MultiPanel-Unload
*/
function aios_unloadMultiPanel() {
    if(webPanel && !aios_getBoolean("aios-remMultiPanel", "checked")) {
        webPanel.setAttribute('cachedurl', '');
        document.persist('web-panels-browser', "cachedurl");
    }
}

function aios_getPageOptions() {
    document.getElementById('ssrSidebar-mitem').setAttribute('disabled', !aios_getBoolean("ssr-mitem", "checked"));
}

/*
	WebPanel functions
	Code borrowed from an older version of Firefox
*/
var WebPanels = {
	
  get URLBar() { return document.getElementById("urlbar"); },

  _lastValidURI: null,
  get lastValidURI() { return this._lastValidURI; },
  set lastValidURI(val) { this._lastValidURI = val; },

  sanitizeURL: function mp_sanitizeURL(strl) {
    // Fix and check the url typed into the address bar for any errors
	return Services.uriFixup.createFixupURI(strl, 8);
  },
  
  toggleLinked: function mp_toggleLinked() {
    var btn = document.getElementById("aios-linkedbtn");
    if (btn.getAttribute("checked") == "true") {
      btn.setAttribute("checked", "false");
    } else {
      btn.setAttribute("checked", "true");
    }
	// instead of using a pref, simply persist the attribute
	webPanel.setAttribute('linkedopt', btn.getAttribute("checked"));
  },
  
  onContentAreaClick: function mp_onContentAreaClick(ev, bool) {
    var btn = document.getElementById("aios-linkedbtn");
    if (btn.getAttribute("checked") == "true") {
	  // If checked, open link in current tab
      return window.parent.contentAreaClick(ev, bool);
    } else {
	  // If no, just do nothing
      return;
    }
  },
  
  onTextReverted: function mp_onTextReverted() {  
    // Setup variables
    var url = this.lastValidURI;
    var throbberElement = window.parent.document.getElementById("sidebar-throbber");
    var isScrolling = this.URLBar.popupOpen;

    // Don't revert to last valid url unless page is NOT loading
    // and user is NOT key-scrolling through autocomplete list
    if ((!throbberElement || !throbberElement.hasAttribute("loading")) && !isScrolling) {
      if (url != "about:blank") {
        this.URLBar.value = url.spec;
        this.URLBar.select();
      
       // If about:blank, urlbar becomes ""  
      } else 
        this.URLBar.value = "";
    }

    // Tell widget to revert to last typed text only if the user
    // was scrolling when they hit escape
    return !isScrolling;
  },

  onTextEntered: function mp_onTextEntered(event) {
	// Sanitize the URL
	var url = this.sanitizeURL(this.URLBar.value);
	this.lastValidURI = url;
	
    // Load the typed url, if blank, don't do anything
	webPanel.contentDocument.location.href = url.spec;
  }
}