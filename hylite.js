/** Hylite.js basic syntax highlighter
 * @author Jonathan Crowder
 */

import {HtmlHelper} from "./HtmlHelper.js";
import {Lexer} from "./Lexer.js";

class HyliteEditor {
    constructor () {
        this.isHooked = false;
        this.element = undefined;
        this.language = undefined;
        this.onchangehook = (evt)=>this.onContentChanged(evt);
        document.addEventListener("keypress", (e)=>{
            if (e.key == "Tab") {
                e.preventDefault();
            }
        });
    }
    highlight (caretAbsolutePosition) {
        let tokens = Lexer.lex(this.element.innerText);
        if (tokens) {
            this.element.innerHTML = "";
            for (let i=0; i<tokens.length; i++) {
                switch (tokens[i].type) {
                    case "symbol":
                    this.element.appendChild(HtmlHelper.symbol(tokens[i].data));
                    break;
                    case "operator":
                    this.element.appendChild(HtmlHelper.operator(tokens[i].data));
                    break;
                    case "keyword":
                    this.element.appendChild(HtmlHelper.keyword(tokens[i].data));
                    break;
                    case "identifier":
                    this.element.appendChild(HtmlHelper.identifier(tokens[i].data));
                    break;
                    case "number_literal":
                    this.element.appendChild(HtmlHelper.number_literal(tokens[i].data));
                    break;
                    case "string_literal":
                    this.element.appendChild(HtmlHelper.string_literal(tokens[i].data));
                    break;
                    case "new_line":
                    this.element.appendChild(HtmlHelper.new_line());
                    break;
                    default:
                    this.element.appendChild(HtmlHelper.other_text(tokens[i].data));
                    break;
                }
            }
            let sel = window.getSelection();
            let range = document.createRange();
            let newFocus;
            
            let offset = 0, childLength = 0;

            for (let i=0; i<this.element.children.length; i++) {
                let child = this.element.children[i];
                childLength = 0;
                if (child.className === "new_line") {
                    childLength += 1; //Represents a single \n char
                } else {
                    childLength += child.textContent.length;
                }
                offset += childLength;
                console.log("Offset now", offset, "vs", caretAbsolutePosition);
                if (offset >= caretAbsolutePosition) {
                    newFocus = child;
                    offset = offset - caretAbsolutePosition;
                    if (offset >= newFocus.textContent.length) {
                        offset = 1;
                        newFocus = this.element;
                    }
                    break;
                }
            }
            console.log(offset, newFocus);

            range.selectNode(newFocus);
            range.setStart(newFocus, offset+1);

            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            if (this.debugelement) {
                let txt = "";
                for (let i=0; i<tokens.length; i++) {
                    if (tokens[i].data) {
                        txt += tokens[i].type + " " + tokens[i].data + "\n";
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

        //Get the current selection (caret position) regardless of elements in the editor
        let sel = window.getSelection();
        let offset = sel.focusOffset;
        let target = sel.focusNode.parentElement; //Because this span will have a child text node (weird)
        //console.log("Starting offset", offset, "in", target);

        for (let i=0; i<this.element.children.length; i++) {
            let child = this.element.children[i];
            if (child === target) {
                break; //We already had this offset when we got the selection
            } else {
                if (child.className === "new_line") {
                    offset+=1; //Represents a single \n char
                } else {
                    //console.log("Adding", child.textContent.length, "because of", child);
                    offset += child.textContent.length;
                }
            }
        }

        if (evt.ctrlKey) {
            if (evt.key == "v") {
                return;
            }
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
            let sel = window.getSelection();
            let offset = sel.focusOffset;
            let focus = sel.focusNode;

            focus.textContent += "\"";

            let range = document.createRange();
            range.selectNode(focus);
            range.setStart(focus, offset);

            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        this.highlight(offset);
        
    }
    /** Hook this editor class to a specific HTMLTextAreaElement
     * @param {HTMLTextAreaElement} ta
     * @returns {Boolean} True if successful, false otherwise
     */
    hookToDiv (ta) {
        if (ta) {
            this.isHooked = true;

            this.element = ta;
            this.element.addEventListener("keyup", this.onchangehook);

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
