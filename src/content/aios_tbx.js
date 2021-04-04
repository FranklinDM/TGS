function aios_gElem(aID) {
    if (AiOS_HELPER.mostRecentWindow && AiOS_HELPER.mostRecentWindow.document.getElementById(aID))
        return AiOS_HELPER.mostRecentWindow.document.getElementById(aID);
    return false;
}

/*
 * Initialize toolbar menu options (AiOS Toolbar, Sidebar Header Toolbar)
 * => Called through onpopupshowing handler of context menus in aios.xul
 */
function aios_onToolbarPopupShowing(aWhich) {
    AiOS_Objects.get();

    var mode;

    // AiOS Toolbar
    if (aWhich.id == "aios-toolbar-contextmenu") {
        // Button mode
        mode = AiOS_Objects.mainToolbar.getAttribute("mode");

        switch (mode) {
        case "full":
            document.getElementById("aios-view-mitem1").setAttribute("checked", true);
            break;
        case "icons":
            document.getElementById("aios-view-mitem2").setAttribute("checked", true);
            break;
        case "text":
            document.getElementById("aios-view-mitem3").setAttribute("checked", true);
            document.getElementById("aios-view-mitem4").setAttribute("disabled", true);
            break;
        }

        // Icon size
        document.getElementById("aios-view-mitem4").setAttribute("checked", AiOS_Objects.mainToolbar.getAttribute("iconsize") == "small");

        // Flexible buttons
        document.getElementById("aios-view-mitem5").setAttribute("checked", AiOS_Objects.mainToolbar.getAttribute("flexbuttons") == "true");
    }

    // Sidebar Header Toolbar
    else if (aWhich.id == "aios-sbhtoolbar-contextmenu") {
        // Button mode => is required for CSS definitions
        AiOS_Objects.sidebarHeader.setAttribute("mode", aios_gElem("aios-sbhtoolbar").getAttribute("mode"));

        // Icon size
        document.getElementById("aios-sbhview-mitem4").setAttribute("checked", aios_gElem("aios-sbhtoolbar").getAttribute("iconsize") == "small");
        AiOS_Objects.sidebarHeader.setAttribute("iconsize", aios_gElem("aios-sbhtoolbar").getAttribute("iconsize"));
    }
}

/*
 * Positions the AiOS and sidebar header toolbar
 * => Called through the menu options of the context menu and aios_setSidebarOrient()
 * => Also called indirectly by aios_initSidebar() => aios_setSidebarOrient() triggers aios_setToolbarPos()
 * => toolboxPosition 1 = to the left of the sidebar    (vertical)
 * => toolboxPosition 2 = right next to the sidebar     (vertical)
 * => toolboxPosition 3 = above the sidebar header      (horizontal)
 * => toolboxPosition 4 = below the sidebar header      (horizontal)
 * => toolboxPosition 5 = below the sidebar             (horizontal)
 */
function aios_setToolbarPos(toolboxPosition) {
    AiOS_Objects.get();

    // TODO: posMode migration path (persisted from toolbar)
    if (!toolboxPosition) {
        toolboxPosition = parseInt(AiOS_Objects.mainToolbox.getAttribute("toolboxposition"));
    }
    
    // Revert to the default position if value is out of range
    if (toolboxPosition < 1 || toolboxPosition > 5) {
        toolboxPosition = 1;
    }

    var toolboxInSidebar = (toolboxPosition > 2);
    var toolbarOrientation = (toolboxInSidebar ? "horizontal" : "vertical");
    
    AiOS_Objects.mainToolbox.setAttribute("toolboxposition", toolboxPosition);
    AiOS_Objects.mainToolbar.setAttribute("orient", toolbarOrientation);

    if (toolboxInSidebar) {
        AiOS_Objects.sidebarBox.insertBefore(AiOS_Objects.mainToolbox, AiOS_Objects.sidebarHeader);
    } else {
        AiOS_Objects.browser.insertBefore(AiOS_Objects.mainToolbox, AiOS_Objects.sidebarBox);
    }

    document.getElementById("aios-pos-mitem" + toolboxPosition).setAttribute("checked", true);
}

/*
 * Sets the view mode of the toolbars
 * => Called through the menu options of the toolbar context menus
 * => viewMode 1 = symbols and text
 * => viewMode 2 = symbols
 * => viewMode 3 = text
 * => viewMode 4 = small icons on/off
 * => viewMode 5 = flexible buttons on/off
 */
function aios_setToolbarView(aViewMode, aWhich) {
    AiOS_Objects.get();

    var viewMode = aViewMode;

    // Determine which toolbar to configure
    var elem = aWhich;
    while (elem.tagName != "menupopup") {
        elem = elem.parentNode;
    }

    var tbar,
        menuid;

    if (elem.id == "aios-toolbar-contextmenu") {
        tbar = aios_gElem("aios-toolbar");
        menuid = "view";
    } else {
        tbar = aios_gElem("aios-sbhtoolbar");
        menuid = "sbhview";
    }

    // Change settings
    var set_property = "mode";
    var set_value = "full";

    // Mode: Symbols & Text, Symbols, Text
    if (viewMode <= 2) {
        if (viewMode == 2)
            set_value = "icons";
        document.getElementById("aios-" + menuid + "-mitem4").setAttribute("disabled", false);
    } else if (viewMode == 3) {
        set_value = "text";
        document.getElementById("aios-" + menuid + "-mitem4").setAttribute("disabled", true);
    }

    // Icon size
    if (viewMode == 4) {
        set_property = "iconsize";
        set_value = (aios_getBoolean("aios-" + menuid + "-mitem4", "checked")) ? "small" : "large";
    }

    // Flexible buttons
    if (viewMode == 5) {
        set_property = "flexbuttons";
        set_value = (aios_getBoolean("aios-" + menuid + "-mitem5", "checked")) ? "true" : "false";
    }

    tbar.setAttribute(set_property, set_value);

    if (tbar != aios_gElem("aios-toolbar")) {
        AiOS_Objects.sidebarHeader.setAttribute(set_property, set_value);
    }
}

/*
 * Enables/disables the AiOS toolbar
 * => Called through menu option (View > Toolbars)
 * => Called by aios_observeSidebar(), aios_toggleOperaMode(), aios_toggleSidebar(), aios_controlSwitch(), aios_BrowserFullScreen()
 */
function aios_toggleToolbar(aWhich) {
    AiOS_Objects.get();

    var mode = (typeof aWhich == "boolean") ? aWhich : !aios_getBoolean(aWhich, "checked");

    AiOS_Objects.mainToolbar.hidden = mode;
}

/*
 * Adds an option to the menu View > Toolbars and the context menu of the toolbars
 */
function replaceViewPopupMethod() {
    let mainToolbar = AiOS_Objects.mainToolbar;
    var targetMenuItem = document.createElement("menuitem");
    targetMenuItem.setAttribute("id", "toggle_" + mainToolbar.id);
    targetMenuItem.setAttribute("label", mainToolbar.getAttribute("toolbarlabel"));
    targetMenuItem.setAttribute("observes", "aios-viewToolbar");
    
    var _onViewToolbarsPopupShowing = onViewToolbarsPopupShowing;
    onViewToolbarsPopupShowing = function (aEvent, aInsertPoint) {
        var popup = aEvent.target;
        if (popup != aEvent.currentTarget) {
            return;
        }

        if (popup.contains(targetMenuItem)) {
            popup.removeChild(targetMenuItem);
        }

        if (aInsertPoint) {
            _onViewToolbarsPopupShowing.apply(this, arguments);
        }
                
        var firstMenuItem = aInsertPoint || popup.firstChild;
        popup.insertBefore(targetMenuItem, firstMenuItem);
        
        if (aInsertPoint == null) {
            _onViewToolbarsPopupShowing.apply(this, arguments);
        }
    };
}
