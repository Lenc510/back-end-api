import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3000;

let pool = null;

function conectarBD() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.URL_BD,
    });
  }
  return pool;
}

const db = conectarBD();

let dbStatus = "ok";
try {
  await db.query("SELECT 1");
  console.log("Conexão com o banco de dados estabelecida com sucesso!");
} catch (e) {
  dbStatus = e.message;
  console.error("Erro na conexão com o banco de dados:", dbStatus);
}

app.get("/", async (req, res) => {
  console.log("Rota GET / solicitada");
  res.json({
    message: "API para questões da prova",
    author: "Luick eduardo Neres Costa",
    statusBD: dbStatus,
  });
});

app.get("/questoes", async (req, res) => {
  console.log("Rota GET /questoes solicitada");
  try {
    const resultado = await db.query("SELECT * FROM questoes");
    const dados = resultado.rows;
    res.json(dados);
  } catch (e) {
    console.error("Erro ao buscar questões:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
      mensagem: "Não foi possível buscar as questões",
    });
  }
});

app.listen(port, () => {
  console.log(`Serviço rodando na porta: ${port}`);
});