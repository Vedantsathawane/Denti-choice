import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaPaperPlane, FaTimes, FaRobot, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import api from '../../services/api';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Denti-Choice AI Booking Assistant. How can I help you today? You can ask me to book, reschedule, or cancel appointments, or check doctor schedules!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputValue(prev => {
            const cleanPrev = prev.trim();
            return cleanPrev + (cleanPrev ? ' ' : '') + finalTranscript.trim();
          });
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          alert('Microphone permission blocked. Please allow microphone access in your browser settings (and ensure you are using localhost or HTTPS).');
        }
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }
  };

  // Basic markdown parser
  const renderMessageContent = (text) => {
    // Replace **bold** with <strong>bold</strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace newlines with <br />
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/ai/booking/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-id': '1' // Default clinic
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to stream AI chat');
      }

      setIsTyping(false);
      
      // Initialize blank assistant response
      const assistantMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(prev => 
            prev.map((msg, idx) => 
              idx === prev.length - 1 && msg.role === 'assistant' 
                ? { ...msg, content: msg.content + chunk } 
                : msg
            )
          );
        }
      }
    } catch (err) {
      console.error('Chat widget error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error connecting to the booking service. Please try again.' }
      ]);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-tr from-[#0066FF] to-[#00D2FF] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl focus:outline-none transition-shadow duration-300"
      >
        {isOpen ? <FaTimes size={24} /> : <FaComments size={26} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-20 right-0 w-[380px] md:w-[420px] h-[550px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#0066FF] to-[#00A3FF] text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FaRobot size={22} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-none">Denti-Choice AI</h4>
                  <span className="text-[11px] text-white/80 font-medium">Virtual Booking Coordinator</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors p-1 bg-white/10 rounded-full"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm transition-all ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-tr from-[#0066FF] to-[#0088FF] text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2.5 h-2.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2.5 h-2.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <div className="px-3 py-2 bg-gray-50/50 dark:bg-gray-900/30 flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none border-t border-gray-100 dark:border-gray-800">
                {['Who are the doctors?', 'What services do you have?', 'Book slot tomorrow', 'How to reschedule?'].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputValue(q)}
                    className="px-3 py-1.5 bg-blue-50/80 dark:bg-blue-950/80 text-[#0066FF] dark:text-blue-300 text-xs rounded-full border border-blue-100/30 dark:border-blue-900/30 hover:bg-[#0066FF] hover:text-white dark:hover:bg-[#0066FF] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Form */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={isListening ? 'Listening... Click to stop' : 'Voice Input'}
              >
                {isListening ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type or dictate message..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] dark:text-white"
              />
              <button
                type="submit"
                className="p-2.5 bg-gradient-to-tr from-[#0066FF] to-[#0088FF] text-white rounded-xl flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg focus:outline-none transition-shadow duration-300"
              >
                <FaPaperPlane size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
