document.addEventListener('DOMContentLoaded', () => {
    // المتغيرات العامة
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const themeToggle = document.getElementById('theme-toggle');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    // التحكم في الوضع المظلم
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // إضافة رسالة جديدة
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        
        // تحويل الروابط إلى عناصر قابلة للنقر
        const linkedMessage = message.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        messageDiv.innerHTML = linkedMessage;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // إظهار مؤشر الكتابة
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return indicator;
    }

    // إرسال رسالة إلى الخادم
    async function sendMessage(message) {
        if (!message.trim()) {
            console.log('Empty message, ignoring...');
            return;
        }

        // إضافة رسالة المستخدم
        addMessage(message, true);
        userInput.value = '';
        sendButton.disabled = true; // تعطيل زر الإرسال أثناء المعالجة

        // إظهار مؤشر الكتابة
        const typingIndicator = showTypingIndicator();

        try {
            // استخدام عنوان Glitch
            const apiUrl = 'https://bitter-safe-diplodocus.glitch.me/api/chat';
            console.log('Sending request to:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    message: message.trim(),
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();
            console.log('Server response:', data);
            
            // إزالة مؤشر الكتابة
            typingIndicator.remove();

            if (data.status === 'error') {
                addMessage(data.error || 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.');
                console.error('Server error:', data.error);
            } else {
                addMessage(data.response);
            }
        } catch (error) {
            console.error('Connection error:', error);
            typingIndicator.remove();
            addMessage('عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
        } finally {
            sendButton.disabled = false; // إعادة تفعيل زر الإرسال
            userInput.focus(); // إعادة التركيز إلى حقل الإدخال
        }
    }

    // معالجة الأحداث
    sendButton.addEventListener('click', () => {
        sendMessage(userInput.value);
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(userInput.value);
        }
    });

    themeToggle.addEventListener('click', toggleTheme);

    // إضافة الاقتراحات
    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            userInput.value = button.textContent;
            sendMessage(button.textContent);
        });
    });

    // رسالة الترحيب
    setTimeout(() => {
        addMessage('مرحباً! كيف يمكنني مساعدتك اليوم؟');
    }, 500);
});
