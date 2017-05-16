//var express = require('express') 
import express from 'express'
//const express = require('express')
const router = express.Router()
import csrf from 'csurf'
import passport from 'passport'
import Order from '../models/order'
import Cart from '../models/cart'


const csrfProtection = csrf()
router.use(csrfProtection)

router.get('/profile', isLoggedIn, function (req, res, next) {
    Order.find({user: req.user}, function(err, orders) {
        if (err) {
            return res.write('Error!')
        }
        var cart
        orders.forEach(function(order) {
            cart = new Cart(order.cart)
            order.items = cart.generateArray()
        })
        res.render('user/profile', { orders: orders })
    })
})


router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout()
    res.redirect('/')
})

router.use('/', notLoggedIn, (req, res, next) => {
  return next()
})

router.get('/signup', (req, res, next) => {
    let messages = req.flash('error')
    res.render('user/signup', {
        csrfToken: req.csrfToken(),
        messages: messages,
        hasErrors: messages.length > 0
    })
})

router.post('/signup', passport.authenticate('local.signup', {
    failureRedirect: '/user/signup',
    failureFlash: true
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl
        req.session.oldUrl = null
        res.redirect(oldUrl)
    } else {
        res.redirect('/user/profile')
    }
})

router.get('/signin', function (req, res, next) {
    var messages = req.flash('error')
    res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0})
})

router.post('/signin', passport.authenticate('local.signin', {
    failureRedirect: '/user/signin',
    failureFlash: true
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl
        req.session.oldUrl = null
        res.redirect(oldUrl)
    } else {
        res.redirect('/user/profile')
    }
})

module.exports = router

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
}

function notLoggedIn(req, res, next){
    if (!req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
}
