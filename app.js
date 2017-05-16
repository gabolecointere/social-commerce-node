import express from 'express'
import path from 'path'
import favicon from 'serve-favicon'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import expressHbs from 'express-handlebars'
import mongoose from 'mongoose'
import session from 'express-session'
import passport from 'passport'
import flash from 'connect-flash'
import validator from 'express-validator'
var MongoStore = require('connect-mongo')(session)

import index from './routes/index'
import userRoutes from './routes/user'

const app = express()

mongoose.connect('localhost:27017/girlyalpha')  
require('./config/passport')

// view engine setup
app.engine('.hbs', expressHbs({
    defaultLayout: 'layout',
    extname: '.hbs'
}))
app.set('view engine', '.hbs')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(validator())
app.use(cookieParser())
app.use(session({
    secret: 'mysupersecret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    cookie: { maxAge: 180 * 60 * 1000 }
}))

app.use(flash())
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
  res.locals.login =  req.isAuthenticated()
  res.locals.session = req.session
  next()
})

app.use('/user', userRoutes)
app.use('/', index)

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app
