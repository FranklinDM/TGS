/*
 * Create a list of available sidebars
 * => Called by aios_initPane()
 */
function aios_genSidebarList() {

    if (!document.getElementById("sidebarInitPopup") || !document.getElementById("panelInitPopup"))
        return false;

    var strings = document.getElementById("aiosStrings");

    var sidebarInit = document.getElementById("sidebarInitPopup");
    var panelInit = document.getElementById("panelInitPopup");
    var allSidebars = AiOS_HELPER.mostRecentWindow.document.getElementsByAttribute("group", "sidebar");

    var cnt = 0;
    var initID = null;
    var sidebarPrefInit = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.init");
    var panelPrefInit = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.open.init");

    for (var i = 0; i < allSidebars.length; i++) {
        var xulElem = null;

        // must have an ID, must not have an observer (menu entries, etc.) and must have a sidebar URL
        if (allSidebars[i].id && !allSidebars[i].getAttribute("observes") && allSidebars[i].getAttribute("sidebarurl")) {

            var separator = document.createElement("menuseparator");
            if (cnt == 0) {
                sidebarInit.appendChild(separator);
                panelInit.appendChild(separator.cloneNode(true));
            }

            if (allSidebars[i].id != "extensionsEMbSidebar" && allSidebars[i].id != "themesEMbSidebar") {
                xulElem = document.createElement("menuitem");
                xulElem.setAttribute("label", strings.getString("prefs.openpanel") + " " + allSidebars[i].getAttribute("label"));
                xulElem.setAttribute("value", allSidebars[i].id);

                if (allSidebars[i].getAttribute("tooltiptext"))
                    xulElem.setAttribute("tooltiptext", allSidebars[i].getAttribute("tooltiptext"));

                sidebarInit.appendChild(xulElem);
                panelInit.appendChild(xulElem.cloneNode(true));
            }

            cnt++;
        }
    }

    sidebarInit.parentNode.value = sidebarPrefInit;
    panelInit.parentNode.value = panelPrefInit;
    return true;
}

/*
 * Use values of the current sidebar width
 * => Called by oncommand() the three <toolbarbutton>
 */
function aios_setWidthVal(mode) {
    var browserWidth = aios_getBrowserWidth();
    var widthSidebar = browserWidth[0];
    var widthContent = browserWidth[1] + browserWidth[2];
    var compWidth = browserWidth[3];

    var percent = parseInt(Math.round((widthSidebar * 100) / compWidth));
    var theUnit = document.getElementById("obj-" + mode + "WidthUnit").value;

    if (theUnit == "px") {
        document.getElementById("obj-" + mode + "WidthVal").value = widthSidebar;
        document.getElementById(mode + "WidthVal").value = widthSidebar;
    } else if (theUnit == "%") {
        document.getElementById("obj-" + mode + "WidthVal").value = percent;
        document.getElementById(mode + "WidthVal").value = percent;
    }
}

/*
 * Convert data when changing the unit of measurement and output
 * => Called by ValueChange listener, initiated in aios_initPrefs()
 */
function aios_changeWidthUnit(mode) {
    var elem = document.getElementById("obj-" + mode + "WidthVal");
    var elemPref = document.getElementById(mode + "WidthVal");
    var theUnit = document.getElementById("obj-" + mode + "WidthUnit").value;

    var browserWidth = aios_getBrowserWidth();
    var compWidth = browserWidth[3];

    if (theUnit == "px")
        elem.value = parseInt((parseInt(elem.value) * compWidth) / 100);
    else
        elem.value = parseInt((parseInt(elem.value) * 100) / compWidth);

    // Change preference, otherwise the new value of the text field will not be saved
    elemPref.value = elem.value;

    // Control
    aios_checkWidthVal(mode);
}

/*
 * Check details of the sidebar width
 * => Called by onBlur() of the three text fields, aios_changeWidthUnit(), aios_setConfSidebarWidth()
 */
function aios_checkWidthVal(mode) {
    var elem = document.getElementById("obj-" + mode + "WidthVal");
    var theUnit = document.getElementById("obj-" + mode + "WidthUnit").value;

    elem.value = parseInt(elem.value);

    // control
    if (mode == "max") {
        if (theUnit == "px" && elem.value < 100)
            elem.value = 100;
        else if (theUnit == "%" && elem.value < 10)
            elem.value = 10;
    }
}

/*
 * Sets the size of the sidebar
 * => Called by aios_savePrefs() in preferences.js and aios_initSidebar() in aios.js
 */
function aios_setConfSidebarWidth() {
    var elem,
        theUnit,
        theValue;
    var widthStyle = "";
    var modes = ["min", "def", "max"];

    var browserWidth = aios_getBrowserWidth();
    var compWidth = browserWidth[3];

    for (var i = 0; i < modes.length; i++) {
        // Called from the options dialog => use the input fields as values
        if (document.getElementById("obj-minWidthVal")) {
            elem = document.getElementById("obj-" + modes[i] + "WidthVal");
            theValue = elem.value;
            theUnit = document.getElementById("obj-" + modes[i] + "WidthUnit").value;

            // control
            aios_checkWidthVal(modes[i]);
        }
        // Called by aios_initSidebar() => use the stored values
        else {
            elem = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.width." + modes[i] + "Val");
            theValue = elem;
            theUnit = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.width." + modes[i] + "Unit");
        }

        // Convert percentage to pixel (figures in % do not work here)
        if (theUnit == "%")
            theValue = parseInt((compWidth * theValue) / 100);

        switch (modes[i]) {
        case "min":
            widthStyle += "min-width: " + theValue + "px !important; ";
            break;
        case "def":
            widthStyle += "width: " + theValue + "px !important; ";
            break;
        case "max":
            widthStyle += "max-width: " + theValue + "px !important; ";
            break;
        }
    }

    var enumerator = AiOS_HELPER.windowMediator.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        win.document.getElementById("sidebar").setAttribute("style", widthStyle);
        win.document.persist("sidebar", "style");
    }
}
