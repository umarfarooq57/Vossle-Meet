/**
 * Vossle — Chat Panel v2
 * Professional in-call chat sidebar with message types and better UX.
 */

import React, { useState, useRef, useEffect } from 'react';

const ChatPanel = ({ messages, onSendMessage, onClose, currentUserId }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Group consecutive messages from same sender
    const groupedMessages = messages.reduce((groups, msg, i) => {
        const prev = messages[i - 1];
        if (prev && prev.senderId === msg.senderId &&
            (new Date(msg.timestamp) - new Date(prev.timestamp)) < 60000) {
            groups[groups.length - 1].msgs.push(msg);
        } else {
            groups.push({
                senderId: msg.senderId,
                senderName: msg.senderName,
                isMe: msg.senderId === currentUserId,
                msgs: [msg],
            });
        }
        return groups;
    }, []);

    return (
        <div style={s.panel}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.headerLeft}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3 style={s.title}>In-call messages</h3>
                </div>
                <button onClick={onClose} style={s.closeBtn} title="Close chat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            </div>

            {/* Messages area */}
            <div style={s.messagesArea}>
                {messages.length === 0 ? (
                    <div style={s.emptyState}>
                        <div style={s.emptyIcon}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5e5e73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p style={s.emptyTitle}>No messages yet</p>
                        <p style={s.emptyDesc}>Messages are only visible to people in the call</p>
                    </div>
                ) : (
                    groupedMessages.map((group, gi) => (
                        <div key={gi} style={{
                            ...s.messageGroup,
                            alignItems: group.isMe ? 'flex-end' : 'flex-start',
                        }}>
                            {!group.isMe && (
                                <div style={s.senderRow}>
                                    <div style={s.senderAvatar}>
                                        {group.senderName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span style={s.senderName}>{group.senderName}</span>
                                    <span style={s.msgTime}>{formatTime(group.msgs[0].timestamp)}</span>
                                </div>
                            )}
                            {group.isMe && (
                                <span style={s.msgTime}>{formatTime(group.msgs[0].timestamp)}</span>
                            )}
                            {group.msgs.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        ...s.msgBubble,
                                        ...(group.isMe ? s.myBubble : s.theirBubble),
                                    }}
                                >
                                    <p style={s.msgText}>{msg.message}</p>
                                </div>
                            ))}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={s.inputBar}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message to everyone"
                    style={s.input}
                    maxLength={1000}
                />
                <button
                    type="submit"
                    style={{
                        ...s.sendBtn,
                        opacity: input.trim() ? 1 : 0.4,
                    }}
                    disabled={!input.trim()}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

const s = {
    panel: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(18, 18, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    title: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#f0f0f5',
    },
    closeBtn: {
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        color: '#5e5e73',
        cursor: 'pointer',
        borderRadius: '6px',
        transition: 'all 150ms',
    },
    messagesArea: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '40px 20px',
    },
    emptyIcon: { opacity: 0.5 },
    emptyTitle: { color: '#9191a8', fontSize: '0.85rem', fontWeight: 500 },
    emptyDesc: { color: '#5e5e73', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.5 },
    messageGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        maxWidth: '88%',
    },
    senderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '2px',
    },
    senderAvatar: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.6rem',
        fontWeight: 700,
        color: 'white',
    },
    senderName: {
        fontSize: '0.72rem',
        fontWeight: 600,
        color: '#818cf8',
    },
    msgTime: {
        fontSize: '0.62rem',
        color: '#5e5e73',
    },
    msgBubble: {
        padding: '8px 12px',
        borderRadius: '12px',
        maxWidth: '100%',
    },
    myBubble: {
        background: 'rgba(99, 102, 241, 0.18)',
        borderBottomRightRadius: '4px',
    },
    theirBubble: {
        background: 'rgba(255,255,255,0.05)',
        borderBottomLeftRadius: '4px',
    },
    msgText: {
        fontSize: '0.82rem',
        color: '#f0f0f5',
        lineHeight: 1.5,
        wordBreak: 'break-word',
    },
    inputBar: {
        display: 'flex',
        gap: '8px',
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    input: {
        flex: 1,
        padding: '10px 14px',
        fontSize: '0.82rem',
        color: '#f0f0f5',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        outline: 'none',
        fontFamily: "'Inter', sans-serif",
        transition: 'border-color 150ms',
        boxSizing: 'border-box',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
    },
    sendBtn: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms',
    },
};

export default ChatPanel;
