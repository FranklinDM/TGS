var aios_managerWindow, downloads_box;
var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;
var sideSrc = null;

var AiOS_Downloads = {
	init: function () {
		var enable_sidebar,
		enable_count,
		enable_layout,
		enable_layoutall,
		enable_loadall,
		enable_shading;

		// Hide the menu bar under Mac OS X
		aios_hideMacMenubar();

		aios_managerWindow = document.getElementById("contentAreaDownloadsView");
		downloads_box = document.getElementById("downloadsRichListBox");

		// For CSS purposes
		AiOS_HELPER.rememberAppInfo(aios_managerWindow);

		try {
			enable_sidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.sidebar");
			enable_count = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.count");
			enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.layout");
			enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.layoutall");
			enable_loadall = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.loadall");
			enable_shading = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.shading");
		} catch (e) {
			return false;
		}

		// Sidebar layout
		if ((enable_layout && aios_inSidebar) || enable_layoutall)
			AiOS_Downloads.sidebarLayout();
		if (enable_shading)
			aios_managerWindow.setAttribute('aios-downloadShade', true);

		// Count and display elements
		if (enable_count) {
			// create an observer instance
			var observer = new MutationObserver(function (mutations) {
					window.setTimeout(function () {
						AiOS_Downloads.countItems();
						if (!enable_count) {
							AiOS_Downloads.removeCount();
						}
					}, 500);
				});
			// configuration of the observer:
			var config = {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true
			};
			// pass in the target node, as well as the observer options
			observer.observe(downloads_box, config);
			// Stop observing when window is closed
			window.addEventListener("unload", function () {
				observer.disconnect();
			}, false);
		} else {
			// remove downloads count
			AiOS_Downloads.removeCount();
		}

		if (document.getElementById("searchbox")) {
			window.setTimeout(function () {
				document.getElementById("searchbox").focus();
			}, 50);
		}

		// Remove the keyboard shortcut so as not to block the main browser
		if (aios_inSidebar)
			aios_removeAccesskeys();

		// Try to load all richlist items..
		if (enable_loadall)
			AiOS_Downloads.updateList();

		return true;
	},

	removeCount: function () {
		// Will only set this if in sidebar
		if (aios_inSidebar)
			sideSrc = top.document.getElementById('sidebar').getAttribute('src');
		var title,
		newTitle;
		// Remove the number in the title
		// => is required only after deactivating the option because the number is stored in the Broadcaster
		if (sideSrc != null && sideSrc.indexOf('about:downloads') >= 0) {
			if (top.document.getElementById('sidebar-title')) {
				title = top.document.getElementById('sidebar-title').getAttribute("value");

				if (title.indexOf(" [") > 0) {
					newTitle = title.substring(0, title.indexOf(" ["));
					top.document.getElementById('sidebar-title').setAttribute("value", newTitle);

					if (aios_inSidebar)
						AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute('sidebartitle', newTitle);
				}
			}
		} else {
			title = document.title;
			if (title.indexOf(" [") > 0) {
				newTitle = title.substring(0, title.indexOf(" ["));
				document.title = newTitle;
			}
		}
	},

	/*
	 * Activates the layout adapted to the sidebar
	 * => Called by aios_init()
	 */
	sidebarLayout: function ()  {
		// Activate CSS for sidebar optimizations
		aios_addCSS("downloads_sb.css", aios_managerWindow);
	},

	updateList: function ()  {
		window.setTimeout(function () {
			var nodes = downloads_box.childNodes;
			for (var node of nodes) {
				if (node._shell) {
					node._shell.ensureActive();
				}
			}
		}, 100);
	},

	/*
	 * Displays the activated and deactivated extensions in the sidebar title
	 * => Called by aios_init()
	 */
	countItems: function () {
		if (!AiOS_HELPER.mostRecentWindow.document)
			return false;

		// Fix for MR Tech Local Install
		var li_count = false;

		if (typeof Local_Install == "object") {
			var li_gPrefBranch = AiOS_HELPER.prefService.getBranch("local_install.");
			li_count = li_gPrefBranch.getBoolPref("showManagerTotals");
			if (li_count)
				return false;
			else
				Local_Install.setWindowTitle = function () {};
		}

		// previous title
		var newTitle;
		var origTitle = "";
		if (AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar"))
			origTitle = AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").getAttribute('label');

		// Count elements
		var exts = AiOS_Downloads.filterItems();
		var str_count = "";

		var list_downloading = 0;
		var list_done = 0;
		var list_failed = 0;

		for (var i = 0; i < exts.length; i++) {
			var state = exts[i].getAttribute('state');
			var hasState = exts[i].hasAttribute('state');

			// downloading => starting + downloading + paused + downloading
			if (state == "-1" || state == "0" || state == "4" || state == "5")
				list_downloading++;

			// done => done
			if (state == "1")
				list_done++;

			// failed => failed + canceled
			if (state == "2" || state == "3")
				list_failed++;

			// some items don't have the state attribute, list as failed
			if (hasState == false)
				list_failed++;
		}

		str_count = list_done;
		if (list_downloading > 0 || list_failed > 0)
			str_count = str_count + "/" + list_downloading;
		if (list_failed > 0)
			str_count = str_count + "/" + list_failed;

		newTitle = origTitle + " [" + str_count + "]";

		// Set title and label
		document.title = newTitle;

		// Will only set this if in sidebar
		if (aios_inSidebar)
			sideSrc = top.document.getElementById('sidebar').getAttribute('src');
		if (sideSrc != null && sideSrc.indexOf('about:downloads') >= 0) {
			if (top.document.getElementById('sidebar-title'))
				top.document.getElementById('sidebar-title').setAttribute("value", newTitle);
		}

		// store the sidebar title in the Broadcaster so that it can be restored when the sidebar is closed / opened
		if (aios_inSidebar)
			AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute('sidebartitle', newTitle);

		return true;
	},

	search: function (term) {
		downloads_box._placesView.searchTerm = term;
	},

	clear: function () {
		downloads_box.clearSelection();
		downloads_box._placesView.doCommand("downloadsCmd_clearDownloads");
		AiOS_Downloads.countItems();
	},

	/*
	 * Original code by Caio Chassot: Slim_Extension_List_0.1
	 * http://v2studio.com/k/moz/
	 * => Called by aios_init()
	}*/
	filterItems: function () {
		var r = [];
		var nodes = downloads_box.childNodes;

		for (var node of nodes) {
			if (node.nodeName == "richlistitem" && node.getAttribute('hidden') != "true") {
				r.push(node);
			}
		}

		return r;
	}
}

window.addEventListener("DOMContentLoaded", AiOS_Downloads.init, false);
