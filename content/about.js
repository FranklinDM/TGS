var AiOS_About = {};

(function () {

    // Called by onpaneload in about_content.xul
    this.initialize = function () {
        Components.utils.import("resource://gre/modules/AddonManager.jsm");

        AddonManager.getAddonByID("tgsidebar@franklindm",
            function (addon) {
            document.getElementById("aboutHeader").setAttribute("title", addon.name);
            document.getElementById("aboutHeader").setAttribute("description", addon.version);

            document.getElementById("macTitle").setAttribute("value", addon.name);
            document.getElementById("macVersion").setAttribute("value", addon.version);
        });

        AiOS_HELPER.rememberAppInfo(document.getElementById("aiosAbout"));

        // List of languages where this extension is translated
        /* let languages = ['ar-SA', 'be-BY', 'cs-CZ', 'da-DK', 'de-DE', 'el-GR', 'en-GB', 'en-US', 'es-AR', 'es-ES', 'et-EE', 'fi-FI',
        'fr-FR', 'he-IL', 'hr-HR', 'hu-HU', 'hy-AM', 'it-IT', 'ja-JP', 'ko-KR', 'lt-LT', 'nb-NO', 'nl-NL', 'pl-PL',
        'pt-BR', 'pt-PT', 'ro-RO', 'ru-RU', 'sk-SK', 'sq-AL', 'sr-RS', 'sv-SE', 'tr-TR', 'uk-UA', 'vi-VN', 'zh-CN', 'zh-TW']; */
        let languages = ['en-GB', 'en-US', 'es-AR', 'es-ES'];

        // Populate translator grid contents
        let langNames = document.getElementById("langNames");
        let tranNames = document.getElementById("translatorNames");
        let rowsElement = document.getElementById('trans.grid').children[1];
        for (let lang in languages) {
            // Create objects to be inserted
            let row = document.createElement('row');
            // Language name
            let content1 = document.createElement('text');
            content1.setAttribute('value', langNames.getString('trans.' + languages[lang] + '.lang'));
            // Language tag
            let content2 = document.createElement('text');
            content2.setAttribute('value', languages[lang]);
            // Language translator(s)
            let content3 = document.createElement('text');
            let tranName;
            try {
                tranName = tranNames.getString('trans.' + languages[lang] + '.name');
            } catch (e) {
                if (languages[lang].includes('-'))
                    tranName = tranNames.getString('trans.' + languages[lang].slice(0, -3) + '.name');
                else
                    throw (e);
            }
            content3.setAttribute('value', tranName);
            // Append elements as child of row
            row.appendChild(content1);
            row.appendChild(content2);
            row.appendChild(content3);
            // Insert row into rowsElement
            rowsElement.appendChild(row);
        }
    };

}).apply(AiOS_About);
