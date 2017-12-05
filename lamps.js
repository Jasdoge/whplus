
let gpio = require('pigpio');

let Lamps = {
	PINS : [0,1,2,3,4,5,6],
	PINS_PWM : [],					// Range between 100 and 0 of brightness boost (affects brightness range 0.1->1.0)
	flashing : 0,					// Nr lamp flashes left after an achievement (prevents default)
	flashingTimer : null,
	idleInterval : null,
	idleDelay : null
};


Lamps.toggleIdle = function(on){
	
	clearInterval(Lamps.idleInterval);
	if(!on){return;}
	
	Lamps.idleInterval = setInterval(function(){Lamps.ping(true);}, 500);
	
};

Lamps.ping = function(idle){
	
	if(!idle){
		
		Lamps.toggleIdle(false);
		clearTimeout(Lamps.idleDelay);
		Lamps.idleDelay = setTimeout(function(){Lamps.toggleIdle(true);}, 60000);
		
	}
	
	var rng = [], i, index, least_index = 0, least_val = 101;
	for(i=0; i<Lamps.PINS.length; ++i){
		
		var n = Lamps.PINS_PWM[i];
		if(n<least_val){
			least_val = n;
			least_index = i;
		}
		
		if(n === 0){
			rng.push(i);
		}
	}
	
	// If there are lamps with 0 brightness, pick one of those at random
	if(rng.length){
		index = rng[Math.floor(Math.random()*rng.length)];
	}
	// Otherwise use the darkest
	else{
		index = least_index;
	}
	
	Lamps.PINS_PWM[index] = 100;
	
};

Lamps.tick = function(){
	
	if(Lamps.flashing){
		return;
	}
	
	for(var i = 0; i<Lamps.PINS_PWM.length; ++i){
		var n = Lamps.PINS_PWM[i];
		if(n<=0){continue;}
		
		n-= 2.5;
		Lamps.PINS_PWM[i] = n;
		
		var pin = Lamps.PINS[i],
			perc = n/100,
			val = Math.floor((0.99*perc+0.01)*100)
		;

			multi = Math.cos(-Math.PI+Math.PI*perc)*0.5+0.5
		;
		console.log(multi);
		
		
		wpi.softPwmWrite(pin, val);
		
	}
	
	
};

Lamps.pingAll = function(){
	for(var i =0; i<Lamps.PINS.length; ++i){
		Lamps.PINS_PWM[i] = 100;
	}
	Lamps.flashing = 50;
	clearInterval(Lamps.flashingTimer);
	Lamps.flashingTimer = setInterval(Lamps.flash, 100);
	for(var i =0; i<Lamps.PINS.length; ++i){
		Lamps.PINS_PWM[i] = 100;
		wpi.softPwmWrite(Lamps.PINS[i], 100);
	}
	
};

Lamps.flash = function(){
	
	var n = 0;
	if(Lamps.flashing%2){
		n = 100;
	}
	for(var i =0; i<Lamps.PINS.length; ++i){
		wpi.softPwmWrite(Lamps.PINS[i], n);
	}
	
	if(--Lamps.flashing === 0){
		clearInterval(Lamps.flashingTimer);
	}
};

Lamps.ini = function(){
	
	var i;
		
	// GPIOs
	wpi.wiringPiSetup();
	
	for(i = 0; i<Lamps.PINS.length; ++i){
		Lamps.PINS_PWM.push(0);
		wpi.softPwmCreate(Lamps.PINS[i], 1, 100);
		
	}
	
	setInterval(Lamps.tick, 40);
	Lamps.toggleIdle(true);
	
};


module.exports = {
	ini:function(){},
	ping:function(){},
	pingAll:function(){}
};