const path = require("path");
const { brotliDecompressSync } = require("zlib");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

/* -- VALIDATION -- */
function orderExists(req, res, next){
    const orderId = req.params.orderId;
    const foundOrder = orders.find(order => order.id === orderId);
    if(foundOrder){
        res.locals.order = foundOrder;
        return next()
    } else {
        next({
            status: 404,
            message: `Order does not exist: ${orderId}`
        })
    }
}

function bodyDataHas(propertyName) {
    return function (req, res, next){
        const { data = {} } = req.body;
        if (data[propertyName]) return next();
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        });
    };
}

function quantityIsValidNumber(req, res, next){
    const { data : {dishes} = {} } = req.body;
    const index = dishes.findIndex(dish => dish.id === req.params.dishId)

    if (dishes.quantity <= 0 || !Number.isInteger(dishes.quantity)) {
        return next ({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        })
    }
    next();
}

function dishesIsValidArray(req, res, next){
    const { data: {dishes} = {} } = req.body;
    console.log('dishes', dishes)
    if (!Array.isArray(dishes) || dishes.length === 0) return next({
        status: 400,
        message: `Order must include at least one dish`
    })
    else return next();
}


/* -- ROUTE HANDLING -- */
function list(req,res){
    res.json({ data: orders});
}

function read(req, res) {
    res.json({ data: res.locals.order})
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const { quantity } = dishes;

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    console.log('newO', newOrder)
    orders.push(newOrder);
    res.status(201).json({ data: newOrder})
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [
        bodyDataHas('deliverTo'),
        bodyDataHas('mobileNumber'),
        bodyDataHas('dishes'),
        dishesIsValidArray,
        quantityIsValidNumber,
        create
    ]
}