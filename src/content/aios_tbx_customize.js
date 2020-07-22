/**
 *  Redefine the width of the vertical toolbar whenever the toolbox changes (Drag 'n Drop)
 **/
var fx_toolboxChanged = toolboxChanged;
toolboxChanged = function () {
    fx_toolboxChanged();
    AiOS_HELPER.mostRecentWindow.aios_adjustToolboxWidth();
};
