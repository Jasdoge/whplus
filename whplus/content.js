
var WHP = {};
(function(){
    "use strict";

    

    WHP.ini = function(){

        

        // Receive communications from background script
        chrome.runtime.onMessage.addListener(WHP.com.onMessage);
        console.log("WH+ Initialized");

        // Clicked on the supply drop
        $("#member-header-picture-edit-thumb").on('click', function(){
            // Wait 10 sec and then force a refresh
            setTimeout(function(){
                WHP.com.send('meta.fetch');
            }, 10000);
        });


        WHP.com.send('get', [false], function(data){

            if(!data.data.ignorecss){
                WHP.sidebar.improve();
            }
            

        });
        
    };


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

        // Browser action clicked
        WHP.com.onBrowserAction = function(){
            WHP.com.send("com.debug", ["Arg 1", "Arg 2"]);
        };


    
    // Tools
        WHP.Tools = {};
        WHP.Tools.scrollTo = function(selector){
            
            $('html, body').animate({
                scrollTop: $(selector).offset().top
            }, 500);

        };


    // Sidebar
        WHP.sidebar = {};
        WHP.sidebar.categories = [
            {name:"Spel", icon:"spel.svg"},
            {name:"Datorer &amp; Tillbehör", icon:"datorer.svg"},
            {name:"Datorkomponenter", icon:"datorkomponenter.svg"},
            {name:"Ljud &amp; Bild", icon:"kamera.svg"},
            {name:"Mobilt", icon:"mobilt.svg"},
            {name:"Hem &amp; Hälsa", icon:"plus.svg"},
            {name:"Lek &amp; Gadgets", icon:"lek.svg"},
            {name:"Film", icon:"video.svg"},
            {name:"Nätverk &amp; Smarta Hem", icon:"network.svg"},
            
            
        ];

        WHP.sidebar.findCategory = function(name){
            for(var i=0; i<WHP.sidebar.categories.length; ++i){
                if(WHP.sidebar.categories[i].name === name){
                    return WHP.sidebar.categories[i];
                }
            }
            return false;
        };


        WHP.sidebar.improve = function(){

            // Add the CSS
            var path = chrome.extension.getURL('main.css');
            $("head").append('<link rel="stylesheet" type="text/css" href="'+path+'" />');

            // Start by making the entire LI's clickable
            $("#site_content_left div.left_nav_sections ul.level1 li:not(.level_change):not(.current_level_first)").each(function(){

                var url = $("a", this).attr('href');
                var text = $("a", this).html();

                var img = WHP.sidebar.findCategory(text);
                if($(this).parent().parent().find("div.menucat").text() !== 'Avdelningar'){
                    img = false;
                }

                $(this).html((img ? '<img src="'+chrome.extension.getURL('media/svg/'+img.icon)+'" class="whp_sidebar_button" />':'')+text);
                $(this).on('click', function(){
                    window.location = url;
                });

            });

        };


})();


WHP.ini();



