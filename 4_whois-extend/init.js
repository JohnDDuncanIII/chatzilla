plugin.id = "whois-extend";

plugin.init =
function _init( glob ) {
	plugin.major = 1;
	plugin.minor = 1;
	plugin.version = plugin.major + "." + plugin.minor;
	plugin.description = "Extend Whois command with 'info all'. " +
			"By MakOke <gboxlan@gmail.com>";
	
	return "OK";
}

plugin.enable =
function _enable() {
	client.commandManager.addHook( "whois", whoisHook, "whoisHook", false );
	return true;
}

plugin.disable =
function _disable() {
	client.commandManager.removeHook( "whois", "whoisHook", false );
	return true;
}

function whoisHook( e ) {
	var NickType = ( e.server.parent.encodedName != 'arrakis' &&
					 e.server.parent.encodedName != 'hispano' )? 'NickServ': 'Nick';
	e.sourceObject.dispatch( 'msg ' + NickType + ' info ' + e.nickname + ' all' ); 
	e.sourceObject.dispatch( 'msg ' + NickType + ' list *!*@' + e.server.getUser( e.nickname ).host );
}
