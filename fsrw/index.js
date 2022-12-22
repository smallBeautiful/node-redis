const {write} = require('./fs-rw');//引入上述模块

write({
    file: 'config.json',
    data: JSON.stringify({data:"123456123456"})
},()=>{
    console.log("success");
},(err)=>{
    console.log("fail:",err);
})
write({
    file: 'config.json',
    data: JSON.stringify({data2:"211212"})
},()=>{
    console.log("success");
},(err)=>{
    console.log("fail:",err);
})
write({
    file: 'config.json',
    data: JSON.stringify({data3:"456456"})
},()=>{
    console.log("success");
},(err)=>{
    console.log("fail:",err);
})
write({
    file: 'config.json',
    data: JSON.stringify({data4:"7789"})
},()=>{
    console.log("success");
},(err)=>{
    console.log("fail:",err);
})
console.log(global.FILE_QUEUE)
