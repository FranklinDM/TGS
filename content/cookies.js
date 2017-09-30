window.addEventListener("DOMContentLoaded", aios_init, false);
var cookieWindow = document.getElementById("CookiesDialog");;

function aios_init() {
    try {
        var enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("ks.layout");
        var enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("ks.layoutall");
		var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;
    }
    catch(e) { }
	
    // Hide the menu bar under Mac OS X
    aios_hideMacMenubar();

    // For CSS purposes
    AiOS_HELPER.rememberAppInfo( cookieWindow );
	
    // Sidebar Layout
    if((enable_layout && aios_inSidebar) || enable_layoutall) aios_sidebarLayout();

	// Remove the keyboard shortcut so as not to block the main browser
    if(aios_inSidebar) aios_removeAccesskeys();
}


/*
	Activates the layout adapted to the sidebar
		=> Called by aios_init()
*/
function aios_sidebarLayout() {
    // Activate CSS for sidebar optimizations
    aios_addCSS("cookies.css", cookieWindow);
}