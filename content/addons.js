var AiOS_Addons = {};

(function() {
    // Registration
    var namespaces = [];

    this.ns = function(fn) {
        var ns = {};
        namespaces.push(fn, ns);
        return ns;
    };


    this.isInSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

    // Initialization
    this.initialize = function() {

        for (var i=0; i<namespaces.length; i+=2) {
            var fn = namespaces[i];

            var ns = namespaces[i+1];
            fn.apply(ns);
        }

        var self = AiOS_Addons;

        if (self.isInSidebar) self.setSidebarLayout();

    };


    this.setSidebarLayout = function() {

        var self = AiOS_Addons,
            before,
            insertedElement,
            nav_tmp,
            nav,
            updatesBox,
            managerWindow = document.getElementById("addons-page");

        self.checkNotification();
        self.setTitle(true);

        // Save for CSS purposes
        AiOS_HELPER.rememberAppInfo( managerWindow );

        // Enable CSS
        managerWindow.setAttribute('aios-inSidebar', 'true');

        // Align the navigation horizontally
        nav_tmp = document.getElementById("category-search").parentNode,
        nav = nav_tmp.ownerDocument.getAnonymousNodes(nav_tmp);
        nav[0].setAttribute("orient", "horizontal");
        nav[0].setAttribute("style", "overflow:hidden;");
		
		// Set orient of detail-autoUpdate to vertical
		document.getElementById('detail-autoUpdate').setAttribute('orient', 'vertical');
		
		// Make search bar flexible only on sidebar layout
		document.getElementById('header-search').setAttribute('flex', '1');

        // Move toolbar with search box, etc.
        before = document.getElementById("view-port-container");
        insertedElement = before.parentNode.insertBefore(document.getElementById("header"), before);

        // Cut labels when searching without search results...
        document.getElementById("search-list-empty").childNodes[1].childNodes[0].setAttribute("crop", "end");

        // Move containers with update messages; otherwise the messages are displayed in the header
        before = document.getElementById("header");
        insertedElement = before.parentNode.insertBefore(document.getElementById("updates-container"), before);

        // Arrange the contents of the notification box vertically
        updatesBox = document.createElement("vbox");
        updatesBox.setAttribute("align", "left");
        updatesBox.appendChild(document.getElementById("updates-noneFound"));
        updatesBox.appendChild(document.getElementById("updates-manualUpdatesFound-btn"));
        updatesBox.appendChild(document.getElementById("updates-progress"));
        updatesBox.appendChild(document.getElementById("updates-installed"));
        updatesBox.appendChild(document.getElementById("updates-downloaded"));
        updatesBox.appendChild(document.getElementById("updates-restart-btn"));
        document.getElementById("updates-container").insertBefore(updatesBox, document.getElementById("updates-container").childNodes[1]);

        // Always make navigation buttons visible
        document.getElementById('back-btn').setAttribute('hidden', false);
        document.getElementById('forward-btn').setAttribute('hidden', false);

    };


    this.setDetailLayout = function() {

        var self = AiOS_Addons,
            pendingContainer,
            pendingBox,
            summary,
            newParent,
            hbox,
            screenshot,
            descriptionContainer;

        if (!self.isInSidebar) return false;

        // Detail view: Align buttons in the pending box (update installation) on the right and arrange them vertically
        pendingContainer = document.getElementById("pending-container");
        pendingContainer.setAttribute("align", "left");

        pendingBox = document.createElement("vbox");
        pendingBox.setAttribute("align", "end");
        pendingBox.appendChild(document.getElementById("detail-restart-btn"));
        pendingBox.appendChild(document.getElementById("detail-undo-btn"));
        pendingContainer.appendChild(pendingBox);

        // New arrangement of the header section of the detail view
        summary = document.getElementById("detail-summary");
        newParent = summary.parentNode;
        hbox = document.createElement("hbox");
        hbox.setAttribute("id", "detail-header");
        hbox.setAttribute("align", "left"); // Icons are not distorted if they are not 64x64
        hbox.appendChild(document.getElementById("detail-icon"));
        hbox.appendChild(summary);
        newParent.insertBefore(hbox, document.getElementById("detail-desc-container"));

        // Place the name above the version number
        summary.insertBefore(document.getElementById("detail-name"), document.getElementById("detail-name-container"));

        // Move screenshot
        screenshot = document.getElementById("detail-screenshot").parentNode;
        screenshot.setAttribute("align", "left"); // picture is not distorted

        descriptionContainer = document.getElementById("detail-desc-container");
        descriptionContainer.childNodes[1].insertBefore(screenshot, document.getElementById("detail-fulldesc"));

        // Detail view: Align buttons in the donation box to the right
        document.getElementById("detail-contributions").childNodes[1].removeAttribute("align");

    };


    // Show or hide notification box depending on existing notifications
    this.checkNotification = function() {

        if (!document.getElementById('updates-noneFound').hidden ||
            !document.getElementById('updates-manualUpdatesFound-btn').hidden ||
            !document.getElementById('updates-progress').hidden ||
            !document.getElementById('updates-installed').hidden ||
            !document.getElementById('updates-downloaded').hidden ||
            !document.getElementById('updates-restart-btn').hidden) {

            document.getElementById('updates-container').hidden = false;
        }
        else {
            document.getElementById('updates-container').hidden = true;
        }

    };


    // Hide the notification box
    this.hideNotification = function() {

        document.getElementById('updates-container').hidden = true;

    };


    // Count and display elements
    this.setTitle = function(aDelay) {

        // without the timeout the childNodes.length of "addon-list" will be 0
        if (aDelay) {

            window.setTimeout( function() {
                AiOS_Addons.setTitle();
            }, 200 );

            return;
        }

        var origTitle,
            viewTitle,
            newTitle,

            numberOfItems,
            count = AiOS_HELPER.prefBranchAiOS.getBoolPref("em.count"),
            selectedCategory = document.getElementById('categories').getAttribute('last-selected'),
            isInSidebar = (top.document.getElementById('sidebar-box')) ? true : false;

        if (!isInSidebar || selectedCategory === "category-discover") {
            count = false;
        }

        // Find original title
        if (AiOS_HELPER.mostRecentWindow.document.getElementById("viewAddonsSidebar")) {
            origTitle = AiOS_HELPER.mostRecentWindow.document.getElementById("viewAddonsSidebar").getAttribute('label');
        }

        // Extend the original title by the activated panel
        if (document.getElementById("categories") && document.getElementById("categories").selectedItem) {
            viewTitle = document.getElementById("categories").selectedItem.getAttribute('name');
            origTitle = origTitle + " - " + viewTitle;
        }

        newTitle = origTitle;

        // If elements should be counted
        if (count) {
            numberOfItems = AiOS_Addons.countItems(selectedCategory, "/");
            newTitle = origTitle + " [" + numberOfItems + "]";
        }

        // Set new title
		let sbTitleElem = top.document.getElementById('sidebar-title');
        if (sbTitleElem) {
            document.title = newTitle;
            sbTitleElem.setAttribute("value", newTitle);
        }

        // Save sidebar title in the broadcaster
		// Preserves title when closing/opening sidebar
        if(top.document.getElementById('viewAddonsSidebar')) {
            top.document.getElementById('viewAddonsSidebar').setAttribute('sidebartitle', newTitle);
        }

        return;
    };


    // Count and return items
    this.countItems = function(selectedCategory, divider) {

        /*
        category-search             => search-list
        category-discover           => -
        category-languages          => addon-list
        category-searchengines      => addon-list
        category-extensions         => addon-list
        category-themes             => addon-list
        category-plugins            => addon-list
        category-availableUpdates   => updates-list
        category-recentUpdates      => updates-list
        category-scripts            => addon-list
        */

        var type = "all",
            the_list = "addon-list",
            exts,
            str_count,
            list_enabled = 0,
            list_disabled = 0;

        if (selectedCategory === "category-search") {
            the_list = "search-list";
            type = document.getElementById("search-filter-radiogroup").getAttribute("value");
        }
        else if (selectedCategory === "category-availableUpdates" || selectedCategory === "category-recentUpdates") {
            the_list = "updates-list";
        }

        exts = AiOS_Addons.filterItems(the_list, type);

        for (var i = 0; i < exts.length; i++) {
            if(exts[i].getAttribute('active') === "true") list_enabled++;
            else  list_disabled++;
        }

        str_count = list_enabled;
        if (list_disabled > 0) str_count = str_count + divider + list_disabled;

        return(str_count);

    };


    // Filter richlist items
    this.filterItems = function(aList, aType) {

        var r = [],
            childs = document.getElementById(aList).childNodes;

        for (var i = 0; i < childs.length; i++) {
            if (childs[i].nodeName === "richlistitem" && childs[i].getAttribute('hidden') !== "true") {
                if (aType === "all") {
                    r.push(childs[i]);
                }
                else if (aType === "local" && childs[i].getAttribute('remote') === "false") {
                    r.push(childs[i]);
                }
                else if (aType === "remote" && childs[i].getAttribute('remote') === "true") {
                    r.push(childs[i]);
                }
            }
        }

        return r;

    };


    // Clean up
    this.shutdown = function() {
        window.removeEventListener("DOMContentLoaded", AiOS_Addons.initialize);
        window.removeEventListener("load", AiOS_Addons.setDetailLayout);
        window.removeEventListener("unload", AiOS_Addons.shutdown);
    };

    // Register handlers
    window.addEventListener("DOMContentLoaded", this.initialize);
    window.addEventListener("load", this.setDetailLayout);
    window.addEventListener("unload", this.shutdown);

}).apply(AiOS_Addons);