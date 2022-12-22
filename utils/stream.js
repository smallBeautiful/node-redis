const EventEmitter = require('events');
const fs = require('fs');

/**
 * 可写流需要考虑并发写的问题，比如并发写时，要确保写的顺序不错乱
 * 为了保证并发写顺序不会乱，WriteStream 创建了一个链表结构缓冲区
 * 用来按顺序缓存待写的内容，等待当前正在写的内容写完，再依次从缓冲区中一个一个读取出来继续写
 */
class Node {
    constructor(element) {
        this.element = element;
        this.next = null;
    }
}

class LinkList {
    constructor() {
        this.head = null;
        this.length = 0;
    }
    append(chunk) {
        let node = new Node(chunk);
        // 链表头
        if (this.head === null) {
            this.head = node;
        } else {
            // 找到最后一个把当前节点放到后面去
            let current = this.head;
            while(current.next) {
                current = current.next;
            }
            current.next = node;
        }
        this.length++;
    }
    get() {
        let head = this.head;
        if (!head) return;
        this.head = head.next;
        this.length--;
        return head.element;
    }
}

module.exports = class WritableStream extends EventEmitter {
    constructor(path, options) {
        super();
        // 写入文件的路径
        this.path = path;
        // 标识，写入文件要做的操作
        this.flags = options.flags || 'a'; // a：追加写入  w: 覆盖
        // 水位线，一次可写入缓存中的字节
        this.highWaterMark = options.highWaterMark || 16 * 1024;
        // 写入完毕是否关闭
        this.autoClose = options.autoClose || true;
        this.start = options.start || 0;
        this.mode = options.mode || 0o666;
        // 编码
        this.encoding = options.encoding || 'utf8';

        // 表示当前是否正在写入
        this._writing = false;
        // 缓冲区，如果当前正在写，就把待写入的内容放到缓冲区中
        this.cache = new LinkList();
        // 只有当前消耗掉了和期望值相等或者大于期望值的时候，设置成 true
        // 当缓存区的内容 + 正在写入的内容超过 highWaterMark 时
        this.needDrain = false;
        // 写入的位置的偏移量
        this.pos = this.start;
        // 打开文件准备写入
        this.open();

        // 用来统计 缓冲区 + 正在写入的内容的个数
        this.len = 0;
    }

    // 只能写字符串或 Buffer 类型的数据
    write(chunk, encoding = this.encoding, callback) {
        chunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        this.legn += chunk.length;
        let flag = this.len < this.highWaterMark;

        // 当 len >= highWaterMark 时，设置 needDrain 为 true，需要触发 drain 事件
        this.needDrain = !flag;

        if(this._writing) {
            // 当前正在写，将待写内容保存到缓冲区中
            this.cache.append({
                chunk,
                encoding,
                callback
            });
        } else {
            // 真正的写入逻辑
            this._writing = true;
            this._write(chunk, encoding, () => {
                callback && callback();
                // 从缓冲区中取出一个出来写
                this.clearBuffer();
            })
        }
        // true：没有超过 highWaterMark（可以继续写）
        // false：超过 highWaterMark（不能继续写了）
        return flag;
    }

    clearBuffer() {
        // 依此从链表中取出一个出来写
        let obj = this.cache.get();
        if (obj) {
            this._write(obj.chunk, obj.encoding, () => {
                obj.callback && obj.callback();
                this.clearBuffer();
            })
        } else {
            // obj 为 undefined 说明缓冲区已经清空完毕
            this._writing = false;
            if (this.needDrain) {
                // 当 needDrain 为 true 时，需要触发 drain 事件
                this.needDrain = false;
                this.emit('drain');
            }
        }
    }

    open() {
        fs.open(this.path, this.flags, (err, fd) => {
            this.fd = fd;
            this.emit('open', fd);
        })
    }

    _write(chunk, encoding, clearBuffer) {
        if (typeof this.fd !== 'number') {
            // 由于 fs.open 操作是异步的，所以这里要保证 fs.open 文件打开完毕，再开始写
            return this.once('open', () => this._write(chunk, encoding, clearBuffer))
        }
        fs.write(this.fd, chunk, 0, chunk.length, this.pos, (err, written) => {
            this.pos += written;
            this.len -= written;
            // 每次写入成功就从缓冲区中依次取出一个出来继续写
            clearBuffer();
        })
    }

    destroy(err) {
        fs.close(this.fd, () => {
            this.emit('close', err);
        })
    }

    // end 相当于 write + close
    end(data) {
        this.write(data, 'utf8', () => {
            this.destroy();
        });
    }
}
