import { io } from "socket.io-client";

export const submissionSocket = io("/submission", { autoConnect: false });
