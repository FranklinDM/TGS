(function () {
    this.AREA_PANELBAR = "aios-toolbar";
    this.AREA_SBHBAR = "aios-sbhtoolbar";
    
    this.initializeCUI = function () {
        let panelbarPlacements = [
            "bookmarks-button",
            "history-button",
            "downloads-button",
            "separator",
            "addons-button",
            "multipanel-button",
            "pageinfo-button",
            "separator",
        ];
        let sbhbarPlacements = [
            "autohide-button",
            "paneltab-button",
            "sidebarclose-button",
        ];
        
        CustomizableUI.registerArea(AiOS.AREA_PANELBAR, {
            type: CustomizableUI.TYPE_TOOLBAR,
            defaultPlacements: panelbarPlacements,
            defaultCollapsed: false,
        }, true);
        CustomizableUI.registerArea(AiOS.AREA_SBHBAR, {
            type: CustomizableUI.TYPE_TOOLBAR,
            defaultPlacements: sbhbarPlacements,
            defaultCollapsed: false,
        }, true);
    };
    
    this.beforeCustomization = function () {
        var toolbars = [document.getElementById("aios-toolbar"), document.getElementById("aios-sbhtoolbar")];
        for (var i in toolbars) {
            toolbars[i].setAttribute("_toolbox", toolbars[i].parentNode.id);
            toolbars[i].setAttribute("_context", toolbars[i].getAttribute("context"));
            toolbars[i].setAttribute("context", "toolbar-context-menu");
            toolbars[i].setAttribute("_orient", toolbars[i].getAttribute("orient"));
            toolbars[i].setAttribute("orient", "horizontal");
            toolbars[i].setAttribute("_mode", toolbars[i].getAttribute("mode"));
            toolbars[i].setAttribute("mode", "icons");
            document.getElementById(toolbars[i].id + "-cui").appendChild(toolbars[i]);
        }
    };

    this.afterCustomization = function () {
        var toolbars = [document.getElementById("aios-toolbar"), document.getElementById("aios-sbhtoolbar")];
        for (var i in toolbars) {
            toolbars[i].setAttribute("context", toolbars[i].getAttribute("_context"));
            toolbars[i].removeAttribute("_context");
            toolbars[i].setAttribute("orient", toolbars[i].getAttribute("_orient"));
            toolbars[i].removeAttribute("_orient");
            toolbars[i].setAttribute("mode", toolbars[i].getAttribute("_mode"));
            toolbars[i].removeAttribute("_mode");
            document.getElementById(toolbars[i].getAttribute("_toolbox")).appendChild(toolbars[i]);
            toolbars[i].removeAttribute("_toolbox");
        }
    };

    this.unload = function () {
        window.removeEventListener("unload", AiOS.unload);

        gNavToolbox.removeEventListener("beforecustomization", AiOS.beforeCustomization);
        gNavToolbox.removeEventListener("aftercustomization", AiOS.afterCustomization);
    };
}).apply(AiOS);

window.addEventListener("load", AiOS.initializeCUI, false);
window.addEventListener("unload", AiOS.unload, false);

gNavToolbox.addEventListener("beforecustomization", AiOS.beforeCustomization, false);
gNavToolbox.addEventListener("aftercustomization", AiOS.afterCustomization, false);

AiOS_HELPER.log("CustomizableUI script was successfully applied!");
