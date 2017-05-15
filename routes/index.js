//var express = require('express');
import express from 'express';
//const express = require('express');
const router = express.Router();


import Product from '../models/product';
import Cart from '../models/cart';
import Order from '../models/order';

/* GET home page. */
router.get('/', (req, res, next) => {
  let successMsg = req.flash('success')[0];
    Product.find((err, docs) => {
        let productChunks = [];
        const chunkSize = 3;
        for (let i = 0; i < docs.length; i += chunkSize) {
            productChunks.push(docs.slice(i, i + chunkSize));
        }
        res.render('shop/index', {
            title: 'Girly in Alpha phase!',
            products: productChunks,
            successMsg: successMsg,
            noMessages: !successMsg
        });
    });
});

router.get('/add-to-cart/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function(err, product) {
       if (err) {
           return res.redirect('/');
       }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    });
});

router.get('/reduce/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/remove/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next) {
   if (!req.session.cart) {
       return res.render('shop/shopping-cart', {products: null});
   }
    var cart = new Cart(req.session.cart);
    res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', isLoggedIn, (req, res, next) => {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];
  res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/checkout', isLoggedIn, (req, res, next) => {
  if (!req.session.cart) {
      return res.render('shop/shopping-cart', {products: null});
  }

  var cart = new Cart(req.session.cart);

  var stripe = require("stripe")(
       "sk_test_YlEp03eZEHZnTbgMBTdcSlGn"
   );

   stripe.charges.create({
       amount: cart.totalPrice * 100,
       currency: "usd",
       source: req.body.stripeToken, // obtained with Stripe.js
       description: "Test Charge"
   }, function(err, charge) {
       if (err) {
           req.flash('error', err.message);
           return res.redirect('/checkout');
       }
       var order = new Order({
       user: req.user,
       cart: cart,
       address: req.body.address,
       name: req.body.name,
       paymentId: charge.id
   });
   order.save(function(err, result) {
       req.flash('success', 'Successfully bought product!');
       req.session.cart = null;
       res.redirect('/');
   });
});
});


module.exports = router;

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}
