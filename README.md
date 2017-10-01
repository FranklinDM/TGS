The Good 'ol Sidebar (TGS) - a sidebar extension for Pale Moon
===================================================================

This is the repository of the sidebar extension called The Good 'ol Sidebar, a fork of [All-in-One Sidebar](http://firefox.exxile.net/aios/index.php), an extension originally made for Mozilla Firefox, which is now discontinued.

You are cordially invited to contribute to the project. :-)

Build the extension
-------------------

To build an installable `.xpi` extension for Pale Moon:

### All operation systems

1. clone this repository
2. zip the contents of the repository (excluding `.git`, `.gitignore`, `build.sh`, `CHANGELOG.md`, and `README.md`) and rename the `.zip` extension to `.xpi`
3. open/install the resulting `.xpi` file with Pale Moon

### Mac OS X

1. clone this repository
2. execute `./build.sh` at the repository root
3. open/install the resulting `tgs_sidebar-dev-build-fx.xpi` file with Pale Moon

### Ubuntu Linux

I'm not an unix expert, but as far as I know the instructions for Mac OS X should also work on linux systems. Correct me if I'm wrong.

### Windows

You could build the extension via the Windows command prompt when you installed [Cygwin](http://cygwin.com). Otherwise just zip the contents of this repository as explained for all operation systems.


Links
-----

[Setting up an extension development environment](https://developer.mozilla.org/docs/Setting_up_extension_development_environment)


Issues
-------

Please use the [issues system of GitHub](https://github.com/FranklinDM/TES/issues?state=open) when contributing and reporting bugs, enhancements or to-do's.


License:
--------

Portions &copy; 2017+ FranklinDM

Portions &copy; 2005+ Ingo Wennemaring

> GNU General Public License, Version 2.0
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
