const Koa = require('koa')
const { koaBody } = require('koa-body')
const Router = require('koa-router')
const { redis } = require('./db')

const app = new Koa()
const router = new Router()
app.use(koaBody())

router.post('/redisSet', ctx => {
    const { key, data } = ctx.request.body
    redis.set(key, JSON.stringify(data)).then(res => {
        console.log(res)
    });
    ctx.body = {
        code: 200,
        message: "success"
    }
})

router.post('/redisGet', ctx => {
    const { key } = ctx.request.body
    redis.get(key).then(val => {
        console.log(val)
    });
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000, () => {
    console.log('app listen:3000')
})
