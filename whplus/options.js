/*

    TODO:
        

*/
var WHP = {};
(function(){
    "use strict";

    WHP.ini = function(){

        // Fetch user data
        chrome.runtime.sendMessage({"task": "get", "args": [false]}, function(data){
            WHP.data = data.data;
            WHP.meta = data.meta;

            WHP.content.build();
        });

    };

    // Loading
        WHP.data = {
            
        };

        WHP.meta = {
            user : '',
            orders : []
        };
        

    // Content
        WHP.content = {};
        WHP.content.build = function(){
            
            var html = `
                <label><input type="checkbox" id="ikoner" `+(WHP.data.ignorecss ? '' : 'checked')+` /> Menyikoner</label>
                <hr />
                <input type="button" id="reset" value="Fabriksåterställ" />
            `;
            
            $("body > div.options").html(html);


            $("#ikoner").on('change', function(){
                var checked = $(this).is(':checked');
                chrome.runtime.sendMessage({"task": "storage.setIgnoreCSS", "args": [!checked]});
            });

            $("#reset").on('click', function(){
                var th = $(this);
                th.prop('disabled', true).val('Fabriksinställningar har återställts');
                
                chrome.runtime.sendMessage({"task": "storage.reset", "args": []});

                setTimeout(function(){
                    th.prop('disabled', false).val('Fabriksåterställ');
                }, 5000);
            });
        };


})();


$(function(){WHP.ini();});
