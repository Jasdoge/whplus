// JavaScript Document
var DictLib = {};

(function(){
	"use strict";
	
	DictLib.DICTIONARIES = [];
	
	DictLib.search = function(name){
		for(var i =0; i<DictLib.DICTIONARIES.length; ++i){
			if(DictLib.DICTIONARIES[i].name === name){
				return DictLib.DICTIONARIES[i];
			}
		}
		return false;
	};
	
	DictLib.add = function(dictionary){
		DictLib.DICTIONARIES.push(dictionary);
	};
	
	DictLib.Dictionary = function(name, translations){
		this.name = name;
		this.translations = translations;
	};
	
	
	
	// Add
	var d = new DictLib.Dictionary("en_GB", {
		"Uppdaterad" : 'Updated',
		'Meny' : 'Menu',
		'Laddar...' : 'Loading...',
		"<h3>Träningsläge aktiverat.</h3><p>Pianot kommer nu guida dig igenom melodin.</p><p>Öppna inställningar och klicka på <em>Avsluta Träning</em> i vänstra delen eller <em>Avsluta (Auto-spelning)</em> till höger när du övat klart.</p>" : "<h3>Practice mode activated.</h3><p>The piano will now step you through the melody.</p><p>Open settings and click <em>End Training</em> in the left part or <em>End (Auto-play)</em> on the right once you are done practicing.</p>",
		'Gitarr' : 'Guitar',
		'Synt' : 'Synth',
		'Orgel' : 'Organ',
		'Elgitarr' : 'Electic Guitar',
		'Voff' : 'Bark',
		'Bjällerklang' : 'Jingle Bells',
		'Avsluta' : 'End',
		'Rudolf' : 'Rudolph',
		'Rudolf Med Röda Mulen' : 'Rudolph The Red-nosed Reindeer',
		"Ditt första quest går ut på att Spela <em>Bjällerklang</em> på pianot. Börja från B på det nedre tangentbordet.</p><p>Tryck på <i>Träna Melodi</i> för att öva på quest-melodin!</p><p>När du avklarar quests låser du upp belöningar." : "Your first quest is to play <em>Jingle Bells</em> on the piano. Begin with B on the lower keyboard.</p><p>Press <i>Practice Melody</i> to practice said melody!</p><p>Completing quests will unlock rewards.",
		"Du har avklarat ditt första Quest! Nästa quest går ut på att spela Beethovens <em>Ode to Joy</em>. Börja på E, valfri rad.</p><p>Du har nu låst upp lite belöningar till höger. Auto-spelning spelar automatiskt en melodi. Ljud ändrar ljudet på pianot. Träning aktiverar tränings-läge för tidigare avklarade quests." : "You have completed your first quest! Next quest is to play Beethoven's <em>Ode to Joy</em>. Begin with E, any row.</p><p>You have also unlocked a couple of rewards. Auto-play will automatically play a melody. Sound changes the piano sound. Training activates practice mode for previously completed quests.",
		"Bra jobbat! Fortsätt med nästa quest: Spela <em>O Tannenbaum</em>. Börja på G, nedre raden." : "Good job! Continue with the next quest: Play <em>O Tannenbaum</em>. Begin with G on the lower row.",
		"Spela <em>Rudolf Med Röda Mulen</em>, börja på F, valfri rad." : 'Play <em>Rudolph the Red Nosed Reindeer</em>, begin with F on any row.',
		"Spela <em>Greensleeves</em>. Börja på A, nedre raden." : 'Play <em>Greensleeves</em>. Begin with A on the lower row.',
		"Spela <em>Doge adventure</em>. Börja på F (Nedre raden)." : "Play <em>Doge adventure</em>. Begin with F (Lower row).",
		'Börja Om' : 'Wipe Progress',
		'Stäng' : 'Close',
		"Är du säker att du vill rensa all användardata?" : "Are you sure you want to wipe your saved progress?",
		'<p>Alla quests avklarade! Fler quests kan komma att läggas till senare, så kolla gärna tillbaks!</p>' : '<p>All quests completed! More quests might be added later, feel free to visit again later!</p>',
		'Träna Meolodi' : 'Practice Melody',
		'Avsluta Träning' : 'End Training',
		'Belöningar':'Rewards',
		'Quest Avklarat':'Quest Completed',
		'Klicka på menyikonen längst ned på sidan för att se vad du låst upp!':'Press the menu button at the bottom of the page to see what you\'ve unlocked!',
		
		
		"Ljud":"Sound",
		"Auto-spelning":"Auto Play",
		"Dekoration":"Decoration",
		"Träning":"Training",
		"Inga":"None",
			
		'Tangenter Spelade Sedan 3 Dagar':'Keys Hit in the Last 3 Days',
		'Alla tangenter spelade':'Total Keys Played',
		'Alla quests avklarade':'Total Quests Completed',
		"Spela <em>Stilla Natt</em>. Börja på G, nedre raden.":'Play <em>Silent Night</em>. Start with G on the lower row.',
		"Stilla Natt":"Silent Night",
		"Panflöjt":'Pan Flute',
		"Saxofon":"Saxophone",
		"Spela <em>Epic Sax Guy</em>. Börja på A (Nedre raden).":"Play <em>Epic Sax Guy</em>. Start with A on the lower row."
		/*
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		'':'',
		
		*/
	});
	DictLib.add(d);
	
	
	
	
})();

