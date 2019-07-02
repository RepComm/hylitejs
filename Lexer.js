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
            //console.error("Scanned string without finding next", delim);
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
            if (toScan[i] == "\n") {
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
            if (toScan[i] !== " ") {
                return result;
            } else {
                result+=toScan[i];
            }
        }
        return result;
    }
    static lex (lang, data) {
        data = data.replace(/ /g," ");
        let tokens = [];
        let currentToken;
        let currentLine = 0;
        let thisLineCharOffset = 0;

        for (let i=0; i<data.length; i++) {
            if (data[i] == " ") {
                //let whitespace = Lexer.scan_whitespace(i, data);
                //i+=whitespace.length+1;

                currentToken = {
                    type:"whitespace",
                    //data:whitespace,
                    data:" ",
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                }
                tokens.push(currentToken);
            } else if (data[i] == "\n") {
                currentToken = {
                    type:"new_line",
                    lineNumber:currentLine,
                    charInLine:i-thisLineCharOffset
                }
                tokens.push(currentToken);
                currentLine++;
                thisLineCharOffset = i;
            } else if (data[i] == "/") {
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
            } else if (data[i] == "\"") {
                let literal = Lexer.scan_string_literal("\"", i+1, data);
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

                if (lang.keywords.includes(identifier)) {
                    currentToken = {
                        type:"keyword",
                        data:identifier,
                        lineNumber:currentLine,
                        charInLine:i-thisLineCharOffset
                    };
                } else {
                    currentToken = {
                        type:"identifier",
                        data:identifier,
                        lineNumber:currentLine,
                        charInLine:i-thisLineCharOffset
                    };
                }

                i+= identifier.length-1;
                tokens.push(currentToken);
            } else if (data[i] == "\t") {

            } else {
                console.error("Illegal char to parse", data[i], "at line", currentLine, ":", i-thisLineCharOffset);
            }
        }
        return tokens;
    }
}

export {Lexer}