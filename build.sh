#!/bin/bash

XPI_FILE=tgs_sidebar-dev-build-pm

echo "- Removing old xpi file"
rm $XPI_FILE.xpi

echo "- Deleting .DS_Store files"
find . -name \.DS_Store -exec rm -v {} \;

echo "- Creating xpi file"
zip -r $XPI_FILE.xpi chrome.manifest icon.png install.rdf license.txt content defaults locale skin/css skin/icons skin/img
