function Keyboard(){}

(function(){
	"use strict";
	
	Keyboard.socket = null;
	Keyboard.container = null;
	Keyboard.initialized = false;
	Keyboard.sounds_loaded = 0;
	Keyboard.autoPlayInterval = null;
	Keyboard.autoPlayNotes = [];	// Text notation
	Keyboard.practiceNotes = [];	// Text notation
	Keyboard.autoPlayStep = 0;
	
	Keyboard.init = function(socket){

		if( Keyboard.initialized )
			return;
		
		Keyboard.initialized = true;
		
		var i, x; 
		
		Keyboard.socket = socket;
		
		Keyboard.container = $('#keyboardContainer');
		
		var html = '',
			spritedata = [],
			default_keys = [0, 2, 4, 5, 7, 9, 11],
			sharps = [1, 3, 6, 8, 10]
		;
		
		for( x=1; x>=0; --x ){
			
			html+= '<div class="keyset">';
				for(i=0; i<7; ++i){
					html+= '<div class="key" data-octave="'+x+'" data-id="'+default_keys[i]+'"><span>'+Quest.NOTEMAP[default_keys[i]]+'</span></div>';
				}
				html+= '<div class="sharps">';
				for(i=0; i<5; ++i){
					html+= '<div class="key sharp" data-octave="'+x+'" data-id="'+sharps[i]+'"><span>'+Quest.NOTEMAP[sharps[i]]+'</span></div>';
				}
				html+= '</div>';
			html+= '</div>';
			
		}
		Keyboard.container.append(html);
		
		$("#keyboardContainer div.key")
			.on('touchstart', function(){
				$(this).toggleClass("active", true);
			})
			.on('touchend', function(){
				$(this).toggleClass("active", false);
			}) 
			.on('mousedown touchstart', Keyboard.onKeyHit);
			
		
		
		// Generate the audio
		var sounds = [
			{src:"audio/achievement.ogg", "id":"achievement"}
		];
		
		
		for(x = 0; x<Menu.REWARDS.length; x++){
			
			var reward = Menu.REWARDS[x];
			if(reward.type !== Reward.TYPE_SOUND){continue;}
			
			spritedata = [];
			
			for(i=0; i<12*2; ++i){
				var oct = Math.floor(i/12),
					n = i-oct*12
				;
				spritedata.push({
					id:reward.id+"_oct:"+oct+"key:"+n,
					startTime:i*2000,
					duration:1900
				});
			}
			
			sounds.push({
				src:"audio/"+reward.data,//+"?", 
				data: {
					audioSprite:spritedata
				}
			});

		}
		
		
		
		createjs.Sound.on("fileload", function(data){
			if(++Keyboard.sounds_loaded === sounds.length){
				Keyboard.onload();
			}
		});
		
		
		createjs.Sound.registerSounds(sounds);
		
	};
	
	Keyboard.toggle = function(on){
		Keyboard.container.toggleClass('hidden', !on);
	};
	
	Keyboard.onload = function(){
		$("#loading").toggleClass('hidden clickable', true).on('click', function(){
			$(this).toggleClass("hidden", true);
		});
		Keyboard.container.toggleClass('hidden', false);
		Menu.load();
	};

	// Event can also be an array of note objects {oct:(int)oct, key:(int)key}
	Keyboard.onKeyHit = function(event){
		var notes = [];	// Contains objects
		if(event.constructor !== Array){
			event.stopPropagation();
    		event.preventDefault();
			var oct = +$(this).attr('data-octave'),
				key = +$(this).attr('data-id');
			notes.push({
				oct:oct,
				key:key
			});
			
			// Quest practice mode
			if(Keyboard.practiceNotes.length){
				
				if($(this).hasClass("practice")){
					Keyboard.advancePractice();
				}
				
			}
			else{
				// Advances quest
				Menu.notePlayed(oct, key);
			}
		}
		else{
			notes = event;
		}		
				
		var i;
		for(i =0; i<notes.length; ++i){
			var n = notes[i];
			
			createjs.Sound.play(Menu.getSoundID()+"_oct:"+n.oct+"key:"+n.key, {volume:0.5});
		}
		
		
		Keyboard.socket.emit("note", notes);
		
	};
	
	
	
	// Takes a text notation such as E and converts it into {oct:(int)octave, key:(int)key}
	Keyboard.textNotationToNumbers = function(tx){
		return {
			oct:+(tx.toUpperCase() === tx),
			key:Quest.NOTEMAP.indexOf(tx.toUpperCase())
		};
	};

	Keyboard.achievement = function(data){
		createjs.Sound.play("achievement", {volume:0.5});
		Keyboard.socket.emit("achievement", data);
	};

	
	Keyboard.advanceAutoPlay = function(){
		
		$("div.key", Keyboard.container).toggleClass("active", false);
		
		if(!Keyboard.autoPlayNotes.length){
			clearInterval(Keyboard.autoPlayInterval);
			return;
		}
		
		var notes = Keyboard.autoPlayNotes.shift(),
			out = [];
		
		// Null note
		if(notes === ""){return;}
			
		if(notes.constructor !== Array){
			notes = [notes];
		}
		
		// Convert to numeric format
		for(var i = 0; i<notes.length; ++i){
			var n = notes[i],
				obj = Keyboard.textNotationToNumbers(n),
				oct = obj.oct,
				note = obj.key
			;
			out.push(obj);
			$("div.key[data-octave="+oct+"][data-id="+note+"]", Keyboard.container).toggleClass("active", true);
		}
		
		Keyboard.onKeyHit(out);
		
	};

	Keyboard.autoPlay = function(data){
		
		
		clearInterval(Keyboard.autoPlayInterval);
		if(!data || !data.hasOwnProperty("notes")){return;}
		
		$("div.key", Keyboard.container).toggleClass("active", false);
		
		Keyboard.autoPlayNotes = data.notes.slice();
		var speed = data.hasOwnProperty("speed") ? data.speed : 250;
		
		
		Keyboard.autoPlayInterval = setInterval(Keyboard.advanceAutoPlay, speed);
		
		
	};
	
	Keyboard.advancePractice = function(){
		$("div.key", Keyboard.container).toggleClass("practice start", false);
		if(!Keyboard.practiceNotes.length){return;}
		
		var steps = Keyboard.practiceNotes[Keyboard.autoPlayStep];
		if(steps.constructor !== Array){
			steps = [steps];
		}
		
		for(var i =0; i<steps.length; ++i){
			var val = Keyboard.textNotationToNumbers(steps[i]);
			
			var c = "practice";
			if(Keyboard.autoPlayStep === 0){c += " start";}
			$("div.key[data-octave="+val.oct+"][data-id="+val.key+"]", Keyboard.container).toggleClass(c, true);
			
			
		}
		
		if(++Keyboard.autoPlayStep >= Keyboard.practiceNotes.length){
			Keyboard.autoPlayStep = 0;
		}
	};
	
	Keyboard.practice = function(notes){
		
		if(notes.length){
			Menu.setPopup($.i18n._("<h3>Träningsläge aktiverat.</h3><p>Pianot kommer nu guida dig igenom melodin.</p><p>Öppna inställningar och klicka på <em>Avsluta Träning</em> i vänstra delen eller <em>Avsluta (Auto-spelning)</em> till höger när du övat klart.</p>"), 0);
		}
		Keyboard.practiceNotes = notes.slice();
		Keyboard.autoPlayStep = 0;
		Keyboard.advancePractice();
	};

	
})();

