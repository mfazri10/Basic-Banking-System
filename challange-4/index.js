// Import Express and Prisma.js
import express from "express";
import prisma from "@prisma/client";

// Initialize Express app
const app = express();

// Initialize Prisma client
const prismaClient = new prisma.PrismaClient();

// Endpoint untuk menambahkan user baru
app.post("/api/v1/users", async (req, res) => {
  // Validate request body
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({
      message: "Data tidak valid",
    });
    return;
  }

  // Create new user
  const user = await prismaClient.user.create({
    data: {
      name,
      email,
      password,
    },
  });

  // Create new profile
  const profile = await prismaClient.profile.create({
    data: {
      userId: user.id,
      name: user.name,
      address: "",
      phone: "",
    },
  });

  // Respond with success
  res.status(201).json({
    user,
    profile,
  });
});

// Endpoint untuk menampilkan daftar users
app.get("/api/v1/users", async (req, res) => {
  // Get all users
  const users = await prismaClient.user.findMany();

  // Respond with success
  res.status(200).json(users);
});

// Endpoint untuk menampilkan detail informasi user
app.get("/api/v1/users/:userId", async (req, res) => {
  // Get user by ID
  const userId = req.params.userId;
  const user = await prismaClient.user.findOne({
    where: {
      id: userId,
    },
  });

  // Get profile by user ID
  const profile = await prismaClient.profile.findOne({
    where: {
      userId: userId,
    },
  });

  // Respond with success
  res.status(200).json({
    user,
    profile,
  });
});

// Endpoint untuk menambahkan akun baru
app.post("/api/v1/accounts", async (req, res) => {
  // Validate request body
  const { name, balance } = req.body;
  if (!name || !balance) {
    res.status(400).json({
      message: "Data tidak valid",
    });
    return;
  }

  // Get user by ID
  const userId = req.user.id;
  const user = await prismaClient.user.findOne({
    where: {
      id: userId,
    },
  });

  // Create new account
  const account = await prismaClient.bankAccount.create({
    data: {
      name,
      balance,
      user: {
        id: user.id,
      },
    },
  });

  // Respond with success
  res.status(201).json({
    account,
  });
});

// Endpoint untuk menampilkan daftar akun
app.get("/api/v1/accounts", async (req, res) => {
  // Get accounts by user ID
  const userId = req.user.id;
  const accounts = await prismaClient.bankAccount.findMany({
    where: {
      user: {
        id: userId,
      },
    },
  });

  // Respond with success
  res.status(200).json(accounts);
});

// Endpoint untuk menampilkan detail akun
app.get("/api/v1/accounts/:accountId", async (req, res) => {
  // Get account by ID
  const accountId = req.params.accountId;
  const account = await prismaClient.bankAccount.findOne({
    where: {
      id: accountId,
    },
  });

  // Respond with success
  res.status(200).json(account);
});

// Endpoint untuk mengirimkan uang dari 1 akun ke akun lain
app.post("/api/v1/transactions", async (req, res) => {
  // Validate request body
  const { fromAccountId, toAccountId, amount } = req.body;
  if (!fromAccountId || !toAccountId || !amount) {
    res.status(400).json({
      message: "Data tidak valid",
    });
    return;
  }

  // Get from account by ID
  const fromAccount = await prismaClient.bankAccount.findOne({
    where: {
      id: fromAccountId,
    },
  });

  // Get to account by ID
  const toAccount = await prismaClient.bankAccount.findOne({
    where: {
      id: toAccountId,
    },
  });

  // Check if from account has enough balance
  if (fromAccount.balance < amount) {
    res.status(400).json({
      message: "Saldo tidak mencukupi",
    });
    return;
  }

  // Create new transaction
  const transaction = await prismaClient.transaction.create({
    data: {
      amount,
      type: "transfer",
      fromBankAccount: {
        id: fromAccount.id,
      },
      toBankAccount: {
        id: toAccount.id,
      },
    },
  });

  // Update from account balance
  await prismaClient.bankAccount.update({
    where: {
      id: fromAccount.id,
    },
    data: {
      balance: fromAccount.balance - amount,
    },
  });

  // Update to account balance
  await prismaClient.bankAccount.update({
    where: {
      id: toAccount.id,
    },
    data: {
      balance: toAccount.balance + amount,
    },
  });

  // Respond with success
  res.status(201).json({
    transaction,
  });
});
