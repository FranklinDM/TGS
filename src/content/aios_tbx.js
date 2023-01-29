function aios_gElem(aID) {
    if (AiOS_HELPER.mostRecentWindow && AiOS_HELPER.mostRecentWindow.document.getElementById(aID))
        return AiOS_HELPER.mostRecentWindow.document.getElementById(aID);
    return false;
}

/*
 * Release or set the width of the vertical toolboxes
 * => Called by aios_toggleToolbar(), aios_setToolbarView(), aios_setToolbarPos(), aios_customizeToolbar() and aios_BrowserFullScreen()
 * => Also called indirectly by aios_initSidebar() => aios_setSidebarOrient() triggers aios_setToolbarPos()
 * => via JS instead of CSS because it has to be dynamic because of Themes
 */
function aios_adjustToolboxWidth(aMode) {
    AiOS_Objects.get();

    var tboxen = ["aios-toolbox-left", "aios-toolbox-right"];
    var tbox;

    // First remove width from element styles and attribute
    for (tbox in tboxen) {
        aios_gElem(tboxen[tbox]).style.minWidth = "";
        aios_gElem(tboxen[tbox]).style.width = "";
        aios_gElem(tboxen[tbox]).style.maxWidth = "";
        aios_gElem(tboxen[tbox]).removeAttribute("width");
    }

    // If no definitions have yet to be made, initiate them by recursive call a short time later
    // Delayed call ensures proper operation
    if (!aMode) {
        window.setTimeout(function () {
            aios_adjustToolboxWidth(true);
        }, 100);

        return false;
    }

    // Set widths
    var usedToolbox;
    var aiosOrient = AiOS_Objects.mainWindow.getAttribute("aiosOrient");
    var posMode = AiOS_Objects.mainToolbar.getAttribute("posMode");

    // Select toolbox according to sidebar alignment
    if ((aiosOrient == "left" && posMode == "1") || (aiosOrient == "right" && posMode == "2")) {
        usedToolbox = "aios-toolbox-left";
    } else if ((aiosOrient == "left" && posMode == "2") || (aiosOrient == "right" && posMode == "1")) {
        usedToolbox = "aios-toolbox-right";
    }

    // usedToolbox is false if the toolbar is positioned inside the sidebar
    if (usedToolbox) {
        var cStyle = document.defaultView.getComputedStyle(aios_gElem(usedToolbox), null);
        var myWidth = parseInt(cStyle.width) + parseInt(cStyle.paddingLeft) + parseInt(cStyle.paddingRight);
    }

    for (tbox in tboxen) {
        // Fix the width of the toolbox used
        if (tboxen[tbox] == usedToolbox) {
            aios_gElem(tboxen[tbox]).style.minWidth = myWidth + "px";
            aios_gElem(tboxen[tbox]).style.maxWidth = myWidth + "px";
        }
        // Set width for unused toolbox to 0px => otherwise the toolbox scales with the sidebar scaling
        else {
            aios_gElem(tboxen[tbox]).style.minWidth = "0px";
            aios_gElem(tboxen[tbox]).style.maxWidth = "0px";
        }
    }

    return true;
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
 * => posMode 1 = to the left of the sidebar	(vertical)
 * => posMode 2 = right next to the sidebar	(vertical)
 * => posMode 3 = above the sidebar header		(horizontal)
 * => posMode 4 = below the sidebar header		(horizontal)
 * => posMode 5 = below the sidebar 			(horizontal)
 */
function aios_setToolbarPos(posMode) {
    AiOS_Objects.get();

    var tbox,
        orient,
        button_flex,
        separator;

    if (!posMode)
        posMode = parseInt(AiOS_Objects.mainToolbar.getAttribute("posMode"));

    var sidebarOrient = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.orient");

    switch (posMode) {
    case 1:
        tbox = (sidebarOrient == 1) ? "aios-toolbox-left" : "aios-toolbox-right";
        orient = "vertical";
        break;

    case 2:
        tbox = (sidebarOrient == 1) ? "aios-toolbox-right" : "aios-toolbox-left";
        orient = "vertical";
        break;

    case 3:
        tbox = "aios-toolbox-sidebartop";
        orient = "horizontal";
        break;

    case 4:
        tbox = "aios-toolbox-sidebartop2";
        orient = "horizontal";
        break;

    case 5:
        tbox = "aios-toolbox-sidebarbottom";
        orient = "horizontal";
        break;
    }

    AiOS_Objects.mainToolbar.setAttribute("posMode", posMode);
    AiOS_Objects.mainToolbar.setAttribute("orient", orient);

    document.getElementById(tbox).appendChild(AiOS_Objects.mainToolbar);

    aios_adjustToolboxWidth(false);

    document.getElementById("aios-pos-mitem" + posMode).setAttribute("checked", true);
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

    if (tbar == aios_gElem("aios-toolbar"))
        aios_adjustToolboxWidth(false);
    else
        AiOS_Objects.sidebarHeader.setAttribute(set_property, set_value);
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

    aios_adjustToolboxWidth(false);
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
