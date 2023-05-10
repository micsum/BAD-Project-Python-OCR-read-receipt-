// Buffer Line
import express, { Response, Request, NextFunction } from "express";
import { print } from "listening-on";
import path from "path";
import socketIO from "socket.io";
import http from "http";
import { knex } from "./db";
import { sessionMiddleware } from "./public/routes/helper";
import { ReceiptController } from "./public/controller/createReceiptController";
import { ReceiptService } from "./public/service/createReceiptService";
import { uploadDir, form } from "./public/routes/helper";
import { UserService } from "./public/service/userService";
import { UserController } from "./public/controller/userController";

const receiptService = new ReceiptService(knex);
const receiptController = new ReceiptController(receiptService, form);
const userService = new UserService(knex);
const userController = new UserController(userService);
const app = express();
let server = http.createServer(app);
export let io = new socketIO.Server(server);

app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded());

app.use(sessionMiddleware);
app.use(receiptController.router);
app.use(userController.router);
//app.use(receiptController.router);
//app.use(receiptController.router);

app.use(express.static("public"));

app.use((req, res) => {
  res.status(404);
  res.sendFile(path.resolve("public", "error404.html")); //404 page to be constructed
});

let port = 8105;
server.listen(port, () => {
  print(port);
});
