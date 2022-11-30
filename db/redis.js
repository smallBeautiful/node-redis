const redis = require("redis");
const { REDIS_CONFIG } = require("../config");
const { host, port } = REDIS_CONFIG;
const client = redis.createClient({ host, port });

client.on("error", function (error) {
    console.error(error)
});

/* Redis API 为异步，使用 Promise 封装 */
function set (key, value) {
    return new Promise((resolve, reject) => {
        /* Only strings, dates and buffers are accepted */
        /* set 只能存储字符串、日期、buffers，所以如果要存储非字符串要转成字符串 */
        if (typeof value === "object") {
            JSON.stringify(value);
        } else if (value === undefined) {
            reject("value 不能为 undefined");
            return;
        };

        client.set(key, value, (err, replay) => {
            err && reject(err);
            client.expire(key, 60)
            resolve(replay);
        });
    });
};

function get (key) {
    return new Promise((resolve, reject) => {
        client.get(key, (err, val) => {
            err && reject(err);

            /* 利用 JSON.parse(string) 报错返回正确的数据格式 */
            try {
                resolve(JSON.parse(val));
            } catch (error) {
                resolve(val);
            }
        });
    });
};

module.exports = {
    get,
    set
};
