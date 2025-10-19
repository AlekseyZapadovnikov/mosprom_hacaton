import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';
import { chatAPI } from '../services/api';

function ChatPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await chatAPI.getMessages(user.id);
      setMessages(response.data.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    setInput('');
    setLoading(true);

    try {
      await chatAPI.sendMessage({
        sender_id: user.id,
        receiver_id: null,
        message: messageText,
        chat_type: 'group'
      });

      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 80px)', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div className="container" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        padding: '1.5rem',
        maxHeight: '100%'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>Общий чат</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Общайтесь со студентами, компаниями и представителями вузов
          </p>
        </div>

        {/* Messages Container */}
        <div className="card" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                color: 'var(--text-secondary)'
              }}>
                <MessageSquare size={48} style={{ margin: '0 auto 1rem' }} />
                <h4>Пока нет сообщений</h4>
                <p>Начните общение первым!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user.id;
                
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isOwnMessage && (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <UserIcon size={20} />
                      </div>
                    )}
                    
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: '1rem',
                        backgroundColor: isOwnMessage 
                          ? 'var(--primary-color)' 
                          : 'var(--bg-tertiary)',
                        color: isOwnMessage ? 'white' : 'var(--text-primary)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.8,
                        marginBottom: '0.25rem'
                      }}>
                        {isOwnMessage ? 'Вы' : 'Пользователь'}
                      </div>
                      {message.message}
                      <div style={{ 
                        fontSize: '0.7rem', 
                        opacity: 0.7,
                        marginTop: '0.25rem'
                      }}>
                        {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {isOwnMessage && (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <UserIcon size={20} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите сообщение..."
                className="form-input"
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn btn-primary"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;