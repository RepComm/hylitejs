
import {HyliteEditor, HyliteLanguage} from "./hylite.js";

let elem = (id)=>document.getElementById(id);

let editor = new HyliteEditor();
let hiddenEditor = elem("hiddenEditor");
let jsEditor = elem("jsEditor");
let jsResult = elem("jsResult");

HyliteLanguage.fromJson("languages/javascript.json", (error, language)=>{
    editor.setLanguage(language);
    editor.hookToEditor(hiddenEditor);
    editor.hookToVisual(jsEditor);
    editor.hookDebugTo(jsResult);
    editor.highlight(0);
});
