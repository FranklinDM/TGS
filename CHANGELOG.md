
# Changelog

### 1.0.4 (10.01.2017)
* Minor: Fix #26 - Use lwtheme's background color in browser element
  * Use the lightweight theme's defined background color by default and set it as the background of the browser element: a workaround to the half cut background image.
  * There are some hidden preferences regarding this, check the hidden settings page of the wiki.
* Major: Fix #25 - Restore features of Downloads panel
  * Restores the following features:
  * Optimized downloads sidebar layout
  * Downloads count, search, and clear all downloads.css
  * Open downloads sidebar when downloading something (and close when finished)
  * There is no need to install a separate add-on to search or clear downloads list
* Minor: Improve dl-indicator command replacement logic (or whatever you call it)
* Minor: Fix #24 - update local copy of pageinfo.js
  * In previous versions, you will see (null) in some parts
* Minor: Fix broken changelog mechanism (you will now see a changelog on update)
* Minor: Sidebar panel should be hidden during print preview
  * CSS style for this wasn't properly put during the unminification
* Minor: Put downloads override under a pref
* Minor: Resolve #23 - Follow up to cookies panel implementation
  * Optimize cookie panel layout for the sidebar
  * Allow it to either open in sidebar/dialog
  * Add it to the options window
* Minor: Show version in about window
  * Was gone because it's searching for AiOS add-on id.
  * In previous versions, will instead show AiOS' version when installed alongside TGS
* Ignore: Clicking on MultiPanel urlbar selects all text
* Ignore: Fix JS errors in add-ons panel
  * Remove undefined debug variable

### 1.0.3 (09.23.2017)
* Minor: Fix #21 Missing tab bar close button when using TMP
  * Reverse a crude workaround applied in the past which hides .tab-closebutton in entirety instead of just hiding it when it appears inside the sidebar header, which causes the close button everywhere to be gone (ex. TMP).
* Ignore: Add-on's update options' orientation set to vertical
* Ignore: Set add-on homepage and other links to the wiki
* Major: Implement **mini-browser** like functions in Multi Panel
  * You can now navigate inside the sidebar, there's now a URL bar available, and ability to either open clicked links inside the sidebar or in current tab
  * Fixed context menu (back/forward/stop/reload buttons were broken in past versions)
  * However, inspect element is still broken. It is something that needs to be fixed browser-side.

### 1.0.2 (08.30.2017)
* Fix #16 - Set appInfo to main browser window
  * This fixes selectors getting applied to where they're not even supposed to.
* Fix #15 - When there's a new download, button opens a popup

### 1.0.1 (08.24.2017)
* Fix #12: Use theme's icons for bookmarks and history buttons
* Resolve #11: Change some links in about to point to our own
* Disable other locales for the meantime since they're a pain to maintain (and we don't use any loc. platform atm)
* Remove border from movable close button

### 1.0.0 (08.23.2017)
* Intial release
  * Compatibility with PM
  * Development was reset to 736206f383f5fe8e8d04bc1b561c196345429eb6 and some commits afterwards were cherrypicked to this repository.
  * Reverted commits that were related to FF's Australis UI and e10s stuff.
  * New cookie panel (planned feature)
  * Restore old toolbar customization UI
  * Remove SASS and grunt stuff and simply use plain CSS