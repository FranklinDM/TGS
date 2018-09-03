
// Get window element
var conWindow;
if (document.getElementById("JSConsoleWindow"))
    conWindow = document.getElementById("JSConsoleWindow");
if (document.getElementById("Console2Window"))
    conWindow = document.getElementById("Console2Window");

var AiOS_Console = {
    /*
     * Initialization
     * => Called by onload in console.xul
     */
    init: function () {
        var enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("co.layout");
        var enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("co.layoutall");

        var aios_inSidebar = (top.document.getElementById("sidebar-box")) ? true : false;

        // Hide the menu bar on Mac OS X
        aios_hideMacMenubar();

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(conWindow);

        // Enable optimized layout?
        if ((enable_layout && aios_inSidebar) || enable_layoutall)
            AiOS_Console.sidebarLayout();

        // Remove keyboard shortcuts to avoid blocking the main browser
        if (aios_inSidebar)
            aios_removeAccesskeys();
    },

    /*
     * Activates the layout adapted to the sidebar
     * => Called by aios_init()
     */
    sidebarLayout: function () {
        aios_addCSS("console.css", conWindow);
        var cStyle = "";

        // Default Error Console
        if (conWindow.id == "JSConsoleWindow") {
            // Create and insert spacer
            var new_spacer = document.createElement("spacer");
            new_spacer.setAttribute("flex", 1);
            var theToolbar = document.getElementById("ToolbarMode");
            theToolbar.insertBefore(new_spacer, theToolbar.childNodes[theToolbar.childNodes.length - 2]);

            // Toolbar Buttons with Tooltip
            if (document.getElementById("ToolbarMode")) {
                var tbChilds = document.getElementById("ToolbarMode").childNodes;
                for (var i = 0; i < tbChilds.length; i++) {
                    if (tbChilds[i].tagName == "toolbarbutton")
                        tbChilds[i].setAttribute("tooltiptext", tbChilds[i].getAttribute("label"));
                }
            }

            // Hide labels => only if there are icons
            cStyle = document.defaultView.getComputedStyle(document.getElementById("Console:modeAll"), "");
        } else if (conWindow.id == "Console2Window") {
            cStyle = document.defaultView.getComputedStyle(document.getElementById("item_modeAll"), "");
        }

        if (cStyle && cStyle.listStyleImage && cStyle.listStyleImage != "none") {
            if (document.getElementById("ToolbarMode"))
                document.getElementById("ToolbarMode").setAttribute("hideLabel", true);
        }
    }
};

window.addEventListener("DOMContentLoaded", AiOS_Console.init, false);
