export default class Options{
    constructor(){

        this.user = {};
        // Fetch user data
        chrome.runtime.sendMessage({"task": "Get", "args": []}, data => {
            this.user = data.user;
            this.build();
        });

    }

    build(){
        // <label><input type="checkbox" id="ikoner" `+(this.user.ignore_css ? '' : 'checked')+` /> Menyikoner</label>
        let html = 
        `
            <input type="button" id="reset" value="Rensa Användardata" />
        `;
        
        $("body > div.options").html(html);
        /*
        $("#ikoner").on('change', function(){
            let checked = $(this).is(':checked');
            chrome.runtime.sendMessage({"task": "SetIgnoreCSS", "args": [!checked]});
        });
        */

        $("#reset").on('click', function(){
            let th = $(this);
            th.prop('disabled', true).val('Användardata har rensats');
            chrome.runtime.sendMessage({"task": "Reset", "args": []});
            setTimeout(() => {
                th.prop('disabled', false).val('Rensa Användardata');
            }, 5000);
        });
    }

}

// Use window.W for debug
window.W = new Options();