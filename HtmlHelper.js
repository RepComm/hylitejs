class HtmlHelper {
    static symbol (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "symbol";
        return text;
    }
    static operator (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "operator";
        return text;
    }
    static keyword0 (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "keyword0";
        return text;
    }
    static keyword1 (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "keyword1";
        return text;
    }
    static identifier (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "identifier";
        return text;
    }
    static other_text (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "other_text";
        return text;
    }
    static commentline (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "commentline";
        return text;
    }
    static commentsection (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "commentsection";
        return text;
    }
    static number_literal (txt) {
        let text = document.createElement("text");
        text.textContent = txt;
        text.className = "number_literal";
        return text;
    }
    static string_literal (txt) {
        let text = document.createElement("text");
        text.textContent = "\"" + txt + "\"";
        text.className = "string_literal";
        return text;
    }
    static new_line () {
        let text = document.createElement("text");
        text.textContent = "\n";
        text.className = "new_line";
        return text;
    }
}

export {HtmlHelper}