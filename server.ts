// Buffer Line
import express, { Response, Request, NextFunction } from "express";
import { print } from "listening-on";
import path from "path";
import socketIO from "socket.io";
import http from "http";
import { Knex } from "knex";
import { sessionMiddleware } from "./helper";
import { ReceiptController } from "./public/controller/receiptController";
import { ReceiptService } from "./public/service/receiptService";
import { uploadDir, form } from "./helper";

const receiptService = new ReceiptService();
const receiptController = new ReceiptController(receiptService, form);
const app = express();
let server = http.createServer(app);
export let io = new socketIO.Server(server);

app.use(express.static(uploadDir));
app.use(express.json());
app.use(express.urlencoded());

app.use(sessionMiddleware);
app.use(receiptController.router);
app.use(express.static("public"));

app.use((req, res) => {
  res.status(404);
  res.sendFile(path.resolve("public", "error404.html")); //404 page to be constructed
});

let port = 8105;
server.listen(port, () => {
  print(port);
});
