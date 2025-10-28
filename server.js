import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3000;

app.use(express.json());

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
  res.json({
    message: "API para questões e usuários",
    author: "Luick Eduardo Neres Costa",
    statusBD: dbStatus,
  });
});


app.get("/questoes", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM questoes");
    res.json(resultado.rows);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar questões" });
  }
});

app.get("/questoes/:id", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM questoes WHERE id = $1", [req.params.id]);
    if (resultado.rows.length === 0) return res.status(404).json({ mensagem: "Questão não encontrada" });
    res.json(resultado.rows[0]);
  } catch (e) {
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

app.post("/questoes", async (req, res) => {
  try {
    const { enunciado, disciplina, tema, nivel } = req.body;
    if (!enunciado || !disciplina || !tema || !nivel) {
      return res.status(400).json({ erro: "Campos obrigatórios faltando" });
    }
    await db.query(
      "INSERT INTO questoes (enunciado, disciplina, tema, nivel) VALUES ($1, $2, $3, $4)",
      [enunciado, disciplina, tema, nivel]
    );
    res.status(201).json({ mensagem: "Questão criada com sucesso!" });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao criar questão" });
  }
});

app.put("/questoes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { enunciado, disciplina, tema, nivel } = req.body;

    const questaoExistente = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);
    if (questaoExistente.rows.length === 0)
      return res.status(404).json({ mensagem: "Questão não encontrada" });

    await db.query(
      "UPDATE questoes SET enunciado=$1, disciplina=$2, tema=$3, nivel=$4 WHERE id=$5",
      [
        enunciado || questaoExistente.rows[0].enunciado,
        disciplina || questaoExistente.rows[0].disciplina,
        tema || questaoExistente.rows[0].tema,
        nivel || questaoExistente.rows[0].nivel,
        id,
      ]
    );
    res.json({ mensagem: "Questão atualizada com sucesso!" });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao atualizar questão" });
  }
});

app.delete("/questoes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const questao = await db.query("SELECT * FROM questoes WHERE id = $1", [id]);
    if (questao.rows.length === 0) return res.status(404).json({ mensagem: "Questão não encontrada" });

    await db.query("DELETE FROM questoes WHERE id = $1", [id]);
    res.json({ mensagem: "Questão excluída com sucesso!" });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao excluir questão" });
  }
});



app.get("/usuarios", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.json(resultado.rows);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar usuários" });
  }
});

app.get("/usuarios/:id", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.params.id]);
    if (resultado.rows.length === 0)
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    res.json(resultado.rows[0]);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar usuário" });
  }
});

app.get("/usuarios/email/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const resultado = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);

    if (resultado.rows.length === 0)
      return res.status(404).json({ mensagem: "Usuário não encontrado com esse e-mail" });

    res.json(resultado.rows[0]);
  } catch (e) {
    console.error("Erro ao buscar usuário por e-mail:", e);
    res.status(500).json({ erro: "Erro interno ao buscar usuário" });
  }
});

app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Campos obrigatórios faltando" });
    }

    await db.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)",
      [nome, email, senha]
    );

    res.status(201).json({ mensagem: "Usuário criado com sucesso!" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao criar usuário" });
  }
});

app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    const usuario = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (usuario.rows.length === 0)
      return res.status(404).json({ mensagem: "Usuário não encontrado" });

    await db.query(
      "UPDATE usuarios SET nome=$1, email=$2, senha=$3 WHERE id=$4",
      [
        nome || usuario.rows[0].nome,
        email || usuario.rows[0].email,
        senha || usuario.rows[0].senha,
        id,
      ]
    );

    res.json({ mensagem: "Usuário atualizado com sucesso!" });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao atualizar usuário" });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await db.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    if (usuario.rows.length === 0)
      return res.status(404).json({ mensagem: "Usuário não encontrado" });

    await db.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.json({ mensagem: "Usuário excluído com sucesso!" });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao excluir usuário" });
  }
});


app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
