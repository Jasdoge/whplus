export default class Note{
	constructor(){
		this.id = ++Note.internalID;
		this.type = 'basic';
		this.iconUrl = '../media/logo-144.png'; 	// needs to be local because CORS bullshit :<
		this.title = '';
		this.message = '';
		this.isClickable = true;
		this.eventTime = Date.now();
	}
	send(){
		Note.active.push(this);
		let n = {
			type:this.type,
			title : this.title,
			message : this.message,
			iconUrl : this.iconUrl,
			isClickable : true
		};
		chrome.notifications.create("note_"+this.id, n);
	}
	onClick(id){
		Note.close(id);
	}
}
Note.internalID = 0;
Note.active = [];
Note.onClick = id => {
	for(let i=0; i<Note.active.length; ++i){
		if('note_'+Note.active[i].id === id)
			Note.active[i].onClick(id);
	}
};
Note.close = id => {
	chrome.notifications.clear(id);
	Note.onClose(id);
};
Note.onClose = id => {
	for(let i=0; i<Note.active.length; ++i){
		if('note_'+Note.active[i].id === id){
			Note.active.splice(i, 1);
			return;
		}
	}
};
