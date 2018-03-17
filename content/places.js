var AiOS_Places = {};

(function () {
    // Registration
    var namespaces = [];

    this.ns = function (fn) {
        var ns = {};
        namespaces.push(fn, ns);
        return ns;
    };

    document.getElementById('search-box').parentNode.setAttribute('id', 'places-toolbar');

    this.mode = (document.getElementById('bookmarksPanel')) ? "bookmarks" : "history";

    if (this.mode === "bookmarks") {
        this.managerWindow = document.getElementById('bookmarksPanel');
        this.managerTree = document.getElementById("bookmarks-view");
    } else {
        this.managerWindow = document.getElementById('history-panel');
        this.managerTree = document.getElementById("historyTree");
    }

    this.treeBoxObject = this.managerTree.treeBoxObject;

    this.searchObj = document.getElementById("search-box");

    // Initialization
    this.initialize = function () {
        var self = AiOS_Places,
        isInSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

        self.checkFolderOptions();

        // Add the separator and the three menu items to the "Tools" menu
        if (self.mode === "history") {
            var viewButton = document.getElementById("viewButton"),
            popUp = viewButton.firstChild;

            popUp.appendChild(document.getElementById('close-separator'));

            popUp.appendChild(document.getElementById('aios-enableAutoClose'));
            popUp.appendChild(document.getElementById('aios-rememberFolder'));
            popUp.appendChild(document.getElementById('aios-scrollToFolder'));
            popUp.appendChild(document.getElementById('aios-duplicateList'));

            popUp.appendChild(document.getElementById('close-separator').cloneNode(true));

            popUp.appendChild(document.getElementById('aios-viewClose'));

            viewButton.removeAttribute('accesskey');
            viewButton.removeChild(document.getElementById('viewPopUp'));
        }

        if (isInSidebar)
            self.setSidebarLayout();

        self.toggleSecondPane();
    };

    this.toggleSecondPane = function () {
        let self = AiOS_Places,
        isHidden = !aios_getBoolean(document.getElementById('aios-duplicateList'), 'checked');
        document.getElementById('duplicateTree').hidden = isHidden;
        document.getElementById('duplicateSplitter').hidden = isHidden;

        if (self.mode === "history")
            searchHistory("");
        if (self.mode === "bookmarks")
            document.getElementById("duplicateTree").place = "place:queryType=1&folder=" + window.top.PlacesUIUtils.allBookmarksFolderId;
    };

    this.checkFolderOptions = function () {
        var self = AiOS_Places,
        lastRowToSelect,
        lastFolderPref = (self.mode === "bookmarks") ? "lastBookmarkFolder" : "lastHistoryFolder",
        options = (aios_getBoolean("aios-enableAutoClose", "checked") || aios_getBoolean("aios-rememberFolder", "checked") || aios_getBoolean("aios-scrollToFolder", "checked"));

        if (options) {
            self.managerTree.addEventListener("click", self.closeOtherFolders);

            // Mark last opened folder
            if (aios_getBoolean("aios-rememberFolder", "checked")) {
                if (AiOS_HELPER.prefBranchAiOS.prefHasUserValue(lastFolderPref)) {
                    lastRowToSelect = AiOS_HELPER.prefBranchAiOS.getIntPref(lastFolderPref);

                    window.setTimeout(function () {
                        AiOS_Places.selectFolder(lastRowToSelect);
                    }, 10);

                }

            }
        } else {
            self.managerTree.removeEventListener("click", self.closeOtherFolders);
        }
    };

    this.toggleButton = function (aElem) {
        document.getElementById(aElem.getAttribute('data-dependent')).setAttribute('hidden', !aios_getBoolean(aElem, "checked"));
    };

    this.setSidebarLayout = function () {
        var self = AiOS_Places,
        strings = document.getElementById("propSetStrings"),
        blurText = strings.getString('bm_hi.search.blur');

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(self.managerWindow);

        // Enable CSS
        self.managerWindow.setAttribute('aios-inSidebar', 'true');

        self.searchObj.placeholder = blurText;

        // Replace Close Folder <button> with a <toolbar button>
        if (document.getElementById("closeFolder")) {
            var closeButton = document.getElementById("closeFolder"),
            closeAttr = closeButton.attributes,
            new_closeButton = document.createElement("toolbarbutton");

            // Remove old <button>
            closeButton.parentNode.removeChild(closeButton);

            // Take over all the attributes of the old button
            for (var i = 0; i < closeAttr.length; i++) {
                new_closeButton.setAttribute(closeAttr[i].name, closeAttr[i].value);
            }

            // Insert a new <toolbarbutton>
            self.searchObj.parentNode.appendChild(new_closeButton);
        }

        // Replace the Tools button <button> with a <toolbar button>
        if (document.getElementById("viewButton")) {
            var viewButton = document.getElementById("viewButton"),
            popUp = viewButton.firstChild.cloneNode(true),
            viewAttr = viewButton.attributes,
            new_viewButton = document.createElement("toolbarbutton");

            // Remove old <button>
            viewButton.parentNode.removeChild(viewButton);

            // Take over all the attributes of the old button
            for (var j = 0; j < viewAttr.length; j++) {
                new_viewButton.setAttribute(viewAttr[j].name, viewAttr[j].value);
            }

            // Insert a new <toolbarbutton>
            new_viewButton.appendChild(popUp);
            self.searchObj.parentNode.appendChild(new_viewButton);
        }
    };

    this.selectFolder = function (index) {
        var self = AiOS_Places;

        if (self.treeBoxObject.view.rowCount >= index) {
            self.treeBoxObject.view.selection.select(index);

            // Check if we really need to scroll
            if (aios_getBoolean("aios-scrollToFolder", "checked") && (self.treeBoxObject.view.rowCount > self.treeBoxObject.getPageLength())) {
                self.treeBoxObject.scrollToRow(index);
            }

            self.treeBoxObject.ensureRowIsVisible(index);
        }
    };

    this.closeOtherFolders = function (e) {
        // Ignore right-click
        if (e.button >= 2)
            return;

        var sidebarType = AiOS_Places.mode;

        var dotoggle = (e.button === 0); // If it was not a left click, just do the standard action
        var tree = AiOS_Places.managerTree;
        var tbo = tree.treeBoxObject;

        // If you click the + sign in front of the folder, then it should just open and the others are not closed
        var row = {},
        col = {},
        obj = {};
        tbo.getCellAt(e.clientX, e.clientY, row, col, obj);
        if (row.value === -1 || obj.value === "twisty") {
            return;
        }

        var x = {},
        y = {},
        w = {},
        h = {};
        tbo.getCoordsForCellItem(row.value, col.value, "image", x, y, w, h);
        var isLTR = (window.getComputedStyle(tree).direction === "ltr");
        var mouseInGutter = isLTR ? (e.clientX < x.value) : (e.clientX > x.value);

        var tboView = tree.view;
        var modifKey = (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey);
        row = tree.currentIndex;
        var isContainer = tboView.isContainer(row);
        if (dotoggle && isContainer && !modifKey) {
            // now the part that closes the other open folders
            var parents = [];
            // Now all upper folders of the current one are searched
            while (row !== -1) {
                parents.push(row);
                row = tboView.getParentIndex(row);
            }

            // Reverses order in the array
            parents.reverse();

            // Go through each line and test
            for (var i = tboView.rowCount - 1; i >= 0; i--) {
                if (parents.length > 0 && parents[parents.length - 1] === i) { // The top folders should do nothing, so should remain open
                    parents.pop();
                } else {
                    if (tboView.isContainer(i) && tboView.isContainerOpen(i)) {
                        // Other items that are folders should be closed
                        tboView.toggleOpenState(i);
                    }
                }
            }

            // If you want to scroll, but only if that is really necessary
            if (aios_getBoolean("aios-scrollToFolder", "checked") && (tboView.rowCount > tbo.getPageLength())) {
                tbo.scrollToRow(tree.currentIndex);
            }

            tbo.ensureRowIsVisible(tree.currentIndex); // Scrolls to the index only when needed.

            if (aios_getBoolean("aios-rememberFolder", "checked")) {
                switch (sidebarType) {
                case "bookmarks":
                    AiOS_HELPER.prefBranchAiOS.setIntPref("lastBookmarkFolder", tree.currentIndex);
                    break;

                case "history":
                    AiOS_HELPER.prefBranchAiOS.setIntPref("lastHistoryFolder", tree.currentIndex);
                    break;
                }
            }
        }
    };

    this.closeAllFolders = function () {
        var aView = AiOS_Places.managerTree.treeBoxObject.view;

        // Last opened folder "forgotten"
        try {
            if (document.getElementById('bookmarksPanel'))
                AiOS_HELPER.prefBranchAiOS.clearUserPref("lastBookmarkFolder");
            else if (document.getElementById('history-panel'))
                AiOS_HELPER.prefBranchAiOS.clearUserPref("lastHistoryFolder");
        } catch (e) {}

        // Close the folder
        if (aView) {
            aView.batching(true);
            for (var i = aView.rowCount - 1; i >= 0; i--) {
                if (aView.isContainer(i) && aView.isContainerOpen(i))
                    aView.toggleOpenState(i);
            }
            aView.batching(false);
        }
    };

    // Clean up
    this.shutdown = function () {
        window.removeEventListener("DOMContentLoaded", AiOS_Places.initialize, false);
        window.removeEventListener("unload", AiOS_Places.shutdown);

        AiOS_Places.managerTree.removeEventListener("click", AiOS_Places.closeOtherFolders);
    };

    // Register handlers
    window.addEventListener("DOMContentLoaded", this.initialize, false);
    window.addEventListener("unload", this.shutdown);

}).apply(AiOS_Places);

/*
 * Overrides to the search functions of History and Bookmarks to consider the second pane
 */

function searchHistory(aInputOld, historyTree) {
    var query = PlacesUtils.history.getNewQuery();
    var options = PlacesUtils.history.getNewQueryOptions();

    const NHQO = Ci.nsINavHistoryQueryOptions;
    var sortingMode;
    var resultType;
    var pane = -1;
    var historyTrees = document.getElementsByClassName('sidebar-placesTree');
    var aInput = aInputOld;

    if (aios_getBoolean(document.getElementById('aios-duplicateList'), 'checked')) {
        if (aInput.substr(0, 2) == 'P1') {
            aInput = aInputOld.substr(2);
            pane = 0;
        }
        if (aInput.substr(0, 2) == 'P2') {
            aInput = aInputOld.substr(2);
            pane = 1;
        }
    }

    switch (gHistoryGrouping) {
    case "visited":
        resultType = NHQO.RESULTS_AS_URI;
        sortingMode = NHQO.SORT_BY_VISITCOUNT_DESCENDING;
        break;
    case "lastvisited":
        resultType = NHQO.RESULTS_AS_URI;
        sortingMode = NHQO.SORT_BY_DATE_DESCENDING;
        break;
    case "dayandsite":
        resultType = NHQO.RESULTS_AS_DATE_SITE_QUERY;
        break;
    case "site":
        resultType = NHQO.RESULTS_AS_SITE_QUERY;
        sortingMode = NHQO.SORT_BY_TITLE_ASCENDING;
        break;
    case "day":
    default:
        resultType = NHQO.RESULTS_AS_DATE_QUERY;
        break;
    }

    if (aInput) {
        query.searchTerms = aInput;
        if (gHistoryGrouping != "visited" && gHistoryGrouping != "lastvisited") {
            sortingMode = NHQO.SORT_BY_FRECENCY_DESCENDING;
            resultType = NHQO.RESULTS_AS_URI;
        }
    }

    options.sortingMode = sortingMode;
    options.resultType = resultType;
    options.includeHidden = !!aInput;

    // call load() on the tree manually
    // instead of setting the place attribute in history-panel.xul
    // otherwise, we will end up calling load() twice
    if (pane != -1) {
        historyTrees[pane].load([query], options);
    } else {
        for (let i = 0; i < historyTrees.length; i++) {
            historyTrees[i].load([query], options);
        }
    }
}

function searchBookmarks(aInputOld) {
    var pane = -1;
    var bookmarksTrees = document.getElementsByClassName('sidebar-placesTree');
    var aInput = aInputOld;

    if (aios_getBoolean(document.getElementById('aios-duplicateList'), 'checked')) {
        if (aInput.substr(0, 2) == 'P1') {
            aInput = aInputOld.substr(2);
            pane = 0;
        }
        if (aInput.substr(0, 2) == 'P2') {
            aInput = aInputOld.substr(2);
            pane = 1;
        }
    }

    if (pane != -1) {
        loadTree(bookmarksTrees[pane], aInput);
    } else {
        for (let i = 0; i < bookmarksTrees.length; i++) {
            loadTree(bookmarksTrees[i], aInput);
        }
    }

    function loadTree(tree, aSearchString) {
        if (!aSearchString)
            tree.place = tree.place;
        else
            tree.applyFilter(aSearchString,
                [PlacesUtils.bookmarksMenuFolderId,
                    PlacesUtils.unfiledBookmarksFolderId,
                    PlacesUtils.toolbarFolderId]);
    }
}
