// Buffer Line
import express, { Response, Request, NextFunction } from "express";
import { print } from "listening-on";
import path from "path";
import socketIO from "socket.io";
import http from "http";
import { knex } from "./db";
import { sessionMiddleware, form } from "./public/routes/helper";
import { UserController } from "./public/controller/userController";
import { UserService } from "./public/service/userService";
import { ReceiptController } from "./public/controller/createReceiptController";
import { ReceiptService } from "./public/service/createReceiptService";
import { DisplayController } from "./public/controller/displayController";
import { DisplayService } from "./public/service/displayService";
import { ClaimReceiptItemController } from "./public/controller/claimReceiptItemController";
import { ClaimReceiptItemService } from "./public/service/claimReceiptItemService";

const app = express();
let server = http.createServer(app);
let io = new socketIO.Server(server);

const receiptService = new ReceiptService(knex);
const receiptController = new ReceiptController(receiptService, form);
const userService = new UserService(knex);
const userController = new UserController(userService);
const displayService = new DisplayService(knex);
const displayController = new DisplayController(displayService);
const claimReceiptItemService = new ClaimReceiptItemService(knex);
const claimReceiptItemController = new ClaimReceiptItemController(
  claimReceiptItemService,
  io
);

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded());

app.use(sessionMiddleware);
app.use(receiptController.router);
app.use(userController.router);
app.use(displayController.router);
app.use(claimReceiptItemController.router);

app.use(express.static("public"));

app.use((req, res) => {
  res.status(404);
  res.sendFile(path.resolve("public", "error404.html")); //404 page to be constructed
});

let port = 8105;
server.listen(port, () => {
  print(port);
});
