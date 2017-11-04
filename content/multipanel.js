let Cc = Components.classes;
let Ci = Components.interfaces;

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

	// Set URLBar value to cached one
	WebPanels.URLBar.value = webPanel.getAttribute("cachedurl");

	// For CSS purposes
	AiOS_HELPER.rememberAppInfo( document.getElementById('webpanels-window') );

	// If URL is blank, go to about:blank
	if (WebPanels.URLBar.value == "") webPanel.contentDocument.location.href = "about:blank";
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

		const nsIWebProgressListener = Ci.nsIWebProgressListener;
		const nsIChannel = Ci.nsIChannel;

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
				aios_setSSR();
		}
		else if(aStateFlags & nsIWebProgressListener.STATE_STOP && aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK) {
			if(window.parent.document.getElementById('sidebar-throbber'))
				window.parent.document.getElementById('sidebar-throbber').removeAttribute("loading");
				stp.setAttribute('disabled', 'true');
				rld.setAttribute('disabled', 'false');
				stp.setAttribute('hidden', 'true');
				rld.setAttribute('hidden', 'false');
				aios_setSSR();
		}
	},

	onLocationChange: function(aWebProgress, aRequest, aLocation) {
		// Activate/deactivate buttons
		aios_setOptions();
		var asc = aLocation;
		// Change urlbar link when browser panel location changes
		WebPanels.URLBar.value = asc.spec;
		// And set last valid URI also (for text reverted)
		WebPanels.lastValidURI = asc;
		// Set vars for back/forward commands
		var bcb = document.getElementById('Browser:Back');
		var fwb = document.getElementById('Browser:Forward');
		// Work around for broken back/forward button states
		fwb.setAttribute('disabled', !webPanel.canGoForward);
		bcb.setAttribute('disabled', !webPanel.canGoBack);
	},

	onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {
		// Small Screen Rendering?
		aios_setSSR();
	},

	onSecurityChange: function(aWebProgress, aRequest, aState) {
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

	QueryInterface: function(aIID) {
		if(aIID.equals(Ci.nsIWebProgressListener) ||
			aIID.equals(Ci.nsISupportsWeakReference) ||
			aIID.equals(Ci.nsISupports))
			return this;

		throw Components.results.NS_NOINTERFACE;
	},

	// Padlock code borrowed from browser's padlock module
	setPadlockLevel: function(level) {
	 let secbut = document.getElementById("lock-icon");
	 var sectooltip = "";

	 if (level) {
	   secbut.setAttribute("level", level);
	   secbut.hidden = false;
	 } else {
	   secbut.hidden = true;
	   secbut.removeAttribute("level");
	 }
	 // Should be localizaed browser-side
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

	WebPanels.URLBar.value = panelLoc;

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
	var ssrURL = "chrome://aios/skin/css/multipanel_ssr.css";

	try {
		var doc = webPanel.contentDocument;
	} catch(e) { }

	if(!doc || !doc.body || !aios_getBoolean("page-button", "checked")) return false;

	// is the document using frames ? we don't like frames for the moment
	if(doc.body.nodeName.toLowerCase() == "frameset") {
		dump("Small Screen Rendering, No frames allowed");
		return false;
	}

	var styleSheets = doc.styleSheets;
	for(var i = 0; i < styleSheets.length; ++i) {
		var currentStyleSheet = styleSheets[i];
		if(/multipanel_ssr/.test(currentStyleSheet.href)) {
			currentStyleSheet.disabled = !aios_getBoolean("ssr-mitem", "checked");
			if (aios_getBoolean("ssr-mitem", "checked") && aios_getBoolean("ssrSidebar-mitem", "checked")) {
				doc.body.setAttribute('aiosSidebar', true);
			}
			return true;
		}
	}

	// we have to attach the stylesheet to the document...
	// what's the document root ? html ?
	if (aios_getBoolean("ssr-mitem", "checked")) {
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
	if (webPanel && !aios_getBoolean("aios-remMultiPanel", "checked")) {
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
	  } else {
		// If about:blank, urlbar becomes ""
		this.URLBar.value = "";
	  }
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
  },

  onTextDrop: function mp_onTextDrop(event) {
	// Get dropped text
	var data = event.dataTransfer.getData("Text");

	// Sanitize the URL
	var url = this.sanitizeURL(data);
	this.lastValidURI = url;

	// Load the typed url, if blank, don't do anything
	webPanel.contentDocument.location.href = url.spec;
  }
}