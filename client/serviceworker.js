let version = "2016-12-17 00:55",
	files = [
	"/audio/achievement.ogg",
	"/audio/christmas_piano.ogg",
	"/audio/christmas_sprite.ogg",
	"/audio/christmas_guitar2.ogg",
	"/audio/christmas_organ.ogg",
	"/audio/christmas_synth2.ogg",
	"/audio/christmas_eguit.ogg",
	"/audio/christmas_dog.ogg",
	"/audio/christmas_panflute.ogg",
	"/audio/christmas_sax2.ogg",
	
	
	"/img/autoplay.png",
	"/img/decoration.png",
	"/img/group.png",
	"/img/mp3.png",
	"/img/note.png"
];
 
this.addEventListener('install', function(event){

	event.waitUntil(
		caches.open(version).then(function( cache ) {
			
			return cache.addAll(files);

		})
	);

});

this.addEventListener('fetch', function(event){
	
	event.respondWith(
		caches.match(event.request).then(function(response) {
			return response || fetch(event.request);
		})
	);

});

