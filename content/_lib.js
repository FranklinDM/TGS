Components.utils.import("resource://gre/modules/Downloads.jsm");

/*
 * Modifies the Sidebar menu
 * => Calling aios_initSidebar() and aios_getSidebarMenu() (MenuButton Events 'onpopupshowing')
 */
function aios_modSidebarMenu() {
    aios_getObjects();

    var actSidebar = aios_remLastSidebar();
    var command,
    commandParent;

    // take over every single menu item or change it if necessary
    for (var i = 0; i < fx_sidebarMenu.childNodes.length; i++) {
        command = null;
        commandParent = null;
        var broadcaster = null;
        var item = fx_sidebarMenu.childNodes[i];

        // Show or hide the icons
        try {
            var enable_icons = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.icons');
            var theClass = (enable_icons) ? '' : 'aios-noIcons';

            if (theClass != '')
                aios_appendClass(item, theClass);
            else
                aios_stripClass(item, 'aios-noIcons');
        } catch (e) {}

        // only if there is no separator or the like
        if (item.getAttribute('observes') && document.getElementById(item.getAttribute('observes'))) {
            // override for Show Downloads ... (DMT Fork)
            if (document.getElementById('viewSdDownloadsSidebar') && item.getAttribute('observes') == 'viewDownloadsSidebar') {
                item.setAttribute('observes', 'viewSdDownloadsSidebar');
            }

            broadcaster = document.getElementById(item.getAttribute('observes'));

            if (broadcaster.getAttribute('oncommand')) {
                commandParent = broadcaster;
            } else if (broadcaster.getAttribute('command')) {
                commandParent = document.getElementById(broadcaster.getAttribute('command'));
            }

            if (commandParent)
                command = commandParent.getAttribute('oncommand');
        } else if (item.getAttribute('oncommand')) {
            command = item.getAttribute('oncommand');
            commandParent = item;
        }

        // Use the label as a tooltip if no tooltip text has been set
        if (!item.getAttribute('tooltiptext') && item.getAttribute('label'))
            item.setAttribute('tooltiptext', item.getAttribute('label'));

        // Enable/disable the menu item of the current sidebar
        if (command && commandParent) {

            try {
                var enable_deac = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.entrydeac');

                if (actSidebar && command.indexOf(actSidebar) != -1 && enable_deac)
                    item.setAttribute('disabled', true);
                else
                    item.setAttribute('disabled', false);
            } catch (e) {}

        }
    }

    // Hide extra separator if there are no non-default sidebar panels
    // or if beside it are sidebar panels that are overriding the default panel options
    var mitemsep1 = document.getElementById('aios-sidebar-mitem-sep1');
    if (mitemsep1.nextSibling.id == "aios-sidebar-mitem-sep0" || mitemsep1.nextSibling.getAttribute('observes') == "viewConsole2Sidebar" || mitemsep1.nextSibling.getAttribute('observes') == "viewSdDownloadsSidebar")
        mitemsep1.setAttribute('hidden', true);

    // Show/hide menu entries (open/close the sidebar and settings) and move
    var showhideMenuseparator = document.getElementById('aios-sidebar-mitem-sep0');
    var paneltabMitem1 = document.getElementById('aios-sidebar-mitem-paneltab1');
    var paneltabMitem2 = document.getElementById('aios-sidebar-mitem-paneltab2');
    var sidebarshowMitem = document.getElementById('aios-sidebar-mitem-show');
    var sidebarhideMitem = document.getElementById('aios-sidebar-mitem-hide');
    var prefsMitem = document.getElementById('aios-sidebar-mitem-prefs');

    var entries = [];
    entries[0] = ["showhide", "paneltab1", "paneltab2", "prefs"];

    // Show/hide entries/icons
    try {
        var enable_showhide = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.showhide');
        var enable_entries = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.entries');

        var returnVals = aios_showHideEntries(entries, 'menus.sidebar.', 'aios-sidebar-mitem-');

        if (enable_showhide && enable_entries) {
            sidebarshowMitem.setAttribute('hidden', !aios_isSidebarHidden());
            sidebarhideMitem.setAttribute('hidden', aios_isSidebarHidden());
        } else {
            sidebarshowMitem.setAttribute('hidden', true);
            sidebarhideMitem.setAttribute('hidden', true);
        }
    } catch (e) {}

    // Move menu entries all the way down if the menu has not been edited yet
    if (!aios_getBoolean(fx_sidebarMenu, 'aios-modified')) {
        fx_sidebarMenu.appendChild(showhideMenuseparator);
        fx_sidebarMenu.appendChild(paneltabMitem1);
        fx_sidebarMenu.appendChild(paneltabMitem2);
        fx_sidebarMenu.appendChild(sidebarshowMitem);
        fx_sidebarMenu.appendChild(sidebarhideMitem);
        fx_sidebarMenu.appendChild(prefsMitem);
    }

    // Remember the sidebar menu as edited
    fx_sidebarMenu.setAttribute('aios-modified', true);
}

/*
 * Show or hide entries/icons
 * => Called by aios_modSidebarMenu()
 */
function aios_showHideEntries(entries, prefPre_tmp, IDPre) {
    var prefPre = prefPre_tmp;
    var returnVals = [];

    try {
        var enable_entries = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefPre + "entries");
        var enable_icons = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefPre + "icons");

        var theClass = (enable_icons) ? '' : 'aios-noIcons';

        for (var i = 0; i < entries.length; i++) {

            for (var j = 0; j < entries[i].length; j++) {
                var pref = false;
                // Read the pref for each entry
                if (enable_entries)
                    pref = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefPre + entries[i][j]);

                // Show or hide entries
                var theID = IDPre + entries[i][j];
                if (document.getElementById(theID)) {
                    // if there are several of them => e.g. because of CompactMenu
                    var items = document.getElementsByAttribute('id', theID);
                    for (var xy = 0; xy < items.length; xy++) {
                        items[xy].hidden = !pref;
                    }
                }

                // Select activated entries per group
                if (!returnVals[i])
                    returnVals[i] = 0;
                if (pref)
                    returnVals[i]++;

                // Show or hide the icons
                if (document.getElementById(IDPre + entries[i][j])) {
                    var elem = document.getElementById(IDPre + entries[i][j]);

                    if (theClass != '')
                        aios_appendClass(elem, theClass);
                    else
                        aios_stripClass(elem, 'aios-noIcons');
                }
            }

            // Show or hide the separator
            var sep = IDPre + "sep" + i;
            if (document.getElementById(sep))
                document.getElementById(sep).hidden = !(returnVals[i] > 0);
        }
    } catch (e) {}

    return returnVals;
}

/*
 * Opens the Tab URL in the Sidebar or the Sidebar URL in a new tab
 * =>  Called by   <command id = "aiosCmd_panelTab1">
 *                 <command id = "aiosCmd_panelTab2">
 *                 <toolbarbutton id = "paneltab-button">
 *     in aios.xul
 */
var aiosNewTab, aiosSidebarTitle;
function aios_panelTab(event) {
    try {
        var ptReverse = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.reverse");
        var enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
    } catch (e) {}

    if (!event || (!enable_rightclick && event.button == 2))
        return false;

    var theSidebar;
    var mode = "sidebar";

    if (typeof event == "object") {
        if ((event.shiftKey && event.button == 0))
            mode = "window";
        // metaKey = Mac
        if ((event.ctrlKey && event.button == 0) || (event.metaKey && event.button == 0) || event.button == 1)
            mode = "tab";

        // Invert the button function?
        if (ptReverse) {
            mode = "tab";
            if ((event.shiftKey && event.button == 0))
                mode = "window";
            // metaKey = Mac
            if ((event.ctrlKey && event.button == 0) || (event.metaKey && event.button == 0) || event.button == 1)
                mode = "sidebar";
        }

        // Right click?
        if (enable_rightclick && event.button == 2)
            mode = "window";
    }

    if (typeof event == "string")
        mode = event;

    /*
     * Open in Sidebar
     */
    if (mode == "sidebar") {
        var tabHref = top.window.content.location.href;

        // Internal sources (chrome:/)
        if (tabHref.indexOf("chrome:/") >= 0) {
            theSidebar = aios_isSidebar(tabHref);

            // In the "right" sidebar panel, use the sidebar toggle command
            if (theSidebar) {
                toggleSidebar(theSidebar, true);
            }
            // no sidebar (but chrome: //)
            else {
                // disable active sidebar and delete persists
                if (document.getElementById(theSidebar)) {
                    document.getElementById(theSidebar).removeAttribute('checked');
                    document.getElementById("sidebar").removeAttribute("src");
                    document.getElementById("sidebar-box").removeAttribute("src");
                    document.getElementById("sidebar-box").removeAttribute("sidebarcommand");
                }

                // chrome-URI in Sidebar oeffnen
                top.document.getElementById('sidebar').contentDocument.location.href = tabHref;
                document.getElementById('sidebar-title').setAttribute('value', top.window.content.document.title);
            }
        }
        // about:
        else if (tabHref.indexOf("about:") >= 0) {
            aios_setMultiPanel(tabHref);
        }
        // normal Website
        else {
            aios_setMultiPanel('page');
        }
    }
    /*
     * Open in Tab or Window
     */
    else {
        var newSrc;

        if (fx_sidebarBox.hidden)
            return false;

        var sidebarDoc = top.document.getElementById('sidebar').contentDocument;
        var sidebarHref = sidebarDoc.location.href;
        aiosSidebarTitle = top.document.getElementById('sidebar-title').getAttribute('value');

        if (sidebarDoc.getElementById('web-panels-browser')) {
            var panelDoc = sidebarDoc.getElementById('web-panels-browser').contentDocument;
            var panelHref = panelDoc.location.href;
        }

        // Bookmark Manager instead of Panel?
        if (sidebarHref == "chrome://browser/content/bookmarks/bookmarksPanel.xul") {
            try {
                var enable_bmm = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.bm");
            } catch (e) {}
            newSrc = (enable_bmm) ? "chrome://browser/content/places/places.xul" : sidebarHref;
        }
        // instead of MultiPanel-XUL open the web page opened in the panel
        else if (sidebarHref == "chrome://browser/content/web-panels.xul" && mode == "tab")
            newSrc = panelHref;
        // all other
        else
            newSrc = sidebarHref;

        // open in TAB
        if (mode == "tab") {
            aiosNewTab = aios_addTab(newSrc);

            if (!enable_bmm) {

                window.setTimeout(function () {
                    aiosNewTab.setAttribute('label', aiosSidebarTitle);
                }, 400);

            }
        }
        // Open in Window
        else {
            // is required for the query in addons / downloads _.... xul and downloads.js
            // otherwise, windows (downloads, add-ons) would be closed again immediately
            AiOS_HELPER.mostRecentWindow.aiosIsWindow = true;
            window.setTimeout(function () {
                AiOS_HELPER.mostRecentWindow.aiosIsWindow = false;
            }, 500);

            var winID = "aiosPanelTabWindow_" + top.document.getElementById('sidebar-box').getAttribute('sidebarcommand');
            var winWidth = (screen.availWidth >= 900) ? 800 : screen.availWidth / 2;
            var winHeight = (screen.availHeight >= 700) ? 600 : screen.availHeight / 2;
            toOpenWindowByType(winID, newSrc, "width=" + winWidth + ",height=" + winHeight + ",chrome,titlebar,toolbar,resizable,centerscreen,dialog=no");
        }
    }

    return true;
}

/*
 * If it is a "real" sidebar panel (existing broadcaster)
 * => apply the correct sidebar toggle command
 */
function aios_isSidebar(aHref) {
    var theSidebar = null;
    var allSidebars = AiOS_HELPER.mostRecentWindow.document.getElementsByAttribute('group', 'sidebar');

    for (var i = 0; i < allSidebars.length; i++) {
        // must have an ID, can not have an observer (menu entries, etc.) and must have a sidebar URL
        if (allSidebars[i].id && !allSidebars[i].getAttribute('observes') && allSidebars[i].getAttribute('sidebarurl')) {

            // remember the active sidebar
            if (aios_getBoolean(allSidebars[i].id, 'checked'))
                theSidebar = allSidebars[i].id;

            if (aHref == allSidebars[i].getAttribute('sidebarurl')) {
                return allSidebars[i].id;
            }
        }
    }

    return false;
}

/*
 * Opens various windows & manager by original instruction
 * Invoked by toolbarbuttons and menu entries
 */
function aios_contextEvent(event, which) {
    try {
        var enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
    } catch (e) {}

    //console.log("Mouse: " + event.button + "\nShift: " + event.shiftKey + "\nCtrl: " + event.ctrlKey + "\nAlt: " + event.altKey + "\nMeta: " + event.metaKey);

    // Only left click (Meta Key = Mac)
    if (event.button == 0 && (!event.shiftKey && !event.ctrlKey && !event.metaKey))
        return false;

    // Right click not allowed
    if (!enable_rightclick && event.button == 2)
        return false;

    // No received event
    if (!event || typeof which != "object")
        return false;

    var mWindow = document.getElementById('main-window');
    if (mWindow && mWindow.getAttribute('chromehidden').indexOf('extrachrome') >= 0)
        return false; // in a JS popup

    // Determine object containing the attribute with command [previously set in aios_setTargets()]
    var cmdObj;
    if (which.getAttribute('command'))
        cmdObj = document.getElementById(which.getAttribute('command'));
    if (!cmdObj && which.getAttribute('observes'))
        cmdObj = document.getElementById(which.getAttribute('observes'));

    // Select mode
    var mode = "sidebar";

    // Shift + Left click => new window
    if ((event.shiftKey && event.button == 0) || (enable_rightclick && event.button == 2)) {
        if (aios_getBoolean(cmdObj, 'aios_inSidebar') || cmdObj.getAttribute('group') == "sidebar")
            mode = "window";
    }

    // Ctrl + left click or middle click => new tab (Meta Key = Mac)
    if ((event.ctrlKey && event.button == 0) || (event.metaKey && event.button == 0) || event.button == 1)
        mode = "tab";

    if (!cmdObj)
        return false;

    // Execute order
    switch (mode) {
    case "sidebar":
        toggleSidebar(cmdObj.getAttribute('aios_sbCmd'));
        break;

    case "window":
        // is required to query in addons / downloads _.... xul and downloads.js
        // otherwise, windows (downloads, add-ons) would be closed again immediately
        AiOS_HELPER.mostRecentWindow.aiosIsWindow = true;
        window.setTimeout(function () {
            AiOS_HELPER.mostRecentWindow.aiosIsWindow = false;
        }, 500);

        var winID = "aiosContextEventWindow_" + cmdObj.getAttribute('aios_sbCmd');
        var winSRC = cmdObj.getAttribute('aios_sbUri');
        var winWidth = (screen.availWidth >= 900) ? 800 : screen.availWidth / 2;
        var winHeight = (screen.availHeight >= 700) ? 600 : screen.availHeight / 2;
        toOpenWindowByType(winID, winSRC, "width=" + winWidth + ",height=" + winHeight + ",chrome,titlebar,toolbar,resizable,centerscreen,dialog=no");

        break;

    case "tab":
        aios_addTab(cmdObj.getAttribute('aios_sbUri'));
        break;
    }

    return true;
}

/*
 * Sets commands for windows, which should be opened according to settings in the sidebar
 * => dynamically via JS, so that no changes are made if it is not to be opened in the sidebar; better compatibility with other extensions
 * => Called by aios_initSidebar()
 */
function aios_setTargets() {
    var objects,
    i;

    // assign the respective commands to the menu elements of the error console, the page source text, and the page information
    if (document.getElementById('javascriptConsole')) {
        document.getElementById('javascriptConsole').removeAttribute('oncommand');
        document.getElementById('javascriptConsole').setAttribute('command', 'Tools:Console');

        if (document.getElementById('key_errorConsole')) {
            document.getElementById('key_errorConsole').removeAttribute('oncommand');
            document.getElementById('key_errorConsole').setAttribute('command', 'Tools:Console');
        }
    }

    document.getElementById('context-viewinfo').removeAttribute('oncommand');
    document.getElementById('context-viewinfo').setAttribute('command', 'View:PageInfo');

    var targets = {
        bm: ['View:Bookmarks', 'viewBookmarksSidebar', 'bookmarks', "aios_openDialog('bookmarks');"],
        hi: ['View:History', 'viewHistorySidebar', 'history', "aios_openDialog('history');"],
        dm: ['Tools:Downloads', 'viewDownloadsSidebar', 'downloads', "if (!AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.sidebar') && AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.popup')) { DownloadsIndicatorView.onCommand(event); } else { BrowserDownloadsUI(); } this.setAttribute('onclick', 'aios_contextEvent(event, this)');"],
        ad: ['Tools:Addons', 'viewAddonsSidebar', 'addons', "BrowserOpenAddonsMgr();"],
        mp: ['Tools:MultiPanel', 'viewWebPanelsSidebar', 'multipanel', "aios_openDialog('multipanel');"],
        pi: ['View:PageInfo', 'viewPageInfoSidebar', 'pageinfo', "BrowserPageInfo();"],
        co: ['Tools:Console', 'viewConsoleSidebar', 'console', "toJavaScriptConsole();"],
        ks: ['View:Cookies', 'viewCookiesSidebar', 'cookies', "aios_openDialog('cookies');"]
    };

    // Overrides for other sidebar extensions
    // Ideally in the future, it would be better to get this from the observer directly on startup
    if (document.getElementById('viewConsole2Sidebar'))
        targets['co'] = ['Tools:Console', 'viewConsole2Sidebar', 'console', "aios_openDialog('" + document.getElementById('viewConsole2Sidebar').getAttribute('sidebarurl') + "', 'Tools:Console');"];
    if (document.getElementById('viewSdDownloadsSidebar'))
        targets['dm'] = ['Tools:Downloads', 'viewSdDownloadsSidebar', 'downloads', "aios_openDialog('" + document.getElementById('viewSdDownloadsSidebar').getAttribute('sidebarurl') + "', 'Tools:Console');"];

    // activate informative tooltips and function reversal (PanelTab)?
    var prefInfotip = false,
    ptReverse = false,
    enable_rightclick = false,
    switchTip = true;
    try {
        prefInfotip = AiOS_HELPER.prefBranchAiOS.getBoolPref("infotips");
        ptReverse = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.reverse");
        enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
        switchTip = AiOS_HELPER.prefBranchAiOS.getBoolPref("switchtip");

        if (prefInfotip) {
            if (elem_switch)
                elem_switch.removeAttribute('tooltiptext');

            // in loop because there may be several buttons with the same ID
            objects = document.getElementsByAttribute('id', 'paneltab-button');
            for (i = 0; i < objects.length; i++) {
                objects[i].removeAttribute('tooltiptext');
            }
        }

        if (!switchTip)
            if (elem_switch)
                elem_switch.removeAttribute('tooltip');

        if (document.getElementById('paneltab-button')) {
            if (ptReverse)
                document.getElementById('paneltab-button').setAttribute('tooltip', 'paneltab-tooltip-reverse');
            else
                document.getElementById('paneltab-button').setAttribute('tooltip', 'paneltab-tooltip');
        }
    } catch (e) {}

    // Modify the toolbar button's command set
    aios_ModifyCommandSet(targets, prefInfotip, objects, i, false);
    aios_ModifyCommandSet(targets, prefInfotip, objects, i, true);

    // Disable context menu of the PanelTab buttons if right-click is allowed
    if (enable_rightclick && document.getElementById('paneltab-button')) {
        document.getElementById('paneltab-button').setAttribute('context', '');
        var pttt1 = document.getElementById('paneltab-tooltip').firstChild;
        var pttt2 = document.getElementById('paneltab-tooltip-reverse').firstChild;

        if (pttt1.getAttribute('r3c2').indexOf(pttt1.getAttribute('rightclick')) == -1) {
            pttt1.setAttribute('r3c2', pttt1.getAttribute('r3c2') + pttt1.getAttribute('rightclick'));
        }
        if (pttt2.getAttribute('r3c2').indexOf(pttt2.getAttribute('rightclick')) == -1) {
            pttt2.setAttribute('r3c2', pttt2.getAttribute('r3c2') + pttt2.getAttribute('rightclick'));
        }
    }

    // Prevent opening the download window if the sidebar is to be used
    if (AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.sidebar'))
        AiOS_HELPER.prefBranch.setBoolPref("browser.download.manager.showWhenStarting", false);

    // Set list of all downloads
    var adlist = Downloads.getList(Downloads.ALL);
    var view = {
        onDownloadAdded: download => aios_DownloadObserver('added', download),
        onDownloadChanged: download => aios_DownloadObserver('changed', download)
    };
    adlist.then(obj => obj.addView(view));

    // Remove the view when the window is closed
    window.addEventListener("unload", function () {
        adlist.then(obj => obj.removeView(view));
    }, false);

    return true;
}

function aios_ModifyCommandSet(targets, prefInfotip, objects, i, isMain) {
    for (var obj in targets) {
        // Open in sidebar?
        var prefSidebar;
        try {
            if (obj != "ad")
                prefSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref(obj + ".sidebar");
            else
                prefSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref("em.sidebar");
            var enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
            var mbSeparate = AiOS_HELPER.prefBranchAiOS.getBoolPref("intercept");
        } catch (e) {}

        // By default, only modify the commands with the -tb suffix
        var cmExt = "-tb";
        // If isMain = true, modify the main commands
        if (isMain)
            cmExt = "";

        var ffObj = document.getElementById(targets[obj][0] + cmExt); // Original object
        var sbObj = document.getElementById(targets[obj][1]); // Sidebar object
        var tpObj = document.getElementById(targets[obj][2] + "-tooltip"); // Tooltip
        var btObj = document.getElementById(targets[obj][2] + "-button"); // Button

        if (ffObj && sbObj) {
            var newObj,
            newCmd,
            newTp;

            if (prefSidebar) {
                // Tooltip
                newObj = sbObj;
                newTp = document.getElementById('template-sidebar-tooltip').childNodes[0].cloneNode(true);

                // Command
                newCmd = newObj.getAttribute('oncommand');

                // prevent two commands from being executed when a key is pressed
                newCmd = "if(aios_preventDblCmd(event)) " + newCmd + " return true;";

                // assign command
                ffObj.setAttribute('oncommand', newCmd);
            } else {
                // Tooltip
                newObj = ffObj;
                newTp = document.getElementById('template-window-tooltip').childNodes[0].cloneNode(true);

                // Command
                ffObj.setAttribute('oncommand', "if(aios_preventDblCmd(event)) " + targets[obj][3]);
            }
            // remembering commands
            // => for context functions - aios_contextEvent() - can be queried
            // => if you do not want to open in Sidebar anymore
            ffObj.setAttribute('aios_inSidebar', prefSidebar);
            if (!aios_getBoolean(ffObj, 'modByAIOS')) {
                // for clicks on toolbarbuttons and menu entries
                ffObj.setAttribute('aios_sbUri', sbObj.getAttribute('sidebarurl'));
                ffObj.setAttribute('aios_sbCmd', targets[obj][1]);

                // for clicks on menu items in the sidebar menu => see aios_preventDblCmd()
                sbObj.setAttribute('aios_sbUri', sbObj.getAttribute('sidebarurl'));
                sbObj.setAttribute('oncommand', "if(aios_preventDblCmd(event)) " + sbObj.getAttribute('oncommand'));
            }

            // Remove Tooltiptext to make info tooltips visible (looped because there may be several buttons with the same ID)
            if (prefInfotip && btObj) {
                objects = document.getElementsByAttribute('id', btObj.id);
                for (i = 0; i < objects.length; i++) {
                    objects[i].removeAttribute('tooltiptext');
                }
            }

            // remove "old" tooltip lines (otherwise they will be inserted with each function call)
            if (tpObj.childNodes.length > 1)
                tpObj.removeChild(tpObj.childNodes[1]);

            // Activate right click in the tooltip
            if (enable_rightclick)
                newTp.setAttribute('r3c2', newTp.getAttribute('r3c2') + newTp.getAttribute('rightclick'));

            // Assign tooltip
            tpObj.appendChild(newTp);

            // Disable context menu of the toolbarbuttons, if right-click is allowed
            if (btObj && enable_rightclick)
                btObj.setAttribute('context', '');

            ffObj.setAttribute('modByAIOS', true);
        }

        if (cmExt == "" && ffObj && mbSeparate) {
            ffObj.setAttribute('oncommand', targets[obj][3]);
        }
    }
}

/*
 * Opens the sidebar,
 *  1. when a download is started ...
 *  2. The manager is to be opened and ...
 *  3. the goal is to open the sidebar
 */
function aios_DownloadObserver(aTopic, aDownload) {
    var autoOpen = AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.autoopen');
    var autoClose = AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.autoclose');
    var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);

    switch (aTopic) {
    case "added":
        var comElem = document.getElementById('Tools:Downloads');
        if (autoOpen && comElem.getAttribute('oncommand').indexOf('viewDownloadsSidebar') >= 0) {
            // AiOS_HELPER.windowWatcher.activeWindow prevents the sidebar from being opened in any window
            if (typeof AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar == "function")
                AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar("viewDownloadsSidebar", true);
        }
        break;

    case "changed":
        // Add a check since without if statement, downloads sidebar would automagically close even if
        // the download isn't done yet (in progress)
        if (aDownload.succeeded) {
            var sideSrc = document.getElementById('sidebar').getAttribute('src');
            if (autoOpen && autoClose && sideSrc.indexOf('about:downloads') >= 0) {
                if (typeof AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar == "function")
                    AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar();
            }
        }
        break;
    }
}

/*
 * Prevents the normal Command command and the double function from being executed by clicking + Shift or Ctrl
 * => Called by sidebar buttons, assigned as first part of oncommand
 */
function aios_preventDblCmd(ev) {
    // metaKey = Mac
    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
        if (ev.explicitOriginalTarget.tagName == 'toolbarbutton' || ev.explicitOriginalTarget.tagName == 'menuitem')
            return false;
    }
    return true;
}

/*
 * Checks whether the browser window is maximized or is in full-screen mode
 * => Called by aios_checkThinSwitch()
 */
function aios_isWinMax() {
    var windowMax = document.getElementById('main-window').getAttribute('sizemode') == "maximized";

    var maxWidth = window.outerWidth > screen.availWidth;
    var maxHeight = window.outerHeight > screen.availHeight;
    if ((maxWidth && maxHeight) || window.fullScreen)
        windowMax = true;

    return windowMax;
}

/*
 * Returns (a boolean) the sidebar box's visibility
 * => depends on the sidebar method
 */
function aios_isSidebarHidden() {
    aios_getObjects();

    let pref = 'collapse';
    if (AiOS_HELPER.prefBranchAiOS.getPrefType(pref)) {
        var aios_collapseSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref(pref);
    }

    if (aios_collapseSidebar)
        return (fx_sidebarBox.hidden || fx_sidebarBox.collapsed);
    else
        return fx_sidebarBox.hidden;
}

/*
 * Initialize the AutoHide feature
 * => Called by aios_initSidebar() and aios_savePrefs()
 */
var aiosFocus = true;
function aios_initAutohide() {
    // Set the state of the autohide button
    document.getElementById('aios-enableAutohide').setAttribute('checked', AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.autoshow"));

    // Add autohide feature/command
    fx_sidebarBox.addEventListener("mouseover", function () {
        if (document.getElementById('appcontent'))
            document.getElementById('appcontent').addEventListener("mouseover", aios_autoShowHide, true);
    }, true);

    window.addEventListener("focus", function (e) {
        aiosFocus = true;
    }, true);
    window.addEventListener("blur", function (e) {
        aiosFocus = false;
    }, true);
}

/*
 * Switch AutoHide on or off using the toolbar button
 * => Call through broadcaster 'aios-enableAutohide'
 */
function aios_toggleAutohide(which) {
    try {
        AiOS_HELPER.prefBranchAiOS.setBoolPref("gen.switch.autoshow", aios_getBoolean(which, 'checked'));
    } catch (e) {}
}
