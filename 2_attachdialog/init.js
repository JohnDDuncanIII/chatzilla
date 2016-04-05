
////
// Attach Dialog for ChatZilla 0.2
// Rob Marshall [tH], chatzilla.rdmsoft.com
// License: http://rdmsoft.com/r/stuff/wtfpl
////

plugin.id = "attachdialog";

plugin.init =
function ad_init()
{
    plugin.version = "0.2";
    plugin.description = "Adds a dialog to connect to a server."
    plugin.cmdary = [["cmd-attach", ad_cmd, 0, ""]];
    plugin.menucmd = ["cmd-attach", {label: "Attach to server..."}];
    plugin.menusep = ["-"];
    plugin.mainmenu = client.menuManager.menuSpecs["mainmenu:chatzilla"].items;
}

plugin.disable =
function ad_disable()
{

try {

    client.commandManager.removeCommands(plugin.cmdary);
    for(var i = 0; i < plugin.mainmenu.length; ++i)
        if((plugin.mainmenu[i] == plugin.menusep) ||
           (plugin.mainmenu[i] == plugin.menucmd))
            plugin.mainmenu.splice(i--, 1);
    client.updateMenus();

} catch (e) {}

    return true;
}

plugin.enable =
function ad_enable()
{
    client.commandManager.defineCommands(plugin.cmdary);
    plugin.mainmenu.unshift(plugin.menusep);
    plugin.mainmenu.unshift(plugin.menucmd);
    client.updateMenus();
    return true;
}

function ad_cmd(e)
{
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"] 
                   .getService(Components.interfaces.nsIWindowMediator);
    /*var wm = getService("@mozilla.org/appshell/window-mediator;1",
                        "nsIWindowMediator");*/
    var exwin = wm.getMostRecentWindow("irc:attach");
    if(exwin)
    {
        exwin.focus();
        return;
    }

    var url = plugin.cwd + "attach.xul";
    var dialog = window.openDialog(url, "", "dependent");
    dialog.addEventListener("load", ad_dialog_load, false);
}

function ad_dialog_load(e)
{
    var attach = e.target.getElementById("attach");
    attach.addEventListener("command", ad_dialog_attach, false);
    var cancel = e.target.getElementById("cancel");
    cancel.addEventListener("command", ad_dialog_cancel, false);

    e.target.addEventListener("keypress", ad_dialog_keypress, false);

    e.target.getElementById("host").select();
}

function ad_dialog_attach(e)
{
    var doc = e.target.ownerDocument;
    var host = doc.getElementById("host").value;
    var port = doc.getElementById("port").value;
    var chans = doc.getElementById("chan").value.split(/[,\s]+/);
    var url;

    for(var i = 0; i < chans.length; ++i)
    {
        url = "irc://" + host + ((port && port != "6667") ? ":" + port : "") +
              "/" + chans[i] + ",isserver";
        client.dispatch("attach", {ircUrl: url});
    }

    doc.defaultView.close();
}

function ad_dialog_cancel(e)
{
    e.target.ownerDocument.defaultView.close();
}

function ad_dialog_keypress(e)
{
    if(e.keyCode == 27)
        ad_dialog_cancel(e);
    else if(e.keyCode == 13)
        ad_dialog_attach(e);
}

// 0.1: First version
// 0.2: Multiple channels



