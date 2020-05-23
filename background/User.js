import Rest from './Rest.js';
import Note from './Note.js';
import WH from './WH.js';

export default class User{
	 constructor(parent){
		this.parent = parent;

		// Data from REST
		this.id = 0;
		this.feed = [];
		this.username = '';
		this.crateTypes = [];

		// Custom config data
		this.ignore_css = false;	// Don't insert CSS
		this.last_feed = 0;			// Max feed timestamp at last cache
		this.crates = 0;			// Crates unopened at last cache
	 }

	 export(){
		 return {
			id : this.id,
			feed : this.feed.map(e => { return e.export(); }),
			username : this.username,
			ignore_css : this.ignore_css,
			crateTypes : this.crateTypes.map(e => { return e.export(); }),
		 };
	 }

	 getMemberURL(){
		 return this.id;
	 }

	 // Loads from the /me endpoint
	 loadFromRest(data){

		// Load from WH API
		return new Rest('me').then(call => {
				let data = call.data;
				if(!data || !data.user || !data.user.id)
					return Promise.reject(301);
				this.id = data.user.id;
				this.username = data.user.username;
				this.feed = data.user.feed.map(el => { return new FeedElement(el, this); });

				// Continue by loading from storage
				return this.loadFromStorage();
			})
			// Compare cached information with the new information
			.then(storageData => {
				this.ignore_css = !!this.ignore_css;
				this.last_feed = storageData.feed || 0;
				this.crates = storageData.crates || 0;
				// Handle new feed entries
				for(let f of this.feed){
					if(f.occuredAt > this.last_feed)
						f.push();
				}

				// Get crates
				return new Rest("supply-drop");
			})
			.then(call => {
				let data = call.data;
				if(!data || !data.crateTypes)
					return Promise.reject("Unable to fetch supply drop data");

				this.crateTypes = data.crateTypes.map(e => { return new CrateElement(e, this); });

				// Crates have increased, send a note
				if( this.crates < this.getNrSupplyDrops() ){
					let note = new Note();
					note.title = "Supply Drop";
					note.message = 'Du har '+this.getNrSupplyDrops()+' oöppnad'+(this.getNrSupplyDrops() === 1 ? '' : 'e')+' supply drop'+(this.getNrSupplyDrops() === 1 ? '' : 's')+'!';
					note.onClick = id => {
						Note.close(id);
						this.parent.ctGotoAndScroll('se/member/'+this.getMemberURL()+'/supply-drop', 'div.member-subpage');
					};
					note.send();
				}
				
				return this.saveToStorage();
			});
	 }

	 loadFromStorage(){
		if(!this.id)
			return Promise.reject("Attempt to load null user", this.id);
		return new Promise(res => {
			let k = "usr_"+this.id;
			chrome.storage.sync.get(k, items => {
				if(!items || !items[k])
					res({});
				res(items[k]);
			});
		});
	 }

	 toggleCSS(on){
		this.ignore_css = !on;
		return this.save();
	 }

	 // Saves to storage
	 saveToStorage(reset){
		return new Promise((res, rej) => {

			if(reset){
				chrome.storage.sync.clear(function() {
					let error = chrome.runtime.lastError;
					if(error)
						return rej(error);
					res();
				});
				return;
			}

			let save = {};
			save["usr_"+this.id] = {
				id : this.id,
				feed : this.feed.length ? this.feed[0].occuredAt : 0,	// Feed only stores the time of the last pushed item
				ignore_css : this.ignore_css,
				crates : this.getNrSupplyDrops()
			};
			chrome.storage.sync.set(save, () => {
				res();
			});
		});
	 }


	 // Notifications
	 getNrSupplyDrops(){
		 // Get nr of supply drops available
		 let out = 0;
		 for(let c of this.crateTypes)
			out+= c.openableCount;
		 return out;
	 }

	 getNrNotices(){
		 return this.getNrSupplyDrops()+this.feed.length;
	 }
}

class FeedElement{
	constructor(data, parent){
		this.parent = parent;
		this.avatarName = '';
		this.backgroundColor = '#e8b0c9';
		this.borderColor = '#e09ab8';
		this.iconUrl = '';
		this.id = 0;
		this.name = '';
		this.occuredAt = 0;
		this.path = {};
		this.title = '';
		this.load(data);
	}

	export(){
		return {
			id : this.id,
			backgroundColor : this.backgroundColor,
			borderColor : this.borderColor,
			iconUrl : this.iconUrl,
			name : this.name,
			occuredAt : this.occuredAt,
			path : this.path,
			title : this.title,
		};
	}

	load(data){
		if(typeof data !== "object")
			return;
		for(let i in data){
			if(this.hasOwnProperty(i) && typeof this[i] !== "function")
				this[i] = data[i];
		}
	}

	// Creates a notification
	push(){
		let note = new Note();
		let ext = this.iconUrl.split('.').pop();
		note.title = this.title;
		note.message = WH.fuzzy_time(Date.now()-this.occuredAt*1000)+' sedan.';
		note.eventTime = this.occuredAt*1000;
		note.onClick = id => {
			Note.close(id);
			this.parent.parent.ctItemClicked('feed', this.id);
		};
		note.send();

	}
}


class CrateElement{

	constructor(data, parent){
		this.parent = parent;
		this.name = '';
		this.icon = '';
		this.progress = 0;
		this.openableCount = 0;
		this.nextResupplyIn = 0;
		this.load(data);
	}

	export(){
		return {
			name : this.name,
			icon : this.icon,
			progress : this.progress,
			openableCount : this.openableCount,
			nextResupplyIn : this.nextResupplyIn,
		};
	}

	load(data){
		if(typeof data !== "object")
			return;
		for(let i in data){
			if(this.hasOwnProperty(i) && typeof this[i] !== "function")
				this[i] = data[i];
		}
	}
	
}



