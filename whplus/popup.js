/*

    TODO:
        - Automatisk leverans-status från posten (bygg när paketet skickas)
        - Supply drop auto click (bygg nästa torsdag)

*/
var WHP = {};
(function(){
    "use strict";

    WHP.ini = function(){

        // Fetch user data
        WHP.com.send("get", [true], function(data){

            WHP.data = data.data;
            WHP.meta = data.meta;
            WHP.content.build();

            // If we are logged in, make sure we set all meta as seen
            if(WHP.data.user){
                WHP.com.send("meta.seen", []);
            }
            
        });

    };


    // Com
        // Background communication
        WHP.com = {};
        WHP.com.send = function(task, args, callback){
            chrome.runtime.sendMessage({"task": task, "args": args}, callback);  
        };
        WHP.com.onMessage = function(request, sender, sendResponse){

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
        };

        WHP.com.debug = function(){console.log("Debug executed", arguments);};


    // Loading
        WHP.data = {
            user: '',
            supplydrop : false,
            orders : []
        };

        WHP.meta = {
            user : '',
            supplydrop : false,
            orders : []
        };
        

    // Content
        WHP.content = {};
        WHP.content.build = function(){
            
            var html = '';



            // Logged out
            if(WHP.meta.user === ''){

                html = 'Ingen session hittades. Logga in på webhallen.com och klicka sedan på ikonen igen.';

            }

            // Logged in
            else{

                // Add the supply dorp
                if(WHP.meta.supplydrop){
                    html+= '<div class="listing clickable supplydrop">';
                        html+= '<img class="label" src="media/svg/supplydrop.svg" />';
                        html+= 'Ny supply-drop finns att hämta!';
                    html+= '</div>';
                }
                
                html+= WHP.content.getOrders();

            }


            $("body").html(html);

            // Bind stuff

            // Go to store listing
            $("div.listing.order[data-id]").on('click', function(){

                var id = +$(this).attr('data-id');
                WHP.com.send("tabs.gotoAndScroll", ["medlem/"+WHP.meta.user+"/bestallningar", "table.medlem_order_info strong:contains('"+id+"'):first"]);
                
            });

            // Go to user page
            $("div.listing.supplydrop").on('click', function(){

                WHP.com.send("tabs.gotoAndScroll", ["medlem/"+WHP.meta.user+"/bestallningar"]);
                
            });

        };

        // Returns order info
        WHP.content.getOrders = function(){
            
            var html = '';
            for(var i=0; i<WHP.meta.orders.length; ++i){

                var order = WHP.meta.orders[i],
                    date = moment.tz(order.date, 'europe/stockholm').valueOf();
                
                html+= '<div class="listing clickable order'+(order.isNew ? ' new':'')+'" data-id='+order.id+'>';
                    html+= '<img class="label" src="media/svg/prislapp.svg" />';
                    html+= '<em class="timestamp">'+WHP.Tools.fuzzy_time(Date.now()-date)+' sedan</em> | '+order.items+' Produkt'+(order.items>1 ? 'er':'')+' Beställd'+(order.items>1? 'a':'')+'<br />'+
                        'Status: <strong>'+order.status+'</strong>';
                html+= '</div>';
                
            }
            
            return html;

        };






    // Tools
        WHP.Tools = {};
        WHP.Tools.fuzzy_time = function(ms){
            var seconds = Math.abs(Math.floor(ms/1000));


            var formats = [
                {t:"år", suf:'', n:3600*24*365},
                {t:"månad", suf:'er', n:3600*24*30},
                {t:"veck", suf:['a','or'], n:3600*24*7},
                {t:"dag", suf:'ar', n:3600*24},
                {t:"timm", suf:['e','ar'], n:3600},
                {t:"minut", suf:'er', n:60},
                {t:"sekund", suf:'er', n:0}
            ];
            for(var i =0; i<formats.length; ++i){
                if(seconds >= formats[i].n){
                    var d = Math.floor(seconds/formats[i].n);
                    var out = d+' '+formats[i].t;
                    
                    var suf = formats[i].suf;
                    if(suf.constructor === Array){
                        out+= suf[+(d>1)];
                    }else if(d>1){
                        out+= suf;
                    }
                    return out;
                }
            }
            return '';
        };

})();


$(function(){WHP.ini();});