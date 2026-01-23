import { Client, Environment } from "square";

// creating the square client
export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // Switch to Environment.Production when going live. For now, keep as sandbox to test functionality.
});

export const paymentsApi = squareClient.paymentsApi;