// JavaScript Document
let Stats = {};
(function(){
	"use strict";
	
	Stats.keysHitTotal = 0;				// Keys hit in total
	Stats.hourly = [];					// Histogram of keys hit in the last 7 days, hourly
	Stats.questsCompletedTotal = 0;		// Total quests completed
	Stats.loaded = false;
	Stats.googleLoaded = false;
	Stats.socket = null;

	// Fetches stats
	Stats.ini = function( socket ){
		
		// Already initialized
		if(Stats.loaded)
			return;

		Stats.loaded = true;
		
		Stats.socket = socket;
		Stats.refresh();
		
		let html = '<div class="content">';
			
				html+= '<h3 style="color:#000">'+$.i18n._('Tangenter Spelade Sedan 3 Dagar')+'</h2><div id="fullHistogram" ></div>';
				html+= '<div class="statrow">'+$.i18n._('Alla tangenter spelade')+': <strong id="totalKeysPlayed">?</strong></div>';
				html+= '<div class="statrow">'+$.i18n._('Alla quests avklarade')+': <strong id="totalQuestsCompleted">?</strong></div>';

			html+= '</div>';
			html+= '<input class="close" type="button" value="'+$.i18n._('Stäng')+'" />';
		
		$("#stats").html(html);
		
		$("#stats input.close").on('click', function(){
			Stats.toggle(false);
		});
		
		$("#minichart").on('click', function(){
			Stats.toggle();
		});
		
		// Load the bar graph
		google.charts.load("current", {packages:["corechart", 'bar']});
		google.charts.setOnLoadCallback(function(){

			// Graph loaded, we can now draw the stats and start refreshing
			setInterval(Stats.refresh, 10000);
			Stats.googleLoaded = true;
			Stats.draw();

		});
		
	};

	Stats.refresh = function(){
		
		Stats.socket.emit('stats', '', function(response){
			
			Stats.keysHitTotal = +response.keysHitTotal+response.notes;
			Stats.hourly = response.hourly;
			Stats.questsCompletedTotal = response.questsCompletedTotal+response.quests;
			Stats.draw();
			
		});
		
	};

	Stats.getHourlyHits = function( unixms ){

		for( let time of Stats.hourly ){

			let t = new Date(time.time),
				hits = time.hits
			;
			if( t.getTime() === unixms )
				return hits;

		}

		return 0;

	};
	
	Stats.draw = function(){
		
		if(!Stats.googleLoaded)
			return;
		
		$("#totalKeysPlayed").html(Stats.keysHitTotal);
		$("#totalQuestsCompleted").html(Stats.questsCompletedTotal);
		
		
		// BIG CHART
		// Get the start time
		let total_days = 3;

		let past = new Date();
			past.setHours(past.getHours()-24*total_days);
			past.setMinutes(0);
			past.setSeconds(0,0);
		
		let entries = [];

		// Go from start to now and add those that don't exist
		for( let i =0; i<total_days*24; ++i){
			
			past.setHours(past.getHours()+1);
			let gtime = past.getTime();
			entries.push([new Date(gtime), Stats.getHourlyHits(gtime)]);

		}
		
		let data = new google.visualization.DataTable();
		data.addColumn('datetime', 'Time');
		data.addColumn('number', 'Keys');
		data.addRows(entries.slice());
		
		
		let options = {
			hAxis: {
				gridlines:{color:"none"},
				textPosition:"none"
			},
			vAxis: {
				gridlines:{color:"none"},
				textPosition:"none",
				baselineColor:"none"
			},
			backgroundColor:"none",
			legend:{
				position:"none"
			},
			colors:["#FFF"],
			'chartArea': {'width': '100%', 'height': '99%'},
			bar:{
				groupWidth:"100%"
			}
		};
			
		let chart = new google.visualization.ColumnChart(document.getElementById("fullHistogram"));
		chart.draw(data, options);
		
		
		
		
		// MINI chart
		// Draw the mini one with 24h precision
		entries = entries.slice(24*total_days-24);
		data = new google.visualization.DataTable();
		data.addColumn('datetime', 'Time');
		data.addColumn('number', 'Keys');
		data.addRows(entries.slice());
		
		// Options can be reused
		chart = new google.visualization.ColumnChart(document.getElementById("minichart"));
		chart.draw(data, options);
		
	};
	
	Stats.toggle = function(on){
		
		if(on === undefined)
			$("#stats").toggleClass("hidden");
		
		else
			$("#stats").toggleClass("hidden", !on);
		
	}
	
	
})();
