class WHP{

    constructor(){

        this.user = {};

        chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {return this.onCom(message,sender,sendResponse);});

        

        this.comSend('Get', [], data => {

            this.user = data.user;
            console.log("WH+ started:", this.user);
            if(!this.user.ignore_css)
                this.drawCSS();

            // When clicking the supply drop canvas, force a refresh after a few sec
            $("div.pixelated > canvas").on('click', () => {
                // Wait 10 sec and then force a refresh
                setTimeout(() => {
                    this.comSend('Refresh');
                }, 3000);
            });

        });

    }


    drawCSS(){
        let path = chrome.extension.getURL('injected/main.css');
        $("head").append('<link rel="stylesheet" type="text/css" href="'+path+'" />');
    }


    onCom(message, sender, sendResponse){
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

    ctDebug(){
        console.log("Debug executed", arguments);
    }

    ctScrollTo(selector){
        $('html, body').animate({
            scrollTop: $(selector).offset().top
        }, 500);
    }

    comSend(task, args, callback){
        chrome.runtime.sendMessage({"task": task, "args": args}, callback);  
    }


}

new WHP();
