(function() {
    const vscode = acquireVsCodeApi();
    const messagesContainer = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');

    function renderAnswerContent(content) {
        const container = document.createElement('div');
        
        // Convert markdown to HTML
        const html = marked.parse(content, {
            breaks: true,
            gfm: true,
            mangle: false,
            headerIds: false
        });
        
        container.innerHTML = html;
        
        // Render LaTeX with MathJax
        MathJax.typesetPromise([container]).catch(err => {
            console.error('MathJax error:', err);
        });
        
        return container;
    }

    function addMessage(text, isBot = false, isError = false) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isBot ? 'bot-message' : 'user-message'} ${isError ? 'error-message' : ''}`;
        
        // Parse think section
        const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/i);
        
        if (thinkMatch) {
            const thinkContent = thinkMatch[1].trim();
            const answerContent = thinkMatch[2].trim();
            
            // Create collapsible think section
            const thinkContainer = document.createElement('div');
            thinkContainer.className = 'think-container';
            
            const thinkHeader = document.createElement('div');
            thinkHeader.className = 'think-header';
            thinkHeader.innerHTML = `
                <span class="caret">▶</span>
                <span>Model's Thinking Process</span>
            `;
            
            const thinkContentEl = document.createElement('div');
            thinkContentEl.className = 'think-content';
            thinkContentEl.textContent = thinkContent;
            
            // Toggle visibility
            let isExpanded = false;
            thinkHeader.addEventListener('click', () => {
                isExpanded = !isExpanded;
                thinkContentEl.style.display = isExpanded ? 'block' : 'none';
                thinkHeader.querySelector('.caret').style.transform = 
                    isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
            });
    
            thinkContainer.appendChild(thinkHeader);
            thinkContainer.appendChild(thinkContentEl);
            
            // Add answer content
            const answerEl = document.createElement('div');
            answerEl.className = 'answer-content';
            // answerEl.innerHTML = answerContent; // Using innerHTML to preserve markdown
            answerEl.appendChild(renderAnswerContent(answerContent)); // Using innerHTML to preserve markdown
            
            messageEl.appendChild(thinkContainer);
            messageEl.appendChild(answerEl);
        } else {
            // messageEl.textContent = text;
            messageEl.appendChild(renderAnswerContent(text));
        }
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
            addMessage(text);
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
            input.value = '';
        }
    });

    window.addEventListener('message', event => {
        if (event.data.command === 'receiveMessage') {
            addMessage(event.data.content, true);
        }
    });
})();