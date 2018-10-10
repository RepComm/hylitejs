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
        let span = document.createElement("span");
        span.appendChild(document.createElement("br"));
        span.className = "new_line";
        return span;
    }
}

export {HtmlHelper}