var AiOS_MP = {
    /*
     * Initialization
     * => Called by onload
     */
    init: function () {
        // Set sidebar/window title
        AiOS_MP.setSBLabel();

        // Activate/deactivate buttons
        AiOS_MP.setOptions();

        window.setTimeout(function () {
            AiOS_MP.setSSR();
        }, 50);

        // Set linked btn attribute
        document.getElementById("aios-linkedbtn").setAttribute("checked", getPanelBrowser().getAttribute("linkedopt"));
        document.getElementById("aios-syncscroll").setAttribute("checked", getPanelBrowser().getAttribute("syncscroll"));

        // Set URLBar value to cached one
        AiOS_MP.URLBar.value = getPanelBrowser().getAttribute("cachedurl");

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(document.getElementById("webpanels-window"));

        // If URL is blank, go to about:blank
        if (AiOS_MP.URLBar.value == "")
            getPanelBrowser().contentDocument.location.href = "about:blank";

        AiOS_MP.toggleSyncScroll();
    },

    toggleSyncScroll: function () {
        if (aios_getBoolean(document.getElementById("aios-syncscroll"), "checked"))
            getPanelBrowser().addEventListener("scroll", AiOS_MP.synchronizeScroll);
        else
            getPanelBrowser().removeEventListener("scroll", AiOS_MP.synchronizeScroll);
    },

    lastScrollTop: 0,
    lastScrollLeft: 0,
    synchronizeScroll: function (where) {
        let scrollElem = getPanelBrowser().contentDocument.scrollingElement,
            selectedTabContent = AiOS_HELPER.mostRecentWindow.getBrowser().selectedTab.linkedBrowser._contentWindow;

        let currLastScrollTop = this.lastScrollTop,
            currLastScrollLeft = this.lastScrollLeft;
        this.lastScrollTop = scrollElem.scrollTop;
        this.lastScrollLeft = scrollElem.scrollLeft;
        
        let deltaTop = 0,
            deltaLeft = 0,
            selTabLeft = selectedTabContent.scrollX,
            selTabTop = selectedTabContent.scrollY;

        if (currLastScrollTop != 0 || currLastScrollLeft != 0) {
            deltaTop = scrollElem.scrollTop - currLastScrollTop;
            deltaLeft = scrollElem.scrollLeft - currLastScrollLeft;
        }

        let combinedLeft = selTabLeft += deltaLeft;
        let combinedTop = selTabTop += deltaTop;

        selectedTabContent.scroll(combinedLeft, combinedTop);
    },

    /*
     * Opens the web page displayed in the browser in the MultiPanel
     * => Called by buttons, aios_panelTab()
     */
    setMultiPanel: function (aMode) {
        var label,
            panelLoc;
        var aios_CONTENT = AiOS_HELPER.mostRecentWindow.document.getElementById("content");

        // about: entries
        if (aMode.indexOf("about:") == 0 && aMode != "about:blank") {
            panelLoc = (aMode == "about:config") ? "chrome://global/content/config.xul" : aMode;
            label = aMode;
        }
        // Web panel page
        else {
            try {
                panelLoc = aios_CONTENT.currentURI.spec;
                label = aios_CONTENT.selectedTab.label;
            } catch (e) {
                // If content is invalid or some error happens, continue.
            }

            // I am the MultiPanel in the tab
            if (top.toString() == "[object Window]" && AiOS_HELPER.mostRecentWindow.aiosLastSelTab) {
                panelLoc = AiOS_HELPER.mostRecentWindow.aiosLastSelTab.document.location.href;
            }
        }

        // When "Page" is clicked, while in the tab the MultiPanel is loaded
        if (panelLoc == "chrome://browser/content/web-panels.xul") {
            panelLoc = aios_CONTENT.contentDocument.getElementById("web-panels-browser").getAttribute("cachedurl");
        }

        var newLabel = "";

        this.URLBar.value = panelLoc;

        // Open MultiPanel or load contents
        if (top.document.getElementById("sidebar") && top.toString() != "[object Window]")
            top.openWebPanel(newLabel, panelLoc);
        else
            getPanelBrowser().contentDocument.location.href = panelLoc;
    },

    /*
     * Activates/deactivates the Toolbar Buttons and Radio-Menu Items (about)
     * => Called onLocationChange() when MultiPanel URL changes (panelProgressListener)
     */
    setOptions: function () {
        var mode;
        var aboutGroup = document.getElementById("aboutGroup").childNodes;
        var panelLoc = getPanelBrowser().contentDocument.location.href;

        if (panelLoc != "about:blank") {
            mode = "page";
            if (panelLoc.indexOf("about:") == 0 && panelLoc != "about:home")
                mode = "about";
            if (panelLoc == "chrome://global/content/config.xul")
                mode = "about";
        }

        if (!mode)
            return false;

        if (mode != "page")
            document.getElementById("page-button").setAttribute("checked", false);
        if (mode != "about")
            document.getElementById("about-button").setAttribute("checked", false);

        document.getElementById(mode + "-button").setAttribute("checked", true);

        if (mode == "page") {
            for (let i = 0; i < aboutGroup.length; i++) {
                if (aboutGroup[i].tagName == "menuitem")
                    aboutGroup[i].setAttribute("checked", false);
            }
        } else {
            for (let i = 0; i < aboutGroup.length; i++) {
                var label = aboutGroup[i].getAttribute("label");
                var isActive = label == panelLoc;
                isActive = (label == "about:config" && panelLoc == "chrome://global/content/config.xul");
                if (aboutGroup[i].tagName == "menuitem" && isActive)
                    aboutGroup[i].setAttribute("checked", true);
            }
        }

        getPanelBrowser().setAttribute("cachedurl", panelLoc);
        document.persist("web-panels-browser", "cachedurl");

        return true;
    },

    /*
     * Sidebar label
     * => Invoked by onload event and onStateChange() when multiPanel URL changes (panelProgressListener)
     */
    setSBLabel: function () {
        var newLabel = "";

        var mpLabel = AiOS_HELPER.mostRecentWindow.document.getElementById("viewWebPanelsSidebar").getAttribute("label");

        if (getPanelBrowser() && getPanelBrowser().contentDocument) {
            var loc = getPanelBrowser().contentDocument.location.href;

            if (getPanelBrowser().contentDocument.title != "")
                newLabel = newLabel + getPanelBrowser().contentDocument.title;
        }

        if (newLabel != "")
            newLabel = newLabel + " - " + mpLabel;
        else
            newLabel = mpLabel;

        if (top.document.getElementById("sidebar-title"))
            top.document.getElementById("sidebar-title").setAttribute("value", newLabel);

        if (!top.document.getElementById("sidebar-title"))
            top.document.title = newLabel;
    },

    /*
     * Small Screen Rendering on/off
     * => Invoked by onStateChange() when MultiPanel URL changes (panelProgressListener)
     * Original code in parts of: Daniel Glazman <glazman@netscape.com>
     */
    setSSR: function () {
        var ssrURL = "chrome://aios/skin/css/multipanel_ssr.css";

        try {
            var doc = getPanelBrowser().contentDocument;
        } catch (e) {
            // For some reason, content document is unavailable - continue.
        }

        if (!doc || !doc.body || !aios_getBoolean("page-button", "checked"))
            return false;

        // If the document uses frames, don't continue
        if (doc.body.nodeName.toLowerCase() == "frameset") {
            AiOS_HELPER.log("Small screen rendering was cancelled because 'frameset' was detected.");
            return false;
        }

        // Check if the stylesheet is present in the document
        var styleSheets = doc.styleSheets;
        for (var i = 0; i < styleSheets.length; ++i) {
            var currentStyleSheet = styleSheets[i];
            if (/multipanel_ssr/.test(currentStyleSheet.href)) {
                // Decide if SSR should be enabled/disabled
                currentStyleSheet.disabled = !aios_getBoolean("ssr-mitem", "checked");
                // Decide if document should adapt to sidebar width
                if (aios_getBoolean("ssr-mitem", "checked")) {
                    doc.body.setAttribute("aiosSidebar", aios_getBoolean("ssrSidebar-mitem", "checked"));
                }
                return true;
            }
        }

        // Attach stylesheet to the current document
        if (aios_getBoolean("ssr-mitem", "checked")) {
            // Create a link element
            var headElement = doc.getElementsByTagName("head")[0];
            var linkElement = doc.createElement("link");
            linkElement.setAttribute("rel", "stylesheet");
            linkElement.setAttribute("type", "text/css");
            linkElement.setAttribute("href", ssrURL);
            // Append the element
            headElement.appendChild(linkElement);
        }

        return true;
    },

    /*
     * MultiPanel Unload
     */
    unload: function () {
        if (getPanelBrowser() && !aios_getBoolean("aios-remMultiPanel", "checked")) {
            getPanelBrowser().setAttribute("cachedurl", "");
            document.persist("web-panels-browser", "cachedurl");
        }
        getPanelBrowser().setAttribute("linkedopt", document.getElementById("aios-linkedbtn").getAttribute("checked"));
        getPanelBrowser().setAttribute("syncscroll", document.getElementById("aios-syncscroll").getAttribute("checked"));
    },

    getPageOptions: function () {
        document.getElementById("ssrSidebar-mitem").setAttribute("disabled", !aios_getBoolean("ssr-mitem", "checked"));
    },

    /* Additionals */

    get URLBar() {
        return document.getElementById("urlbar");
    },

    _lastValidURI: null,
    get lastValidURI() {
        return this._lastValidURI;
    },
    set lastValidURI(val) {
        this._lastValidURI = val;
    },

    sanitizeURL: function (strl) {
        // Fix and check the url typed into the address bar for any errors
        return Services.uriFixup.createFixupURI(strl, 8);
    },

    onContentAreaClick: function (ev, bool) {
        if (aios_getBoolean("aios-linkedbtn", "checked")) {
            // If checked, open link in current tab
            return window.parent.contentAreaClick(ev, bool);
        } else {
            // If no, just do nothing
            return;
        }
    },

    onTextReverted: function () {
        // Setup variables
        var url = this.lastValidURI;
        var throbberElement = window.parent.document.getElementById("sidebar-throbber");
        var isScrolling = this.URLBar.popupOpen;

        // Don't revert to last valid url unless page is NOT loading
        // and user is NOT key-scrolling through autocomplete list
        if ((!throbberElement || !throbberElement.hasAttribute("loading")) && !isScrolling) {
            if (url == "about:blank") {
                this.URLBar.value = "";
            } else {
                this.URLBar.value = url.spec;
                this.URLBar.select();
            }
        }

        // Tell widget to revert to last typed text only if the user
        // was scrolling when they hit escape
        return !isScrolling;
    },

    onTextEntered: function (event) {
        // Sanitize the URL
        this.lastValidURI = this.sanitizeURL(this.URLBar.value);
        // Load the given URL
        getPanelBrowser().loadURI(this.lastValidURI.spec);
    },

    onTextDrop: function (event) {
        // Get dropped text
        let data = event.dataTransfer.getData("Text");
        // Sanitize the URL
        this.lastValidURI = this.sanitizeURL(data);
        // Load the given URL
        getPanelBrowser().loadURI(this.lastValidURI.spec);
    }
};
