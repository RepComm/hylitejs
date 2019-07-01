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
        document.addEventListener("keypress", (e)=>{
            if (e.key == "Tab") {
                e.preventDefault();
            }
        });
    }
    highlight (caretAbsolutePosition) {
        let tokens = Lexer.lex(this.editorElement.value);
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
            // let sel = window.getSelection();
            // let range = document.createRange();
            // let newFocus;
            
            // let offset = 0, childLength = 0;

            // for (let i=0; i<this.editorElement.children.length; i++) {
            //     let child = this.editorElement.children[i];
            //     childLength = 0;
            //     if (child.className === "new_line") {
            //         childLength += 1; //Represents a single \n char
            //     } else if (child.className === "string_literal") {
            //         childLength += child.textContent.length + 2;
            //     } else {
            //         childLength += child.textContent.length;
            //     }
            //     offset += childLength;
            //     console.log("Offset now", offset, "vs", caretAbsolutePosition);
            //     if (offset >= caretAbsolutePosition) {
            //         newFocus = child;
            //         offset = offset - caretAbsolutePosition;
            //         // if (offset >= newFocus.textContent.length) {
            //         //     offset = 1;
            //         //     newFocus = this.element;
            //         // }
            //         break;
            //     }
            // }
            // console.log(offset, newFocus);

            // range.selectNode(newFocus);
            // range.setStart(newFocus, offset+1);

            // range.collapse(true);
            // sel.removeAllRanges();
            // sel.addRange(range);

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

            return true;
        }
    }
    hookToVisual (div) {
        if (div) {
            this.visualElement = div;
            return true;
        }
    }
    hookDebugTo (ta) {
        if (ta) {
            this.debugelement = ta;
        }
    }
    setLanguage (lang) {
        this.language = lang;
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
