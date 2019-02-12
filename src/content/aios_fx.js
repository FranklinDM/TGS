/*
 * From chrome://browser/content/browser.js
 */

/**
 * Opens or closes the sidebar identified by commandID.
 *
 * @param commandID a string identifying the sidebar to toggle; see the
 *                  note below. (Optional if a sidebar is already open.)
 * @param forceOpen boolean indicating whether the sidebar should be
 *                  opened regardless of its current state (optional).
 * @note
 * We expect to find a xul:broadcaster element with the specified ID.
 * The following attributes on that element may be used and/or modified:
 *  - id           (required) the string to match commandID. The convention
 *                 is to use this naming scheme: 'view<sidebar-name>Sidebar'.
 *  - sidebarurl   (required) specifies the URL to load in this sidebar.
 *  - sidebartitle or label (in that order) specify the title to
 *                 display on the sidebar.
 *  - checked      indicates whether the sidebar is currently displayed.
 *                 Note that toggleSidebar updates this attribute when
 *                 it changes the sidebar's visibility.
 *  - group        this attribute must be set to "sidebar".
 */

// Store a copy of the original toggleSidebar function
var aios_oldCollapseToggleSidebar = toggleSidebar;

// Define the toggleSidebar function with collapsing enabled
function aios_collapseToggleSidebar(commandID, forceOpen) {
    var sidebarBox = document.getElementById("sidebar-box");
    if (!commandID)
        commandID = sidebarBox.getAttribute("sidebarcommand");

    // Otherwise there will be errors in the second print preview when SidebarCollapsing is active and the sidebar is collapsed
    // => commandID is not defined in this case
    if (!commandID)
        return;

    var sidebarBroadcaster = document.getElementById(commandID);
    var sidebar = document.getElementById("sidebar"); // xul:browser
    var sidebarTitle = document.getElementById("sidebar-title");
    var sidebarSplitter = document.getElementById("sidebar-splitter");

    if (sidebarBroadcaster.getAttribute("checked") == "true") {
        if (!forceOpen) {
            // Replace the document currently displayed in the sidebar with about:blank
            // so that we can free memory by unloading the page. We need to explicitly
            // create a new content viewer because the old one doesn't get destroyed
            // until about:blank has loaded (which does not happen as long as the
            // element is hidden).

            sidebarBroadcaster.removeAttribute("checked");
            sidebarBox.setAttribute("sidebarcommand", "");

            // AiOS: Simply collapse the sidebar
            sidebarBox.removeAttribute("hidden");
            sidebarBox.collapsed = true;

            sidebarSplitter.hidden = true;
            gBrowser.selectedBrowser.focus();
        } else {
            fireSidebarFocusedEvent();
        }
        return;
    }

    // Now we need to show the specified sidebar
    // But first update the 'checked' state of all sidebar broadcasters
    var broadcasters = document.getElementsByAttribute("group", "sidebar");
    for (let broadcaster of broadcasters) {
        // skip elements that observe sidebar broadcasters and other random elements
        if (broadcaster.localName != "broadcaster")
            continue;

        if (broadcaster != sidebarBroadcaster)
            broadcaster.removeAttribute("checked");
        else
            sidebarBroadcaster.setAttribute("checked", "true");
    }

    // AiOS: Uncollapsed and unhide the sidebar
    sidebarBox.removeAttribute("hidden");
    sidebarBox.removeAttribute("collapsed");

    sidebarSplitter.hidden = false;

    var url = sidebarBroadcaster.getAttribute("sidebarurl");
    var title = sidebarBroadcaster.getAttribute("sidebartitle");
    if (!title)
        title = sidebarBroadcaster.getAttribute("label");
    sidebar.setAttribute("src", url); // kick off async load
    sidebarBox.setAttribute("sidebarcommand", sidebarBroadcaster.id);
    sidebarTitle.value = title;

    // We set this attribute here in addition to setting it on the <browser>
    // element itself, because the code in gBrowserInit.onUnload persists this
    // attribute, not the "src" of the <browser id="sidebar">. The reason it
    // does that is that we want to delay sidebar load a bit when a browser
    // window opens. See delayedStartup().
    sidebarBox.setAttribute("src", url);

    if (sidebar.contentDocument.location.href != url)
        sidebar.addEventListener("load", sidebarOnLoad, true);
    else // older code handled this case, so we do it too
        fireSidebarFocusedEvent();
}

// If sidebar collapsing is enabled, use modified function
toggleSidebar = function (commandID, forceOpen) {
    if (AiOS.isCollapsingEnabled()) {
        aios_collapseToggleSidebar(commandID, forceOpen);
    } else {
        aios_oldCollapseToggleSidebar(commandID, forceOpen);
    }
};
