
import { Worker } from 'bullmq'

const emailWorker = new Worker(
    'email',
    async (job) => {
        const { name, email } = job.data

        if (job.name === 'welcome') {
            console.log(
                `Приветственное письмо отправлено: ${name} (${email})`
            )
        }

        if (job.name === 'reminder') {
            console.log(
                `Напоминание отправлено: ${name} (${email})`
            )
        }
    },
    {
        connection: {
            host: '127.0.0.1',
            port: 6379,
            maxRetriesPerRequest: null
        }
    }
)

emailWorker.on('completed', (job) => {
    console.log(`Задача ${job.name} выполнена`)
})

emailWorker.on('failed', (job, error) => {
    console.error(`Ошибка задачи ${job?.name}:`, error)
})

console.log('Email Worker запущен')
