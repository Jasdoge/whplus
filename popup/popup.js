export default class Popup{

    constructor(){

        this.user = {};

        // Fetch user data
        this.comSend("Get", [], data => {

            this.user = data.user;
            this.render();   // IT BEGINS

        });

    }


    // Com
    onComMessage(request, sender, sendResponse){

        var task = request.task.split('.');
        var args = request.args;
        if(args === undefined){args = [];}
        if(args.constructor !== Array){args = [args];}
        var track = WHP;
        while(task.length){
            var name = task.shift();
            if(!track.hasOwnProperty(name)){
                console.error("WH+ Error, task not found", name);
                return;
            }
            track = track[name];
        }
        track.apply(this, args);
    }

    // Background communication
    comSend(task, args, callback){
        chrome.runtime.sendMessage({"task": task, "args": args}, callback);  
    }

    comDebug(){console.log("Debug executed", arguments);}


    // Content
    render(){
        
        let th = this;
        let html = '';
        // Logged out
        if(!this.user.id)
            html = 'Ingen session hittades. Logga in på webhallen.com och klicka sedan på ikonen igen.';

        // Logged in
        else{

            let totalNotices = 0;
            for(let c of this.user.crateTypes){
                if(c.openableCount){
                    totalNotices += c.openableCount;
                    html+= '<div class="listing clickable supplydrop '+c.name+'">';
                        html+= '<img class="label" src="https://cdn.webhallen.com'+c.icon+'" />';
                        html+= '<div class="quant">'+c.openableCount+'</div>';
                        html+= 'Ny supply-drop finns att hämta!';
                    html+= '</div>';
                }
            }


            for(let f of this.user.feed){
                ++totalNotices;
                html+= '<div class="listing clickable feed" data-id='+f.id+' style="border-color:'+f.borderColor+';background-color:'+f.backgroundColor+';">';
                    html+= '<img src="https://cdn.webhallen.com/img/icons/feed/'+f.iconUrl+'" />';
                    html+= f.title;
                    html+= '<span class="remove" data-id="'+f.id+'">'+'×'+'</span>';
                html+= '</div>';
            }
            if(!totalNotices)
                html = '<div class="empty">Inga nya händelser!</div>';   
        }

        $("body").html(html);

        // Bind stuff
        $("div.listing.clickable").on('click', function(){

            let type = 'feed', id = +$(this).attr('data-id');
            if($(this).is(".supplydrop"))
                type = 'supplydrop';
            th.comSend('ItemClicked', [type, id]);
        });

        $("div.listing.clickable.feed span.remove").on('click', function(event){
            event.stopImmediatePropagation();

            // Let's remove it
            let id = $(this).parent().attr('data-id');
            th.comSend("RemoveFeed", [id], () => {
                $(this).parent().remove();
            });

            return false;
        });


    }

}

Popup.fuzzy_time = ms => {
	let seconds = Math.abs(Math.floor(ms/1000));
	let formats = [
		{t:"år", suf:'', n:3600*24*365},
		{t:"månad", suf:'er', n:3600*24*30},
		{t:"veck", suf:['a','or'], n:3600*24*7},
		{t:"dag", suf:'ar', n:3600*24},
		{t:"timm", suf:['e','ar'], n:3600},
		{t:"minut", suf:'er', n:60},
		{t:"sekund", suf:'er', n:0}
	];
	for(let i =0; i<formats.length; ++i){
		if(seconds >= formats[i].n){
			let d = Math.floor(seconds/formats[i].n),
				out = d+' '+formats[i].t;
			
			let suf = formats[i].suf;
			if(suf.constructor === Array)
				out+= suf[+(d>1)];
			else if(d>1)
				out+= suf;
			
			return out;
		}
	}
	return '';
};





window.W = new Popup();