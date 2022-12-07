var schedule = require('node-schedule');


// 这是每当秒数为10时打印时间。如果想每隔10秒执行，设置 rule.second =[0,10,20,30,40,50]即可。
// rule支持设置的值有second,minute,hour,date,dayOfWeek,month,year
// var date = new Date(2022, 12, 7, 22, 28, 0);
// var j = schedule.scheduleJob(date, function(){
//     console.log('现在时间：',new Date());
// });
// var rule = new schedule.RecurrenceRule();
// rule.second = 10;
// var j = schedule.scheduleJob(rule, function(){
//     console.log('现在时间：',new Date());
// })


// 周一到周日的20点执行
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 22;
rule.minute = [38, 39, 40, 41, 42];
schedule.scheduleJob(rule,() => {
    console.log("执行任务");
})
