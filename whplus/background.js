
var WHPBG = {};

(function(){
    "use strict";

    WHPBG.EVENTS_BOUND = false;

    // Returns a promise
    WHPBG.ini = function(){
        
        chrome.browserAction.onClicked.addListener(function(tab){
            WHPBG.com.send("com.onBrowserAction", []);
        });

        chrome.runtime.onMessage.addListener(WHPBG.com.onMessage);
        chrome.tabs.onUpdated.addListener(WHPBG.com.onTabUpdated);

        chrome.notifications.onClicked.addListener(WHPBG.notice.onClick);
        
        // Start polling every 10 minutes
        setInterval(function(){
            WHPBG.meta.fetch();
        }, 1000*60*10);
    
        return WHPBG.reInit();
        
    };

    WHPBG.reInit = function(){
        return new Promise(function(res){
            // Load from storage, then from website
            WHPBG.storage.load().then(WHPBG.meta.fetch).then(function(){
                res();
            });
        });
    };

    WHPBG.setIcon = function(png){
        
        chrome.browserAction.setIcon({
            path: png
        });

    };

    // Ran after each refresh
    WHPBG.onMetaFetched = function(){
        WHPBG.refreshIcon();
    };

    WHPBG.refreshIcon = function(){
        // Logged in
        var icon = 'icon_no_news.png';
        var badge = {text:""};
        if(WHPBG.meta.fetched.user !== ''){
            if(WHPBG.meta.getNrNewNotifications()){
                icon = 'icon.png';
                badge = {"text":String(WHPBG.meta.getNrNewNotifications())};
            }
        }else{
            icon = 'icon_disconnect.png';
        }

        chrome.browserAction.setBadgeText(badge);
        WHPBG.setIcon(icon);

    };



    // Fetches data, will try to log in again if logged out and retry_if_logged_out is set
    WHPBG.get = function(retry_if_logged_out, sendResponse){
        if(retry_if_logged_out && WHPBG.meta.fetched.user === ''){
            
            // Send a response regardless of it succeeded or failed
            WHPBG.reInit().then(function(){
                sendResponse({
                    data : WHPBG.storage.data,
                    meta : WHPBG.meta.fetched
                });
            });

            return true;
        }

        sendResponse({
            data : WHPBG.storage.data,
            meta : WHPBG.meta.fetched
        });
    };

    // COM
        WHPBG.com = {};
        WHPBG.com.onCompleteBindings = [];  // Contains objects of {id:(int)tabID, fn:(function)onComplete} - These are removed once the event triggers

        // Sends to active tab
        WHPBG.com.send = function(task, args, callback){
            // Send a message to the active tab
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {"task":task, "args":args}, callback);
            });
        };

        WHPBG.com.sendTo = function(tabid, task, args, callback){
            chrome.tabs.sendMessage(tabid, {"task":task, "args":args}, callback);
        };

        WHPBG.com.scrollTabTo = function(tabid, querySelector, callback){
            chrome.tabs.sendMessage(tabid, {"task":"Tools.scrollTo", "args":[querySelector]}, callback);
        };

        WHPBG.com.onMessage = function(request, sender, sendResponse){
            var task = request.task.split('.');
            var args = request.args;
            if(args === undefined){args = [];}
            if(args.constructor !== Array){args = [args];}
            var track = WHPBG;
            while(task.length){
                var name = task.shift();
                if(!track.hasOwnProperty(name)){
                    console.error("WH+ Error, task not found", name);
                    return;
                }
                track = track[name];
            }
            args.push(sendResponse, sender);
            if(track.apply(this, args) === true){
                return true;
            }
        };

        WHPBG.com.debug = function(){console.log("DEBUG", arguments);};

        // Run a function when a tab finishes loading by ID
        WHPBG.com.bindOnComplete = function(id, callback){
            WHPBG.com.onCompleteBindings.push({id:id, fn:callback});
        };

        WHPBG.com.onTabUpdated = function(id, changeInfo, tab){
            // make sure the status is 'complete' and it's the right tab
            if(changeInfo.status == 'complete') {
                
                for(var i=0; i<WHPBG.com.onCompleteBindings.length && WHPBG.com.onCompleteBindings.length; ++i){
                    var obj = WHPBG.com.onCompleteBindings[i];
                    if(+obj.id !== +id){continue;}
                    obj.fn.call();
                    WHPBG.com.onCompleteBindings.splice(i, 1);
                    --i;                    
                }

            }
        };

        WHPBG.com.getTabID = function(callback, sender){
            callback(sender.tab.id);
        };


    // Chrome Notices
        WHPBG.notice = {};
        WHPBG.notice.send = function(id, title, message, icon){
            icon = icon || 'icon.png';
            chrome.notifications.create(id, {
                type:'basic',
                title : title,
                message : message,
                iconUrl : icon,
                isClickable : true
            });
        };
        
        WHPBG.notice.onClick = function(id){
            chrome.notifications.clear(id);
            var data = id.split('|');
            var task = data.shift();
            if(task === 'supplyDropReady'){
                WHPBG.tabs.gotoAndScroll("medlem/"+WHPBG.meta.fetched.user+"/bestallningar");
            }

            // Order clicked
            else if(task === 'order'){
                
                var ordernr = +data;
                WHPBG.tabs.gotoAndScroll("medlem/"+WHPBG.meta.fetched.user+"/bestallningar", "table.medlem_order_info strong:contains('"+ordernr+"'):first");

                // Remove order isNew
                var order = WHPBG.Tools.searchIn(WHPBG.meta.fetched.orders, "id", ordernr);
                if(order){
                    order.isNew = false;
                    WHPBG.storage.save();
                    WHPBG.refreshIcon();
                }
                
            }

        };



    // TABS
        WHPBG.tabs = {};

        WHPBG.tabs.gotoAndScroll = function(dir, scrollTo){
            var url = 'https://www.webhallen.com/'+dir;
            WHPBG.tabs.focusOrNew(url).then(function(data){

                // No scroll needed
                if(!scrollTo){return;}

                var tabid = data[0];
                var created = data[1];

                // wait for tab to load
                if(created){
                    WHPBG.com.bindOnComplete(tabid, function(){
                        WHPBG.com.scrollTabTo(tabid, scrollTo);
                    });
                }
                // send immediately
                else{
                    WHPBG.com.scrollTabTo(tabid, scrollTo);
                }
            });
        };

        // Focuses a tab if it exists, otherwise opens a new tab. Returns a promise which resolves with [tabid, created]
        WHPBG.tabs.focusOrNew = function(url){

            return new Promise(function(res, rej){
                chrome.windows.getAll({populate:true},function(windows){

                    for(var n =0; n < windows.length; ++n){
                        var win = windows[n];
                        for(var i=0; i<win.tabs.length; ++i){
                            var u = win.tabs[i].url;
                            if(u === url){
                                chrome.tabs.update(win.tabs[i].id, {selected: true});
                                res([win.tabs[i].id, false]);
                                return;
                            }
                        }
                    }

                    chrome.tabs.create({"url":url}, function(tab){
                        res([tab.id, true]);
                    });

                });
            });
        };



    // META | Fetch from website
        WHPBG.meta = {};

        // Data fetched from their site when browser button is clicked
        WHPBG.meta.fetched = {
            "user" : '',            // Username
            "supplydrop" : false,   // Supply drop ready
            "orders" : []           // {date:timestamp, id:ordernr, items:nrItems, status:statusText}
        };

        // Clones above object
        WHPBG.meta.clone = function(){
            var base = WHPBG.meta.fetched;
            var out = {
                "user" : base.user,
                "supplydrop" : base.supplydrop,
                "orders" : []
            };
            for(var i=0; i<base.orders.length; ++i){
                out.orders.push(base.orders[i].getSaveOut());
            }
            return out;
        };

        // Returns nr unseen items
        WHPBG.meta.getNrNewNotifications = function(){
            var out = 0, meta = WHPBG.meta.fetched, i;
            if(meta.supplydrop){++out;}
            for(i=0; i<meta.orders.length; ++i){
                if(meta.orders[i].isNew){
                    ++out;
                }
            }
            return out;
        };

        // The browser action  has been opened successfully. The user has now seen all updates
        WHPBG.meta.seen = function(){
            var meta = WHPBG.meta.fetched;
            var need_save = false;
            for(var i=0; i<meta.orders.length; ++i){
                if(meta.orders[i].isNew){
                    meta.orders[i].isNew = false;
                    need_save = true;
                }
            }            

            // Save and reload the icon
            if(need_save){
                WHPBG.storage.save();
                WHPBG.refreshIcon();
            }
        };

        // Sets supply drop status and notifies if it doesn't exist
        // Returns TRUE if data has been changed
        WHPBG.meta.setSupplyDrop = function(exists){

            WHPBG.meta.fetched.supplydrop = exists;
            if(exists !== WHPBG.storage.data.supplydrop){
                if(exists){
                    WHPBG.notice.send('supplyDropReady', 'Supply drop!', 'En ny supply drop finns att hämta!');
                    return true;
                }
            }
            return false;
        };

        // Parses an order before adding it or not
        // Returns TRUE If the order is new or has changed
        WHPBG.meta.addOrder = function(order){

            var out = false;
            // Later on, add tracking. This requires the order to be shipped.
            var existing = WHPBG.Tools.searchIn(WHPBG.storage.data.orders, "id", order.id);

            if(
                // This was a newly placed order
                (!existing && order.status !== "Skickad/Hämtad" && order.status.toLowerCase() !== "mottagaren har hämtat försändelsen") || 
                // The order status has changed
                (existing && existing.status !== order.status)
            ){
                // WH Borked
                if(order.status === '[]')
                    return;

                // notify
                var date = moment.tz(order.date, 'europe/stockholm').valueOf();
                var title = 'Beställning Uppdaterad!';
                var message = WHPBG.Tools.fuzzy_time(Date.now()-date)+' sedan | '+order.items+' Produkter\n'+'Status: '+order.status.toUpperCase();
                WHPBG.notice.send('order|'+order.id, title, message);
                order.isNew = true;
                out = true;
            }

            if(existing && existing.isNew){
                order.isNew = true;
            }

            // This order should show up in the top bar
            if(order.status !== "Skickad/Hämtad" && order.status.toLowerCase() !== "mottagaren har hämtat försändelsen"){
                WHPBG.meta.fetched.orders.push(order);
            }

            return out;
        };

        // user has changed
        WHPBG.meta.onUserChange = function(){
            if(WHPBG.storage.user === ''){return;}
            WHPBG.storage.save();               // Wipes the stored data
        };


        // Fetch metadata
        WHPBG.meta.fetch = function(){

            return new Promise(function(res, rej){

                var user = WHPBG.storage.data.user;
                
                var onFinish = function(){
                    WHPBG.onMetaFetched();
                    res();
                };

                var fail = function(err){
                    onFinish();
                    throw(err);
                };

                // 1. Get basic login status and non-login meta

                WHPBG.meta.query()
                .then(function(response){

                    return new Promise(function(resolve, reject){

                        if($("#login_box_top_text_medlem", response).length){

                            WHPBG.meta.fetched.user = '';
                            WHPBG.refreshIcon();
                            reject("User not logged in");
                            

                        }

                        var n = $("#userpanel_name", response);
                        if(n.length){
                            WHPBG.meta.fetched.user = n.text().trim();

                            if(WHPBG.meta.fetched.user !== WHPBG.storage.data.user){
                                WHPBG.meta.onUserChange();
                            }

                            resolve();
                            return;
                        }

                        reject("#userpanel_name not found");
                        

                    });
                    

                }, fail)

                // 2. Fetch orders (Subfunction is needed to fetch the current user)
                // Also able to fetch supply drop status
                .then(function(){return WHPBG.meta.query('/medlem/'+WHPBG.meta.fetched.user+'/bestallningar');}, fail)
                
                .then(function(response){
                    
                    return new Promise(function(resolve, reject){
                        
                        var root = $(response),
                            searchin = $("#site_content_middle_page table.medlem_order_info", root),
                            need_save = false   // Checks if data has changed
                        ;

                        // A. Fetch orders
                        WHPBG.meta.fetched.orders = [];
                        searchin.each(function(){

                            var order = new WHPBG.meta.Order();

                            $("tr td:first-child", this).each(function(){

                                var label = $(this).text();
                                if(label === "Status"){

                                    order.status = $(this).next().text();
                                    
                                }

                                else if(label === 'Orderdatum'){
                                    order.date = $(this).next().text();
                                }

                                else if(label === 'Ordernummer'){
                                    order.id = +$(this).next().text();
                                }
                                
                            });

                            // Fetch info about the order
                            var len = $(this).parent().find('div.download_order > div.form_box_content > table > tbody > tr').length-1;
                            order.items = len;

                            // Check tracking
                            var tracking = $(this).parent().find('div#tracking_info_area');
                            if(tracking.length){
                                var status = $("div.tracking_info > table tr:first", tracking);
                                order.date = $("td:first", status).text();
                                var location = $("td:nth-child(2)", status).text().trim();
                                order.status = $("td:last", status).text().trim();
                                if(order.status.toLowerCase() !== 'mottagaren har hämtat försändelsen'){
                                    order.status+= ' ['+location+']';
                                }

                            }

                            // Check if order has changed or is new
                            if(WHPBG.meta.addOrder(order)){need_save = true;}

                            

                        });

                        
                        // B. Check supply drop status
                        if(WHPBG.meta.setSupplyDrop($("img#member-header-picture-edit-thumb", root).attr('src') ===  '/images/member/supplydrop_thumb.png')){
                            need_save = true;
                        }
                        

                        if(need_save){
                            WHPBG.storage.save();
                        }
                        resolve();
                    });

                }, fail)
                
                // Finish the whole chain promise
                .then(onFinish);

            });

        };

        // Fetches raw data from url
        WHPBG.meta.query = function(url){
            url = url || '/';
            url = 'https://www.webhallen.com'+url;

            return new Promise(function(res, rej){
                $.get(url)
                .done(function(response){
                    // Resolve an escaped DOM
                    res(new DOMParser().parseFromString(response, 'text/html'));
                })
                .fail(function(response){
                    rej("HTTP GET failed");
                });
            });

        };

        // Meta order class
            WHPBG.meta.Order = function(){

                this.date = '';
                this.id = 0;
                this.items = 0;
                this.status = "";
                this.isNew = false;

                // Returns data for saving
                this.getSaveOut = function(){
                    return {
                        "date" : this.date,
                        "id" : this.id,
                        "items" : this.items,
                        "status" : this.status,
                        "isNew" : this.isNew,
                    };
                };

            };




    // Storage
        WHPBG.storage = {};

        // Whenever saved, this becomes a clone of the WHPBG.meta.fetched object
        // This is used to we can see when data has changed
        WHPBG.storage.data = {
            "user" : '',
            "supplydrop" : false,
            "orders" : [],
            "ignorecss" : false         // Don't use custom CSS icons and stuff in foreground script
        };

        
        // Set user name

        WHPBG.storage.save = function(){
            var ignore = WHPBG.storage.data.ignorecss;
            WHPBG.storage.data = WHPBG.meta.clone();
            WHPBG.storage.data.ignorecss = ignore;

            return new Promise(function(res){
                chrome.storage.sync.set(WHPBG.storage.data, function() {
                    // Notify that we saved.
                    console.log("Save done");
                    res();
                });
            });
        };

        WHPBG.storage.setIgnoreCSS = function(ignore){
            WHPBG.storage.data.ignorecss = ignore;
            WHPBG.storage.save();
        };

        WHPBG.storage.reset = function(){
            WHPBG.meta.fetched = {
                "user" : '',
                "supplydrop" : false,
                "orders" : [],
                "ignorecss" : false
            };
            WHPBG.storage.save().then(function() {
                console.log("Data has been purged. Reinitializing");
                WHPBG.reInit();
            });
        };

        WHPBG.storage.load = function(){
            return new Promise(function(res){
                chrome.storage.sync.get(null, function(items){
                    for(var i in WHPBG.storage.data){
                        if(!items.hasOwnProperty(i)){continue;}
                        WHPBG.storage.data[i] = items[i];
                    }
                    res();
                });
            });
        };


    
    // Tools
        WHPBG.Tools = {};
        // Searches for arr[i][index] === find, returns the found object or false
        WHPBG.Tools.searchIn = function(arr, index, find){
            for(var i=0; i<arr.length; ++i){
                if(arr[i][index] === find){
                    return arr[i];
                }
            }
            return false;
        };

        WHPBG.Tools.fuzzy_time = function(ms){
            var seconds = Math.abs(Math.floor(ms/1000));


            var formats = [
                {t:"år", suf:'', n:3600*24*365},
                {t:"månad", suf:'er', n:3600*24*30},
                {t:"veck", suf:'or', n:3600*24*7},
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
        
    // Start
    WHPBG.ini();
})();
