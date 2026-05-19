import React, { useState, useEffect, useRef, useCallback } from 'react';
import supportApi from '../api/supportApi';
import './SupportPage.css';

const msgSender = (m) => m?.senderId ?? m?.sender ?? 'USER';
const msgBody = (m) => m?.content ?? m?.text ?? '';

const SupportPage = ({ user, notify }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [currentMsg, setCurrentMsg] = useState('');
  const scrollRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    if (!user?.id) return;
    try {
      const list = await supportApi.getByUser(user.id);
      setTickets(Array.isArray(list) ? list : []);
      setActiveTicket((prev) => {
        if (prev && list.some((t) => t.id === prev.id)) {
          return list.find((t) => t.id === prev.id) || prev;
        }
        return list.length > 0 ? list[0] : null;
      });
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setTickets([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTicket]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!currentMsg.trim()) return;

    if (!activeTicket) {
      try {
        const created = await supportApi.create({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          subject: 'Support Request',
          status: 'OPEN',
          message: currentMsg.trim(),
        });
        setActiveTicket(created);
        setTickets((prev) => [...prev.filter((t) => t.id !== created.id), created]);
        setCurrentMsg('');
        notify('Ticket created successfully!', 'success');
      } catch {
        notify('Failed to create ticket.', 'error');
      }
    } else {
      try {
        const updated = await supportApi.reply(activeTicket.id, currentMsg.trim(), 'USER');
        setActiveTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setCurrentMsg('');
      } catch {
        notify('Failed to send message.', 'error');
      }
    }
  };

  if (!user) {
    return (
      <div className="container animate-in support-page-container page-with-navbar-spacing">
        <div className="glass support-login-glass">
          <h2 className="support-login-title">Please Login</h2>
          <p className="support-login-text">You must be logged in to chat with our support team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-in support-main-container page-with-navbar-spacing">
      <div className="glass support-chat-glass">
        <div className="support-chat-header">
          <div>
            <h2 className="support-chat-title">Support Chat</h2>
            <p className="support-chat-status">Status: {activeTicket?.status || 'No active ticket'}</p>
          </div>
          <div className="support-chat-icon">💬</div>
        </div>

        <div ref={scrollRef} className="support-msg-area">
          {activeTicket?.messages?.length > 0 ? (
            activeTicket.messages.map((m, i) => {
              const sender = msgSender(m);
              const isUser = sender === 'USER' || sender === user.id;
              return (
                <div
                  key={`${activeTicket.id}-${i}`}
                  className={`support-msg-bubble ${isUser ? 'support-msg-bubble-user' : 'support-msg-bubble-other'}`}
                >
                  <div className="support-msg-text">{msgBody(m)}</div>
                  <div className="support-msg-time">
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="support-no-msg">Start a conversation with our support team.</div>
          )}
        </div>

        <form onSubmit={handleSend} className="support-input-area">
          <input
            value={currentMsg}
            onChange={(e) => setCurrentMsg(e.target.value)}
            placeholder="Type your message..."
            className="support-input-field"
          />
          <button type="submit" className="support-send-btn">
            Send
          </button>
        </form>
      </div>

      <div className="support-contact-section">
        <div className="glass hover-pop support-contact-card">
          <div className="support-contact-icon-1">📞</div>
          <div>
            <strong className="support-contact-title">Emergency Assistance</strong>
            <p className="support-contact-desc">+94 11 234 5678 (24/7)</p>
          </div>
        </div>
        <div className="glass hover-pop support-contact-card">
          <div className="support-contact-icon-2">💬</div>
          <div>
            <strong className="support-contact-title">WhatsApp Support</strong>
            <p className="support-contact-desc">+94 77 987 6543 (Immediate)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
