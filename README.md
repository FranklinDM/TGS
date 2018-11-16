The Good 'ol Sidebar (TGS) - a sidebar extension
===================================================================

This is the repository of the sidebar extension called [The Good 'ol Sidebar](https://addons.palemoon.org/addon/tgsidebar/), an extension for [Pale Moon](https://www.palemoon.org) and [Basilisk](https://basilisk-browser.org). It is also a fork of [All-in-One Sidebar](http://firefox.exxile.net/aios/index.php) which was an extension made for Mozilla Firefox, but is now discontinued.

More information about this extension could be found at the [wiki](https://github.com/FranklinDM/TGS/wiki).

You are cordially invited to contribute to the project. :-)

Build the extension
-------------------

To build an installable `.xpi` extension:

### All operating systems

1. Clone this repository
2. Zip the contents of the repository (excluding `.git`, `.gitignore`, `build.sh`, `CHANGELOG.md`, and `README.md`) and rename the `.zip` extension to `.xpi`
3. Open/install the resulting `.xpi` file with Pale Moon/Basilisk

### Mac OS X / Linux

1. Clone this repository
2. Execute `./build.sh` at the repository root
3. Open/install the resulting `tgs_sidebar-dev-build-pm.xpi` file with Pale Moon/Basilisk

### Windows

You could build the extension via the Windows command prompt if you have Cygwin installed. Otherwise, just zip the contents of this repository as explained for all operating systems.


Links
-----

[Setting up an extension development environment](https://developer.mozilla.org/docs/Setting_up_extension_development_environment)


Issues
-------

Please use the [issue tracker of GitHub](https://github.com/FranklinDM/TGS/issues?state=open) when contributing and reporting bugs, enhancements or to-do's.


License
--------

Portions &copy; 2017+ FranklinDM

Portions &copy; 2005+ Ingo Wennemaring

> GNU General Public License, Version 2.0
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
