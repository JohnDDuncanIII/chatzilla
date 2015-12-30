plugin.id = "lag-average";

plugin.init =
function _init( glob ) {
	this.major = 1;
	this.minor = 0;
	this.version = this.major + "." + this.minor + " ( 25 Feb 2010)";
	this.description = "Display all Lags and Average. " +
			"By MakOke <gboxlan@gmail.com>";

	this.cmds = [		
		["lags", cmdLags, CMD_CONSOLE | CMD_NO_HELP | CMD_NEED_NET] 
	];
			
	return "OK";
}

plugin.enable =
function _enable() {
	this.commands = client.commandManager.defineCommands( this.cmds );
	return true;
}

plugin.disable =
function _disable() {
	client.commandManager.removeCommands( this.commands );
	return true;
}

function cmdLags( e ) {
	var viewList = client.viewsArray; 
	var sumLag = 0; var countLag = 0;
	for( var i = 0; i < viewList.length; i++ ) { 
		var thisView = viewList[i].source; 
		if( thisView.TYPE == 'IRCNetwork' && thisView.lastServer.isConnected ) {
			thisView.lastServer.updateLagTimer();
			e.sourceObject.display( 'The lag in ' + thisView.encodedName + ' is ' + 
									String( thisView.lastServer.lag ) + ' seconds.' );
			sumLag += thisView.lastServer.lag;
			countLag++;
		}
	}
	if( countLag )
		e.sourceObject.display( 'The lag average is ' + 
								Math.round( ( sumLag / countLag ) * 1000 ) / 1000 + ' seconds.' );
}
