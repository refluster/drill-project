var App = function() {
	this.express = require('express');
	this.http = require('http');
	this.path = require('path');
	
	this.app = this.express();
	this.server;
};

App.prototype.stop = function() {
	// terminate background processes
	//   T.B.D.

    // close http server
    this.server.close();
}

App.prototype.start = function() {
	// server settings
	this.app.set('port', process.env.PORT || 3000);
	this.app.set('view engine', 'ejs');
	this.app.use(this.express.static(this.path.join(__dirname, 'public')));

	// start server
	this.server = this.http.createServer(this.app);
	this.server.listen(this.app.get('port'), function() {
		console.log('Express server listening on port ' + this.app.get('port'));
	}.bind(this));

	// driver
	this.driver = require('./lib/drv');
	this.driver.start();

	// socket io
	this.socket = require('./lib/socket');
	this.socket.init(this.driver, this.server);
}

app = new App();
app.start();
