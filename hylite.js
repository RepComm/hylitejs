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
            if (toScan[i].match("[_a-zA-Z0-9]")) {
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
    static lex (data) {
        data = data.replace(/\s/g, " ");
        let tokens = [];
        let currentToken;
        let currentLine = 0;
        let thisLineCharOffset = 0;

        for (let i=0; i<data.length; i++) {
            if (data[i] == " ") {
                //Do nothing
            } else if (data[i] == '\n') {
                console.log("Got new line");
                currentLine++;
                thisLineCharOffset = i;
            } else if ("+-*/".includes(data[i])) {
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
            } else if (data[i].match("[_a-zA-Z]")) {
                let identifier = Lexer.scan_identifier(i, data);

                currentToken = {
                    type:"identifier",
                    data:identifier,
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                };

                i+= identifier.length;
                tokens.push(currentToken);
            } else if (data[i] == '\t') {

            } else if (data[i] == '#') {
                let cmt = Lexer.scan_comment_line(i, data);
                i+= cmt.length;
                console.log("Code comment:", cmt);
            } else {
                console.log("got", data[i], data[i].charCodeAt(0), " ".charCodeAt(0));
                //console.error("Illegal char to parse", data[i], "at line", currentLine, ":", i-thisLineCharOffset);
            }
        }
        return tokens;
    }
}

class HyliteEditor {
    constructor () {
        this.isHooked = false;
        this.element = undefined;
        this.language = undefined;
        this.onchangehook = (evt)=>this.onContentChanged(evt);
    }

    tokenize (text) {
        let tokens = undefined;
        let chars = undefined;
        let char;
        for (let i=0; i<text.length; i++) {
            char = text[i];
            if (this.language.isTerminator(char)) {
                if (chars) {
                    //if (!tokens) tokens = [];


                    //tokens.push(chars);
                }
                chars = undefined;
            } else {
                if (!chars) {
                    chars = "";
                    chars += char;
                } else {
                    chars += char;
                    if (i===text.length-1 || this.language.isTerminator(text[i+1])) {
                        if (this.language.isKeyword(chars)) {
                            if (!tokens) tokens = [];
                            tokens.push({
                                type:"keyword",
                                data:chars
                            });
                            chars = undefined;
                        } else if (this.language.isSymbol(text[i])) {
                            if (!tokens) tokens = [];
                            tokens.push({
                                type:"symbol",
                                data:text[i]
                            });
                            chars = undefined;
                        }
                    }
                }
            }
        }
        if (tokens) {
            if (this.debugelement) {
                let txt = "";
                for (let i=0; i<tokens.length; i++) {
                    txt += tokens[i].type + " " + tokens[i].data + "\n";
                }
                this.debugelement.innerHTML = txt;
            }
        } else {
            this.debugelement.innerHTML = "No Tokens yet";
        }
    }
    onContentChanged (evt) {
        let tokens = Lexer.lex(this.element.innerText);
        if (tokens) {
            if (this.debugelement) {
                let txt = "";
                for (let i=0; i<tokens.length; i++) {
                    txt += tokens[i].type + " " + tokens[i].data + "\n";
                }
                this.debugelement.innerHTML = txt;
            }
        } else {
            this.debugelement.innerHTML = "No Tokens yet";
        }
        //this.tokenize(this.element.innerText);// + evt.key);
    }
    /** Hook this editor class to a specific HTMLTextAreaElement
     * @param {HTMLTextAreaElement} ta
     * @returns {Boolean} True if successful, false otherwise
     */
    hookToCode (ta) {
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