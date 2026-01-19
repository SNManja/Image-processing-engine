export function setupJSONEditor() {

    const textareaId = "pipeline-json-textarea";
    const el = document.getElementById(textareaId);
    if (!el) return;

    el.addEventListener('keydown', (e) => {
        const { value, selectionStart, selectionEnd } = el;

        if (e.key === 'Tab') {
            e.preventDefault();
            el.value = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
            el.selectionStart = el.selectionEnd = selectionStart + 4;
        }

        // 2. Auto-indentación al presionar Enter
        if (e.key === 'Enter') {
            e.preventDefault();
            // Encontrar la indentación de la línea actual
            const before = value.substring(0, selectionStart);
            const lines = before.split('\n');
            const currentLine = lines[lines.length - 1];
            const indent = currentLine.match(/^\s*/)[0];
            
            // Si la línea termina en '{' o '[', aumentar indentación
            const extraIndent = /[{[]$/.test(currentLine.trim()) ? "  " : "";
            
            const newText = "\n" + indent + extraIndent;
            el.value = before + newText + value.substring(selectionEnd);
            el.selectionStart = el.selectionEnd = selectionStart + newText.length;
        }

        // 3. Auto-cierre de brackets y comillas
        const pairs = { '{': '}', '[': ']', '"': '"', "'": "'" };
        if (pairs[e.key]) {
            e.preventDefault();
            const pair = pairs[e.key];
            el.value = value.substring(0, selectionStart) + e.key + pair + value.substring(selectionEnd);
            el.selectionStart = el.selectionEnd = selectionStart + 1;
        }
    });
}