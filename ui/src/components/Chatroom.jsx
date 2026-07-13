import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import PropTypes from 'prop-types'

const socket = io.connect('http://localhost:3001')

const Chatroom = ({ username, room }) => {
    const storageKey = `chat_history_${room}`
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })
    const [isConnected, setIsConnected] = useState(socket.connected)
    const [typingUser, setTypingUser] = useState('')
    const typingTimeoutRef = useRef(null)

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        socket.emit('join_room', room)

        const handleReceive = (data) => {
            setMessages((prevMessages) => [...prevMessages, data])
        }
        const handleConnect = () => setIsConnected(true)
        const handleDisconnect = () => setIsConnected(false)
        const handleUserTyping = ({ username: typer }) => {
            if (typer === username) return
            setTypingUser(typer)
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => setTypingUser(''), 3000)
        }

        socket.on('receive_message', handleReceive)
        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)
        socket.on('user_is_typing', handleUserTyping)

        return () => {
            socket.off('receive_message', handleReceive)
            socket.off('connect', handleConnect)
            socket.off('disconnect', handleDisconnect)
            socket.off('user_is_typing', handleUserTyping)
            clearTimeout(typingTimeoutRef.current)
        }
    }, [room, username])

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(messages))
        } catch {
            // ignore write errors
        }
    }, [messages, storageKey])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const sendMessage = async () => {
        if (message.trim() === '') return

        const messageData = {
            room,
            author: username,
            message: message.trim(),
            time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
            id: crypto.randomUUID(),
        }

        socket.emit('send_message', messageData)
        setMessages((prevMessages) => [...prevMessages, messageData])
        setMessage('')
        inputRef.current?.focus()
    }

    return (
        <div className="mx-auto flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            <header className="flex items-center justify-between border-b border-gray-700 bg-gray-800/60 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span
                        className={`h-3 w-3 rounded-full ${
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        title={isConnected ? 'Connected' : 'Disconnected'}
                    />
                    <div className="text-left">
                        <h2 className="text-lg font-semibold leading-tight text-white">
                            #{room}
                        </h2>
                        <p className="text-xs text-gray-400">
                            {isConnected ? 'Connected' : 'Reconnecting...'}
                        </p>
                    </div>
                </div>
                <span className="rounded-full bg-gray-700 px-3 py-1 text-sm font-medium text-gray-200">
                    {username}
                </span>
            </header>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-gray-500">
                        <p className="text-base font-medium">No messages yet</p>
                        <p className="text-sm">Say hello to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.author === username
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-2 ${
                                    isOwn ? 'flex-row-reverse' : 'flex-row'
                                }`}
                            >
                                <div
                                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
                                        isOwn
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-200'
                                    }`}
                                >
                                    {msg.author?.charAt(0) ?? '?'}
                                </div>
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                        isOwn
                                            ? 'rounded-br-sm bg-blue-600 text-white'
                                            : 'rounded-bl-sm bg-gray-700 text-gray-100'
                                    }`}
                                >
                                    {!isOwn && (
                                        <p className="mb-0.5 text-xs font-semibold text-blue-300">
                                            {msg.author}
                                        </p>
                                    )}
                                    <p className="break-words text-sm leading-relaxed">
                                        {msg.message}
                                    </p>
                                    <p
                                        className={`mt-1 text-right text-[10px] ${
                                            isOwn ? 'text-blue-100' : 'text-gray-400'
                                        }`}
                                    >
                                        {msg.time}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
                {typingUser && (
                    <div className="px-1 pb-1 text-xs italic text-gray-400">
                        {typingUser} is typing...
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-700 bg-gray-800/60 px-4 py-3">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value)
                        socket.emit('typing', { username, room })
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 rounded-full border border-gray-600 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                    onClick={sendMessage}
                    disabled={message.trim() === ''}
                    className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                    Send
                </button>
            </div>
        </div>
    )
}

Chatroom.propTypes = {
    username: PropTypes.string.isRequired,
    room: PropTypes.string.isRequired,
}

export default Chatroom
