
import { Queue } from 'bullmq'

export const emailQueue = new Queue('email', {
    connection: {
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: null
    }
})
