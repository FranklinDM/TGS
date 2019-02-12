#!/bin/bash

XPI_FILE=tgs_sidebar-dev-build

echo "- Removing old xpi file"
rm $XPI_FILE.xpi

echo "- Deleting .DS_Store files"
find . -name \.DS_Store -exec rm -v {} \;

echo "- Creating xpi file"
zip -r $XPI_FILE.xpi chrome.manifest locales.manifest icon.png install.rdf license.txt content defaults locale skin
