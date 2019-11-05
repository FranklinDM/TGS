var AiOS_Objects = {
    get: function () {
        function getElement(elem) {
            try {
                return document.getElementById(elem);
            } catch (e) { return; }
        }
        this.mainWindow = getElement("main-window");                            // fx_mainWindow
        this.browser = getElement("browser");                                   // fx_browser
        this.sidebar = getElement("sidebar");                                   // fx_sidebar     (*unused)
        this.sidebarBox = getElement("sidebar-box");                            // fx_sidebarBox
        this.sidebarHeader = getElement("sidebar-header");                      // fx_sidebarHeader
        this.sidebarSplitter = getElement("sidebar-splitter");                  // fx_sidebarSplitter
        this.sidebarMenu = getElement("viewSidebarMenu");                       // fx_sidebarMenu (*unused)
        this.maximizedWindow = null;                                            // fx_maximizedWindow (*unused)

        this.toggleBox = getElement("aios-toggle-toolbox");
        this.toggleBar = getElement("aios-toggle-toolbar");

        // broadcaster in aios.xul with saved desired toolbar state
        //  => stored by onViewToolbarCommand() in tbx.js (AiOS < 0.7.7)
        //  => saved/set by aios_toggleToolbar()
        this.toggleSwitchItem = getElement("aios-viewTogglebar");
        this.toggleToolbarItem = getElement("aios-viewToolbar");

        this.mainToolbar = getElement("aios-toolbar");

        this.sbSwitch = getElement("aios-toggle-button");
        this.sbToggleButton = getElement("sidebars-togglebutton");
        this.sbKey = getElement("aiosKey_sidebar");                             // elem_key (*unused)
        this.sbDefaultClose = getElement("sidebarclose-button");
        this.sbClose = getElement("sbh-sidebarclose-button");
    }
};

var AiOS = {
    /*
     * Initialization
     * => Called through the onload event
     */
    _initialized: false,
    initSidebar: function () {
        AiOS_Objects.get();

        // MacOS X => replace keyboard shortcut (Ctrl is replaced by Command and toggle by the icon for it)
        if (AiOS_HELPER.os == "Darwin") {
            aios_replaceKey("switch-tooltip-box", "r2c2", "command");
            aios_replaceKey("template-sidebar-tooltip-box", "r2c2", "command");
            aios_replaceKey("template-window-tooltip-box", "r2c2", "command");
            aios_replaceKey("paneltab-tooltip-box", "r2c2", "command");
            aios_replaceKey("paneltab-tooltip-reverse-box", "r2c2", "command");
            aios_replaceKey("sidebarheader-tooltip-box", "r3c2", "command");

            aios_replaceKey("switch-tooltip-box", "r3c2", "shift");
            aios_replaceKey("template-sidebar-tooltip-box", "r3c2", "shift");
            aios_replaceKey("template-window-tooltip-box", "r3c2", "shift");
            aios_replaceKey("paneltab-tooltip-box", "r3c2", "shift");
            aios_replaceKey("paneltab-tooltip-reverse-box", "r3c2", "shift");
            aios_replaceKey("sidebarheader-tooltip-box", "r1c2", "shift");
        }

        // Set appInfo to main browser window (needed for CSS)
        AiOS_HELPER.rememberAppInfo(AiOS_Objects.mainWindow);

        // Sidebar left or right
        // Property assignment for CSS (LTR <=> RTL; sidebar left <=> right)
        AiOS.setSidebarOrient();

        // At the first start (or after deleting the xulstore.json) => ...
        if (!aios_getBoolean(AiOS_Objects.sidebarBox, "aiosInit")) {
            // Customize the icon size of the nav toolbar
            AiOS_Objects.sidebarBox.setAttribute("aiosInit", true);
            document.persist(AiOS_Objects.sidebarBox.id, "aiosInit");

            if (AiOS_Objects.mainToolbar)
                AiOS_Objects.mainToolbar.setAttribute("iconsize", document.getElementById("nav-bar").getAttribute("iconsize"));

            // Set sidebar width after configuration
            aios_setConfSidebarWidth();
        }

        // Sets commands for managers and windows according to settings
        window.setTimeout(function () {
            aios_setTargets();
        }, 50);

        // Call lwtheme color handler (in response to bug 483972)
        AiOS.lwthemeColorHandler();

        // Observe lwtheme styling updates/changes
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(AiOS.lwthemeObserver, "lightweight-theme-styling-update", false);

        // Initialize autohide feature
        aios_initAutohide();

        // Collapse the sidebar instead of closing it
        var lp;

        if (AiOS.isCollapsingEnabled()) {
            // Reset the hidden attribute in any case
            document.getElementById("sidebar-box").setAttribute("hidden", false);

            // If the sidebar should not be opened at startup
            // Create a new or additional window
            if (window.opener) {
                AiOS_Objects.sidebarBox.setAttribute("collapsed", window.opener.document.getElementById("sidebar-box").getAttribute("collapsed"));
                AiOS_Objects.mainToolbar.setAttribute("hidden", window.opener.document.getElementById("aios-toolbar").getAttribute("hidden"));
            }
            // Browser start
            else {
                if (!aios_getBoolean("main-window", "aiosOpen")) {
                    AiOS_Objects.sidebarBox.setAttribute("collapsed", true);
                    AiOS_Objects.sidebarSplitter.setAttribute("hidden", true);
                }
            }

            // Otherwise the sidebar is visible but empty after deactivating/activating
            lp = document.getElementById("sidebar-box").getAttribute("aiosLastPanel");
            if (aios_getBoolean(document.getElementById("main-window"), "aiosOpen") && lp != "") {
                toggleSidebar(lp, true);
                document.getElementById("sidebar-splitter").hidden = false;
                document.getElementById("sidebar-splitter").setAttribute("state", "open");
            }
        }

        // If there is no recently opened sidebar or it no longer exists, then simply open the bookmarks sidebar
        lp = AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel");
        if (!lp || (lp && !document.getElementById(lp))) {
            AiOS_Objects.sidebarBox.setAttribute("aiosLastPanel", "viewBookmarksSidebar");
            document.persist(AiOS_Objects.sidebarBox.id, "aiosLastPanel");
        }

        // Initialize Sidebar, Toolbar and Sidebar Switch at start using user settings
        var sidebarInit = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.init");
        var toolbarInit = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.toolbar.init");
        var switchInit = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.init");

        // Open sidebar at startup
        if (sidebarInit == "open")
            toggleSidebar(AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel"), true);

        // Close sidebar at startup
        if (sidebarInit == "close" && !aios_isSidebarHidden()) {
            toggleSidebar();
            if (AiOS.isCollapsingEnabled()) {
                document.getElementById("sidebar-box").setAttribute("collapsed", true);
            }
        }

        // Open certain sidebar at startup
        if (sidebarInit != "rem" && sidebarInit != "open" && sidebarInit != "close") {
            if (document.getElementById(sidebarInit))
                toggleSidebar(sidebarInit, true);
        }

        if (toolbarInit != 2)
            AiOS_Objects.mainToolbar.setAttribute("hidden", !toolbarInit);
        if (switchInit != 2)
            AiOS_Objects.toggleBox.setAttribute("hidden", !switchInit);

        // Set the standard size of the sidebar when double-clicking
        var fx_sidebarheader = document.getElementsByTagName("sidebarheader")[0];
        fx_sidebarheader.addEventListener("dblclick", function (e) {
            AiOS.setSidebarWidth(e);
        }, false);

        // Determine if we should disable/enable the sidebar switch's drag and drop feature and
        // set the delay on how long an item should be on top of the switch if necessary
        var switchDrag = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.drag");
        var switchDragDelay = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.dragdelay");

        if (switchDragDelay)
            AiOS_Objects.sbSwitch.setAttribute("ondragenter", "window.setTimeout(function() { AiOS.toggleSidebar('switch', true); event.stopPropagation(); }, " + switchDragDelay + ");");
        else
            AiOS_Objects.sbSwitch.setAttribute("ondragenter", "");

        // Determine if it's necessary to open the changelog link
        var oldVersion = AiOS_HELPER.prefBranchAiOS.getCharPref("changelog");
        if (parseFloat(oldVersion) != 0) {
            Components.utils.import("resource://gre/modules/AddonManager.jsm");
            AddonManager.getAddonByID("tgsidebar@franklindm", function (addon) {
                var version = addon.version;
                if (version != oldVersion) {
                    AiOS_HELPER.prefBranchAiOS.setCharPref("changelog", version);

                    if (gBrowser) {
                        let plainVersion = version.split(".").join("");
                        var changelogLink = "https://github.com/FranklinDM/TGS/wiki/Changelog#" + plainVersion;

                        window.setTimeout(function () {
                            gBrowser.loadTabs([changelogLink], false);
                        }, 500);
                    }
                }
            });
        }

        // Vertical buttons?
        var vButtons = AiOS_HELPER.prefBranchAiOS.getBoolPref("vbuttons");

        AiOS_Objects.mainWindow.setAttribute("aiosVButtons", "true");
        if (!vButtons)
            AiOS_Objects.mainWindow.setAttribute("aiosVButtons", "false");
        document.persist(AiOS_Objects.mainWindow.id, "aiosVButtons");

        // Vertical bookmarks bar?
        // Remove the attribute of the bookmarks bar. When placed on the AiOS toolbar, you can use CSS to set the orientation.
        if (document.getElementById("PlacesToolbarItems"))
            document.getElementById("PlacesToolbarItems").removeAttribute("orient");

        AiOS._initialized = true;
    },

    /*
     * Double-click on the sidebar header to restore the default sidebar size
     * => Called by EventListener on header, set in aios_initSidebar()
     */
    setSidebarWidth: function (event) {
        AiOS_Objects.get();

        var mode = "def";
        if (event) {
            if (event.shiftKey)
                mode = "min";
            if (event.ctrlKey || event.metaKey)
                mode = "max"; // metaKey = Mac
        }

        var sWidthVal = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.width." + mode + "Val");
        var sWidthUnit = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.width." + mode + "Unit");

        if (sWidthUnit == "%") {
            var browserWidth = aios_getBrowserWidth();
            var compWidth = browserWidth[3];

            sWidthVal = parseInt(Math.round((compWidth * sWidthVal) / 100));
        }

        // Set sidebar size
        AiOS_Objects.sidebarBox.setAttribute("width", sWidthVal);
    },

    /*
     * Sets the display of the sidebar
     * => Called by aios_initSidebar() and aios_savePrefs() in prefs.js
     * => 1 = left, 2 = right
     */
    setSidebarOrient: function () {
        AiOS_Objects.get();

        // Sidebar alignment
        var sidebarOrient = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.orient");

        AiOS_Objects.mainWindow.setAttribute("aiosOrient", "left");
        if (sidebarOrient == 2)
            AiOS_Objects.mainWindow.setAttribute("aiosOrient", "right");

        // Fix for MileWideBack
        if (document.getElementById("back-strip") && sidebarOrient == 2) {
            var mwb = document.getElementById("back-strip");
            var mwbParent = document.getElementById("back-strip").parentNode;
            mwbParent.removeChild(mwb);
            mwbParent.appendChild(mwb);
        }

        aios_setToolbarPos();
    },

    /*
     * Checks if sidebar collapsing is enabled
     */
    isCollapsingEnabled: function () {
        return AiOS_HELPER.prefBranchAiOS.getBoolPref("collapse");
    },

    /*
     * Monitor sidebar status for changes
     * => Called by observes-elements (hidden and collapsed) in 'sidebar-box'
     */
    observeSidebar: function (mode) {
        AiOS_Objects.get();

        // In case the Toolbar was hidden before opening (ex: by switching in Opera mode)
        var showToolbar = aios_getBoolean(AiOS_Objects.toggleToolbarItem, "checked");
        if (showToolbar && !aios_isSidebarHidden())
            aios_toggleToolbar(false);

        // In case the Switch was hidden before opening (ex: by startup behavior)
        var showSwitch = aios_getBoolean(AiOS_Objects.toggleSwitchItem, "checked");
        if (showSwitch && !aios_isSidebarHidden())
            AiOS_Objects.toggleBox.setAttribute("hidden", false);

        // Grippy status (CSS pays attention to attribute 'aiosOpen')
        AiOS_Objects.mainWindow.setAttribute("aiosOpen", !AiOS_Objects.sidebarBox.hidden && !AiOS_Objects.sidebarBox.collapsed);
        document.persist(AiOS_Objects.mainWindow.id, "aiosOpen");

        // toggle button status (button looks for attribute 'checked')
        AiOS_Objects.sidebarBox.setAttribute("checked", !AiOS_Objects.sidebarBox.hidden && !AiOS_Objects.sidebarBox.collapsed);

        // In case the Grippy was used before opening
        if (mode == "hidden") {
            AiOS_Objects.sidebarBox.removeAttribute("collapsed");

            AiOS_Objects.sidebarSplitter.removeAttribute("hidden");
            AiOS_Objects.sidebarSplitter.setAttribute("state", "open");
        }
    },

    /*
     * Remember last sidebar and save as persist
     * => Called by observes element in 'sidebar-box' and aios_modSidebarMenu()
     */
    remLastSidebar: function () {
        AiOS_Objects.get();

        var actSidebar = false;

        // Remember last sidebar and save
        var allSidebars = document.getElementsByAttribute("group", "sidebar");
        for (var i = 0; i < allSidebars.length; i++) {
            // May not observe an item (menu entries, etc.), but must have a sidebar URL
            if (!allSidebars[i].getAttribute("observes") && allSidebars[i].getAttribute("sidebarurl")) {
                // Must have an ID and must be "checked"
                if (allSidebars[i].getAttribute("id") && aios_getBoolean(allSidebars[i], "checked")) {
                    // Store command in the "persist"-var "aiosLastPanel" and return
                    AiOS_Objects.sidebarBox.setAttribute("aiosLastPanel", allSidebars[i].id);
                    document.persist(AiOS_Objects.sidebarBox.id, "aiosLastPanel");
                    actSidebar = allSidebars[i].id;
                }
            }
        }

        return actSidebar;
    },

    /*
     * Toggles the sidebar in Opera behavior
     * => Called by aios_toggleSidebar() for elements in Opera behavior
     */
    toggleOperaMode: function (aForcePanel, aForceOpen) {
        AiOS_Objects.get();

        var showToolbar = aios_getBoolean(AiOS_Objects.toggleToolbarItem, "checked");

        // Notice sidebar to open
        var openPanel = AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel"); // Last opened sidebar
        if (openPanel == "")
            openPanel = "viewBookmarksSidebar"; // Open Bookmarks if no sidebar was open
        if (aForcePanel)
            openPanel = aForcePanel; // User-defined sidebar (at each open)

        // Vertical toolbar mode
        if (AiOS_Objects.mainToolbar.orient == "vertical") {
            // If the toolbar is visible
            if (!aios_getBoolean(AiOS_Objects.mainToolbar, "hidden")) {
                // If the sidebar is visible
                if (!aios_isSidebarHidden() && !aForceOpen) {
                    AiOS_Objects.sidebarBox.setAttribute("aiosShouldOpen", true); // Remember the state of the sidebar (visible)
                    document.persist(AiOS_Objects.sidebarBox.id, "aiosShouldOpen"); // Persist attribute 'aiosShouldOpen'
                    toggleSidebar(); // Hide sidebar
                } else {
                    AiOS_Objects.sidebarBox.setAttribute("aiosShouldOpen", false); // Remember the state of the sidebar (invisible)
                    document.persist(AiOS_Objects.sidebarBox.id, "aiosShouldOpen"); // Persist attribute 'aiosShouldOpen'
                }

                if (!aForceOpen)
                    aios_toggleToolbar(true); // Hide Toolbar
            }
            // If the toolbar is not visible
            else {
                if (showToolbar) // Is toolbar shown?
                    aios_toggleToolbar(false); // Show Toolbar

                // If sidebar should be displayed (status before last closing) or the toolbar has been switched off
                if (aios_getBoolean(AiOS_Objects.sidebarBox, "aiosShouldOpen") || !showToolbar)
                    toggleSidebar(openPanel);
            }
        }

        // Horizontal toolbar mode
        else {
            // If the sidebar is visible
            if (!aios_isSidebarHidden()) {
                AiOS_Objects.sidebarBox.setAttribute("aiosShouldOpen", true); // Remember the state of the sidebar (visible)
                document.persist(AiOS_Objects.sidebarBox.id, "aiosShouldOpen"); // Persist attribute 'aiosShouldOpen'
                toggleSidebar(); // Hide Sidebar
            } else {
                if (lastPanel == "")
                    toggleSidebar(openPanel);
            }
        }

    },

    /*
     * Clone the sidebar menu for the sidebars buttons
     * => Called by menu button events 'onpopupshowing'
     */
    getSidebarMenu: function (aPopup) {
        AiOS_Objects.get();

        // Modify menu (deactivate active menu item, Ez Sidebar-Fix etc.)
        aios_modSidebarMenu();
        while (aPopup.hasChildNodes()) {
            aPopup.removeChild(aPopup.firstChild);
        }

        for (var i = 0; i < AiOS_Objects.sidebarMenu.childNodes.length; i++) {
            aPopup.appendChild(AiOS_Objects.sidebarMenu.childNodes[i].cloneNode(true));
        }
    },

    /*
     * Closes the sidebar when the mouse moves over the content area
     * => Called by mouse-over of the 'appcontent' and the sidebar-switch (with transfer of mode)
     *
     * => aios_initSidebar() adds a mouse-over event to the "sidebar-box" object, ...
     * => this mouse-over event adds a mouse-over event to the "appcontent" ...
     * => which calls this function
     */
    _autoTimeout: null,
    autoShowHide: function (mode) {
        var autobutton = aios_getBoolean("aios-enableAutohide", "checked");

        var autoshow = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.autoshow");
        var onlymax = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.onlymax");
        var delayshow = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.delayshow");
        var delayhide = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.delayhide");
        var hidemethod = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.hidemethod");

        //console.log(mode);

        // Feature not activated, feature should only at max. Window grab, window does not have the focus
        if (!autoshow || !autobutton || (onlymax && !aios_isWinMax()) || !aiosFocus)
            return false;

        /*
         *  Triggered by the switch
         **/
        if (mode == "switch") {
            // If sidebar should be visible and not hidden => ignore it
            if (!aios_isSidebarHidden() && (hidemethod == 1 || hidemethod == 3))
                return false;

            let delay;
            if (!aios_isSidebarHidden())
                delay = delayhide;
            else
                delay = delayshow;
            // Show/hide after a certain time
            AiOS._autoTimeout = window.setTimeout(function () {
                AiOS.toggleSidebar("switch");
            }, delay);

            // Remove the timeout if the mouse was too short on the switch or was clicked
            AiOS_Objects.sbSwitch.addEventListener("mouseout", function () {
                window.clearTimeout(AiOS._autoTimeout);
            }, true);

            // If the invisible sidebar switch is enabled and no click is true, don't remove the timeout
            if (AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.inv") && AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.invnoclick"))
                return true;

            AiOS_Objects.sbSwitch.addEventListener("click", function () {
                window.clearTimeout(AiOS._autoTimeout);
            }, true);

            return true;
        }
        /*
         *  Triggered by the content area
         **/
        else {
            if (!aios_isSidebarHidden() && hidemethod == 1) {
                // Delete event on "appcontent" again, otherwise the sidebar would be displayed again
                // => mouse-over the sidebar (in aios_initSidebar()) adds this feature back to the "appcontent"
                document.getElementById("appcontent").removeEventListener("mouseover", AiOS.autoShowHide, true);

                // Hide after a certain time
                AiOS._autoTimeout = window.setTimeout(function () {
                    AiOS.toggleSidebar("switch");
                }, delayhide);

                // Remove the timeout when the mouse comes back in the sidebar
                AiOS_Objects.sidebarBox.addEventListener("mouseover", function () {
                    window.clearTimeout(AiOS._autoTimeout);
                }, true);
            }
        }

        return true;
    },

    /*
     * Activates/deactivates the Sidebar/Toolbar/Switch depending on the item and settings
     * => Call by toggle button, switch, shortcut, open/close menu items, sidebar close button
     * => Mode 1: Open/close the sidebar
     * => Mode 2: Sidebar and Toolbar open/close
     * => Mode 3: Sidebar, Toolbar and Toggle bar open/close
     * => Mode 4: Opera behavior
     */
    toggleSidebar: function (aMode, aForceOpen) {
        AiOS_Objects.get();

        var prefstring = "key";
        if (aMode == AiOS_Objects.sbSwitch || aMode == "switch")
            prefstring = "switch";
        if (aMode == AiOS_Objects.sbToggleButton || aMode == "tbb")
            prefstring = "tbb";
        if (aMode == AiOS_Objects.sbDefaultClose || aMode == AiOS_Objects.sbClose || aMode == "close")
            prefstring = "close";

        var mode = AiOS_HELPER.prefBranchAiOS.getIntPref("cmode." + prefstring);
        var toolBox_enabled = aios_getBoolean("aios-viewToolbar", "checked");
        var toggleBox_enabled = aios_getBoolean(AiOS_Objects.toggleSwitchItem, "checked");

        // Direct transfer via JavaScript e.g. via "Custom Buttons"
        if (aMode === 1)
            mode = 1;
        if (aMode === 2)
            mode = 2;
        if (aMode === 3)
            mode = 3;
        if (aMode === 4)
            mode = 4;

        // Load user-defined panel?
        var forcePanel;
        var openPanel = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.open.init");
        if (openPanel != "rem" && (prefstring == "key" || prefstring == "switch" || prefstring == "tbb"))
            forcePanel = openPanel;
        else
            forcePanel = false;

        if (mode == 4) {
            AiOS.toggleOperaMode(forcePanel, aForceOpen);
        } else {
            // If Sidebar Collapsing is enabled ...
            // A particular panel should be opened in principle ...
            // It is not open yet, the sidebar is still open ...
            // Then the panel should be loaded, but the Sidebar should be closed => for performance purpose
            if (AiOS.isCollapsingEnabled() && forcePanel && AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel") != forcePanel && !aios_isSidebarHidden())
                var closeNow = true;

            var tmpcmd = (forcePanel) ? forcePanel : AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel");
            toggleSidebar(tmpcmd, aForceOpen);

            // Close sidebar if the above conditions are met
            if (closeNow)
                toggleSidebar(tmpcmd, aForceOpen);

            if ((mode == 2 || mode == 3) && toolBox_enabled) {
                aios_toggleToolbar(aios_isSidebarHidden());
            }

            if (mode == 3 && toggleBox_enabled)
                AiOS_Objects.toggleBox.setAttribute("hidden", aios_isSidebarHidden());
        }

        return true;
    },

    /*
     * Sidebar toggle per collapsed
     * => Called by the Grippy itself on onClick()
     */
    useGrippy: function () {
        AiOS_Objects.sidebarBox.collapsed = !AiOS_Objects.sidebarBox.collapsed;

        // Fix for Win Vista & 7: aiosOpen is not set by missing call of aios_observeSidebar
        // aios_observeSidebar is actually called by Observer's sidebar-box, k.A. why not here
        if (AiOS_HELPER.os == "WINNT" && AiOS_HELPER.osVersion.indexOf("5.1") == -1)
            AiOS.observeSidebar(true);
    },

    /*
     * Enables/disables the narrow sidebar toggle switch
     * => Called by event listener "onresize", observer (sizemode) in tbx.xul,
     * aios_BrowserFullScreen() and aios_savePrefs() in prefs.js
     */
    checkSidebarSwitch: function () {
        if (!AiOS._initialized)
            return;

        AiOS_Objects.get();

        var thin_switch,
            thinmax_switch,
            switch_width,
            switch_twidth,
            athin_switch,
            inv_switch,
            invmax_switch,
            invhover,
            invmouse;

        thin_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.thin");
        thinmax_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.thinmax");

        switch_width = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.width");
        switch_twidth = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.twidth");

        inv_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.inv");
        invmax_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.invmax");
        invhover = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.invhover");
        invmouse = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.invmouse");

        switch (AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.visibility")) {
        case 0:
            if (!aios_isSidebarHidden() && inv_switch && AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.invnoclick"))
                AiOS_Objects.toggleBar.hidden = true;
            else
                AiOS_Objects.toggleBar.hidden = false;
            break;
        case 1:
            AiOS_Objects.toggleBar.hidden = !aios_isSidebarHidden();
            break;
        case 2:
            AiOS_Objects.toggleBar.hidden = aios_isSidebarHidden();
            break;
        }

        // Decide whether to use thin switch configuration
        var thin = thin_switch;
        if (thin_switch && thinmax_switch && !aios_isWinMax())
            thin = false;

        // Decide whether to use inv switch configuration
        var inv = inv_switch;
        if (inv_switch && invmax_switch && !aios_isWinMax())
            inv = false;

        var width_val = (thin) ? switch_twidth : switch_width;
        var barStyle = "min-width: " + width_val + "px; max-width: " + width_val + "px;";

        if (inv) {
            barStyle += " height: " + document.defaultView.getComputedStyle(document.getElementById("appcontent"), null).getPropertyValue("height") + ";" + " position: fixed;";
            AiOS_Objects.toggleBox.setAttribute("style", "position: fixed;");

            let cursor = (!invmouse) ? "default" : "pointer";
            let hoverState = (invhover) ? "true" : "false";
            AiOS_Objects.toggleBar.setAttribute("invHover", hoverState);
            AiOS_Objects.sbSwitch.setAttribute("invHover", hoverState);
            document.documentElement.style.setProperty("--aios-grippy-cursor", cursor);
        } else {
            document.documentElement.style.setProperty("--aios-grippy-cursor", "pointer");
            AiOS_Objects.toggleBar.removeAttribute("invHover");
            AiOS_Objects.sbSwitch.removeAttribute("invHover");
            AiOS_Objects.toggleBox.removeAttribute("style");
        }

        if (width_val < 4 || inv)
            barStyle += " background-image: none !important;";

        if (width_val < 2 || inv)
            barStyle += " border: none !important;";

        AiOS_Objects.sbSwitch.setAttribute("style", barStyle);
        AiOS_Objects.toggleBar.setAttribute("style", barStyle);
    },

    /*
     * Control the mouse actions of the sidebar switcher
     * => Called by onClick() of the switcher
     */
    controlSwitch: function (ev, which) {
        // If the invisible sidebar switch is enabled and no click is true, reject any click interactions
        if (AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.inv") && AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.invnoclick"))
            return;
        // Left click => metaKey = Mac
        if (ev.button == 0 && (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey)) {
            AiOS.toggleSidebar(which);
        }

        // Middle click / Ctrl + Left click => metaKey = Mac
        if (ev.button == 1 || (ev.button == 0 && ev.ctrlKey) || (ev.button == 0 && ev.metaKey)) {
            aios_toggleElement("aios-viewToolbar");
            aios_toggleToolbar("aios-viewToolbar");
        }

        // Right click / Shift + Left click
        if (ev.button == 2 || (ev.button == 0 && ev.shiftKey)) {
            if (aios_isSidebarHidden())
                toggleSidebar(AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel"), true);
            else
                toggleSidebar();
        }
    },

    /*
     * Called when browser enters fullscreen either by F11 or by document
     */
    onFullscreen: function (event) {
        AiOS_Objects.get();

        let enterFS = window.fullScreen;

        // Decide which fullscreen action should be done
        switch (enterFS) {
        case true:
            // Target states
            var close_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref("fs.switch");
            var close_toolbar = AiOS_HELPER.prefBranchAiOS.getBoolPref("fs.toolbar");
            var close_sidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref("fs.sidebar");

            // Actual states
            var rem_switchHidden = aios_getBoolean(AiOS_Objects.toggleBox, "hidden");
            var rem_toolbarHidden = aios_getBoolean(AiOS_Objects.mainToolbar, "hidden");
            var rem_sidebarHidden = aios_isSidebarHidden();

            // Save actual states
            AiOS_Objects.toggleBox.setAttribute("fsSwitch", rem_switchHidden);
            AiOS_Objects.toggleBox.setAttribute("fsToolbar", rem_toolbarHidden);
            AiOS_Objects.toggleBox.setAttribute("fsToolbarMode", AiOS_Objects.mainToolbar.getAttribute("mode"));
            AiOS_Objects.toggleBox.setAttribute("fsToolbarIconsize", AiOS_Objects.mainToolbar.getAttribute("iconsize"));
            AiOS_Objects.toggleBox.setAttribute("fsSidebar", rem_sidebarHidden);

            // Set target states (SidebarSwitch and Toolbar are hidden by default)
            if (close_sidebar && !rem_sidebarHidden)
                toggleSidebar();

            if (close_switch && !rem_switchHidden)
                AiOS_Objects.toggleBox.hidden = true;

            if (close_toolbar && !rem_toolbarHidden)
                aios_toggleToolbar(true);

            // Set Toolbar for Fullscreen (only without the extension Autohide)
            if (typeof autoHIDE != "object") {
                AiOS_Objects.mainToolbar.setAttribute("mode", "icons");
                AiOS_Objects.mainToolbar.setAttribute("iconsize", "small");
            }
            break;
        case false:
            // Restore Toolbar Settings (only without the Autohide extension)
            if (typeof autoHIDE != "object") {
                AiOS_Objects.mainToolbar.setAttribute("mode", AiOS_Objects.toggleBox.getAttribute("fsToolbarMode"));
                AiOS_Objects.mainToolbar.setAttribute("iconsize", AiOS_Objects.toggleBox.getAttribute("fsToolbarIconsize"));
            }

            var enable_restore = AiOS_HELPER.prefBranchAiOS.getBoolPref("fs.restore");
            if (enable_restore) {
                if (!aios_getBoolean(AiOS_Objects.toggleBox, "fsSidebar"))
                    toggleSidebar(AiOS_Objects.sidebarBox.getAttribute("aiosLastPanel"), true);
                else if (!aios_isSidebarHidden())
                    toggleSidebar();

                aios_toggleToolbar(aios_getBoolean(AiOS_Objects.toggleBox, "fsToolbar"));
                AiOS_Objects.toggleBox.hidden = aios_getBoolean(AiOS_Objects.toggleBox, "fsSwitch");
            }
            break;
        }

        // Decide on what mode should be applied on sidebar switch
        AiOS.checkSidebarSwitch();

        aios_adjustToolboxWidth(false);
    },

    /*
     * Before & After customization event
     */
    customizeStates: {
        save: function () {
            this.switchHidden = aios_getBoolean(AiOS_Objects.toggleBox, "hidden");
            this.toolbarHidden = aios_getBoolean(AiOS_Objects.mainToolbar, "hidden");
            this.sidebarHidden = aios_isSidebarHidden();
        },
        restore: function () {
            if (this.toolbarHidden)
                aios_toggleToolbar(true);
            if (this.switchHidden)
                AiOS.toggleSidebar("switch", false);
            if (this.sidebarHidden)
                AiOS.toggleSidebar(1, false);
        }
    },

    customizeEvent: function (e) {
        if (e.type == "beforecustomization") {
            AiOS.customizeStates.save();
            // Force show AiOS toolbar & sidebar
            aios_toggleToolbar(false);
            AiOS.toggleSidebar("switch", true);
        } else {
            AiOS.customizeStates.restore();
        }
    },

    /*
     * Lightweight themes styling update observer
     */
    lwthemeObserver: {
        observe: function (aSubject, aTopic, aData) {
            if (aTopic == "lightweight-theme-styling-update") {
                window.setTimeout(function () {
                    AiOS.lwthemeColorHandler();
                }, 100);
            }
        }
    },

    /*
     * Lightweight themes background handler
     * When lwbg pref = true, will enforce the persona's defined bg color
     * When lwbg pref = true & rpt = true, will repeat the persona's defined header image
     * When lwbg pref = false & ccl has value, will use the custom background defined by ccl
     * When lwbg pref = false & ccl has no value, fall back to using transparent
     */
    lwthemeColorHandler: function () {
        var lwbg = AiOS_HELPER.prefBranchAiOS.getBoolPref("lw.defaultbg"),
            ccl = AiOS_HELPER.prefBranchAiOS.getCharPref("lw.custombg"),
            rpt = AiOS_HELPER.prefBranchAiOS.getBoolPref("lw.repeat");
        switch (lwbg) {
        case true:
            // To avoid seeing the ugly overlapping persona image
            AiOS_Objects.browser.style.background = AiOS_Objects.mainWindow.style.backgroundColor;
            if (rpt) {
                AiOS_Objects.browser.style.background = null;
                AiOS_Objects.mainWindow.style.backgroundRepeat = "repeat";
            }
            break;
        case false:
            AiOS_Objects.browser.style.background = null;
            if (ccl != "")
                AiOS_Objects.browser.style.background = ccl;
            break;
        default:
            // If all else fails, use transparent bg
            AiOS_Objects.browser.style.background = null;
        }
    }
};

window.addEventListener("load", AiOS.initSidebar, false);
window.addEventListener("resize", AiOS.checkSidebarSwitch, false);
window.addEventListener("fullscreen", AiOS.onFullscreen, false);

if (!AiOS_HELPER.usingCUI) {
    window.addEventListener("beforecustomization", AiOS.customizeEvent, false);
    window.addEventListener("aftercustomization", AiOS.customizeEvent, false);
}

// Otherwise newly defined shortcuts will be reset on browser restart
extLoad.add(30, function () {
    aiosKeyconfig.loadkeys(aiosKeyconfig.prefService.getCharPref("extensions.aios.keyconf.profile"));
});
