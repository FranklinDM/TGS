var AiOS_About = {

    initialize: function () {
        Components.utils.import("resource://gre/modules/AddonManager.jsm");

        AddonManager.getAddonByID("tgsidebar@franklindm", function (addon) {
            document.getElementById("aboutHeader").setAttribute("title", addon.name);
            document.getElementById("aboutHeader").setAttribute("description", addon.version);

            document.getElementById("macTitle").setAttribute("value", addon.name);
            document.getElementById("macVersion").setAttribute("value", addon.version);
        });

        AiOS_HELPER.rememberAppInfo(document.getElementById("aiosAbout"));

        // Query languages where this extension is translated
        const language = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService().QueryInterface(Components.interfaces.nsIToolkitChromeRegistry).getLocalesForPackage("aios");
        let languages = [];
        while (language.hasMore()) {
            languages.push(language.getNext());
        }
        languages.sort();

        // Populate translator table contents
        let bundleTranslators = document.getElementById("bundleTranslators");
        let rowsElement = document.getElementById("trans.grid").children[1];
        for (let lang in languages) {
            // Create objects to be inserted
            let row = document.createElement("row");
            let content1 = document.createElement("text");
            let content2 = document.createElement("text");
            let content3 = document.createElement("text");
            // Language name
            content1.setAttribute("value", AiOS_About.getLangName(languages[lang]));
            // Language tag
            content2.setAttribute("value", languages[lang]);
            // Language translator(s)
            let tranName;
            try {
                tranName = bundleTranslators.getString("trans." + languages[lang] + ".name");
            } catch (e) {
                if (languages[lang].includes("-")) {
                    tranName = bundleTranslators.getString("trans." + languages[lang].slice(0, -3) + ".name");
                } else {
                    AiOS_HELPER.log("Please check if the translator(s) of '" + AiOS_About.getLangName(languages[lang]) + "' is listed in translators.properties\nAdditional info: " + e);
                }
            }
            content3.setAttribute("value", tranName);
            // Append elements as child of row
            row.appendChild(content1);
            row.appendChild(content2);
            row.appendChild(content3);
            // Insert row into rowsElement
            rowsElement.appendChild(row);
        }
    },

    getLangName: function (abCD) {
        // Function to get language name and region from browser strings
        let bundleRegions = document.getElementById("bundleRegions");
        let bundleLanguages = document.getElementById("bundleLanguages");

        var abCDPairs = abCD.toLowerCase().split("-"); // ab[-cd]
        var useABCDFormat = abCDPairs.length > 1;
        var ab = useABCDFormat ? abCDPairs[0] : abCD;
        var cd = useABCDFormat ? abCDPairs[1] : "";
        if (ab) {
            var language = "";
            try {
                language = bundleLanguages.getString(ab);
            } catch (e) {
                // continue
            }

            var region = "";
            if (useABCDFormat) {
                try {
                    region = bundleRegions.getString(cd);
                } catch (e) {
                    // continue
                }
            }

            var name = "";
            if (useABCDFormat) {
                name = language + "/" + region;
            } else {
                name = language;
            }
        }
        return name;
    }
};
