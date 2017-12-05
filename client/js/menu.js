function Menu(){}

function Quest(id, name, description, notes, rewards, hidden){
	"use strict";
	this.id = id;
	this.name = name;
	this.description = description;
	this.notes = notes;
	this.rewards = rewards;
	this.hidden = hidden;
}
// 0 C, 1 C# etc
Quest.NOTEMAP =  ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function Reward(id, name, type, data){
	"use strict";
	this.id = id;
	this.name = name;
	this.type = type;
	this.data = data;
	
	
	this.getTypeName = function(){
		var names = [
			"Ljud",
			"Auto-spelning",
			"Dekoration",
			"MP3",
			"Träning"
		];
		return $.i18n._(names[this.type]);
	};
	
	this.getTypeIcon = function(){
		var names = [
			"note.png",
			"autoplay.png",
			"decoration.png",
			"mp3.png",
			"practice.png"
		];
		return names[this.type];
	};
	
}
Reward.TYPE_SOUND = 0;					// Data: (str)soundfile
Reward.TYPE_AUTOPLAY = 1;				// Data: {speed:(int)ms_time_between_notes=250, notes:(arr)notes}
										// Notes are in the format of "(str)note" where uppercase is the high octave
										// Notes can also be arrays to trigger multiple notes at the same time
Reward.TYPE_DECORATION = 2;				// Data: (str)decor_id
Reward.TYPE_DOWNLOAD = 3;				// Data: (str)mp3
Reward.TYPE_PRACTICE = 4;				// Data: (str)quest_id

(function(){
	"use strict";
	
	
	Menu.data = {
		unlocks : {										// Quest names
			"default" : 1,
			"jinglebells" : 0
		},
		// Reward IDs (x in reward_x is Reward.TYPE_* value)
		defaults : {
			reward_0 : "sound_default",						// Keyboard sound - Default bells
			reward_2 : "deco_default",					// 
		},
		highlight_menu : 1
	};
	
	Menu.getSoundID = function(){
		return Menu.data.defaults.reward_0;
	};
	
	Menu.open = false;
	Menu.playedNotes = [];
	Menu.popupTimer = null;
	
	Menu.REWARDS = [];
	Menu.QUESTS = [];
	
	
	
	// BEFORE sounds have loaded
	Menu.ini = function(){
		// REWARDS
		Menu.REWARDS = [
			// Sounds
			new Reward("sound_default", "Bells", Reward.TYPE_SOUND, "christmas_sprite.ogg"),
			new Reward("sound_piano", "Piano", Reward.TYPE_SOUND, "christmas_piano.ogg"),
			new Reward("sound_guitar", $.i18n._("Gitarr"), Reward.TYPE_SOUND, "christmas_guitar2.ogg"),
			new Reward("sound_synth", $.i18n._("Synt"), Reward.TYPE_SOUND, "christmas_synth2.ogg"),
			new Reward("sound_organ", $.i18n._("Orgel"), Reward.TYPE_SOUND, "christmas_organ.ogg"),
			new Reward("sound_eguit", $.i18n._("Elgitarr"), Reward.TYPE_SOUND, "christmas_eguit.ogg"),
			new Reward("sound_doge", $.i18n._("Voff"), Reward.TYPE_SOUND, "christmas_dog.ogg"),
			new Reward("sound_panflute", $.i18n._("Panflöjt"), Reward.TYPE_SOUND, "christmas_panflute.ogg"),
			new Reward("sound_sax", $.i18n._("Saxofon"), Reward.TYPE_SOUND, "christmas_sax2.ogg"),
			
			
			
			
			
			// Autoplay
			new Reward("auto_stop", "&#10060; "+$.i18n._("Avsluta"), Reward.TYPE_AUTOPLAY, {}),
			new Reward("auto_jinglebells", $.i18n._("Bjällerklang"), Reward.TYPE_AUTOPLAY, {speed:125, notes:[
				"d","","b","","a","","g","","d","","","","","","d","",
				"d","","b","","a","","g","","e","","","","","","e","",
				"e","","C","","b","","a","","D","","","","","","D","",
				"E","","D","","C","","a","","b","","","","","","d","",
				
				"d","","b","","a","","g","","d","","","","","","d","",
				"d","","b","","a","","g","","e","","","","","","e","",
				"e","","C","","b","","a","","D","","D","","D","","D","",
				"E","","D","","C","","a","","g","","","","D","","","",
				
				"b","","b","","b","","","","b","","b","","b","","","",
				"b","","D","","g","","","a","b","","","","","","","",
				"C","","C","","C","","","C","C","","b","","b","","b","b",
				"b","","a","","a","","b","","a","","","","D","","","",
				
				"b","","b","","b","","","","b","","b","","b","","","",
				"b","","D","","g","","","a","b","","","","","","","",
				"C","","C","","C","","","C","C","","b","","b","","b","b",
				"D","","D","","C","","a","","g","","","","","","","",
			]}),
			
			new Reward("auto_ode", "Ode to Joy", Reward.TYPE_AUTOPLAY, {speed:200, notes:[
				["E","C","g"],"","E","","F","","G","",["G","C","g"],"","F","","E","","D","",
				["C","g","e"],"","C","","D","","E","",["E","g","d"],"","","D","D","","","",
				["E","g","e"],"","E","","F","","G","",["G","C","e"],"","F","","E","","D","", 
				["C","g","d"],"","C","","D","","E","",["D","g","d"],"","","C","C","","","",
				
				["D","a","d"],"","D","F","E","","C","",["D","a","d"],"","D","F","E","","C","",
				["D","g","d"],"","D","F","E","","D","",["C","e","c"],"","D","","g","","","",
				["E","C","g"],"","E","","F","","G","",["G","C","g"],"","F","","E","","D","",
				["C","g","e"],"","C","","D","","E","",["D","g","d"],"","","C",["C","g","c"],"","","",
			]}),
			
			new Reward("auto_tannenbaum", "O Tannenbaum", Reward.TYPE_AUTOPLAY, {speed:200, notes:[
				"g","","",
				["C","g","c"],"","C","C","","","D","","", ["E","g","c"],"","E","E","","","","E","D",
				"","E",["F","f","d"],"","","b","","","D", "","",["C","g","c"],"","","","","g","","", 
				["C","g","c"],"","C","C","","","D","","", ["E","g","c"],"","E","E","","","","E","D",
				"","E",["F","f","d"],"","","b","","","D", "","",["C","g","c"],"","","","","G","G",
				
				"","E",["A","g","c"],"","","","G","G","", "F",["F","a","d"],"","","","F","F","","D",
				["G","g","c"],"","","","F","F","","E",["E","g","c"], "","","","", "g","","",
				
				["C","g","c"],"","C","C","","","D","","", ["E","g","c"],"","E","E","","","","E","D",
				"","E",["F","f","d"],"","","b","","","D", "","",["C","g","c"],
				
			]}),
			
			new Reward("auto_silentnight", $.i18n._("Stilla Natt"), Reward.TYPE_AUTOPLAY, {speed:250, notes:[
				["c","g"],"","","a","g","",["e","c"],"","","","","",
				["c","g"],"","","a","g","",["e","c"],"","","","","",
				["D","g"],"","","","D","",["b","g"],"","","","","",
				["C","e"],"","","","C","",["g","c"],"","","","","",
				["a","e"],"","","","a","",["C","e"],"","","b","a","",
				["g","c"],"","","a","g","",["e","c"],"","","","","",
				["a","e"],"","","","a","",["C","e"],"","","b","a","",
				["g","c"],"","","a","g","",["e","c"],"","","","","",
				
				["D","a"],"","","","D","",["F","a"],"","","D","b","",
				["C","g"],"","","","","",["E","c"],"","","","","",
				["C","c"],"","g","","e","",["g","c"],"","f","","d","",
				["g","c"]
			]}),
			
			
			
			
			// Decorations
			new Reward("deco_default", "&#10060; "+$.i18n._("Inga"), Reward.TYPE_DECORATION, ""),
			
			
			// Practice
			new Reward("practice_end", "&#10060; "+$.i18n._("Avsluta"), Reward.TYPE_PRACTICE, "default"),
			new Reward("practice_jinglebells", $.i18n._("Bjällerklang"), Reward.TYPE_PRACTICE, "jinglebells"),
			new Reward("practice_ode", "Ode to Joy", Reward.TYPE_PRACTICE, "ode"),
			new Reward("practice_greensleeves", "Greensleeves", Reward.TYPE_PRACTICE, "greensleeves"),
			new Reward("practice_tannenbaum", "Oh Tannenbaum", Reward.TYPE_PRACTICE, "tannenbaum"),
			new Reward("practice_rudolph", $.i18n._("Rudolf"), Reward.TYPE_PRACTICE, "rudolph"),
			new Reward("practice_silentnight", $.i18n._("Stilla Natt"), Reward.TYPE_PRACTICE, "silentnight"),
			
			
		];
		
	// QUESTS
		Menu.QUESTS = [
			new Quest("default", "", "Unlocked by default", [], ["sound_default"]), // , "deco_default"
			new Quest("jinglebells", "Jingle Bells", $.i18n._("Ditt första quest går ut på att Spela <em>Bjällerklang</em> på pianot. Börja från B på det nedre tangentbordet.</p><p>Tryck på <i>Träna Melodi</i> för att öva på quest-melodin!</p><p>När du avklarar quests låser du upp belöningar."), 
				["b","b","b","b","b","b","b","D","g","a","b"], 
				["sound_piano", "auto_jinglebells", "auto_stop", "practice_jinglebells", "practice_end"],
				false
			),
			
			new Quest("ode", "Ode to Joy", $.i18n._("Du har avklarat ditt första Quest! Nästa quest går ut på att spela Beethovens <em>Ode to Joy</em>. Börja på E, valfri rad.</p><p>Du har nu låst upp lite belöningar till höger. Auto-spelning spelar automatiskt en melodi. Ljud ändrar ljudet på pianot. Träning aktiverar tränings-läge för tidigare avklarade quests."), 
				["E","E","F","G","G","F","E","D","C","C","D","E","E","D","D"], 
				["sound_organ", "auto_ode", "practice_ode"],
				false
			),
			
			new Quest("tannenbaum", "O Tannenbaum", $.i18n._("Bra jobbat! Fortsätt med nästa quest: Spela <em>O Tannenbaum</em>. Börja på G, nedre raden."), 
				["g","C","C","C","D","E","E","E","E","D","E","F","b","D","C"],
				["sound_synth", "practice_tannenbaum", "auto_tannenbaum"],
				false
			),
			
			new Quest("rudolph", $.i18n._("Rudolf Med Röda Mulen"), $.i18n._("Spela <em>Rudolf Med Röda Mulen</em>, börja på F, valfri rad."), 
				[
					"f","g","f","d","a#","g","f","f","g","f","g","f","a#","a"
				],
				["sound_eguit", "practice_rudolph"],
				false
			),
			
			new Quest("silentnight", $.i18n._("Stilla Natt"), $.i18n._("Spela <em>Stilla Natt</em>. Börja på G, nedre raden."), 
				["g","a","g","e","g","a","g","e","D","D","b","C","C","g"],  
				["practice_silentnight", "auto_silentnight"],
				false
			),
			
			new Quest("greensleeves", "Greensleeves", $.i18n._("Spela <em>Greensleeves</em>. Börja på A, nedre raden."), 
				["a","C","D","E",["F","F#"],"E","D","b","g","a", "b","C","a","a","g#","a","b","g#","e"],  
				["practice_greensleeves", "sound_guitar", "sound_panflute"],
				false
			),
			
			
			
			// Hidden quests
			new Quest("doge", "Wow", $.i18n._("Spela <em>Doge adventure</em>. Börja på F (Nedre raden)."), 
				["f","f","f","a#","a#","a#","D#","D#","D#","D","D","C"],  
				["sound_doge"],
				true
			),
			new Quest("epicsax", "Epic Sax Guy", $.i18n._("Spela <em>Epic Sax Guy</em>. Börja på A (Nedre raden)."), 
				["A","F","A","A","G","A","A","F","A","A","G","A","A","F","C","A","G","F","E","D","E","F","D"],  
				["sound_sax"],
				true
			),
			
			
			
			
		];
	};
	
	
	// AFTER sounds have loaded
	Menu.load = function(){
		
		// Setup
		var data = JSON.parse(localStorage.getItem("bells_data")),
			i
		;
		

		if(data !== null){
			
			if(data.hasOwnProperty("defaults")){
				for(i in data.defaults){
					if(Menu.data.defaults.hasOwnProperty(i)){
						Menu.data.defaults[i] = data.defaults[i];
					}
				}
			}
			
			if(data.hasOwnProperty("unlocks")){
				
				for(i in data.unlocks){
					if(Menu.getQuest(i) !== false){
						Menu.data.unlocks[i] = +data.unlocks[i];
					}
				}
			}
			
			if(data.hasOwnProperty("highlight_menu")){
				Menu.data.highlight_menu = data.highlight_menu;
			}
			
		}
		
		Menu.refreshHighlight();
		
		
		// Build skeleton
		var html = '<div class="main">'+
					'<div class="quest"><h3>Quest</h3><div class="content"></div></div>'+
					'<div class="unlocks"><h3>Rewards</h3><div class="content"></div><br /><div class="button" id="wipe" style="font-size:2vw">'+$.i18n._('Börja Om')+'</div></div>'+
				'</div>'+
				'<div class="footer"><div class="button" id="closeMenu">'+$.i18n._('Stäng')+'</div></div>'
		;
		
		 
		$("#menu").html(html);
		
		$("#menuBottom")
			.toggleClass('hidden', false);
		$("#menuButton")
			.on('click', Menu.toggle);
			
		$("#closeMenu").on('click', function(){
			Menu.toggle();
		});
		
		$("#wipe").on('click', function(){
			if(confirm($.i18n._("Är du säker att du vill rensa all användardata?"))){
				localStorage.setItem("bells_data", "{}");
				location.reload();
			}
		});
			
		Menu.refresh();
		
	};
	
	Menu.save = function(){
		localStorage.setItem("bells_data", JSON.stringify(Menu.data));
	};
	
	Menu.getRewardDiv = function(reward, hideIfNotUnlocked){
		var classes = ["reward"];
		if(Menu.hasReward(reward.id)){
			classes.push("unlocked");
		}else if(hideIfNotUnlocked){
			classes.push("hidden");
		}
		
		if(Menu.data.defaults.hasOwnProperty("reward_"+reward.type) && Menu.data.defaults["reward_"+reward.type] === reward.id){
			classes.push("selected");
		}
		
		
		var html = '<div class="'+classes.join(' ')+'" data-id="'+reward.id+'">';
			html+= '<img src="img/'+reward.getTypeIcon()+'" /><strong>'+reward.name+'</strong> <em>('+reward.getTypeName()+')</em>';
			html+= '</div>';
		
		return html;
	};
	
	Menu.refresh = function(){
		
		// 
		
		// Quests
		var quest = Menu.getCurrentQuest(),
			i, reward, preCat;
			
		var html = $.i18n._('<p>Alla quests avklarade! Fler quests kan komma att läggas till senare, så kolla gärna tillbaks!</p>');
		if(quest !== false){
			html = '<p class="title"><strong>'+quest.name+'</strong></p>'+
				'<p>'+quest.description+'</p>'+
				'<p style="text-align:center">'+
					'<input type="button" value="'+$.i18n._('Träna Meolodi')+'" id="startPractice" />'+
					'<input type="button" value="'+$.i18n._('Avsluta Träning')+'" id="endPractice" class="hidden" />'+
				'</p>'+
				'<p class="title">'+$.i18n._('Belöningar')+':</p>';

			for(i =0; i<quest.rewards.length; ++i){
				reward = Menu.findReward(quest.rewards[i]);
				if(reward === false){continue;}
				html+= Menu.getRewardDiv(reward);
			}
		}
		$("#menu div.quest div.content").html(html);
		
		
		// Rewards
		html = '';
		preCat = -1;
		for(i = 0; i<Menu.REWARDS.length; ++i){
			reward = Menu.REWARDS[i];
			if(preCat !== reward.type){
				if(preCat != -1){html+= '<div class="divider"></div>';}
				preCat =reward.type;
			}
			
			html+= Menu.getRewardDiv(reward, true);
			
		}
		
		$("#menu div.unlocks div.content").html(html);
		
		// Bind things
		$("#menu div.reward.unlocked").on('click', function(){
			
			var reward = Menu.findReward($(this).attr('data-id'));
			if(reward === false){return;}
			 
			if(reward.type === Reward.TYPE_AUTOPLAY){
				Menu.toggle();
				Keyboard.autoPlay(reward.data);
			}
			else if(reward.type === Reward.TYPE_SOUND){
				Menu.data.defaults.reward_0 = reward.id;
				Menu.save();
				Menu.refresh();
			}
			else if(reward.type === Reward.TYPE_PRACTICE){
				var q = Menu.getQuest(reward.data);
				if(q){
					Keyboard.practice(q.notes);
					Menu.toggle();
				}
			}
			
		});
		
		$("#startPractice").on('click', function(){
			Keyboard.practice(quest.notes);
			$("#startPractice, #endPractice").toggleClass("hidden");
			Menu.toggle();
		});
		$("#endPractice").on('click', function(){
			$("#startPractice, #endPractice").toggleClass("hidden");
			Keyboard.practice([]);
			Menu.toggle();
		});
		
	};



// Rewards
	Menu.findReward = function(id){
		for(var i =0; i<Menu.REWARDS.length; ++i){
			if(Menu.REWARDS[i].id === id){
				return Menu.REWARDS[i];
			}
		}
		return false;
	};	
	

// Quests
	Menu.getCurrentQuest = function(){
		for(var i =0; i<Menu.QUESTS.length; ++i){
			var q = Menu.QUESTS[i];
			if(!Menu.hasQuestUnlock(q.id) && !q.hidden){
				return q;
			}
		}
		return false;
	};
	
	Menu.getQuest = function(id){
		for(var i =0; i<Menu.QUESTS.length; ++i){
			if(Menu.QUESTS[i].id === id){
				return Menu.QUESTS[i];
			}
		}
		return false;
	};
	
	Menu.getUncompletedHiddenQuests = function(){
		var out = [];
		for(var i =0; i<Menu.QUESTS.length; ++i){
			if(Menu.QUESTS[i].hidden && !Menu.hasQuestUnlock(Menu.QUESTS[i].id)){
				out.push(Menu.QUESTS[i]);
			}
		}
		return out;
	};

	// Checks if a note is in an array of mixed case notes (textual)
	Menu.noteIn = function(note, arr){
		if(arr.constructor !== Array){
			arr = [arr];
		}
		for(var i = 0; i<arr.length; ++i){
			if(arr[i].toUpperCase() === note.toUpperCase()){
				return true;
			}
		}
		return false;
	};
	
	// Compares played notes against quest req notes
	Menu.compareNotes = function(playedNotes, req){
		
		// Check length first
		if(playedNotes.length !== req.length){
			
			return false;
		}
		
		
		
		for(var x = 0; x<playedNotes.length; ++x){
			if(!Menu.noteIn(playedNotes[x], req[x])){
				return false;
			}
		}
		return true;
	};
	
	Menu.notePlayed = function(oct, note){
		var n = Quest.NOTEMAP[note],						// Note text played
			q = Menu.getCurrentQuest(),						// Active quest or FALSE
			req = [],										// Notes required for the quest being scanned
			nl = Menu.playedNotes.length,					// NR notes played in list
			check = Menu.getUncompletedHiddenQuests(),		// Quests to scan
			i
		;
		
		Menu.playedNotes.push(n);
		// Store the 100 most recent notes
		if(nl > 100){
			var toRemove = nl-100;
			Menu.playedNotes.splice(0, toRemove);
		}
		
		if(q){
			check.push(q);
		}
		
		
		// Go through the quests and see if any of them unlocked
		for(i=0; i<check.length; ++i){
			q = check[i];					// Quest object
			req = q.notes;					// Notes needed to be played (text notes)
			var scan = Menu.playedNotes.slice(-req.length);
			
			if(Menu.compareNotes(scan, req)){
				Menu.unlock(q.id);
			}
		}
		
	};



	Menu.hasQuestUnlock = function(id){
		if(!Menu.data.unlocks.hasOwnProperty(id)){
			return false;
		}
		return +Menu.data.unlocks[id];
	};
	
	Menu.hasReward = function(id){
		for(var i = 0; i<Menu.QUESTS.length; ++i){
			if(!Menu.hasQuestUnlock(Menu.QUESTS[i].id)){continue;}
			if(~Menu.QUESTS[i].rewards.indexOf(id)){
				return true;
			}
		}
		return false;
	};
	
	
	Menu.unlock = function(id){
		var quest = Menu.getQuest(id);
		if(quest === false){
			return false;
		}
		
		// Wipe practice mode
		Keyboard.practice([]);
		
		Menu.data.highlight_menu = 1;
		Menu.refreshHighlight();
		
		Menu.data.unlocks[id] = 1;
		Menu.refresh();
		
		Menu.setPopup("<h3>"+$.i18n._("Quest Avklarat")+": "+quest.name+"</h3><p>"+$.i18n._("Klicka på menyikonen längst ned på sidan för att se vad du låst upp!")+"</p>");
		Keyboard.achievement(id);
		Menu.save();
	};
	
	
	
	
	Menu.refreshHighlight = function(){
		$("#menuButton").toggleClass("highlight", Boolean(Menu.data.highlight_menu));
	};
	
	
	
	
// Loading/saving
	Menu.toggle = function(){
		Menu.open = !Menu.open;
		$("#menu").toggleClass('hidden', !Menu.open);
		Keyboard.toggle(!Menu.open);
		if(Menu.open && Menu.data.highlight_menu){
			Menu.data.highlight_menu = 0;
			Menu.save();
			Menu.refreshHighlight();
		}
	};
	
	
	
	Menu.setPopup = function(text, duration){
		duration = duration === undefined ? 5000 : 0;
		clearTimeout(Menu.popupTimer);
		$("#loading").html(text).toggleClass("hidden", false);
		
		if(duration){
			Menu.popupTimer = setTimeout(function(){
				$("#loading").toggleClass("hidden", true);
			}, 5000);
		}
		
		$("#loading").toggleClass("noanim", (duration<=0));
	};
	
	
	
	
})();

