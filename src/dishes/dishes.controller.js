const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");

/* -- VALIDATION -- */
function dishExists(req, res, next){
    const dishId = req.params.dishId;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if(foundDish){
        res.locals.dish = foundDish;
        return next();
    }
    
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`
    })
}

function bodyDataHas(propertyName){
    return function (req, res, next){
        const { data = {} } = req.body;
        if (data[propertyName]) return next();
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`
        });
    };
}

function priceIsValidNumber(req, res, next) {
    const { data: {price} = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        return next ({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    };
    next()
}

function bodyDataIdMatchesParamsId(req, res, next){
    if (!req.body.data.id) return next();
    if (req.body.data.id === req.params.dishId){
        next();
    }else{
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`
        })
    }
}

/* -- ROUTE HANDLING -- */
function list(req, res){
    res.json({ data: dishes})
}

function read(req, res) {
    res.json({ data: res.locals.dish})
}

function create(req, res){
    const { data: { name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish})
}

function update(req, res, next){
    const { data: { name, description, price, image_url} = {} } = req.body;

    const foundDish = res.locals.dish;

    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish})
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [
        bodyDataHas('name'),
        bodyDataHas('description'),
        bodyDataHas('price'),
        bodyDataHas('image_url'),
        priceIsValidNumber,
        create
    ],
    update: [
        dishExists,
        bodyDataHas('name'),
        bodyDataHas('description'),
        bodyDataHas('price'),
        bodyDataHas('image_url'),
        priceIsValidNumber,
        bodyDataIdMatchesParamsId,
        update
    ]
}
