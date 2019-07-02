/** Hylite.js basic syntax highlighter
 * @author Jonathan Crowder
 */

import {HtmlHelper} from "./HtmlHelper.js";
import {Lexer} from "./Lexer.js";

class HyliteEditor {
    constructor () {
        this.isHooked = false;
        this.editorElement = undefined;
        this.language = undefined;
        this.lastNewLine = false;
        this.onchangehook = (evt)=>this.onContentChanged(evt);
        this.options = {
            tabConversion:{
                enabled:true,
                char:"\t",
                amount:1,
                tabCharSize:2 //Width of chars an actual Tab char () takes up, modifies css tab-size
            },
            //TODO - Document options and implement
            autoType:{
                enabled:true,
                langDefinitionBased:true, //Use autotype from language definitions
                globalBased:true, //Use common ones such as quotations and brackets
                cursorMove:"middle", //pre = don't move cursor, middle = cursor to center, end = past typed chars
                globalAutoTypeMap:{ //Map of typed to autotyped
                    "\"":"\"",
                    "'":"'",
                    "{":"}",
                    "(":")",
                    "`":"`",
                    "/*":"*/"
                }
            }

        };
    }
    /** Highlights the visual editor
     * @param {Integer} caretAbsolutePosition (unimplemented) highlight beginning at this index in the code
     */
    highlight (caretAbsolutePosition) {
        let tokens = Lexer.lex(this.language, this.editorElement.value);
        if (tokens) {
            this.visualElement.innerHTML = "";
            for (let i=0; i<tokens.length; i++) {
                switch (tokens[i].type) {
                    case "symbol":
                    this.visualElement.appendChild(HtmlHelper.symbol(tokens[i].data));
                    break;
                    case "operator":
                    this.visualElement.appendChild(HtmlHelper.operator(tokens[i].data));
                    break;
                    case "keyword":
                    this.visualElement.appendChild(HtmlHelper.keyword(tokens[i].data));
                    break;
                    case "identifier":
                    this.visualElement.appendChild(HtmlHelper.identifier(tokens[i].data));
                    break;
                    case "number_literal":
                    this.visualElement.appendChild(HtmlHelper.number_literal(tokens[i].data));
                    break;
                    case "string_literal":
                    this.visualElement.appendChild(HtmlHelper.string_literal(tokens[i].data));
                    break;
                    case "new_line":
                    this.visualElement.appendChild(HtmlHelper.new_line());
                    break;
                    default:
                    this.visualElement.appendChild(HtmlHelper.other_text(tokens[i].data));
                    break;
                }
            }
            if (this.debugelement) {
                let txt = "";
                for (let i=0; i<tokens.length; i++) {
                    txt += tokens[i].type;
                    if (tokens[i].data) {
                        txt += " " + tokens[i].data + "\n";
                    } else {
                        txt += "\n";
                    }
                }
                this.debugelement.innerHTML = txt;
            }
        } else {
            //Don't undo things if we can't parse it correctly
            //this.debugelement.innerHTML = "No Tokens yet";
        }
    }
    /** When the content is changed
     * @param {KeyboardEvent} evt Event that drove this change
     */
    onContentChanged (evt) {
        if (evt.key !== "Enter") {
            this.lastNewLine = false;
        }
        if (evt.ctrlKey) {
            if (evt.key === "v") {
                return;
            }
        }
        if (evt.key === "Shift") {
            return;
        }
        if (evt.key == "ArrowLeft" ||
            evt.key == "ArrowRight" ||
            evt.key == "ArrowUp" ||
            evt.key == "ArrowDown") {
            evt.preventDefault();
            return;
        }
        if (evt.key === "Tab") {
            evt.preventDefault();
            let sel = window.getSelection();
            let offset = sel.focusOffset;
            let focus = sel.focusNode;

            focus.textContent += "  ";

            let range = document.createRange();
            range.selectNode(focus);
            range.setStart(focus, offset+1);

            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (evt.key === "\"") {
            // let sel = window.getSelection();
            // let offset = sel.focusOffset;
            // let focus = sel.focusNode;

            // focus.textContent += "\"";

            // let range = document.createRange();
            // range.selectNode(focus);
            // range.setStart(focus, offset);

            // range.collapse(true);
            // sel.removeAllRanges();
            // sel.addRange(range);
        } else if (evt.key === "Enter") {
            evt.preventDefault();
        }
        this.highlight(0);//offset);
        
    }
    /** Hook this editor class to a specific HTMLTextAreaElement
     * @param {HTMLTextAreaElement} ta
     * @returns {Boolean} True if successful, false otherwise
     */
    hookToEditor (ta) {
        if (ta) {
            this.isHooked = true;

            this.editorElement = ta;
            this.editorElement.addEventListener("keyup", this.onchangehook);

            this.editorElement.addEventListener("keydown", (e)=>{
                if (e.key == "Tab") {
                    e.preventDefault();
                    let start = this.editorElement.selectionStart;
                    let val = this.editorElement.value;
                    let insert = "";
                    for (let i=0; i<this.options.tabConversion.amount; i++) {
                        insert += this.options.tabConversion.char;
                    }

                    this.editorElement.value = val.substring(0, start) + insert + val.substring(start);
                    this.editorElement.selectionStart = start + 2;
                    this.editorElement.selectionEnd = this.editorElement.selectionStart;
                    return false;
                }
            });

            return true;
        }
    }
    /** Set the display element (HTMLDivElement)
     * @param {HTMLDivElement} div
     * @returns {Boolean} True if successful, false otherwise
     */
    hookToVisual (div) {
        if (div) {
            this.visualElement = div;
            return true;
        }
    }
    //DEBUG ONLY
    hookDebugTo (ta) {
        if (ta) {
            this.debugelement = ta;
        }
    }
    /** Set the language type to highlight
     * @param {HyliteLanguage} lang to syntax highlight
     */
    setLanguage (lang) {
        this.language = lang;
    }
    /** Apply options to this editor instance
     * @param {Map} opts options to apply
     * @description Only applies options to keys specified
     */
    setOptions (opts) {
        let keys = Object.keys(opts);
        let key;
        for (let i=0; i<keys.length; i++) {
            key = keys[i];
            this.options[key] = opts[key];
        }
    }
}

class HyliteLanguage {
    constructor (jsonFilePath) {
        this.keywords;
        this.symbols; //operators
        this.literalRegex; //Number and string matching usually
        this.terminators;
    }
    isTerminator (text) {
        for (let i=0; i<this.terminators.length; i++) {
            if (text === this.terminators[i]) {
                return true;
            }
        }
        return false;
    }
    isKeyword(text) {
        for (let i=0; i<this.keywords.length; i++) {
            if (text === this.keywords[i]) {
                return true;
            }
        }
        return false;
    }
    isSymbol (text) {
        for (let i=0; i<this.symbols.length; i++) {
            if (text === this.symbols[i]) {
                return true;
            }
        }
        return false;
    }

    static fromJson(fpath, callback) {
        fetch(fpath).then( (result)=>{
            result.json().then((json)=>{
                let lang = new HyliteLanguage();
                lang.keywords = json.keywords;
                lang.symbols = json.symbols;
                lang.literalRegex = json.literalRegex;
                lang.terminators = json.terminators;

                callback(undefined, lang);
            }).catch((reason)=>{
                callback(reason, undefined);
            })
        }).catch((reason)=>{
            callback(reason, undefined);
        });
    }
}

export {HyliteEditor, HyliteLanguage}
