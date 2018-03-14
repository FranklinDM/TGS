
# Changelog

### 1.0.6 (03.14.2018)
* Major: Revise invisible sidebar switch implementation
  * This...
    * uses a similar approach to what OmniSidebar does
    * no longer tied to auto hide/show
    * allows us to have visual feedback on the sidebar switch and style it if users would want to do so
    * doesn't have to listen much on mousemove events on the appcontent plus it's more accurate on the hover area
    * also allows the sidebar to open when dragging something above it even if the sidebar switch is invisible (previously, it would be a bit more tricky to implement)
  * Add an option to only activate when on fullscreen/maximized
* Minor: Uncombine show & hide delay for AutoHide
  * Your existing options will be migrated and used for both show & hide
* Minor: Implement second pane mode for bookmarks and history sidebars
  * One of the planned features for AiOS
* Minor: Allow opening the downloads in popup (default browser behavior)
  * See Issue #40
* Minor: Add option to whether show the sidebar when installing an add-on
  * I myself find this annoying and decided that there should be a switch for this behavior
* Minor: Fix up SSR feature of MultiPanel
  * This now works on most sites even when navigating
* Minor: Make add-ons page more compact and others
  * Search bar is now flexible only when on sidebar
  * Details view (when selecting an add-on) should use less space
* Minor: Change default page info hotkey to Ctrl+Shift+E
* Ignore: Hide tools button label (in Bookmarks/History)
* Ignore: Generate language list tab on options/about dynamically
  * Languages are no longer hardcoded in the about window and instead placed on the JS file
* Ignore: Refactoring/changes under the hood

### 1.0.5.1 (12.10.2017)
* Minor: Small behavior change for invisible sidebar switch trigger
  * See [issue #27](https://github.com/FranklinDM/TGS/issues/27#issuecomment-350508656).

### 1.0.5 (12.09.2017)
* Major: Resolve #31 - Add an option to not intercept panel calls from menu/shortcut
  * This option can be found at the General tab, under Behavior in the options window
  * How this works: Toolbar button -> opens the sidebar, Hotkeys & menu items -> opens the default action (in dialog)
* Major: Tag #27 - Improve Auto Hide functionality (partially)
  * Add an invisible sidebar switch trigger (simply hover over the left/right side of your screen and the sidebar will appear)
    * Automatically opening sidebar when dragging something over the switch will have no effect when this is enabled (at the moment, will be fixed later?)
  * Hide sidebar if mouse cursor is on.. option is now exposed (no longer in advanced)
    * Instead of radio options, it is now a drop-down menu
    * Add don't hide automatically option (means, sidebar will auto show but will not auto hide)
* Major: Most settings now apply instantly
  * Switching 'open in sidebar' options in panels no longer requires a browser restart
  * Default commands of controlled toolbar buttons are now stored in the targets array
  * Modifying switch width, sidebar+toolbar orientation, and auto hide (through options window) now applies in all windows
* Minor: Better fix for #15 that doesn't use mutation observers
  * Instead of using mutation observers which is quite a performance hit in some cases, override the downloads indicator's overlay with our own modified copy of the overlay which changes the respective commands that we need.
  * We 'might' need to update this when Pale Moon modifies its copy of the indicator overlay (a small trade-off though, but **remember: they are not FF who changes internal stuff too frequently which makes add-on development a BIG maintenance burden**)
  * This also fixes the inconsistent downloads tooltip (when the big info tips are used)
  * Remove dm.observer pref (now unused)
* Minor: Resolve #30 - Option to disable sidebar switch tooltip
  * Via hidden pref: aios.switchtip
* Minor: Few changes to MultiPanel
  * A throbber now appears when opened in window/tab
  * Dropping URLs onto the address bar now opens that URL instead of just inserting it
* Minor: Resolve #34 - Fix missing TGS toolbar after customize mode
  * The toolbar is force shown when entering customize mode
  * May fix missing toolbar problems others were experiencing in the past
* Minor: Resolve #21 - Stylesheet revamp
  * Unify Windows & Mac styles
    * Remove Mac colored brown/sepia-like toolbar images
  * Don't make generic toolbar image look transparent
  * Remove unused donate image
  * Toolbar image regions must be exact (18x18)
  * Improve appearance of inverted toolbar images
* Minor: Fix downloads sidebar on automatic close mechanism
  * Get the current state of the download first
  * Only close the download sidebar when a download is in the succeeded state
  * Before behavior was when something happens to any download item, it will trigger the close mechanism  
* Minor: Prevent non-numbers from being placed on input boxes in prefs window
  * Prevents some invalid values like putting letters in places where numbers are the only accepted values
  * Also adds a spin button beside the boxes
  * Prevent negative values (for miliseconds/pixels/percent)
* Minor: Resolve #28 - Expose options when dragging something above the sidebar switch
  * When options for delay is set to 0, this means that there is no delay
* Minor: Shading items in DL list should controllable by pref
  * Allows shading to happen even in non-default themes
* Minor: Properly show some strings on key config (and some others)
  * In the past (including AiOS 0.7.21.1), some parts of the UI will show the camel case name of the string instead of the actual string itself
  * Adds 'keyconf.properties' and reads the string from the string bundle instead
  * Now properly displays 'Browser restart required' when resetting keys
  * Removes used, onreset, and unrecognized from prefs.dtd and moves them to the newly created 'keyconf.properties'
  * Move arrays to _keycofig.js
* Minor: Some changes to cookies & places (bookmarks+history) panel layout
  * Instead of modifying search box label on focus/blur, simply set the placeholder
  * Remove "Search:" label from cookies panel
* Ignore: Restore separator between custom and default panels on SB menu  
* Ignore: Fix 'props' is undefined in keyconfig
* Ignore: Fix 'sideSrc' is null error
* Ignore: Fix 'aiosVersionDotless' is undefined
* Ignore: Exporting TGS prefs now shows TGS instead of AiOS

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