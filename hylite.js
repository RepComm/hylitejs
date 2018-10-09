/** Hylite.js basic syntax highlighter
 * @author Jonathan Crowder
 */

class Lexer {
    static scan_number_literal(start, toScan) {
        let toScanLength = toScan.length;
        if (start > toScanLength) {
            console.error("Start is past size of string data to search");
        }
        let result = "";
        for (let i=start; i<toScanLength; i++) {
            if (".0123456789".includes(toScan[i])) {
                result+=toScan[i];
            } else {
                return result;
            }
        }
        return result;
    }
    static scan_string_literal(delim, start, toScan) {
        let end = toScan.indexOf(delim, start);
        if (end === -1) {
            console.error("Scanned string without finding next", delim);
            return false;
        }
        if (end > toScan.length) {
            console.error("Start is past size of string data to search");
            return false;
        }
        return toScan.substring(start, end);
    }
    static scan_identifier(start, toScan) {
        let toScanLength = toScan.length;
        let result = "";
        for (let i=start; i<toScanLength; i++) {
            if (toScan[i].match(/[_a-zA-Z0-9]/)) {
                result+=toScan[i];
            } else {
                return result;
            }
        }
        return result;
    }
    static scan_comment_line(start, toScan) {
        let toScanLength = toScan.length;
        let result = "";
        for (let i=start; i<toScanLength; i++) {
            if (toScan[i] == '\n') {
                return result;
            } else {
                result+=toScan[i];
            }
        }
        return result;
    }
    static scan_whitespace (start, toScan) {
        let toScanLength = toScan.length;
        let result = "";
        for (let i=start; i<toScanLength; i++) {
            if (toScan[i] !== ' ') {
                return result;
            } else {
                result+=toScan[i];
            }
        }
        return result;
    }
    static lex (data) {
        data = data.replace(/ /g,' ');
        let tokens = [];
        let currentToken;
        let currentLine = 0;
        let thisLineCharOffset = 0;

        for (let i=0; i<data.length; i++) {
            if (data[i] == " ") {
                let whitespace = Lexer.scan_whitespace(i, data);
                i+=whitespace.length+1;

                currentToken = {
                    type:"whitespace",
                    data:whitespace,
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                }
                tokens.push(currentToken);
            } else if (data[i] == '\n') {
                currentToken = {
                    type:"new_line",
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                }
                tokens.push(currentToken);
                currentLine++;
                thisLineCharOffset = i;
            } else if (data[i] == '/') {
                if (i !== data.length-1 && data[i+1] == "/") {
                    let cmt = Lexer.scan_comment_line(i+2, data);
                    i+= cmt.length + 1;
                    console.log("Code comment:", cmt); 
                } else {
                    currentToken = {
                        type:"operator",
                        data:data[i],
                        lineNumber:currentLine,
                        charInLine:i-thisLineCharOffset
                    }
                    tokens.push(currentToken);
                }
            } else if ("+-*/<>".includes(data[i])) {
                currentToken = {
                    type:"operator",
                    data:data[i],
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                }
                tokens.push(currentToken);
            } else if ("(){},.:=;".includes(data[i])) {
                currentToken = {
                    type:"symbol",
                    data:data[i],
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                }
                tokens.push(currentToken);
            } else if (data[i] == '"') {
                let literal = Lexer.scan_string_literal('\"', i+1, data);
                if (!literal) return false;

                currentToken = {
                    type:"string_literal",
                    data:literal,
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                };

                i+= literal.length+1;
                tokens.push(currentToken);
            } else if (data[i].match("[.0-9]")) {
                let literal = Lexer.scan_number_literal(i, data);

                currentToken = {
                    type:"number_literal",
                    data:literal,
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                };

                i+= literal.length-1;
                tokens.push(currentToken);
            } else if (data[i].match(/[_a-zA-Z]/)) {
                let identifier = Lexer.scan_identifier(i, data);

                //For keywords loop

                currentToken = {
                    type:"identifier",
                    data:identifier,
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                };

                i+= identifier.length-1;
                tokens.push(currentToken);
            } else if (data[i] == '\t') {

            } else {
                console.error("Illegal char to parse", data[i], "at line", currentLine, ":", i-thisLineCharOffset);
            }
        }
        return tokens;
    }
}

class HtmlHelper {
    static symbol (txt) {
        let span = document.createElement("span");
        span.textContent = txt;
        span.className = "symbol";
        return span;
    }
    static operator (txt) {
        let span = document.createElement("span");
        span.textContent = txt;
        span.className = "operator";
        return span;
    }
    static keyword (txt) {
        let span = document.createElement("span");
        span.textContent = txt;
        span.className = "keyword";
        return span;
    }
    static identifier (txt) {
        let span = document.createElement("span");
        span.textContent = txt;
        span.className = "identifier";
        return span;
    }
    static other_text (txt) {
        let span = document.createElement("span");
        span.textContent = txt;
        span.className = "other_text";
        return span;
    }
    static number_literal (txt) {
        let span = document.createElement("span");
        span.textContent = txt;
        span.className = "number_literal";
        return span;
    }
    static string_literal (txt) {
        let span = document.createElement("span");
        span.textContent = "\"" + txt + "\"";
        span.className = "string_literal";
        return span;
    }
    static new_line () {
        return document.createElement("br");
    }
}

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
    onContentChanged (evt) {
        clearTimeout(this.highlightTimeout);
        if (evt.ctrlKey) {
            if (evt.key == "v") {
                return;
            }
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
        let tokens = Lexer.lex(this.element.innerText);
        this.highlightTimeout = setTimeout(()=>{
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
                //this.debugelement.innerHTML = "No Tokens yet";
            }
            //this.tokenize(this.element.innerText);// + evt.key);
            let sel = window.getSelection();
            let offset = sel.focusOffset;
            let focus = sel.focusNode;

            let range = document.createRange();
            range.selectNode(focus);
            range.setStart(focus, offset);

            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }, 500);
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

/** Example
 * let editor = new HyliteEditor();
 * editor.hookToTextArea( textarea );
 * 
 * let jsLang = HyliteLanguage("languages/javascript.json");
 * 
 * editor.setLanguage ( jsLang );
 */