var aios_managerWindow, downloadsBox, strings, downloadsList, sideSrc = null;
var aios_inSidebar = (top.document.getElementById("sidebar-box")) ? true : false;

var AiOS_Downloads = {
    init: function () {
        let enable_count,
            enable_layout,
            enable_layoutall,
            enable_shading,
            searchBox;

        // Hide the menu bar under Mac OS X
        aios_hideMacMenubar();

        aios_managerWindow = document.getElementById("contentAreaDownloadsView");
        downloadsBox = document.getElementById("downloadsRichListBox");
        strings = document.getElementById("propSetStrings");
        searchBox = document.getElementById("searchbox");

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(aios_managerWindow);

        enable_count = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.count");
        enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.layout");
        enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.layoutall");
        enable_shading = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.shading");

        // Sidebar layout
        if ((enable_layout && aios_inSidebar) || enable_layoutall)
            AiOS_Downloads.sidebarLayout();
        if (enable_shading)
            aios_managerWindow.setAttribute("aios-downloadShade", true);

        if (enable_count) {
            // Set list of all downloads
            if (PrivateBrowsingUtils.isWindowPrivate(window))
                downloadsList = Downloads.getList(Downloads.PRIVATE);
            else
                downloadsList = Downloads.getList(Downloads.PUBLIC);
            var view = {
                onDownloadAdded: download => AiOS_Downloads.countItems(),
                onDownloadChanged: download => AiOS_Downloads.countItems(),
                onDownloadRemoved: download => AiOS_Downloads.countItems()
            };
            downloadsList.then(obj => obj.addView(view));

            // Remove the view when the window is closed
            window.addEventListener("unload", () => {
                downloadsList.then(obj => obj.removeView(view));
            }, false);
        } else {
            // Determine if downloads status count should be removed
            AiOS_Downloads.removeCount();
        }

        window.setTimeout(() => {
            searchBox.placeholder = strings.getString("bm_hi.search.blur");
            searchBox.focus();
        }, 50);

        if (aios_inSidebar) {
            // Get sidebar URL for comparison
            sideSrc = top.document.getElementById("sidebar").getAttribute("src");
            // Remove keyboard shortcuts to avoid blocking the main browser
            aios_removeAccesskeys();
        }

        // Load all items of the downloads box
        window.addEventListener("load", AiOS_Downloads.updateList, false);
    },

    removeCount: function () {
        let title = document.getElementById("contentAreaDownloadsView").getAttribute("data-title");
        // Reset panel/window title
        if (sideSrc != null && sideSrc.includes("about:downloads")) {
            top.document.getElementById("sidebar-title").setAttribute("value", title);
            AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute("sidebartitle", title);
        } else {
            document.title = title;
        }
    },

    /*
     * Activates the layout adapted to the sidebar
     */
    sidebarLayout: function () {
        AiOS_HELPER.rememberAppInfo(aios_managerWindow);
        aios_managerWindow.setAttribute("aios-inSidebar", "true");
    },

    /*
     * Forces all items in the downloads list to become visible
     */
    updateList: function () {
        let nodes = downloadsBox.childNodes;
        for (let node of nodes) {
            if (node._shell) {
                node._shell.ensureActive();
            }
        }
    },

    /*
     * Displays the status of downloads in the sidebar title
     */
    countItems: function () {
        AiOS_HELPER.log("Count Items called!");
        // previous title
        let title = document.getElementById("contentAreaDownloadsView").getAttribute("data-title");
        let newTitle;
        downloadsList.then(obj => obj.getAll()).then(function (value) {
            let list = value;

            // Count elements
            let str_count = "";

            let list_downloading = 0;
            let list_done = 0;
            let list_failed = 0;

            list.forEach(dl => {
                // downloading => starting + downloading + paused + downloading
                if (dl.hasProgress && dl.hasPartialData && !dl.error) {
                    list_downloading++;
                    return;
                }

                // done => done
                if (dl.stopped && dl.succeeded) {
                    list_done++;
                    return;
                }

                // failed => failed + canceled
                if (!dl.hasPartialData || dl.error) {
                    list_failed++;
                    return;
                }
            });

            str_count = list_done;
            if (list_downloading > 0)
                str_count += "/" + list_downloading;
            if (list_failed > 0)
                str_count += "/" + list_failed;

            newTitle = title + " [" + str_count + "]";

            // Set title and label
            document.title = newTitle;

            if (sideSrc != null && sideSrc.includes("about:downloads")) {
                if (top.document.getElementById("sidebar-title"))
                    top.document.getElementById("sidebar-title").setAttribute("value", newTitle);
            }

            // Store the sidebar title in the broadcaster to prevent losing new title when toggling the sidebar
            if (aios_inSidebar)
                AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute("sidebartitle", newTitle);
        });
    },

    search: function (term) {
        downloadsBox._placesView.searchTerm = term;
    },

    clear: function () {
        downloadsBox.clearSelection();
        downloadsBox._placesView.doCommand("downloadsCmd_clearDownloads");
        AiOS_Downloads.countItems();
    }
};

window.addEventListener("DOMContentLoaded", AiOS_Downloads.init, false);
