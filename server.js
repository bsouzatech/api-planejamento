const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================
// 💾 CONEXÃO COM O BANCO DE DADOS
// ========================================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // altere se for diferente
  password: "Bruno3308@", // sua senha do MySQL
  database: "planejamento",
});

// Testar conexão
db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco:", err);
  } else {
    console.log("✅ Conectado ao MySQL com sucesso!");
  }
});

// ========================================================
// 🚀 ROTAS PRINCIPAIS
// ========================================================

// Rota inicial
app.get("/", (req, res) => {
  res.send("🚀 API do Controle de Presença com Login funcionando!");
});

// ========================================================
// 📁 ROTAS DE PROJETOS
// ========================================================

// Criar novo projeto
app.post("/projetos", (req, res) => {
  const { nome, numero_os, data_inicio, data_fim } = req.body;
  const sql = "INSERT INTO projetos (nome, numero_os, data_inicio, data_fim) VALUES (?, ?, ?, ?)";
  db.query(sql, [nome, numero_os, data_inicio, data_fim], (err, result) => {
    if (err) {
      console.error("Erro ao criar projeto:", err);
      res.status(500).json({ erro: "Erro ao criar projeto" });
    } else {
      res.status(201).json({ mensagem: "Projeto criado com sucesso!" });
    }
  });
});

// Listar todos os projetos
app.get("/projetos", (req, res) => {
  db.query("SELECT * FROM projetos", (err, results) => {
    if (err) {
      res.status(500).json({ erro: err });
    } else {
      res.json(results);
    }
  });
});

// ========================================================
// 👷 ROTAS DE COLABORADORES
// ========================================================

// Adicionar colaborador
app.post("/colaboradores", (req, res) => {
  const { nome, funcao, turno } = req.body;
  const sql = "INSERT INTO colaboradores (nome, funcao, turno) VALUES (?, ?, ?)";
  db.query(sql, [nome, funcao, turno], (err, result) => {
    if (err) {
      console.error("Erro ao adicionar colaborador:", err);
      res.status(500).json({ erro: "Erro ao adicionar colaborador" });
    } else {
      res.status(201).json({ mensagem: "Colaborador adicionado com sucesso!" });
    }
  });
});

// ========================================================
// 🕒 ROTAS DE PRESENÇAS
// ========================================================

// Registrar presença
app.post("/presencas", (req, res) => {
  const { id_colaborador, id_projeto, data, status } = req.body;
  const sql = "INSERT INTO presencas (id_colaborador, id_projeto, data, status) VALUES (?, ?, ?, ?)";
  db.query(sql, [id_colaborador, id_projeto, data, status], (err, result) => {
    if (err) {
      console.error("Erro ao registrar presença:", err);
      res.status(500).json({ erro: "Erro ao registrar presença" });
    } else {
      res.status(201).json({ mensagem: "Presença registrada com sucesso!" });
    }
  });
});

// Listar presenças de um projeto
app.get("/presencas/:id_projeto", (req, res) => {
  const { id_projeto } = req.params;
  const sql = `
    SELECT c.nome, c.funcao, c.turno, p.data, p.status
    FROM presencas p
    JOIN colaboradores c ON c.id = p.id_colaborador
    WHERE p.id_projeto = ?
    ORDER BY c.nome, p.data;
  `;
  db.query(sql, [id_projeto], (err, results) => {
    if (err) {
      res.status(500).json({ erro: err });
    } else {
      res.json(results);
    }
  });
});

// ========================================================
// 🔐 ROTAS DE USUÁRIOS (LOGIN / REGISTRO)
// ========================================================

// Registrar novo usuário
app.post("/usuarios/registro", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Preencha todos os campos!" });
  }

  const senhaCriptografada = bcrypt.hashSync(senha, 10);

  db.query(
    "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
    [nome, email, senhaCriptografada],
    (err, result) => {
      if (err) {
        console.error("Erro ao registrar usuário:", err);
        return res.status(500).json({ error: "Erro ao registrar usuário." });
      }
      res.status(201).json({ message: "Usuário registrado com sucesso!" });
    }
  );
});

// Login de usuário
app.post("/usuarios/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Informe o e-mail e a senha!" });
  }

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro no servidor." });
    if (results.length === 0)
      return res.status(401).json({ error: "Usuário não encontrado!" });

    const usuario = results[0];
    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);

    if (!senhaCorreta)
      return res.status(401).json({ error: "Senha incorreta!" });

    // Gera token JWT
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      "segredo_super_seguro",
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login bem-sucedido!",
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  });
});

// ========================================================
// ⚙️ INICIAR SERVIDOR
// ========================================================
const PORT = 3000;
app.listen(PORT, () => console.log(`🌐 Servidor rodando na porta ${PORT}`));
