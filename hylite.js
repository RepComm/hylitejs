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
        this.onchangehook = (evt)=>this.onContentChanged(evt);
        window.addEventListener("resize", (e)=>{
            this.viewSync();
        });
        this.options = {
            tabConversion:{
                enabled:true,
                char:" ",
                amount:2,
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
                    case "keyword0":
                    this.visualElement.appendChild(HtmlHelper.keyword0(tokens[i].data));
                    break;
                    case "keyword1":
                    this.visualElement.appendChild(HtmlHelper.keyword1(tokens[i].data));
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
                    case "commentline":
                    this.visualElement.appendChild(HtmlHelper.commentline(tokens[i].data));
                    break;
                    case "commentsection":
                    this.visualElement.appendChild(HtmlHelper.commentsection(tokens[i].data));
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
        this.highlight(this.editorElement.selectionStart);
        
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
                let start = this.editorElement.selectionStart;
                let end = this.editorElement.selectionEnd;
                if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
                    if (start !== end) {
                        this.editorElement.setRangeText(
                            "",
                            this.editorElement.selectionStart+1,
                            this.editorElement.selectionEnd
                        );
                        this.editorElement.selectionStart++;
                        this.editorElement.selectionEnd = this.editorElement.selectionStart;
                    }
                }

                if (this.options.autoType.enabled) {
                    if (this.options.autoType.globalAutoTypeMap[e.key]) {
                        start = this.editorElement.selectionStart;
                        setTimeout(()=>{
                            this.editorElement.value = this.editorElement.value.substring(0, start+1) +
                            this.options.autoType.globalAutoTypeMap[e.key] +
                            this.editorElement.value.substring(start+1);
                            this.highlight(start);
                            this.editorElement.selectionStart = start+1;
                            this.editorElement.selectionEnd = start+1;
                        }, 100);
                    }
                }

                if (e.key == "Tab") {
                    e.preventDefault();
                    start = this.editorElement.selectionStart;
                    let val = this.editorElement.value;
                    let insert = "";
                    for (let i=0; i<this.options.tabConversion.amount; i++) {
                        insert += this.options.tabConversion.char;
                    }

                    this.editorElement.value = val.substring(0, start) + insert + val.substring(start);
                    this.editorElement.selectionStart = start + this.options.tabConversion.amount;
                    this.editorElement.selectionEnd = this.editorElement.selectionStart;
                    return false;
                }
            });

            this.editorElement.addEventListener("scroll", (e)=>{
                this.viewSync();
            });

            setTimeout(()=>this.viewSync(), 100);
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
            this.viewSync();
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
    viewSync () {
        if (this.editorElement && this.visualElement) {
            console.log("syncing view");
            let dr = this.visualElement.getBoundingClientRect();
            this.editorElement.style.width = dr.width + "px";
            this.editorElement.style.height = dr.height + "px";
            this.visualElement.scrollTop = this.editorElement.scrollTop;
            this.visualElement.scrollLeft = this.editorElement.scrollLeft;

            if (this.visualElement.scrollTop < this.editorElement.scrollTop) {
                this.editorElement.scrollTop = this.visualElement.scrollTop;
            }
        }
    }
}

class HyliteLanguage {
    constructor (jsonFilePath) {
        this.keywords0;
        this.keywords1;
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
        for (let i=0; i<this.keywords0.length; i++) {
            if (text === this.keywords[i]) {
                return true;
            }
        }
        for (let i=0; i<this.keywords1.length; i++) {
            if (text === this.keywords1[i]) {
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
                let jkeys = Object.keys(json);
                for (let jk of jkeys) {
                    lang[jk] = json[jk];
                }
                console.log(lang);
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
