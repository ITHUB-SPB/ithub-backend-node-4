
import { Server } from 'socket.io'
import type { Server as HttpServer } from 'node:http'

import type { AuthUser } from './types.js'
import { verifyToken } from './utils/auth.js'
import { prisma } from './prisma.js'

type OnlineUser = {
    id: number
    email: string
    role: 'user' | 'moderator'
}

type ChatMessage = {
    sender: OnlineUser
    text: string
    createdAt: string
}

type RoomMessage = {
    roomId: string
    sender: OnlineUser
    text: string
    createdAt: string
}

interface ClientToServerEvents {
    'message:send': (data: { text: string }) => void
    'room:join': (data: { roomId: string }) => void
    'room:leave': (data: { roomId: string }) => void
    'room:message': (data: {
        roomId: string
        text: string
    }) => void
}

interface ServerToClientEvents {
    'message:new': (message: ChatMessage) => void
    'user:online': (user: OnlineUser) => void
    'user:offline': (data: { userId: number }) => void
    'users:online': (users: OnlineUser[]) => void
    'room:message': (message: RoomMessage) => void
}

interface SocketData {
    user: AuthUser
}

type ChatServer = Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
>

const onlineUsers = new Map<
    number,
    {
        user: OnlineUser
        sockets: Set<string>
    }
>()

export function setupChat(httpServer: HttpServer): void {

    const io: ChatServer = new Server(httpServer)

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth['token']

            if (typeof token !== 'string' || !token) {
                next(new Error('Требуется авторизация'))
                return
            }

            const payload = verifyToken(token, 'access')

            const account = await prisma.account.findUnique({
                where: {
                    id: payload.sub
                },
                select: {
                    id: true,
                    email: true,
                    role: true
                }
            })

            if (!account) {
                next(new Error('Пользователь не найден'))
                return
            }

            socket.data.user = {
                id: account.id,
                email: account.email,
                role: account.role
            }

            next()

        } catch {
            next(new Error('Недействительный JWT-токен'))
        }
    })

    io.on('connection', (socket) => {

        const account = socket.data.user

        const user: OnlineUser = {
            id: account.id,
            email: account.email,
            role: account.role
        }

        const usersList = Array.from(onlineUsers.values())
            .filter(item => item.user.id !== user.id)
            .map(item => item.user)

        socket.emit('users:online', usersList)

        let onlineUser = onlineUsers.get(user.id)

        const isFirstConnection = !onlineUser

        if (!onlineUser) {
            onlineUser = {
                user,
                sockets: new Set<string>()
            }

            onlineUsers.set(user.id, onlineUser)
        }

        onlineUser.sockets.add(socket.id)

        if (isFirstConnection) {
            socket.broadcast.emit('user:online', user)
        }

        socket.on('message:send', (data) => {

            const text = data?.text?.trim()

            if (!text || text.length > 2000) {
                return
            }

            const message: ChatMessage = {
                sender: user,
                text,
                createdAt: new Date().toISOString()
            }

            io.emit('message:new', message)
        })

        socket.on('room:join', (data) => {

            const roomId = data?.roomId?.trim()

            if (!roomId || roomId.length > 100) {
                return
            }

            socket.join(roomId)
        })

        socket.on('room:leave', (data) => {

            const roomId = data?.roomId?.trim()

            if (!roomId || roomId.length > 100) {
                return
            }

            socket.leave(roomId)
        })

        socket.on('room:message', (data) => {

            const roomId = data?.roomId?.trim()
            const text = data?.text?.trim()

            if (
                !roomId ||
                roomId.length > 100 ||
                !text ||
                text.length > 2000 ||
                !socket.rooms.has(roomId)
            ) {
                return
            }

            const message: RoomMessage = {
                roomId,
                sender: user,
                text,
                createdAt: new Date().toISOString()
            }

            io.to(roomId).emit('room:message', message)
        })

        socket.on('disconnect', () => {

            const currentUser = onlineUsers.get(user.id)

            if (!currentUser) {
                return
            }

            currentUser.sockets.delete(socket.id)

            if (currentUser.sockets.size === 0) {

                onlineUsers.delete(user.id)

                io.emit('user:offline', {
                    userId: user.id
                })
            }
        })
    })

    console.log('Socket.io чат запущен')
}
