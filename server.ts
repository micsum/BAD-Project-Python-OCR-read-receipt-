// Buffer Line
import express, { Response, Request, NextFunction } from "express";
import { print } from "listening-on";
import path from "path";
import socketIO from "socket.io";
import http from "http";
import { knex } from "./db";
import { sessionMiddleware, hasLogin, form } from "./helper";
import { createSocketServer } from "./createSocketServer";
import { UserController } from "./login/userController";
import { UserService } from "./login/userService";
import { ReceiptController } from "./public/controller/createReceiptController";
import { ReceiptService } from "./public/service/createReceiptService";
import { DisplayController } from "./public/controller/displayController";
import { DisplayService } from "./public/service/displayService";
import { ClaimReceiptItemController } from "./public/controller/claimReceiptItemController";
import { ClaimReceiptItemService } from "./public/service/claimReceiptItemService";
import { TopUpController, stripe } from "./public/controller/topUpController";
import { TopUpService } from "./public/service/topUpService";

const app = express();
let server = http.createServer(app);
export let io = new socketIO.Server(server);

const receiptService = new ReceiptService(knex);
const receiptController = new ReceiptController(receiptService, form, io);
const userService = new UserService(knex);
const userController = new UserController(userService);
const displayService = new DisplayService(knex);
const displayController = new DisplayController(displayService);
const claimReceiptItemService = new ClaimReceiptItemService(knex);
const claimReceiptItemController = new ClaimReceiptItemController(
  claimReceiptItemService,
  io
);
const topUpService = new TopUpService(knex);
const topUpController = new TopUpController(stripe, topUpService);

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded());
app.use(sessionMiddleware);
app.use(express.static("login"));

app.use(userController.router);
app.use(hasLogin, receiptController.router);
app.use(hasLogin, displayController.router);
app.use(hasLogin, claimReceiptItemController.router);
app.use(hasLogin, topUpController.router);
app.use(hasLogin, express.static("public"));
createSocketServer();

app.use((req, res) => {
  res.status(404);
  res.sendFile(path.resolve("public", "error404.html")); //404 page to be constructed
});

let port = 8105;
server.listen(port, () => {
  print(port);
});
