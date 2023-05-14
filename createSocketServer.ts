// Buffer Line
import { io } from "./server";

const userReceiptMap: Map<number, string> = new Map();
export function createSocketServer() {
  io.on("connection", function (socket) {
    socket.on("joinUserSocketRoom", function ({ userID }) {
      socket.join(userID);
    });

    socket.on("joinReceiptRoom", function ({ userID, receiptStringID }) {
      let joinedReceipt = userReceiptMap.get(userID);
      if (joinedReceipt !== undefined) {
        socket.leave(joinedReceipt);
      }
      socket.join(receiptStringID);
      userReceiptMap.set(userID, receiptStringID);
    });

    socket.on("leaveSocketRoom", function ({ roomName }) {
      socket.leave(roomName);
    });

    socket.on("disconnect", function () {
      console.log("disconnected");
    });
  });
}
