const path = require("path");
const { brotliDecompressSync } = require("zlib");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

/* -- VALIDATION -- */
function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) return next();
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function quantityIsValidNumber(req, res, next) {
  const { dishes } = ({} = req.body.data);
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });

  next();
}

function dishesIsValidArray(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length === 0)
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  else return next();
}

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;

  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  if (status === "delivered")
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  return next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function bodyDataIdMatchesParamsId(req, res, next) {
  if (!req.body.data.id) return next();
  if (req.body.data.id === req.params.orderId) {
    next();
  } else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.orderId}`,
    });
  }
}

function isPendingCheck(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status !== "pending")
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  return next();
}

/* -- ROUTE HANDLING -- */
function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  console.log("dishes", dishes, "newO", newOrder);
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const { quantity } = dishes;
  const foundOrder = res.locals.order;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  foundOrder.dishes.quantity = quantity;

  res.json({ data: foundOrder });
}

function destroy(req, res) {
  const orderId = req.params.orderId;
  const index = orders.findIndex((order) => order.id === orderId);

  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValidArray,
    quantityIsValidNumber,
    create,
  ],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesIsValidArray,
    statusPropertyIsValid,
    bodyDataIdMatchesParamsId,
    quantityIsValidNumber,
    update,
  ],
  destroy: [orderExists, isPendingCheck, destroy],
};
