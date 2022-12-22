// 异步文件写入
var fs = require('fs');
// let ws
// function createStream() {
//     if (!ws) {
//         ws = fs.createWriteStream('b.txt', { flags: 'a', defaultEncoding: 'utf8', })
//     }
// }
// // 打开文件
// function writeToFile(str = '') {
//     createStream()
//     ws.write(str + '\n')
// }
//
// for (let i = 0; i < 10000; i++) {
//     writeToFile(String(i))
// }

const ws = fs.createWriteStream('b.txt', { flags: 'a', defaultEncoding: 'utf8', })
ws.write(11111 + '\n')
