
window.addEventListener("load", aios_initSidebar, false);
window.addEventListener("resize", aios_checkThinSwitch, false);
window.addEventListener("fullscreen", aios_BrowserFullScreen, false);
window.addEventListener("beforecustomization", aios_customizeStart, false);
window.addEventListener("aftercustomization", aios_customizeEnd, false);

// Otherwise newly defined shortcuts will be reset on browser restart
extLoad.add(30, function() {
	aiosKeyconfig.loadkeys(aiosKeyconfig.prefService.getCharPref("extensions.aios.keyconf.profile"));
});

var initialised = false;

var fx_mainWindow, fx_browser, fx_sidebar, fx_sidebarBox, fx_sidebarHeader, fx_sidebarSplitter, fx_sidebarMenu, fx_maximizedWindow;
var aios_toggleBox, aios_toggleBar, aios_toggleSwitchItem, aios_toggleToolbarItem, aios_toolbar;
var elem_switch, elem_tbb, elem_key, elem_close, elem_close2;

var aios_enterFullScreen = 0;
var aios_leaveFullScreen = 0;

// Collapse sidebar instead of closing
var aios_collapseSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref('collapse');

function aios_getObjects() {
	try {
		fx_mainWindow = document.getElementById('main-window');
		fx_browser = document.getElementById('browser');
		fx_sidebar = document.getElementById('sidebar');
		fx_sidebarBox = document.getElementById('sidebar-box');
		fx_sidebarHeader = document.getElementById('sidebar-header');
		fx_sidebarSplitter = document.getElementById('sidebar-splitter');
		fx_sidebarMenu = document.getElementById('viewSidebarMenu');

		aios_toggleBox = document.getElementById('aios-toggle-toolbox');
		aios_toggleBar = document.getElementById('aios-toggle-toolbar');

		// broadcaster in aios.xul with saved desired toolbar state
		//	=> stored by onViewToolbarCommand() in tbx.js (AiOS <0.7.7)
		//	=> saved / set by aios_toggleToolbar()
		aios_toggleSwitchItem = document.getElementById('aios-viewTogglebar');
		aios_toggleToolbarItem = document.getElementById('aios-viewToolbar');

		aios_toolbar = document.getElementById('aios-toolbar');

		elem_switch = document.getElementById('aios-toggle-button');
		elem_tbb = document.getElementById('sidebars-togglebutton');
		elem_key = document.getElementById('aiosKey_sidebar');
		elem_close = document.getElementById('sidebarclose-button');
		elem_close2 = document.getElementById('sbh-sidebarclose-button');
	}
	catch(e) { }
}


/*
	Initialization
		=> Called through the onload event
*/
function aios_initSidebar() {
	aios_getObjects();

	// MacOS X => replace keyboard shortcut (Ctrl is replaced by Command and toggle by the icon for it)
	if (AiOS_HELPER.os == "Darwin") {
		aios_replaceKey('switch-tooltip-box', 'r2c2', 'command');
		aios_replaceKey('template-sidebar-tooltip-box', 'r2c2', 'command');
		aios_replaceKey('template-window-tooltip-box', 'r2c2', 'command');
		aios_replaceKey('paneltab-tooltip-box', 'r2c2', 'command');
		aios_replaceKey('paneltab-tooltip-reverse-box', 'r2c2', 'command');
		aios_replaceKey('sidebarheader-tooltip-box', 'r3c2', 'command');

		aios_replaceKey('switch-tooltip-box', 'r3c2', 'shift');
		aios_replaceKey('template-sidebar-tooltip-box', 'r3c2', 'shift');
		aios_replaceKey('template-window-tooltip-box', 'r3c2', 'shift');
		aios_replaceKey('paneltab-tooltip-box', 'r3c2', 'shift');
		aios_replaceKey('paneltab-tooltip-reverse-box', 'r3c2', 'shift');
		aios_replaceKey('sidebarheader-tooltip-box', 'r1c2', 'shift');
	}

	// Set appInfo to main browser window (needed for CSS)
	AiOS_HELPER.rememberAppInfo(fx_mainWindow);

	// Sidebar left or right
	// Property assignment for CSS (LTR <=> RTL; sidebar left <=> right)
	aios_setSidebarOrient();

	// At the first start (or after deleting the xulstore.json) => ...
	if(!aios_getBoolean(fx_sidebarBox, 'aiosInit')) {
		// Customize the icon size of the nav toolbar
		fx_sidebarBox.setAttribute('aiosInit', true);
		document.persist(fx_sidebarBox.id, 'aiosInit');

		if(aios_toolbar) aios_toolbar.setAttribute('iconsize', document.getElementById('nav-bar').getAttribute('iconsize'));

		// Set sidebar width after configuration
		aios_setConfSidebarWidth();
	}

	// Sets commands for managers and windows according to settings
	window.setTimeout(function() {
		aios_setTargets();
	}, 50);

	// Call lwtheme color handler (in response to bug 483972)
	lwthemeColorHandler();
	
	// Observe lwtheme styling updates/changes
	var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	observerService.addObserver(lwthemeObserver, "lightweight-theme-styling-update", false);

	// Initialize autohide feature
	aios_initAutohide();
	
	// Initialize invisible sidebar switch trigger feature
	aios_initInvTrg();
	
	// Check if real sidebar switch should be hidden
	aios_checkInvTrg();

	// Collapse the sidebar instead of closing it
	var lp;

	if (aios_collapseSidebar) {
		// Reset the hidden attribute in any case
		document.getElementById('sidebar-box').setAttribute('hidden', false);

		// If the sidebar should not be opened at startup
		// Create a new or additional window
		if(window.opener) {
			fx_sidebarBox.setAttribute('collapsed', window.opener.document.getElementById('sidebar-box').getAttribute('collapsed'));
			aios_toolbar.setAttribute('hidden', window.opener.document.getElementById('aios-toolbar').getAttribute('hidden'));
		}
		// Browser start
		else {
			//alert(aios_getBoolean('main-window', 'aiosOpen'));
			if(!aios_getBoolean('main-window', 'aiosOpen')) {
				fx_sidebarBox.setAttribute('collapsed', true);
				fx_sidebarSplitter.setAttribute('hidden', true);
			}
		}

		// Otherwise the sidebar is visible but empty after deactivating/activating
		lp = document.getElementById('sidebar-box').getAttribute("aiosLastPanel");
		if(aios_getBoolean(document.getElementById('main-window'), 'aiosOpen') && lp != "") {
			toggleSidebar(lp, true);
			document.getElementById('sidebar-splitter').hidden = false;
			document.getElementById('sidebar-splitter').setAttribute('state', 'open');
		}
	}

	// If there is no recently opened sidebar or it no longer exists, then simply open the bookmarks sidebar
	lp = fx_sidebarBox.getAttribute("aiosLastPanel");
	if(!lp || (lp && !document.getElementById(lp))) {
		fx_sidebarBox.setAttribute("aiosLastPanel", "viewBookmarksSidebar");
		document.persist(fx_sidebarBox.id, "aiosLastPanel");
	}

	// Sidebar, Toolbar u. Switch at start gem. settings
	try {
		var sidebarInit = AiOS_HELPER.prefBranchAiOS.getCharPref('gen.init');
		var toolbarInit = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.toolbar.init');
		var switchInit = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.init');

		// Open sidebar at startup
		if(sidebarInit == "open") toggleSidebar(fx_sidebarBox.getAttribute('aiosLastPanel'), true);

		// Close sidebar at startup
		if(sidebarInit == "close" && !aios_isSidebarHidden()) {
			toggleSidebar();
			if(aios_collapseSidebar) {
				document.getElementById('sidebar-box').setAttribute('collapsed', true);
			}
		}

		// Open certain sidebar at startup
		if(sidebarInit != "rem" && sidebarInit != "open" && sidebarInit != "close") {
			if(document.getElementById(sidebarInit)) toggleSidebar(sidebarInit, true);
		}

		if(toolbarInit != 2) aios_toolbar.setAttribute('hidden', !toolbarInit);
		if(switchInit != 2) aios_toggleBox.setAttribute('hidden', !switchInit);
	}
	catch(e) { }

	// Set the standard size of the sidebar when double-clicking
	var fx_sidebarheader = document.getElementsByTagName('sidebarheader')[0];
	fx_sidebarheader.addEventListener("dblclick", function(e) {
		aios_setSidebarWidth(e);
	}, false);

	// Monitor the sidebars menu - necessary in case the first call is made through the view menu
	//fx_sidebarMenu.addEventListener('popupshowing', aios_modSidebarMenu, false);

	// Disable drag-and-drop functionality for the sidebar toggle switch?
	// And/or set delay for this d-and-d func?
	try {
		var switchDrag = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.drag");
		var switchDelay = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.delay");
		var switchDragDelay = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.dragdelay");

		if (switchDragDelay != 0) elem_switch.setAttribute('ondragenter',
		"window.setTimeout(function() { aios_toggleSidebar('switch', true); event.stopPropagation(); }, " + switchDragDelay + ");");
		if (!switchDrag) elem_switch.removeAttribute('ondragenter');
	}
	catch(e) { }

	// Show changelog?
	try {
		var changelog = AiOS_HELPER.prefBranchAiOS.getCharPref('changelog');
	}
	catch(e) { }

	// When value of changelog pref is set to 0, don't show changelog
	if (parseFloat(changelog) != 0) {
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID("tgsidebar@franklindm", function(addon) {
			var aiosVersion = addon.version;

			if (aiosVersion && (aiosVersion != changelog)) {
				var aiosUpdated = (changelog != "") ? true : false;

				try {
					AiOS_HELPER.prefBranchAiOS.setCharPref('changelog', aiosVersion);
					var changelog_new = AiOS_HELPER.prefBranchAiOS.getCharPref('changelog');
				}
				catch(e) { }

				// If saving the current version worked fine
				if (changelog_new === aiosVersion && gBrowser) {
					let aiosVersionDotless = aiosVersion.split('.').join("");
					var hp = "https://github.com/FranklinDM/TGS/wiki/Changelog#" + aiosVersionDotless;
					if (aiosUpdated) hp = "https://github.com/FranklinDM/TGS/wiki/Changelog#" + aiosVersionDotless;

					window.setTimeout(function() {
						gBrowser.loadTabs(new Array(hp), false);
					}, 500);
				}
			}
		});
	}

	// Vertical buttons?
	try {
		var vButtons = AiOS_HELPER.prefBranchAiOS.getBoolPref("vbuttons");

		fx_mainWindow.setAttribute('aiosVButtons', 'true');
		if(!vButtons) fx_mainWindow.setAttribute('aiosVButtons', 'false');
		document.persist(fx_mainWindow.id, 'aiosVButtons');
	}
	catch(e) { }

	// Vertical bookmarks bar?
	// Remove the attribute of the bookmarks bar. When placed on the AiOS toolbar, you can use CSS to set the orientation.
	if(document.getElementById('PlacesToolbarItems')) document.getElementById('PlacesToolbarItems').removeAttribute('orient');

	initialised = true;
}


/*
	Double-click on the sidebar header to restore the default sidebar size
		=> Called by EventListener on header, set in aios_initSidebar()
*/
function aios_setSidebarWidth(event) {
	aios_getObjects();

	var mode = "def";
	if(event) {
		if(event.shiftKey) mode = "min";
		if(event.ctrlKey || event.metaKey) mode = "max";	// metaKey = Mac
	}

	try {
		var sWidthVal = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.width.' + mode + 'Val');
		var sWidthUnit = AiOS_HELPER.prefBranchAiOS.getCharPref('gen.width.' + mode + 'Unit');

		if(sWidthUnit == "%") {
			var browserWidth = aios_getBrowserWidth();
			var compWidth = browserWidth[3];

			sWidthVal = parseInt(Math.round((compWidth * sWidthVal) / 100));
		}

		// Set sidebar size
		fx_sidebarBox.setAttribute('width', sWidthVal);
	}
	catch(e) { }
}


/*
	Sets the display of the sidebar
		=> Called by aios_initSidebar() and aios_savePrefs() in prefs.js
		=> 1 = left, 2 = right
*/
function aios_setSidebarOrient() {
	aios_getObjects();

	try {
		// Sidebar alignment
		var sidebarOrient = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.orient');
		fx_mainWindow.setAttribute('aiosOrient', 'left');
		if (sidebarOrient == 2) fx_mainWindow.setAttribute('aiosOrient', 'right');

		// LTR <=> RTL
		fx_mainWindow.setAttribute('aiosMode', 'ltr');

		// Fix for MileWideBack
		if (document.getElementById('back-strip') && sidebarOrient == 2) {
			var mwb = document.getElementById('back-strip');
			var mwbParent = document.getElementById('back-strip').parentNode;
			mwbParent.removeChild(mwb);
			mwbParent.appendChild(mwb);
		}
	}
	catch(e) { }

	aios_setToolbarPos();
}


/*
	Monitor sidebar status for changes
		=> Called by observes-elements (hidden and collapsed) in 'sidebar-box'
*/
function aios_observeSidebar(mode) {
	aios_getObjects();

	// In case the Toolbar was hidden before opening (ex: by switching in Opera mode)
	var showToolbar = aios_getBoolean(aios_toggleToolbarItem, 'checked');
	if (showToolbar && !aios_isSidebarHidden()) aios_toggleToolbar(false);

	// In case the Switch was hidden before opening (ex: by startup behavior)
	var showSwitch = aios_getBoolean(aios_toggleSwitchItem, 'checked');
	if (showSwitch && !aios_isSidebarHidden()) aios_toggleBox.setAttribute('hidden', false);

	// Grippy status (CSS pays attention to attribute 'aiosOpen')
	fx_mainWindow.setAttribute('aiosOpen', !fx_sidebarBox.hidden && !fx_sidebarBox.collapsed);
	document.persist(fx_mainWindow.id, 'aiosOpen');

	// toggle button status (button looks for attribute 'checked')
	fx_sidebarBox.setAttribute('checked', !fx_sidebarBox.hidden && !fx_sidebarBox.collapsed);

	// In case the Grippy was used before opening
	if (mode == "hidden") {
		fx_sidebarBox.removeAttribute('collapsed');

		fx_sidebarSplitter.removeAttribute('hidden');
		fx_sidebarSplitter.setAttribute('state', 'open');
	}
}


/*
	Remember last sidebar and save as persist
		=> Called by observes element in 'sidebar-box' and aios_modSidebarMenu()
*/
function aios_remLastSidebar() {
	aios_getObjects();

	var actSidebar = false;

	// Remember last sidebar and save
	var allSidebars = document.getElementsByAttribute('group', 'sidebar');
	for (var i = 0; i < allSidebars.length; i++) {
		// May not observe an item (menu entries, etc.), but must have a sidebar URL
		if (!allSidebars[i].getAttribute('observes') && allSidebars[i].getAttribute('sidebarurl')) {
			// Must have an ID and must be "checked"
			if (allSidebars[i].getAttribute('id') && aios_getBoolean(allSidebars[i], 'checked')) {
				// Store command in the "persist"-var "aiosLastPanel" and return
				fx_sidebarBox.setAttribute("aiosLastPanel", allSidebars[i].id);
				document.persist(fx_sidebarBox.id, "aiosLastPanel");
				actSidebar = allSidebars[i].id;
			}
		}
	}

	return actSidebar;
}


/*
	Toggles the sidebar in Opera behavior
		=> Called by aios_toggleSidebar() for elements in Opera behavior
*/
function aios_toggleOperaMode(aForcePanel, aForceOpen) {
	aios_getObjects();

	var showToolbar = aios_getBoolean(aios_toggleToolbarItem, 'checked');

	// Notice sidebar to open
	var openPanel = fx_sidebarBox.getAttribute('aiosLastPanel');							// Last opened sidebar
	if (openPanel == "") openPanel = "viewBookmarksSidebar";								// Open Bookmarks if no sidebar was open
	if (aForcePanel) openPanel = aForcePanel;												// User-defined sidebar (at each open)

	// Vertical toolbar mode
	if (aios_toolbar.orient == "vertical") {
		// If the toolbar is visible
		if (!aios_getBoolean(aios_toolbar, 'hidden')) {
			// If the sidebar is visible
			if(!aios_isSidebarHidden() && !aForceOpen) {
				fx_sidebarBox.setAttribute("aiosShouldOpen", true);							// Remember the state of the sidebar (visible)
				document.persist(fx_sidebarBox.id, 'aiosShouldOpen');						// Persist attribute 'aiosShouldOpen'
				toggleSidebar();															// Hide sidebar
			}
			else {
				fx_sidebarBox.setAttribute("aiosShouldOpen", false);						// Remember the state of the sidebar (invisible)
				document.persist(fx_sidebarBox.id, 'aiosShouldOpen');						// Persist attribute 'aiosShouldOpen'
			}

			if(!aForceOpen) aios_toggleToolbar(true);										// Hide Toolbar
		}
		// If the toolbar is not visible
		else {
			if (showToolbar)																// Is toolbar shown?
				aios_toggleToolbar(false);													// Show Toolbar

			// If sidebar should be displayed (status before last closing) or the toolbar has been switched off
			if (aios_getBoolean(fx_sidebarBox, 'aiosShouldOpen') || !showToolbar) toggleSidebar(openPanel);
		}
	}

	// Horizontal toolbar mode
	else {
		// If the sidebar is visible
		if (!aios_isSidebarHidden()) {
			fx_sidebarBox.setAttribute("aiosShouldOpen", true);								// Remember the state of the sidebar (visible)
			document.persist(fx_sidebarBox.id, 'aiosShouldOpen');							// Persist attribute 'aiosShouldOpen'
			toggleSidebar();																// Hide Sidebar
		}
		else {
			if (lastPanel == "") toggleSidebar(openPanel);
	   }
	}

}


/*
	Clone the sidebar menu for the sidebars buttons
		=> Called by menu button events 'onpopupshowing'
*/
function aios_getSidebarMenu(aPopup) {
	aios_getObjects();

	// Modify menu (deactivate active menu item, Ez Sidebar-Fix etc.)
	aios_modSidebarMenu();

	while (aPopup.hasChildNodes()) {
		aPopup.removeChild(aPopup.firstChild);
	}

	for (var i = 0; i < fx_sidebarMenu.childNodes.length; i++) {
		aPopup.appendChild(fx_sidebarMenu.childNodes[i].cloneNode(true));
	}
}


/*
	Closes the sidebar when the mouse moves over the content area
		=> Called by mouse-over of the 'appcontent' and the sidebar-switch (with transfer of mode)

		=> aios_initSidebar() adds a mouse-over event to the "sidebar-box" object, ...
		=> this mouse-over event adds a mouse-over event to the "appcontent" ...
		=> which calls this function
*/
var aios_autoTimeout;
function aios_autoShowHide(mode) {
	var autobutton = aios_getBoolean('aios-enableAutohide', 'checked');

	var autoshow = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.autoshow');
	var onlymax = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.onlymax');
	var delay = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.delay');
	var hidemethod = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.hidemethod');

	//console.log(mode);

	// Feature not activated, feature should only at max. Window grab, window does not have the focus
	if (!autoshow || !autobutton || (onlymax && !aios_isWinMax()) || !aiosFocus) return false;
	
	/*
	 *	Triggered by the switch
	 **/
	if (mode == "switch") {
		// If sidebar should be visible and not hidden => ignore it
		if (!aios_isSidebarHidden() && (hidemethod == 1 || hidemethod == 3)) return false;

		// Show/hide after a certain time
		aios_autoTimeout = window.setTimeout(function() {
			aios_toggleSidebar('switch');
		}, delay);

		// Remove the timeout if the mouse was too short on the switch or was clicked
		elem_switch.addEventListener("mouseout", function(){
			window.clearTimeout(aios_autoTimeout);
		}, true);
		elem_switch.addEventListener("click", function(){
			window.clearTimeout(aios_autoTimeout);
		}, true);

		return true;
	} 
	/*
	 *	Triggered by the content area
	 **/
	else {
		if (!aios_isSidebarHidden() && hidemethod == 1) {
			// Delete event on "appcontent" again, otherwise the sidebar would be displayed again
			// => mouse-over the sidebar (in aios_initSidebar()) adds this feature back to the "appcontent"
			document.getElementById('appcontent').removeEventListener("mouseover", aios_autoShowHide, true);

			// Hide after a certain time
			aios_autoTimeout = window.setTimeout(function() {
				aios_toggleSidebar('switch');
			}, delay);

			// Remove the timeout when the mouse comes back in the sidebar
			fx_sidebarBox.addEventListener("mouseover", function(){
				window.clearTimeout(aios_autoTimeout);
			}, true);
		}
	}

	return true;
}

/*
	Shows/hides the sidebar when the mouse moves over the trigger zone inside the content area
		=> Called by mouse-move of the 'appcontent' element
		
		=> aios_initSidebar() adds a mouse-move event to the "appcontent" object, ...
		=> this event calls this function
*/
var aios_invCursorTZ = false, aios_invTimeout, savedPos;
function aios_invisibleTrigger(mode) {
	var autobutton = aios_getBoolean('aios-enableAutohide', 'checked');
	
	var autoshow = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.autoshow');
	var onlymax = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.onlymax');
	var delay = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.delay');
	var hidemethod = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.hidemethod');
	var invTrg = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.invtrigger');
	var invWidth = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.invwidth');
	var orient = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.orient');
	//console.log(mode);

	// Feature is disabled, should only function at maximized window, window does not have the focus, trigger width is 0, inv trigger is disabled
	if (!autoshow || !autobutton || (onlymax && !aios_isWinMax()) || !aiosFocus || !invTrg || invWidth == 0) return false;

	// If sidebar is visible and hide method is (1 - on content area) or (3 - don't autohide) => ignore it
	if (!aios_isSidebarHidden() && (hidemethod == 1 || hidemethod == 3)) return false;
	
	var rightWidth = fx_browser.boxObject.width - invWidth;
	savedPos = mode.clientX;
	//console.log('savepos: ' + savedPos + ',clientX: ' + mode.clientX + ', rightWidth: ' + rightWidth);
	if (((mode.clientX <= invWidth) && orient == 1 || (mode.clientX >= rightWidth) && orient == 2) && !aios_invCursorTZ)
	{
		// I am in trigger zone
		aios_invCursorTZ = true;

		// Show/hide after a certain time
		aios_invTimeout = window.setTimeout(function() {
			if ((savedPos <= invWidth) && orient == 1 || (savedPos >= rightWidth) && orient == 2) {
				aios_toggleSidebar('switch');
			}
			aios_invCursorTZ = false;
		}, delay);

		// Remove the timeout when the mouse comes back in the sidebar
		fx_sidebarBox.addEventListener("mouseover", function(){
			window.clearTimeout(aios_invTimeout);
		}, true);
	}
	if ((mode.clientX > invWidth) && orient == 1 || (mode.clientX < invWidth) && orient == 2) {
		aios_invCursorTZ = false;
	}
}

/*
	Activates/deactivates the Sidebar/Toolbar/Switch depending on the item and settings
	=> Call by toggle button, switch, shortcut, open/close menu items, sidebar close button
		=> Mode 1: Open/close the sidebar
		=> Mode 2: Sidebar and Toolbar open/close
		=> Mode 3: Sidebar, Toolbar and Toggle bar open/close
		=> Mode 4: Opera behavior
*/
function aios_toggleSidebar(aMode, aForceOpen) {
	aios_getObjects();
	
	var prefstring = "key";
	if (aMode == elem_switch || aMode == "switch") 						  prefstring = "switch";
	if (aMode == elem_tbb 	 || aMode == "tbb") 						  prefstring = "tbb";
	if (aMode == elem_close  || aMode == elem_close2 || aMode == "close") prefstring = "close";

	try {
		var mode = AiOS_HELPER.prefBranchAiOS.getIntPref('cmode.' + prefstring);
		var toolBox_enabled = aios_getBoolean('aios-viewToolbar', 'checked');
		var toggleBox_enabled = aios_getBoolean(aios_toggleSwitchItem, 'checked');

		// Direct transfer via JavaScript e.g. via "Custom Buttons"
		if (aMode === 1) mode = 1;
		if (aMode === 2) mode = 2;
		if (aMode === 3) mode = 3;
		if (aMode === 4) mode = 4;

		// Load user-defined panel?
		var forcePanel;
		var openPanel = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.open.init");
		if (openPanel != "rem" && (prefstring == "key" || prefstring == "switch" || prefstring == "tbb")) forcePanel = openPanel;
		else forcePanel = false;

		if (mode == 4) {
			aios_toggleOperaMode(forcePanel, aForceOpen);
		}
		else {
			// If Sidebar Collapsing is enabled ...
			// A particular panel should be opened in principle ...
			// It is not open yet, the sidebar is still open ...
			// Then the panel should be loaded, but the Sidebar should be closed => for performance purpose
			if (aios_collapseSidebar && forcePanel && fx_sidebarBox.getAttribute('aiosLastPanel') != forcePanel && !aios_isSidebarHidden()) var closeNow = true;

			var tmpcmd = (forcePanel) ? forcePanel : fx_sidebarBox.getAttribute('aiosLastPanel');
			toggleSidebar(tmpcmd, aForceOpen);

			// Close sidebar if the above conditions are met
			if (closeNow) toggleSidebar(tmpcmd, aForceOpen);


			if ((mode == 2 || mode == 3) && toolBox_enabled) {
				aios_toggleToolbar(aios_isSidebarHidden());
			}

			if (mode == 3 && toggleBox_enabled)
				aios_toggleBox.setAttribute('hidden', aios_isSidebarHidden());
		}
	}
	catch(e) { }

	return true;
}


/*
	Sidebar toggle per collapsed
		=> Called by the Grippy itself on onClick()
*/
function aios_useGrippy() {
	fx_sidebarBox.collapsed = !fx_sidebarBox.collapsed;

	// Fix for Win Vista & 7: aiosOpen is not set by missing call of aios_observeSidebar
	// aios_observeSidebar is actually called by Observer's sidebar-box, k.A. why not here
	if (AiOS_HELPER.os == "WINNT" && AiOS_HELPER.osVersion.indexOf("5.1") == -1) aios_observeSidebar(true);
}


/*
	Enables/disables the narrow sidebar toggle switch
		=> Called by event listener "onresize", observer (sizemode) in tbx.xul,
		   aios_BrowserFullScreen() and aios_savePrefs() in prefs.js
*/
function aios_checkThinSwitch() {
	if (!initialised) return;

	aios_getObjects();

	var thin_switch, thinmax_switch, switch_width, switch_twidth, athin_switch;

	try {
		thin_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.thin');
		thinmax_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.thinmax');

		switch_width = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.width');
		switch_twidth = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.twidth');

		// Should it be slim?
		var thin = thin_switch;
		if (thin_switch && thinmax_switch && !aios_isWinMax()) thin = false;

		var width_val = (thin) ? switch_twidth : switch_width;
		var barStyle = "min-width: " + width_val + "px; max-width: " + width_val + "px;";

		if (width_val < 4) elem_switch.setAttribute('style', 'background-image: none;');
		else elem_switch.setAttribute('style', '');

		if (width_val < 2) barStyle += " border: none;";
		aios_toggleBar.setAttribute('style', barStyle);
	}
	catch(e) { }
}


/*
	Control the mouse actions of the sidebar switcher
		=> Called by onClick() of the switcher
*/
function aios_controlSwitch(ev, which) {
	// Left click => metaKey = Mac
	if (ev.button == 0 && (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey)) {
		aios_toggleSidebar(which);
	}

	// Middle click / Ctrl + Left click => metaKey = Mac
	if (ev.button == 1 || (ev.button == 0 && ev.ctrlKey) || (ev.button == 0 && ev.metaKey)) {
		aios_toggleElement('aios-viewToolbar');
		aios_toggleToolbar('aios-viewToolbar');
	}

	// Right click / Shift + Left click
	if (ev.button == 2 || (ev.button == 0 && ev.shiftKey)) {
		if (aios_isSidebarHidden()) toggleSidebar(fx_sidebarBox.getAttribute('aiosLastPanel'), true);
		else toggleSidebar();
	}
}


/*
	Extends the FF function BrowserFullScreen() to control the AIOS elements
		=> Call by aios_initSidebar()
*/
function aios_BrowserFullScreen() {
	aios_getObjects();

	try {
		var enable_restore = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.restore');
	}
	catch(e) {
		return false;
	}

	// Fullscreen on
	// => hide elements
	if (document.mozFullScreenElement || window.fullScreen) {
		// Fix for multiple firing of the mozfullscreenchange event
		aios_leaveFullScreen = 0;
		aios_enterFullScreen++;
		if(aios_enterFullScreen > 1) return;

		try {
			// Target states
			var close_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.switch');
			var close_toolbar = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.toolbar');
			var close_sidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.sidebar');

			// Actual states
			var rem_switchHidden = aios_getBoolean(aios_toggleBox, 'hidden');
			var rem_toolbarHidden = aios_getBoolean(aios_toolbar, 'hidden');
			var rem_sidebarHidden = aios_isSidebarHidden();
		}
		catch(e) {
			return false;
		}

		// Save actual states
		aios_toggleBox.setAttribute('fsSwitch', rem_switchHidden);
		aios_toggleBox.setAttribute('fsToolbar', rem_toolbarHidden);
		aios_toggleBox.setAttribute('fsToolbarMode', aios_toolbar.getAttribute("mode"));
		aios_toggleBox.setAttribute('fsToolbarIconsize', aios_toolbar.getAttribute("iconsize"));
		aios_toggleBox.setAttribute('fsSidebar', rem_sidebarHidden);

		// Set target states (SidebarSwitch and Toolbar are hidden by default)
		if (close_sidebar && !rem_sidebarHidden) toggleSidebar();

		aios_toggleBar.setAttribute("moz-collapsed", false);
		if (close_switch && !rem_switchHidden) aios_toggleBox.hidden = true;

		document.getElementById('aios-sbhtoolbar').setAttribute("moz-collapsed", false);

		aios_toolbar.setAttribute("moz-collapsed", false);
		if (close_toolbar && !rem_toolbarHidden) aios_toggleToolbar(true);

		// Set Toolbar for Fullscreen (only without the extension Autohide)
		if (typeof autoHIDE != "object") {
			aios_toolbar.setAttribute("mode", "icons");
			aios_toolbar.setAttribute("iconsize", "small");
		}
	}
	// Fullscreen off
	// => Show elements
	else {
		// Fix for multiple firing of the mozfullscreenchange event
		aios_enterFullScreen = 0;
		aios_leaveFullScreen++;
		if (aios_leaveFullScreen > 1) return;

		// Restore Toolbar Settings (only without the Autohide extension)
		if(typeof autoHIDE != "object") {
			aios_toolbar.setAttribute("mode", aios_toggleBox.getAttribute('fsToolbarMode'));
			aios_toolbar.setAttribute("iconsize", aios_toggleBox.getAttribute('fsToolbarIconsize'));
		}

		if (enable_restore) {
			if (!aios_getBoolean(aios_toggleBox, 'fsSidebar')) toggleSidebar(fx_sidebarBox.getAttribute('aiosLastPanel'), true);
			else if (!aios_isSidebarHidden()) toggleSidebar();

			aios_toggleToolbar(aios_getBoolean(aios_toggleBox, 'fsToolbar'));
			aios_toggleBox.hidden = aios_getBoolean(aios_toggleBox, 'fsSwitch');
		}
	}

	// Activates/deactivates the narrow sidebar switch
	aios_checkThinSwitch();

	aios_adjustToolboxWidth(false);

	return true;
}

/*
	Before customization event
*/
function aios_customizeStart(e) {
	// Force show AiOS toolbar & sidebar
	aios_toggleToolbar(false);
	aios_toggleSidebar('switch', true);
}

/*
	After customization event
*/
function aios_customizeEnd(e) {
	// Force show AiOS toolbar & sidebar
	aios_toggleToolbar(false);
	aios_toggleSidebar('switch', true);
}

/*
	Lightweight themes styling update observer
*/
var lwthemeObserver = {
	observe : function(aSubject, aTopic, aData) {
		if (aTopic == "lightweight-theme-styling-update") {
			window.setTimeout(function() {
				lwthemeColorHandler();
			}, 100);
		}
	}
}

/*
	Lightweight themes background handler
	* When lwbg pref = true, will enforce the persona's defined bg color
	* When lwbg pref = true & rpt = true, will repeat the persona's defined header image
	* When lwbg pref = false & ccl has value, will use the custom background defined by ccl
	* When lwbg pref = false & ccl has no value, fall back to using transparent
*/
function lwthemeColorHandler() {
	var lwbg = AiOS_HELPER.prefBranchAiOS.getBoolPref("lw.defaultbg"),
		ccl = AiOS_HELPER.prefBranchAiOS.getCharPref("lw.custombg"),
		rpt = AiOS_HELPER.prefBranchAiOS.getBoolPref("lw.repeat");
	switch (lwbg) {
		case true:
			// To avoid seeing the ugly overlapping persona image
			fx_browser.style.background = fx_mainWindow.style.backgroundColor;
			if (rpt) fx_mainWindow.style.backgroundRepeat = "repeat";
			break;
		case false:
			fx_browser.style.background = null;
			if (ccl != "") fx_browser.style.background = ccl;
			break;
		default:
			// If all else fails, use transparent bg
			fx_browser.style.background = null;
  }
}