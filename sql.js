/*
	db = database, default "pibells"
	user = username, default "pibells"
	pass = password, default "pibells"
	bindings = field mapper object, default { id:"id", year:"year", month:"month", day:"day", hour:"hour", "minute":minute, type:"type", hits:"hits" }
	table = table name, default pibells_log
	host = hostname, default localhost		
*/
function sql( settings ){

	if( typeof settings !== "object" )
		settings = {};

	let mysqlModule = require('mysql');
	this.db = settings.db || "pibells";
	this.user = settings.user || "pibells";
	this.password = settings.password || "pibells";
	this.table = settings.table || "pibells_log";
	this.host = settings.host || "localhost";
	this.bindings = { year:"year", month:"month", day:"day", hour:"hour", minute:"minute", type:"type", hits:"hits" };
	
	this.pool = mysqlModule.createPool({
		host : this.host,
		user : this.user,
		password: this.password,
		database: this.db,
	});

	if( typeof settings.bindings === "object" ){
		
		for( let i in settings.bindings ){

			if( this.bindings.hasOwnProperty(i) )
				this.bindings[i] = settings.bindings[i];
			else
				console.error("Invalid binding field: ", i);

		}

	}

	// Returns a promise resolving to the connection
	this.getConnection = function(){

		let th = this;
		return new Promise(function( res, rej ){

			th.pool.getConnection(function( err, connection ){

				if( err )
					return rej( err );
				
				res( connection );

			});

		});
	};

	// Attempts to created the table, returns a promise
	this.createTable = function(){

		let th = this;
		return new Promise(function( res, rej ){

			th.getConnection()
			.then(function(){

				th.query("CREATE TABLE IF NOT EXISTS `"+th.table+"` ( \
					`"+th.bindings.year+"` int(11) NOT NULL DEFAULT '0', \
					`"+th.bindings.month+"` int(11) NOT NULL DEFAULT '0', \
					`"+th.bindings.day+"` int(11) NOT NULL DEFAULT '0', \
					`"+th.bindings.hour+"` int(11) NOT NULL DEFAULT '0', \
					`"+th.bindings.minute+"` int(11) NOT NULL DEFAULT '0', \
					`"+th.bindings.type+"` varchar(16) COLLATE utf8_general_ci NOT NULL DEFAULT 'key', \
					`"+th.bindings.hits+"` int(11) NOT NULL DEFAULT '0', \
					PRIMARY KEY (`"+th.bindings.year+"`,`"+th.bindings.month+"`,`"+th.bindings.day+"`,`"+th.bindings.hour+"`,`"+th.bindings.minute+"`,`"+th.bindings.type+"`) \
				) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci")
				.then(function(){
		
					console.log("Table exists, SQL logging is now in use!");
					res();
		
				})
				.catch(rej);

			})
			.catch(rej);

		});
	};
	
	// Returns a promise
	this.query = function( query, params, connection ){

		params = params || [];
		let con = connection;

		if( !connection )
			con = this.getConnection();
		else
			con = Promise.resolve(con);
		
		return new Promise(function( res, rej ){

			con.then(function( cn ){

				// Now we have connection cn and can run a query
				cn.query( query, params, function( err, results ){

					if( err )
						return rej( err );

					res( results );

				});

				
				// If this function spawned the connection, close it
				if( !connection )
					cn.release();

			}).catch(rej);

		});
		


	};

	// returns a promise
	this.addRecord = function( type, nr ){

		return this.query('INSERT INTO '+this.table+' ('+
			'`'+this.bindings.year+'`, '+
			'`'+this.bindings.month+'`, '+
			'`'+this.bindings.day+'`, '+
			'`'+this.bindings.hour+'`, '+
			'`'+this.bindings.minute+'`, '+
			'`'+this.bindings.type+'`, '+
			'`'+this.bindings.hits+'`'+
		') VALUES (YEAR(NOW()),MONTH(NOW()),DAY(NOW()),HOUR(NOW()),MINUTE(NOW()),?,?) ON DUPLICATE KEY UPDATE `'+this.bindings.hits+'`=`'+this.bindings.hits+'`+?', [type, nr, nr]);

	};

	// Methods
	// Returns a promise resolving to an object with complete sums of log entries by type
	this.getSumByTypes = function(){

		let th = this;
		return new Promise(function(res, rej){

			th.query('SELECT `'+th.bindings.type+'`, SUM(`'+th.bindings.hits+'`) as nr FROM '+th.table+' GROUP BY `'+this.bindings.type+'`')
			.then(function( rows ){

				let out = {};
				for( let row of rows )
					out[row.type] = row.nr;

				res( out );

			})
			.catch(rej);

		});

	};

	this.getHourly = function(){

		let th = this;
		return new Promise(function( res, rej ){

			// Get an hourly log dating a week back
			let q = "SELECT TIMESTAMP(CONCAT(`"+th.bindings.year+"`,'-',`"+th.bindings.month+"`,'-',`"+th.bindings.day+"`,' ',`"+th.bindings.hour+"`,':00')) as time, SUM(`"+th.bindings.hits+"`) as hits FROM `"+th.table+"` WHERE "+
					"`"+th.bindings.type+"`='key' AND "+
					"UNIX_TIMESTAMP(CONCAT(`"+th.bindings.year+"`,'-',`"+th.bindings.month+"`,'-',`"+th.bindings.day+"`,' ',`"+th.bindings.hour+"`,':',`"+th.bindings.minute+"`)) > UNIX_TIMESTAMP()-(3600*24*3) "+ 
					"GROUP BY `"+th.bindings.year+"`,`"+th.bindings.month+"`,`"+th.bindings.day+"`,`"+th.bindings.hour+"` "+
					"ORDER BY `"+th.bindings.year+"` DESC,`"+th.bindings.month+"` DESC,`"+th.bindings.day+"` DESC,`"+th.bindings.hour+"` DESC"
			;
			
			// Get data about total quests completed
			th.query(q)
			.then(function( rows ){
				res(rows);
			})
			.catch(rej);

		});

	};


	return this;

}




module.exports = sql;
