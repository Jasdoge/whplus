
/*
	Options:
		nohost : Do not host the website. Allows you to host the website for the HTML5 app elsewhere. Default false
		nosocket : Do not accept socket connections. Allows you to host only the website on this device if you wish. Default false
		nogpio : Do not use the santa module's gpio

		port : webserver port

		express : express server, otherwise a new express server will be spawned
		app : express app
		server : express server
		io : express io
		
	functions that can be overwritten:
		onLog( int octave, int key ) - Raised when a key is played
		onQuestCompleted() - Raised when a quest is completed

*/
// Santa is the main controller
const Santa = function( gpioPins, options, sqlOptions ){

	let th = this;
	this.express = require('express');
	this.app = this.express();
	this.server = require('http').createServer(this.app);
	this.io = require('socket.io')(this.server);
	this.sql = require('./sql.js')(sqlOptions);
	this.elves = [];

	// Adds a self-elf to simplify the GPIO pin randomizer
	if( !options.nogpio )
		this.elves.push( new Elf( gpioPins, false, this ) );

	

	// Setup DB
	this.sql.createTable().then(function(){

		console.log("Logging & Settings enabled");
		th.pushLog(true);
		setInterval(function(){
			th.pushLog();
		}, 10000); // Log every 10 sec
		th.init(options);
		
	})
	.catch(function( err ){
		
		console.error("Unable to initialize", err);

	});


	
	// Log data, requires enableSqlLogging
	this.log = {
		quests : 0,						// Quests completed since last log push
		notes : 0,						// Notes played since last log push
		keysHitTotal : 0,				// Total keys hit all time
		questsCompletedTotal : 0,		// Total quests completed all time
		hourly : [],					// Notes hit on an hourly basis. Requires MYSQL connection
	};

	// Initialize
	this.init = function( options ){
		
		if( typeof options !== "object" )
			options = {};
		if( options.hasOwnProperty("express") )
			this.express = options.express;
		if( options.hasOwnProperty("app") )
			this.app = options.app;
		if( options.hasOwnProperty("server") )
			this.server = options.server;
		if( options.hasOwnProperty("io") )
			this.io = options.io;

		if( !options.nosocket ){

			let io = this.io;
			// IO connected
			io.on('connection', function( socket ){

				// Debug output
				socket.on('debug', function( msg ){ console.log("Socket debug", msg); });
				
				// Data is an array of note objects with {oct:(int)octave, key:(int)key}
				socket.on('note', function( data ){

					for( let i=0; i<data.length; ++i )
						th.flashSingle();
					
					++th.log.notes;
					th.onNotePlayed( +data.octave, +data.key );

				});
				
				// Data is the string ID of the achievement unlocked
				socket.on('achievement', function( data ){

					th.flashAll();
					th.onQuestCompleted();
					++th.log.quests;

				});
				
				// Update the active user count
				socket.on('disconnect', function(){

					io.sockets.emit('users_count', io.engine.clientsCount);

				});
				
				// returns statistics
				socket.on('stats', function( name, response ){
					
					response(th.log);

				});
				
				
				io.sockets.emit('users_count', io.engine.clientsCount);
				
			});

		}

		if( !options.nohost ){

			let port = options.port;
			if( !port )
				port = 8080;

			this.app.use(this.express.static( __dirname+"/client"));
			this.server.listen(port, function(){
				
				console.log("Server online on port "+port+"!");
				// Log.send();

			});

		}

	};

	// Updates the log
	this.pushLog = function( force ){

		let q = this.log.quests,			// quests completed since last push
			n = this.log.notes				// num notes pressed since last push
		;
		
		this.log.quests = 0;
		this.log.notes = 0;
		
		let queries = [];

		// Notes have been pressed
		if(n)
			queries.push(this.sql.addRecord("key", n));

		// Quests have been completed
		if(q)
			queries.push(this.sql.addRecord("quest", q));

		// Nothing has changed, do not refresh
		if( !queries.length && !force )
			return;
		
		// Refresh data
		Promise.all(queries)
		.then(function(){

			// Get total hits
			th.sql.getSumByTypes()
			.then(function( data ){

				th.log.keysHitTotal = data.key;
				th.log.questsCompletedTotal = data.quest;


			})
			.catch(function(err){
				console.error("Unable to fetch totals", err);
			});

			th.sql.getHourly()
			.then(function( data ){

				th.log.hourly = data;

			})
			.catch(function(err){
				console.error("Unable to fetch history", err);
			});


		})
		.catch(function( err ){
			console.error("SQL errors: ", err);
		});
		

	};



	// Lamp functionality
	this.flashAll = function(){

		let lamps = this.getLamps();
		for( let lamp of lamps )
			lamp.twinkle();

	};

	this.flashSingle = function(){

		let lamps = this.getLamps();
		lamps.sort(function( a, b ){
			
			let now = Date.now();
			if( 
				a.lastTrigger === b.lastTrigger || 
				( now > a.lastTrigger+2000 && now > b.lastTrigger+2000 )
			)return Math.round(Math.random())*2-1;

			return a.lastTrigger < b.lastTrigger ? -1 : 1;

		});

		let rand = lamps[0];
		
		rand.flash();

	};

	// Returns Lamp objects of all elves
	this.getLamps = function(){

		let out = [];
		for( let elf of this.elves )
			out = out.concat(elf.lamps);
		return out;

	};



	// Events
	this.onNotePlayed = function( octave, key ){};
	this.onQuestCompleted = function(){};

	return this;

};



// Elf is used to trigger the lamps
// Santa is added automatically when this is created through santa
const Elf = function( pins, ip, santa ){

	this.santa = santa;
	this.ip = ip;
	this.lamps = [];

	// Used only when ip is falsy (this should control lamps)
	this.Gpio = null;
	
	// This elf was run locally, so we'll need pigpio
	if( !this.ip ){
		
		this.Gpio = require("pigpio").Gpio;
		
		// This elf has no santa, so we'll scan the network
		if( !santa ){

			console.log("Scanner for santa in network");
			console.log("TODO: Scan for santa");

		}

	}

	// Setup the pins
	if( Array.isArray(pins) ){
		
		this.lamps = [];
		for( let pin of pins )
			this.lamps.push( new Lamp( this, pin ) );

	}
	
};

// Helper class
/*
	Elf is the parent object, or undefined if this is a dedicated elf
	Pin is the int nr of the gpio to use, can also be an object with { pin:(int)pin, min:(float)min_pwm, max:(float)max_pwm }

*/
const Lamp = function( elf, pin ){
	
	let th = this;
	
	const FADE_MS = 1000;
	const FADE_FPS = 60;
	const TWINKLE_SPEED = 250; // Time to make a full flash
	
	this.elf = elf;
	this.pin = pin;
	
	// For host
	this.lastTrigger = 0;

	// For localhost
	this.controller = null;
	this.fadeTimer = null;
	this.twinkling = false;
	this.twinkleStep = 0;
	this.twinkleInterval = null;
	this.min = 0.05;
	this.max = 1;
	this.intensity = this.min;

	if( typeof pin === "object" ){

		this.pin = 0;
		if( pin.hasOwnProperty('pin') )
			this.pin = +pin.pin;
		if( pin.hasOwnProperty('min') )
			this.min = Math.max(+pin.min, 0);
		if( pin.hasOwnProperty('max') )
			this.max = Math.min(+pin.max, 1);

		this.intensity = this.min;

	}

	this.twinkle = function(){

		th.twinkling = true;
		th.twinkleStep = 0;
		clearTimeout(this.twinkleInterval);
		clearTimeout(this.fadeTimer);

		this.twinkleInterval = setInterval(function(){
			
			th.twinkleStep += Math.PI*2/(FADE_FPS*TWINKLE_SPEED/1000);
			th.intensity = ((Math.sin(th.twinkleStep)+1)/2)*0.75+0.25;
			th.write();

		}, 1000/FADE_FPS);

		this.fadeTimer = setTimeout(function(){
			
			clearTimeout(th.twinkleInterval);
			th.twinkling = false;
			th.startFade();

		}, 3000);


	};

	this.flash = function(){

		if( this.twinkling )
			return;

		this.lastTrigger = Date.now();
		// Localhost
		if( !this.elf.ip ){
			
			clearTimeout(this.fadeTimer);
			clearInterval(this.fadeTimer);

			this.intensity = this.max;
			this.fadeTimer = setTimeout(function(){
				th.startFade();
			}, 500);

			this.write();

		}


		// Send UDP request to elf slave
		else{

			console.log("Send UDP request to elf");

		}

	};

	this.startFade = function(){

		this.fadeTimer = setInterval(function(){
			th.fade();
		}, 1000/FADE_FPS);

	};

	this.write = function(){
		this.controller.pwmWrite(Math.round(this.intensity*255));
	};

	this.fade = function(){


		this.intensity -= (this.max-this.min)/(FADE_FPS*FADE_MS/1000);
		if( this.intensity <= this.min ){
			
			this.intensity = this.min;
			clearTimeout(this.fadeTimer);

		}

		this.write();

	};


	// Ini
	if( this.elf ){

		this.controller = new this.elf.Gpio( Math.round(this.pin), { mode:this.elf.Gpio.OUTPUT });
		this.write();

	}

};



module.exports = {
	Santa : Santa,
	Elf : Elf	
};


