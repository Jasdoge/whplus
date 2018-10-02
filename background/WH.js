/*
	Main script. Handles communications
*/

import User from './User.js';
import Note from './Note.js';
import Rest from './Rest.js';

export default class WH{

	constructor(){

		this.user = new User(this);
		this.tab_creation_callbacks = {};	// id : callback

		// Bind events
		chrome.browserAction.onClicked.addListener(tab => {
            WHPBG.com.send("com.onBrowserAction", []);
        });
        chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {return this.onCom(message,sender,sendResponse);});
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {this.onTabUpdated(tabId, changeInfo, tab);});

        chrome.notifications.onClicked.addListener(Note.onClick);
        chrome.notifications.onClosed.addListener(Note.onClose);
        
        // Start polling every 10 minutes
        setInterval(() => {
            this.fetchFromRest();
		}, 1000*60*10);
		
		// Fetch active REST user
		this.fetchFromRest(); 
		
	}


	// User has been updated
	onRestUpdate(){
		this.refreshIcon();
	}



	// Refresh from api
	fetchFromRest(){
		return this.user.loadFromRest()
			.catch(err => {
				// User logged out
				if(err === 301)
					this.user = new User(this);
				else
					console.error(err);
			}).then(() => {
				this.onRestUpdate();
			});
	}



	// ICON
		// Refreshes the icon based on user
		refreshIcon(){
			// Logged in
			let icon = 'icon_no_news.png',
				badge = {text:""},
				notes = this.user.getNrNotices()
			;

			// User is logged in
			if(this.user.id){
				if(notes){
					icon = 'icon.png';
					badge = {"text":String(notes)};
				}
			}else
				icon = 'icon_disconnect.png';
			
			chrome.browserAction.setBadgeText(badge);
			chrome.browserAction.setIcon({
				path: '../media/'+icon
			});

		}


	// COM

		onCom(message,sender,sendResponse){

			let task = message.task, 
				args = message.args
			;
			if(args === undefined)
				args = [];

			if(args.constructor !== Array)
				args = [args];
			
			if(typeof this['ct'+task] !== "function")
				return console.error("No such task from front script:", task);

			let ret = this['ct'+task].apply(this, args);
			Promise.resolve(ret).then(re => {
				sendResponse(re);
			});
			return true;
		}

		comSendToTabs(task, args, callback){
			// Send a message to the active tab
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var activeTab = tabs[0];
				chrome.tabs.sendMessage(activeTab.id, {"task":task, "args":args}, callback);
			});
		}

		comSendToTab(tabid, task, args, callback){
			chrome.tabs.sendMessage(tabid, {"task":task, "args":args}, callback);
		}

		comScrollTabTo(tabid, querySelector, callback){
			chrome.tabs.sendMessage(tabid, {"task":"ScrollTo", "args":[querySelector]}, callback);
		}

		ctGotoAndScroll(page, scrollTo){
			let url = 'https://www.webhallen.com/'+page;
			this.tabFocusOrNew(url)
				.then(data => {
					// No scroll needed
					if(!scrollTo)
						return;

					let tabid = data[0],
						created = data[1]
					;

					// wait for tab to load
					if(created)
						this.tab_creation_callbacks[tabid] = () => {
							this.comScrollTabTo(tabid, scrollTo);
						};
					// send immediately
					else
						this.comScrollTabTo(tabid, scrollTo);

				});
			return true;
		}

		ctRemoveFeed(id){
			return new Rest('user/feed/'+id, 'DELETE').then(() => {
				return this.fetchFromRest();
			});
		}

		ctDebug(){
			console.log("COM Debug", arguments);
		}

		ctGet(){
			return {
				user : this.user.export(),
			};
		}

		ctRefresh(){
			this.fetchFromRest();
		}

		// Push or widget popup clicked
		// type is feed or supplydrop
		ctItemClicked(type, id){
			if(type === 'supplydrop')
				this.ctGotoAndScroll('se/member/'+this.user.id+'-'+encodeURIComponent(this.user.username)+'/supply-drop', "div.member-subpage");
			else if(type === 'feed'){
				for(let f of this.user.feed){
					if(f.id !== +id)
						continue;
					let url = 'se/';
					let n = f.path.name.split('.');
					let a = n.shift(), b = n.shift();
					url+= a+'/';
					if(a === 'member')
						url+= this.user.getMemberURL()+'/';
					url+= b+'/';
					if(b === 'achievements')
						url+= f.path.params.aid+'/';
					if(b === 'orders')
						url+= f.path.params.oid+'#/';
					this.ctGotoAndScroll(url);
					return;
				}
			}
		}
		
		ctSetIgnoreCSS(ignore){
			this.user.toggleCSS(!ignore);
		}

		ctReset(){
			this.user.saveToStorage(true).then(() => {
				this.user = new User(this);
				this.fetchFromRest();
			});
		}

	// TABS
		onTabUpdated(id, changeInfo, tab){
			// make sure the status is 'complete' and it's the right tab
			if(changeInfo.status == 'complete'){
				if(this.tab_creation_callbacks[id]){
					this.tab_creation_callbacks[id]();
					delete this.tab_creation_callbacks[id];
				}
			}
		}

		// Focuses a tab if it exists, otherwise opens a new tab. Returns a promise which resolves with [tabid, created]
        tabFocusOrNew(url){
            return new Promise(function(res, rej){
                chrome.windows.getAll({populate:true},function(windows){

                    for(let win of windows){
                        for(let tab of win.tabs){
                            var u = tab.url;
                            if(u === url){
                                chrome.tabs.update(tab.id, {selected: true});
                                res([tab.id, false]);
                                return;
                            }
                        }
                    }

                    chrome.tabs.create({"url":url}, function(tab){
                        res([tab.id, true]);
                    });

                });
            });
		}
		

}

// Tools
WH.fuzzy_time = ms => {
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



console.log("Use W.user for user etc");
window.W = new WH();
