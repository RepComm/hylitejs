
import {HyliteEditor, HyliteLanguage} from "/hylitejs/hylite.js";

let elem = (id)=>document.getElementById(id);

let editor = new HyliteEditor();
let jsEditor = elem("jsEditor");
let jsResult = elem("jsResult");

HyliteLanguage.fromJson("languages/javascript.json", (error, language)=>{
    editor.setLanguage(language);

    editor.hookToDiv(jsEditor);
    editor.hookDebugTo(jsResult);
});
