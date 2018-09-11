/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * Modified to match our use and stolen from Basilisk's content.js
 */
var EXPORTED_SYMBOLS = ["PageInfoUtils"];

var PageInfoUtils = {
    getPageInfoData: function (win, doc, str, imgE) {
        let strings = str;
        let window = win;
        let document = doc;
        let imageElement = imgE;

        let pageInfoData = {
            metaViewRows: this.getMetaInfo(document),
            docInfo: this.getDocumentInfo(document),
            feeds: this.getFeedsInfo(document, strings),
            windowInfo: this.getWindowInfo(window),
            imageInfo: this.getImageInfo(imageElement)
        };

        return pageInfoData;
    },

    getImageInfo: function (imageElement) {
        let imageInfo = null;
        if (imageElement) {
            imageInfo = {
                currentSrc: imageElement.currentSrc,
                width: imageElement.width,
                height: imageElement.height,
                imageText: imageElement.title || imageElement.alt
            };
        }
        return imageInfo;
    },

    getMetaInfo: function (document) {
        let metaViewRows = [];

        // Get the meta tags from the page.
        let metaNodes = document.getElementsByTagName("meta");

        for (let metaNode of metaNodes) {
            metaViewRows.push([metaNode.name || metaNode.httpEquiv || metaNode.getAttribute("property"),
                    metaNode.content]);
        }

        return metaViewRows;
    },

    getWindowInfo: function (window) {
        let windowInfo = {};
        windowInfo.isTopWindow = window == window.top;

        let hostName = null;
        try {
            hostName = window.location.host;
        } catch (exception) {}

        windowInfo.hostName = hostName;
        return windowInfo;
    },

    getDocumentInfo: function (document) {
        let docInfo = {};
        docInfo.title = document.title;
        docInfo.location = document.location.toString();
        docInfo.referrer = document.referrer;
        docInfo.compatMode = document.compatMode;
        docInfo.contentType = document.contentType;
        docInfo.characterSet = document.characterSet;
        docInfo.lastModified = document.lastModified;
        docInfo.principal = document.nodePrincipal;

        let documentURIObject = {};
        documentURIObject.spec = document.documentURIObject.spec;
        documentURIObject.originCharset = document.documentURIObject.originCharset;
        docInfo.documentURIObject = documentURIObject;

        return docInfo;
    },

    getFeedsInfo: function (document, strings) {
        let feeds = [];
        // Get the feeds from the page.
        let linkNodes = document.getElementsByTagName("link");
        let length = linkNodes.length;
        for (let i = 0; i < length; i++) {
            let link = linkNodes[i];
            if (!link.href) {
                continue;
            }
            let rel = link.rel && link.rel.toLowerCase();
            let rels = {};

            if (rel) {
                for (let relVal of rel.split(/\s+/)) {
                    rels[relVal] = true;
                }
            }

            if (rels.feed || (link.type && rels.alternate && !rels.stylesheet)) {
                let type = Feeds.isValidFeed(link, document.nodePrincipal, "feed" in rels);
                if (type) {
                    type = strings[type] || strings["application/rss+xml"];
                    feeds.push([link.title, type, link.href]);
                }
            }
        }
        return feeds;
    }
};
