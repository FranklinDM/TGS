
// For CSS purposes
AiOS_HELPER.rememberAppInfo(document.getElementById("CustomizeToolbarWindow"));

/**
 *  Redefine the width of the vertical toolbar whenever the toolbox changes (Drag 'n Drop)
 **/
var fx_toolboxChanged = toolboxChanged;
toolboxChanged = function () {
    fx_toolboxChanged();
    AiOS_HELPER.mostRecentWindow.aios_adjustToolboxWidth();
};

/**
 *  Prevent the positioning of the dialog under Mac OS X.
 **/
if (AiOS_HELPER.os != "Darwin")
    repositionDialog = function (aWindow) {
        // Always use persisted dimensions and position!
        return;
    };

/**
 * Restore the default set of buttons to fixed toolbars,
 * remove all custom toolbars, and rebuild the palette.
 */
/* Original: restoreDefaultSet() => taken from TotalToolbar 1.8 by alta88 */
restoreDefaultSet = function () {
    // Unwrap the items on the toolbar.
    unwrapToolbarItems();

    // Remove all of the customized toolbars.
    forEachCustomizableToolbar(function (toolbar) {
        let customIndex = toolbar.getAttribute("customindex");
        if (customIndex) {
            // Clean up any customizations from the root doc.
            AiOS_HELPER.mostRecentWindow.handleOptions("remove", toolbar, gToolbox);

            // Reset externalToolbars list.
            let newExternalToolbars = [];
            gToolbox.externalToolbars.forEach(function (extToolbar, index) {
                if (extToolbar.id != toolbar.id)
                    newExternalToolbars.push(extToolbar);
            });
            gToolbox.externalToolbars = newExternalToolbars;

            let toolbox = toolbar.parentNode;
            toolbox.toolbarset.removeAttribute("toolbar" + customIndex);
            gToolboxDocument.persist(toolbox.toolbarset.id, "toolbar" + customIndex);
            toolbar.currentSet = "__empty";
            toolbox.removeChild(toolbar);
            --toolbox.customToolbarCount;
        }
    });

    // Reset values for AiOS toolbar => before defaultset is reset => otherwise errors (too many separators)
    AiOS_HELPER.mostRecentWindow.aios_setToolbarPos(1);
    AiOS_HELPER.mostRecentWindow.AiOS_Objects.mainToolbar.setAttribute("flexbuttons", "false");

    // Restore the defaultset for fixed toolbars.
    forEachCustomizableToolbar(function (toolbar) {
        var defaultSet = toolbar.getAttribute("defaultset");
        if (defaultSet)
            toolbar.currentSet = defaultSet;

        // Remove any contextmenu options.
        AiOS_HELPER.mostRecentWindow.handleOptions("remove", toolbar, gToolbox);
    });

    // Restore the default icon size and mode.
    document.getElementById("smallicons").checked = (updateIconSize() == "small");
    document.getElementById("modelist").value = updateToolbarMode();

    // Now rebuild the palette.
    buildPalette();

    // Now re-wrap the items on the toolbar.
    wrapToolbarItems();

    toolboxChanged("reset");

    // Reset iconize the sidebar header toolbar => after the global size has been reset
    AiOS_HELPER.mostRecentWindow.document.getElementById("aios-sbhtoolbar").setAttribute("iconsize", "small");
};
