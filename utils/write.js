const fs = require('fs')
const path = require('path')
const { EventEmitter } = require('events')

class MyFileWriteStream extends EventEmitter {
    constructor(path, options = {}) {
        super()
        this.path = path
        this.fd = options.fd || null
        this.flag = options.flag || 'a'
        this.mode = options.mode || 438
        this.encoding = options.encoding || 'utf8'
        this.start = options.start || 0
        this.autoClose = options.autoClose
        this.highWaterMark = options.highWaterMark || 16 * 1024
        this.buffered = [] // 文件可写流对象缓冲区，本质是一个队列
        this.writing = false // 该参数用于判断write的数据是缓存(true)，还是直接消费(false)
        this.length = 0 // 缓冲区的实时字节数
        this.needDrain = false // 是否需要触发drain事件

        // 创建文件可写流时，默认打开文件
        this.open()
    }

    open() {
        fs.open(this.path, this.flag, this.mode, (err, fd) => {
            if (err) {
                this.emit('error', err)
            } else {
                this.fd = fd
                this.emit('open', fd)
            }
        })
    }

    write(chunk, encoding, callback) {
        // 参数校验与初始化
        if (typeof encoding === 'function') {
            callback = encoding
            encoding = 'utf8'
        }
        chunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)

        // write方法同步返回值flag准备
        this.length += chunk.length
        let flag = this.length < this.highWaterMark
        this.needDrain = !flag

        // writeOrBuffer
        if (this.writing) { // buffer流程
            this.buffered.push({ chunk, encoding, callback })
        } else { // write流程
            this.writing = true
            this._write(chunk, encoding, () => { // onwrite回调
                callback()// 执行原有回调
                this._clearBuffer() // 清空缓冲区
            })
        }
        return flag
    }

    _write(chunk, encoding, callback) {
        if (!this.fd) {
            this.once('open', this._write.bind(this, chunk, encoding, callback))
        } else {
            fs.write(this.fd, chunk, 0, chunk.length, this.start, (err, written) => {
                if (err) this.emit('error', err)
                this.start += written
                this.length -= written
                callback()
            })
        }
    }

    _clearBuffer() {
        if (this.buffered.length !== 0) { // 需要注意的是此处不能换成while循环，否则可写流缓冲区无意义，可写流缓冲区的意义在于降低写文件I/O的数量，防止I/O操作过多
            let { chunk, encoding, callback } = this.buffered.shift()
            this._write(chunk, encoding, () => {
                callback()
                this._clearBuffer()
            })
        } else {
            if (this.needDrain) {
                this.needDrain = false
                this.emit('drain')
            }
        }
    }
}

const mfw = new MyFileWriteStream(path.join(__dirname, '../data/a.txt'), {
    highWaterMark: 3,
    start: 0
})

mfw.on('drain', () => {
    console.log('drain');
})

mfw.write('456', () => {
    console.log('456\r');
})
