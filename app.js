const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3001;


app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
//const db = mysql.createPool({
//host: process.env.DB_HOST,
//user: process.env.DB_USERNAME,
//password: process.env.DB_PASSWORD,
//database: process.env.DB_DBNAME,
//waitForConnections: true,
//connectionLimit: 10,
//queueLimit: 0
//});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'aapm'
});



// CONFIGURA A SESSÃO DO USUÁRIO
app.use(session({
  secret: 'aapm', // CHAVE SECRETA PARA ASSINAR A SESSÃO
  resave: false, // NÃO REGRAVA A SESSÃO SE NÃO HOUVER MUDANÇAS
  saveUninitialized: true // SALVA UMA NOVA SESSÃO MESMO SE NÃO MODIFICADA
}));

app.use((req, res, next) => {
  res.locals.nome = req.session.nome || 'Usuário'; // Substitua 'Usuário' por um valor padrão ou deixe em branco
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Outras configurações e rotas


app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'));
app.use(express.static('src'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// LOGIN
app.get(['/'], (req, res) => {
  res.render('login.ejs');
});

// ROTA DE SAÍDA
app.get('/sair', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error('Erro ao destruir a sessão:', err);
          res.status(500).send('Erro interno do servidor');
      } else {
          res.redirect('/');
      }
  });
});

// ROTA PARA EXIBIR A PÁGINA INICIAL
app.get('/pagInicial', (req, res) => {
  if (!req.session.cod_usuario) {
      return res.redirect('/'); // Redireciona para a página de login se não estiver autenticado
  }
  res.render('pagInicialAluno');
});

// ROTA PARA EXIBIR A PÁGINA INICIAL ADMINISTRADOR
app.get('/pagInicialAdm', (req, res) => {
  if (!req.session.cod_usuario) {
      return res.redirect('/'); // Redireciona para a página de login se não estiver autenticado
  }
  res.render('pagInicialAdm'); // Renderiza a página inicial do administrador
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const senha = req.body.senha;

  db.query('SELECT cod_usuario, nome, senha, cod_cargo FROM usuario WHERE email = ?', [email], (error, results) => {
      if (error) {
          console.error('Erro ao consultar o banco de dados:', error);
          return res.render('login', { errorMessage: 'Erro ao consultar o banco de dados.' });
      }

      if (results.length > 0) {
          const senhaBD = results[0].senha;
          const cod_usuario = results[0].cod_usuario; // PEGA O cod_usuario DO BANCO
          const nome = results[0].nome; // PEGA O NOME DO USUÁRIO
          const cod_cargo = results[0].cod_cargo; // PEGA O CARGO DO USUÁRIO

          // COMPARA A SENHA DO BANCO COM A ENVIADA PELO USUÁRIO
          if (senhaBD === senha) {
              // ARMAZENA O cod_usuario E O NOME NA SESSÃO
              req.session.cod_usuario = cod_usuario;
              req.session.nome = nome;

              console.log('Senha correta!');

              // REDIRECIONA PARA A PÁGINA DE ALUNO OU ADMINISTRADOR BASEADO NO cod_cargo
              if (cod_cargo === 1) { // SE O CARGO FOR ALUNO (EX: cod_cargo = 1)
                  res.redirect('pagInicialAluno'); // REDIRECIONA PARA A PÁGINA DO ALUNO
              } else if (cod_cargo === 2) { // SE O CARGO FOR ADMINISTRADOR (EX: cod_cargo = 2)
                  res.redirect('pagInicialAdm'); // REDIRECIONA PARA A PÁGINA DO ADMINISTRADOR
              } else {
                  res.render('login', { errorMessage: 'Tipo de usuário inválido!' });
              }
          } else {
              console.log('Senha incorreta!');
              res.render('login', { errorMessage: 'Email ou senha incorretos!' });
          }
      } else {
          console.log('Email não cadastrado!');
          res.render('login', { errorMessage: 'Email ou senha incorretos!' });
      }
  });
});

// get é diferente de post
// get pega do query (url) e post pega do body


// CARREGAR INFORMAÇÕES


const carregarArmarios = (callback) => {
  db.query('SELECT * from armario', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os armarios', error);
    } else {
      const armarios = results
      callback(null, armarios);
    }
  })
};

const carregarCamisetas = (callback) => {
  db.query('SELECT * from camiseta order by modelo_camiseta', (error, results) => {
    if (error) {
      console.log('Erro ao carregar camisetas', error);
    } else {
      const camisetas = results
      callback(null, camisetas);
    }
  })
};

const carregarCargos = (callback) => {
  db.query('SELECT * from cargo order by cod_cargo', (error, results) => {
    if (error) {
      console.log('Erro ao carregar cargos', error);
    } else {
      const cargos = results
      callback(null, cargos);
    }
  })
};

const carregarCursos = (callback) => {
  db.query('SELECT * from curso order by nome_curso', (error, results) => {
    if (error) {
      console.log('Erro ao carregar cursos', error);
    } else {
      const cursos = results
      callback(null, cursos);
    }
  })
};

const carregarEmprestimos = (callback) => {
  db.query('SELECT * from emprestimo_material', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os emprestimos de materiais', error);
    } else {
      const emprestimos = results
      callback(null, emprestimos);
    }
  })
};

const carregarEntregas = (callback) => {
  db.query('SELECT * from entrega_camiseta', (error, results) => {
    if (error) {
      console.log('Erro ao carregar as entregas de camisetas', error);
    } else {
      const entregas = results
      callback(null, entregas);
    }
  })
};

const carregarEventos = (callback) => {
  db.query('SELECT * from evento', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os eventos', error);
    } else {
      const eventos = results
      callback(null, eventos);
    }
  })
};

const carregarIndicacoesLivros = (callback) => {
  db.query('SELECT * from indicacao order by titulo', (error, results) => {
    if (error) {
      console.log('Erro ao carregar as indicações de livros', error);
    } else {
      const indicacoesLivros = results
      callback(null, indicacoesLivros);
    }
  })
};

const carregarLivros = (callback) => {
  db.query('SELECT * from livro order by titulo', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os livros', error);
    } else {
      const livros = results
      callback(null, livros);
    }
  })
};

const carregarMateriais = (callback) => {
  db.query('SELECT * from material order by nome_material', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os materiais', error);
    } else {
      const materiais = results
      callback(null, materiais);
    }
  })
};

const carregarOcorrenciasMateriais = (callback) => {
  db.query('SELECT * from ocorrencia_material order by data_ocorrecia', (error, results) => {
    if (error) {
      console.log('Erro ao carregar as ocorrencias dos materiais', error);
    } else {
      const ocorrenciasMateriais = results
      callback(null, ocorrenciasMateriais);
    }
  })
};

const carregarOcorrenciasPatrimonios = (callback) => {
  db.query('SELECT * from ocorrencia_patrimonio order by data_ocorrencia', (error, results) => {
    if (error) {
      console.log('Erro ao carregar as ocorrencias dos patrimonios', error);
    } else {
      const ocorrenciasPatrimonios = results
      callback(null, ocorrenciasPatrimonios);
    }
  })
};

const carregarPatrimonios = (callback) => {
  db.query('SELECT * from patrimonio order by nome_patrimonio', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os patrimonios', error);
    } else {
      const patrimonios = results
      callback(null, patrimonios);
    }
  })
};

const carregarPeriodos = (callback) => {
  db.query('SELECT * from periodo order by cod_periodo', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os periodos', error);
    } else {
      const periodos = results
      callback(null, periodos);
    }
  })
};

const carregarTipoCursos = (callback) => {
  db.query('SELECT * from tipocurso', (error, results) => {
    if (error) {
      console.log('Erro ao carregar os tipos de curso', error);
    } else {
      const tipocursos = results
      callback(null, tipocursos);
    }
  })
};

const carregarTurmas = (callback) => {
  db.query('SELECT * from turma order by nome_turma', (error, results) => {
    if (error) {
      console.log('Erro ao carregar turmas', error);
    } else {
      const turmas = results
      callback(null, turmas);
    }
  })
};

const carregarUsuarios = (callback) => {
  db.query('SELECT * from usuario order by nome', (error, results) => {
    if (error) {
      console.log('Erro ao carregar usuarios', error);
    } else {
      const usuarios = results
      callback(null, usuarios);
    }
  })
};


  // ACERVO

  app.get(['/acervoAdm'], (req, res) => {
    
    res.render('acervoAdm.ejs')
  }
);

  // ARMARIO

  //mudar a data inscrição => data_vencimento
  app.get('/armarioAdm', (req, res) => {
    db.query('SELECT cod_armario, nome_armario, status_armario FROM armario order by status_armario', (error, results) => {
        if (error) {
            console.log('Houve um erro ao recuperar os usuarios', error);
            res.status(500).send('Erro interno do servidor');
        } else {
            res.render('armarioAdm', { armario: results });
        }
    });
});

app.get('/pesquisarArmarioAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT a.cod_armario, a.nome_armario, a.status_armario, u.nome FROM armario a JOIN usuario u ON a.cod_usuario = u.cod_usuario WHERE a.nome_armario like ? or u.nome like ?', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro', error)
    } else {
      res.render('armarioAdm.ejs', { armario: results })
    }
  });
})

app.get('/infoArmarioAdm', (req, res) => {
  const cod = req.query.cod_armario;

  carregarArmarios((error, listaArmarios) => {
    if (error) {
      console.log('erro ao carregar os armários', error);
      return res.status(500).send('Erro ao carregar armários');
    }

    carregarUsuarios((error, listaUsuarios) => {
      if (error) {
        console.log('erro ao carregar usuarios', error);
        return res.status(500).send('Erro ao carregar usuários');
      }

      carregarCursos((error, listaCursos) => {
        if (error) {
          console.log('erro ao carregar o curso', error);
          return res.status(500).send('Erro ao carregar cursos');
        }

        carregarTurmas((error, results) => {
          if (error) {
            console.log('erro ao carregar as turmas', error);
            return res.status(500).send('Erro ao carregar turmas');
          }

          carregarPeriodos((error, results) => {
            if (error) {
              console.log('erro ao buscar periodos', error);
              return res.status(500).send('Erro ao buscar períodos');
            }

            // Query para buscar o armário
            db.query('SELECT a.cod_armario, a.nome_armario, a.status_armario, u.nome, u.email, t.nome_turma, c.nome_curso, p.periodo FROM armario a LEFT JOIN usuario u ON a.cod_usuario = u.cod_usuario LEFT JOIN turma t ON t.cod_turma = u.cod_turma LEFT JOIN periodo p ON t.cod_periodo = p.cod_periodo LEFT JOIN curso c ON t.cod_curso = c.cod_curso WHERE a.cod_armario = ?', [cod], (error, results) => {
              if (error) {
                console.log('Erro ao buscar o armário', error);
                return res.status(500).send('Erro ao buscar o armário');
              }

              if (results.length > 0) {
                const armario = results[0]; // Pega o primeiro resultado

                // Verifica o status do armário e renderiza a view apropriada
                if (armario.status_armario === 0) {
                  res.render('infoArmarioLivreAdm', {
                    armarios: listaArmarios,
                    usuarios: listaUsuarios,
                    armario: armario
                  });
                } else if (armario.status_armario === 1) {
                  res.render('infoArmarioEmUsoAdm', {
                    armarios: listaArmarios,
                    usuarios: listaUsuarios,
                    armario: armario
                  });
                }
              } else {
                console.log('Armário não encontrado');
                res.status(404).send('Armário não encontrado');
              }
            });
          });
        });
      });
    });
  });
});


  
app.get('/cadastrarArmarioAdm', (req, res) => {
  carregarArmarios ((error, listaArmarios) => {
    if (error) {
      console.log ('Erro ao carregar armarios:', error)
    } 

    console.log ('Armarios: ', listaArmarios);
    res.render('cadastrarArmarioAdm', {
      armarios: listaArmarios
    })
  })
});

app.post('/cadastrarArmarioAdm', (req, res) => {
  const nome = req.body.nome_armario; 

  console.log("nome do armario:", nome);

  db.query("INSERT INTO armario (nome_armario, status_armario) VALUES (?, 0)", [nome], (error, results) => {
    if (error) {
      console.log('Erro ao cadastrar armário:', error);
      res.status(500).send('Erro ao cadastrar armário');
    } else {
      console.log ('cadastrado')
      res.redirect('/armarioAdm');
    }
  });
});


app.post('/editarArmarioAdm/:cod_armario', (req, res) => {
  const cod = req.params.cod_armario;
  const usuario = parseInt(req.body.nome);

  console.log (cod, usuario);


  db.query('UPDATE armario SET cod_usuario = ?, status_armario = 1 WHERE cod_armario = ?', [usuario, cod], (error, results) => {
    if (error) {
      console.log('Erro ao editar o armario.', error);
      res.status(500).send('Erro ao editar o armário');
    } else {
      res.redirect('/armarioAdm');
      console.log ('editou')
    }
  });
});


app.post ('/desocuparArmarioAdm/:cod_armario', (req,res) => { 
  const cod = req.params.cod_armario;


  console.log (cod)
  db.query ('UPDATE armario SET status_armario = 0 WHERE cod_armario = ?', [cod], (error, results) => {
    if (error) {
      console.log ('Erro ao desocupar o armário', error);
      res.status(500).send('Erro ao editar o armário')
    } else {
      res.redirect('/armarioAdm');
      console.log ('desocupou')
    }
  })
})




  // INDICACAO

  app.get('/indicacaoAdm', (req, res) => {
    
        res.render('indicacaoAdm.ejs')
      }
    );





//OCORRENCIA

    app.get (['/ocorrenciaAdm'], (req, res) => {

      res.render('ocorrenciaAdm.ejs')
    })

//INDICACOES LIVROS

app.get(['/indicacaoLivroAdm'], (req, res) => {
  db.query('SELECT * FROM indicacao', (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os dados das indicações', error)
    } else {
      console.log('puxou', results)
      res.render('indicacaoLivroAdm.ejs', { indicacao: results })
    }
  })
});

app.get('/pesquisarIndicacaoLivroAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT * FROM indicacao where titulo like ? or autor like ?', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro', error)
    } else {
      res.render('indicacaoLivroAdm.ejs', { indicacao: results })
    }
  });
})


app.get('/infoIndicacaoLivroAdm', (req, res) => {
  const cod = req.query.cod_indicacao;

  carregarIndicacoesLivros ((error, listaIndicacoesLivros) => {
    if(error) {
      console.log('erro ao carregar a indicação', error)
    } carregarUsuarios ((error,listaUsuarios) => {
      db.query('SELECT i.cod_indicacao, i.titulo, i.autor, i.genero, i.descricao, u.nome, u.email FROM indicacao i JOIN usuario u ON i.cod_usuario = u.cod_usuario WHERE cod_indicacao = ?', [cod], (error, results) => {
        if (error){
          console.log ('Erro ao buscar a indicacao', error)
        } if (results.length > 0) {
          res.render ('infoIndicacaoLivroAdm', {
            indicacoes: listaIndicacoesLivros,
            usuarios: listaUsuarios,
            indicacao:results[0]
          })

        } else {
          console.log('indicação não encontrada')
        }
      })
    })
  })

})


//LIVROS

app.get(['/livrosAdm'], (req, res) => {
  db.query('SELECT cod_livro, titulo, autor FROM livro', (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os dados do livro', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      console.log('puxou', results)
      res.render('livrosAdm.ejs', { livros: results });
    }
  });
});


app.get('/adicionarLivroAdm', (req, res) => {

  carregarLivros((error, listaLivros) => {
    if (error) {
      console.log('Erro ao carregar livros:', error);
    }
    console.log('Livros:', listaLivros);
    res.render('cadastrarLivroAdm.ejs', {
      livros: listaLivros
    })
  })
})


app.post('/cadastrarLivroAdm', (req, res) => {
  // Extraindo os valores do corpo da requisição
  const titulo = req.body.titulo;
  const autor = req.body.autor;
  const genero = req.body.genero;
  const descricao = req.body.descricao;

  console.log(titulo);
  console.log(autor);
  console.log(genero);
  console.log(descricao);

  // Executando a query com os valores extraídos do corpo da requisição
  db.query("INSERT INTO livro (titulo, autor, genero, descricao) values (?, ?, ?, ?)", [titulo, autor, genero, descricao], (error, results) => {
    if (error) {
      // Em caso de erro, loga a mensagem de erro e envia uma resposta de erro
      console.log('Erro ao cadastrar livro:', error);
      res.status(500).send('Erro ao cadastrar livro');
    } else {
      res.redirect('/livrosAdm');
    }
  });
});

app.get('/pesquisarLivroAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT * FROM livro WHERE titulo like ? or autor like ?', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro')
    } else {
      res.render('livrosAdm.ejs', { livros: results })
      console.log (results)
    }
  });
})


app.get('/infoLivroAdm', (req, res) => {
  const cod = req.query.cod_livro;

  carregarLivros((error, listaLivros) => {
    if (error) {
      console.log('Erro ao carregar livros:', error);
      return res.status(500).send('Erro ao carregar livros');
    }

    db.query('SELECT * FROM livro WHERE cod_livro = ?', [cod], (error, results) => {
      if (error) {
        console.log('Erro ao buscar o livro com o cod_livro', cod, error);
        return res.status(500).send('Erro ao buscar o livro');
      }

      if (results.length > 0) {
        res.render('infoLivroAdm', {
          livros: listaLivros,
          livro: results[0] 
        });

      } else {
        res.status(404).send('Livro não encontrado');
      }
    });
  });
});


app.post('/editarLivroAdm/:cod_livro', (req, res) => {
  const cod = req.params.cod_livro
  const titulo = req.body.titulo;
  const autor = req.body.autor;
  const genero = req.body.genero;
  const descricao = req.body.descricao;

  console.log (cod);


  db.query('UPDATE livro SET titulo = ?, autor = ?, genero = ?, descricao = ? WHERE cod_livro = ?', [titulo, autor, genero, descricao, cod], (error, results) => {
    if (error) {
      console.log('Erro ao editar o livros.', error);
      res.status(500).send('Erro ao editar o livros');
    } else {
      res.redirect('/livrosAdm');
      console.log ('editou')
    }
  });
});


// MATERIAIS

app.get(['/materialAdm'], (req, res) => {
  db.query('SELECT cod_material, nome_material, status_material FROM material ORDER BY nome_material', (error, results) => {
      if (error) {
          console.log('Houve um erro ao recuperar os dados do material:', error);
          res.status(500).send('Erro ao recuperar dados');
      } else {
          // Mapear os resultados para adicionar o status
          const material = results.map((item) => {
              let status = '';
              if (item.status_material === 0) {
                  status = 'quebrado';
              } else if (item.status_material === 1) {
                  status = 'funcionando';
              } else if (item.status_material === 2) {
                  status = 'em manutenção';
              } else {
                  status = 'não definido';
              }
              return { ...item, status }; // Retorna um novo objeto com o status adicionado
          });

          res.render('materialAdm', { material });
      }
  });
});

app.get('/pesquisarMaterialAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT * FROM material WHERE nome_material like ?', [`%${pesquisa}%`, `%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os dados do material:', error);
      res.status(500).send('Erro ao recuperar dados');
  } else {
      // Mapear os resultados para adicionar o status
      const material = results.map((item) => {
          let status = '';
          if (item.status_material === 0) {
              status = 'quebrado';
          } else if (item.status_material === 1) {
              status = 'funcionando';
          } else if (item.status_material === 2) {
              status = 'em manutenção';
          } else {
              status = 'não definido';
          }
          return { ...item, status }; // Retorna um novo objeto com o status adicionado
      });

      res.render('materialAdm', { material });
      console.log (results)
    }
  });
})



app.get('/adicionarMaterialAdm', (req, res) => {
  carregarMateriais ((error, listaMateriais) => {
    if (error) {
      console.log ('Erro ao carregar materiais:', error)
    } 

    console.log ('Materiais: ', listaMateriais);
    res.render('cadastrarMaterialAdm.ejs', {
      materiais: listaMateriais
    })
  })
});


app.post('/cadastrarMaterialAdm', (req, res) => {
  // Extraindo os valores do corpo da requisição
  const nome = req.body.nome_material; 
  const descricao = req.body.descricao;

  console.log("nome do material:", nome);
  console.log("descricao:", descricao);

  // Executando a query com os valores extraídos do corpo da requisição
  db.query("INSERT INTO material (nome_material, descricao_material, status_material) VALUES (?, ?, 1)", [nome, descricao], (error, results) => {
    if (error) {
      // Em caso de erro, loga a mensagem de erro e envia uma resposta de erro
      console.log('Erro ao cadastrar material:', error);
      res.status(500).send('Erro ao cadastrar material');
    } else {
      console.log ('cadastrado')
      res.redirect('/materialAdm');
    }
  });
});


app.get('/infoMaterialAdm', (req, res) => {
  const cod = req.query.cod_material;

  // Primeiro, carregue a lista de materiais (se necessário)
  carregarMateriais((error, listaMateriais) => {
    if (error) {
      console.log('Erro ao carregar materiais:', error);
      return res.status(500).send('Erro ao carregar materiais');
    }

    // Em seguida, execute a consulta ao banco de dados
    db.query('SELECT * FROM material WHERE cod_material = ?', [cod], (error, results) => {
      if (error) {
        console.log('Erro ao buscar o material com o cod_material', cod, error);
        return res.status(500).send('Erro ao buscar o material');
      }

      if (results.length > 0) {
        // Renderize a página com os dados do material
        res.render('infoMaterialAdm', {
          materiais: listaMateriais,
          material: results[0] // Passa o material encontrado para a visualização
        });

      } else {
        res.status(404).send('Material não encontrado');
      }
    });
  });
});



app.post('/editarMaterialAdm/:cod_material', (req, res) => {
  const cod = req.params.cod_material;
  const nome = req.body.nome_material;
  const descricao = req.body.descricao;

  console.log (cod);


  db.query('UPDATE material SET nome_material = ?, descricao_material = ? WHERE cod_material = ?', [nome, descricao, cod], (error, results) => {
    if (error) {
      console.log('Erro ao editar o material.', error);
      res.status(500).send('Erro ao editar o material');
    } else {
      res.redirect('/materialAdm');
      console.log ('editou')
    }
  });
});


app.post('/excluirMaterialAdm/:cod_material', (req, res) => {
  const cod = req.params.cod_material;
    
  console.log('Código do material para exclusão:', cod);

  db.query('DELETE FROM material WHERE cod_material = ?', [cod], (error, results) => {
    if (error) {
      console.log('Erro ao excluir o material:', error);
      res.status(500).send('Erro ao excluir o material');
    } else {
      console.log('Material excluído com sucesso');
      res.redirect('/materialAdm');
    }
  });
});




// OCORRENCIA PATRIMÔNIO

app.get(['/ocorrenciaPatrimonioAdm'], (req, res) => {
  db.query('SELECT o.cod_ocorrencia, p.nome_patrimonio FROM ocorrencia_patrimonio o JOIN patrimonio p ON o.cod_patrimonio = p.cod_patrimonio;', (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os dados do ocorrencia', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      console.log('puxou', results)
      res.render('ocorrenciaPatrimonioAdm.ejs', { ocorrenciaPatrimonio: results });
    }
  });
});


app.get('/pesquisarOcorrenciaPatrimonioAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa); // Para depuração
  db.query('SELECT o.cod_ocorrencia, p.nome_patrimonio FROM ocorrencia_patrimonio o JOIN patrimonio p ON o.cod_patrimonio = p.cod_patrimonio WHERE p.nome_patrimonio like ?', [`%${pesquisa}%`], (error, results) => {


    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      console.log(results)
      res.render('ocorrenciaPatrimonioAdm.ejs', { ocorrenciaPatrimonio: results });
    }
  });
});


app.get('/adicionarOcorrenciaPatrimonioAdm', (req, res) => {

  carregarOcorrenciasPatrimonios((error, listaOcorrenciaPatrimonios) => {
    if (error) {
      console.log('Erro ao carregar camisetas:', error);
    }
    console.log('Camisetas:', listaOcorrenciaPatrimonios);
    res.render('cadastrarOcorrenciaPatrimonioAdm.ejs', {
      ocorrenciaPatrimonios: listaOcorrenciaPatrimonios
    })
  })
})

// PAREI AQUIIIIII AQUUIIIIIIIII IIIIIII lembrei do cod_patrimonio

app.post('/cadastrarOcorrenciaPatrimonioAdm', (req, res) => {
  // Extraindo os valores do corpo da requisição

  const patrimonio = parseInt(req.body.patrimonio);
  const data = req.body.data;
  const detalhe = req.body.detalhe;
  const status = req.body.status

  console.log(status);

  // Executando a query com os valores extraídos do corpo da requisição
  db.query("INSERT INTO ocorrencia_patrimonio (cod_patrimonio, cod_usuario, data_ocorrencia, detalhes_ocorrencia, status_ocorrencia) values (?, ?)", [modelo, quantidade], (error, results) => {
    if (error) {
      // Em caso de erro, loga a mensagem de erro e envia uma resposta de erro
      console.log('Erro ao cadastrar usuario:', error);
      res.status(500).send('Erro ao cadastrar usuario');
    } else {
      res.redirect('/estoqueAdm');
    }
  });
});




// ESTOQUE

app.get('/estoqueAdm', (req, res) => {
  db.query('SELECT cod_camiseta, modelo_camiseta, quantidade FROM camiseta ORDER BY modelo_camiseta', (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os dados do estoque', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      console.log('puxou', results)
      res.render('estoqueAdm.ejs', { estoque: results });
    }
  });
});

app.get('/pesquisarCamisetaAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa); // Para depuração
  db.query('SELECT modelo_camiseta, cod_camiseta as "cod", quantidade FROM camiseta WHERE modelo_camiseta LIKE ?', [`%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      res.render('estoqueAdm.ejs', { estoque: results });
    }
  });
});

app.post('/cadastroCamisetaAdm', (req, res) => {
  // Extraindo os valores do corpo da requisição
  const modelo = req.body.modelo_camiseta;
  const quantidade = req.body.quantidade;

  console.log(modelo);
  console.log(quantidade);


  // Executando a query com os valores extraídos do corpo da requisição
  db.query("INSERT INTO camiseta (modelo_camiseta, quantidade) values (?, ?)", [modelo, quantidade], (error, results) => {
    if (error) {
      // Em caso de erro, loga a mensagem de erro e envia uma resposta de erro
      console.log('Erro ao cadastrar usuario:', error);
      res.status(500).send('Erro ao cadastrar usuario');
    } else {
      res.redirect('/estoqueAdm');
    }
  });
});


app.get('/adicionarCamisetaAdm', (req, res) => {

  carregarCamisetas((error, listaCamisetas) => {
    if (error) {
      console.log('Erro ao carregar camisetas:', error);
    }
    console.log('Camisetas:', listaCamisetas);
    res.render('cadastroCamisetaAdm.ejs', {
      camisetas: listaCamisetas
    })
  })
})

app.get('/infoCamisetaAdm', (req, res) => {
  const cod = req.query.cod_camiseta;

  // Primeiro, carregue a lista de camisetas (se necessário)
  carregarCamisetas((error, listaCamisetas) => {
    if (error) {
      console.log('Erro ao carregar camisetas:', error);
      return res.status(500).send('Erro ao carregar camisetas');
    }

    // Em seguida, execute a consulta ao banco de dados
    db.query('SELECT * FROM camiseta WHERE cod_camiseta = ?', [cod], (error, results) => {
      if (error) {
        console.log('Erro ao buscar a camiseta com o cod_camiseta', cod, error);
        return res.status(500).send('Erro ao buscar a camiseta');
      }

      if (results.length > 0) {
        // Renderize a página com os dados da camiseta
        res.render('infoCamisetaAdm', {
          camisetas: listaCamisetas,
          camiseta: results[0] // Passa a camiseta encontrado para a visualização
        });

      } else {
        res.status(404).send('Camiseta não encontrada');
      }
    });
  });
});


app.post('/editarCamisetaAdm/:cod_camiseta', (req, res) => {
  const cod = req.params.cod_camiseta;
  const modelo = req.body.modelo_camiseta;
  const quantidade = req.body.quantidade;

  console.log (cod);


  db.query('UPDATE camiseta SET modelo_camiseta = ?, quantidade = ? WHERE cod_camiseta = ?', [modelo, quantidade, cod], (error, results) => {
    if (error) {
      console.log('Erro ao editar a camiseta.', error);
      res.status(500).send('Erro ao editar a camiseta');
    } else {
      res.redirect('/estoqueAdm');
      console.log ('editou')
    }
  });
});


app.post('/excluirCamisetaAdm/:cod_camiseta', (req, res) => {
  const cod = req.params.cod_camiseta;
    
  console.log('Código da camiseta para exclusão:', cod);

  db.query('DELETE FROM camiseta WHERE cod_camiseta = ?', [cod], (error, results) => {
    if (error) {
      console.log('Erro ao excluir a camiseta:', error);
      res.status(500).send('Erro ao excluir a camiseta');
    } else {
      console.log('Camiseta excluída com sucesso');
      res.redirect('/estoqueAdm');
    }
  });
});





// ENTREGA

app.get('/entregaAdm', (req, res) => {
  db.query('SELECT e.cod_entrega, u.nome, c.modelo_camiseta FROM entrega_camiseta e JOIN usuario u ON e.cod_usuario = u.cod_usuario JOIN camiseta c ON e.cod_camiseta = c.cod_camiseta;', (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar as entregas', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      res.render('entregaAdm.ejs', { entrega: results });
    }
  });
});


app.get('/infoEntregaAdm', (req, res) => {
  const cod = req.query.cod_entrega


  carregarEntregas ((error, listaEntragas) => {
    if (error) {
      console.log ('erro ao carregar as entregas', error)
    } carregarUsuarios ((error, listaUsuarios) => {
      if(error) {
        console.log ('erro ao carregar usuario', error)
      } carregarTurmas ((error, listaTurmas) =>{
        if (error) {
          console.log ('erro ao carregar o curso', error)
        } carregarPeriodos ((error, listaPeriodos) => {
          if (error) {
            console.log ('erro ao carregar período', error)
          } carregarCamisetas ((error, listaCamisetas) => {
            if (error) {
              console.log ('erro ao carregar camiseta', error)
            } carregarCursos ((error, listaCursos) => {
              if (error) {
                console.log ('erro ao carregar o curso', error)
              } db.query ('SELECT e.cod_entrega, u.nome, u.email, p.periodo, t.nome_turma, cu.nome_curso, c.modelo_camiseta FROM entrega_camiseta e JOIN usuario u ON e.cod_usuario = u.cod_usuario JOIN camiseta c ON e.cod_camiseta = c.cod_camiseta JOIN turma t ON u.cod_turma = t.cod_turma JOIN periodo p ON t.cod_periodo = p.cod_periodo JOIN curso cu ON t.cod_curso = cu.cod_curso WHERE e.cod_entrega = ?', [cod],(error, results) => {
                if (error) {
                  console.log ('Erro ao buscar a entrega', error)
                } if (results.length > 0) {
                  res.render ('infoEntregaAdm', {
                    entregas: listaEntragas,
                    usuarios: listaUsuarios,
                    turmas: listaTurmas,
                    periodos: listaPeriodos,
                    camisetas: listaCamisetas,
                    cursos: listaCursos,
                    entrega: results[0]
                  })
                } else {
                  console.log ('entrega não encontrada')
                }
              })
            })
          })
        })
      })
    })
  })
})



app.get('/pesquisarEntregaAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa); // Para depuração
  db.query('SELECT e.cod_entrega, u.nome, c.modelo_camiseta FROM entrega_camiseta e JOIN usuario u ON e.cod_usuario = u.cod_usuario JOIN camiseta c ON e.cod_camiseta = c.cod_camiseta WHERE u.nome LIKE ?', [`%${pesquisa}%`], (error, results) => {


    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro', error);
      res.status(500).send('Erro interno do servidor');
    } else {
      console.log(results)
      res.render('entregaAdm.ejs', { entrega: results });
    }
  });
});


// USUARIOS


// MOSTRA OS USUARIOS - ADM
app.get('/usuariosAdm', (req, res) => {
  db.query('SELECT * FROM usuario', (error, results) => {
      if (error) {
          console.log('Houve um erro ao recuperar os usuarios', error);
          res.status(500).send('Erro interno do servidor');
      } else {
          console.log('Usuarios recuperados:', results);
          res.render('usuariosAdm', { usuario: results });
      }
  });
});


app.get('/pesquisarUsuariosAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT nome, cod_usuario FROM usuario where nome like ?', [`%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Ocorreu um erro ao realizar o filtro')
    } else {
      res.render('usuariosAdm', { usuario: results });
    }
  });
});


app.get('/cadastrarUsuarioAdm', (req, res) => {
  carregarUsuarios((error, listaUsuarios) => {
    if (error) {
      console.log('Erro ao carregar usuários:', error);
    }
    carregarTurmas((error, listaTurmas) => {
      if (error) {
        console.log('Erro ao carregar turmas:', error);
      }
      carregarCamisetas((error, listaCamisetas) => {
        if (error) {
          console.log('Erro ao carregar camisetas:', error);
        } carregarCargos((error, listaCargos) => {
          if (error) {
            console.log('Erro ao carregar os cargos:', error);
          }


          console.log('Turmas:', listaTurmas);
          console.log('Usuarios:', listaUsuarios);
          console.log('Camisetas:', listaCamisetas);
          console.log('Cargos:', listaCargos);
          res.render('cadastrarUsuarioAdm.ejs', {
            usuarios: listaUsuarios,
            turmas: listaTurmas,
            camisetas: listaCamisetas,
            cargos: listaCargos
          })
        })
      })
    });
  });
});


// cadastro
app.post('/cadastrarUsuarioAdm', (req, res) => {
  // Extraindo os valores do corpo da requisição
  const usuario = req.body.nome;  // Mantido como String
  const cpf = req.body.cpf;       // Mantido como String ou pode converter para Number se necessário
  const celular = req.body.celular; // Mantido como String ou pode converter para Number se necessário
  const email = req.body.email;   // Mantido como String
  const cidade = req.body.cidade; // Mantido como String
  const bairro = req.body.bairro; // Mantido como String
  const rua = req.body.rua;       // Mantido como String
  const complemento = req.body.complemento; // Mantido como String
  const numero = req.body.numero; // Mantido como String ou pode converter para Number se necessário
  const cep = req.body.cep;       // Mantido como String ou pode converter para Number se necessário
  const turma = parseInt(req.body.turma); // Conversão para Number (id)
  const camiseta = parseInt(req.body.camiseta); // Conversão para Number (id)
  const senha = req.body.senha;   // Mantido como String
  const data_inscricao = req.body.data_inscricao; // Mantido como String
  const cargo = parseInt(req.body.cargo); // Conversão para Number (id)

  console.log(data_inscricao);
  console.log("nome usuario:", usuario);
  console.log("id turma:", turma);
  console.log("id camiseta:", camiseta);

  // Executando a query com os valores extraídos do corpo da requisição
  db.query("INSERT INTO usuario (cod_turma, cod_camiseta, cod_cargo, nome, cpf, celular, email, senha, rua, cep, bairro, cidade, numero, complemento, status_usuario, data_inscricao) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)", [turma, camiseta, cargo, usuario, cpf, celular, email, senha, rua, cep, bairro, cidade, numero, complemento, data_inscricao], (error, results) => {
    if (error) {
      console.log ("erro ao inserir o usuario", error)
    } else {

    db.query ("SELECT cod_usuario FROM usuario WHERE cpf = ?", [cpf], (error, results) =>{
      console.log ('resultado da pesquisa', results)
      const cod = results[0]?.cod_usuario
      console.log ('cod_usuario esperado', cod)
    if (error) {
      // Em caso de erro, loga a mensagem de erro e envia uma resposta de erro
      console.log('Erro ao buscar o usuario', error);
      res.status(500).send('Erro ao cadastrar usuario');
    } else {
      if (cargo === 1) {
      db.query("INSERT INTO entrega_camiseta (cod_camiseta, cod_usuario, status_entrega) VALUES (?, ?, 1)", [camiseta, cod], (error,results) => {
        if(error) {
          console.log ('erro ao mandar a camiseta', error)
        } else {
          res.redirect('/usuariosAdm');
        }
      
      })

      } else {
        res.redirect('/usuariosAdm');
      }
      
    }
  })
}
  });
});

app.get('/infoUsuarioAdm', (req, res) => {
  const cod = req.query.cod_usuario;
  console.log('Código do usuário:', cod);

  // Função para carregar os dados do banco de dados
  const carregarDados = (callback) => {
    carregarUsuarios((error, listaUsuarios) => {
      if (error) return callback(error);

      carregarTurmas((error, listaTurmas) => {
        if (error) return callback(error);

        carregarCamisetas((error, listaCamisetas) => {
          if (error) return callback(error);

          carregarCargos((error, listaCargos) => {
            if (error) return callback(error);


            db.query('SELECT * FROM usuario WHERE cod_usuario = ?', [cod], (error, results) => {
              if (error) return callback(error);

              if (results.length > 0) {
                const usuario = results[0];
                const data_inscricao_bd = usuario.data_inscricao;
                const data_inscricao_js = new Date(data_inscricao_bd);
                const data_inscricao = data_inscricao_js.toISOString().substring(0, 10);

                callback(null, {
                  usuario,
                  usuarios: listaUsuarios,
                  turmas: listaTurmas,
                  camisetas: listaCamisetas,
                  cargos: listaCargos,
                  data_inscricao
                });
              } else {
                callback(new Error('Usuário não encontrado'));
              }
            });
          });
        });
      });
    });
  };

  carregarDados((error, dados) => {
    if (error) {
      if (error.message === 'Usuário não encontrado') {
        console.log(error.message);
        return res.status(404).send(error.message);
      }
      console.log('Erro ao carregar dados:', error.message);
      return res.status(500).send('Erro ao carregar dados');
    }

    res.render('infoUsuarioAdm.ejs', dados);
  });
});



app.post('/editarUsuarioAdm/:cod_usuario', (req, res) => {
  // Extraindo os valores do corpo da requisição
  const cod_usuario = req.params.cod_usuario;
  const usuario = req.body.nome;  // Mantido como String
  const cpf = req.body.cpf;       // Mantido como String ou pode converter para Number se necessário
  const celular = req.body.celular; // Mantido como String ou pode converter para Number se necessário
  const email = req.body.email;   // Mantido como String
  const cidade = req.body.cidade; // Mantido como String
  const bairro = req.body.bairro; // Mantido como String
  const rua = req.body.rua;       // Mantido como String
  const complemento = req.body.complemento; // Mantido como String
  const numero = req.body.numero; // Mantido como String ou pode converter para Number se necessário
  const cep = req.body.cep;       // Mantido como String ou pode converter para Number se necessário
  const turma = parseInt(req.body.turma); // Conversão para Number (id)
  const camiseta = parseInt(req.body.camiseta); // Conversão para Number (id)
  const senha = req.body.senha;   // Mantido como String
  const data_inscricao = req.body.data_inscricao; // Mantido como String
  const cargo = parseInt(req.body.cargo); // Conversão para Number (id)


  db.query('UPDATE usuario set nome = ?, cpf = ?, celular = ?, email = ?, cidade = ?, bairro = ?, rua = ?, complemento = ?, numero = ?, cep = ?, cod_turma = ?, cod_camiseta = ?, senha = ?, data_inscricao = ?, cod_cargo = ? where cod_usuario = ?', [usuario, cpf, celular, email, cidade, bairro, rua, complemento, numero, cep, turma, camiseta, senha, data_inscricao, cargo, cod_usuario], (error, results) => {
    if (error) {
      console.log('Erro ao editar usuario.', error)
    } else {
      res.redirect('/usuariosAdm')
    }
  })
});


app.post('/excluirUsuarioAdm/:cod_usuario', (req, res) => {
  const cod_usuario = parseInt(req.params.cod_usuario);
  console.log(cod_usuario)
  db.query('DELETE from usuario WHERE cod_usuario = ?', [cod_usuario], (error, results) => {
    if (error) {
      console.log('erro ao excluir o usuario', error)
    } else {
      res.redirect('/usuariosAdm')
    }
  })
});





  // PATRIMONIO

  app.get(['/patrimonioAdm'], (req, res) => {
    db.query('SELECT cod_patrimonio, nome_patrimonio, status_patrimonio FROM patrimonio ORDER BY nome_patrimonio', (error, results) => {
        if (error) {
            console.log('Houve um erro ao recuperar os dados do patrimônio:', error);
            res.status(500).send('Erro ao recuperar dados');
        } else {
            // Mapear os resultados para adicionar o status
            const patrimonio = results.map((item) => {
                let status = '';
                if (item.status_patrimonio === 0) {
                    status = 'quebrado';
                } else if (item.status_patrimonio === 1) {
                    status = 'funcionando';
                } else if (item.status_patrimonio === 2) {
                    status = 'em manutenção';
                } else {
                    status = 'não definido';
                }
                return { ...item, status }; // Retorna um novo objeto com o status adicionado
            });

            res.render('patrimonioAdm', { patrimonio });
        }
    });
});

  //redirecionar para a página de cadastro
app.get('/adicionarPatrimonioAdm', (req, res) => {
  carregarPatrimonios ((error, listaPatrimonios) => {
    if (error) {
      console.log ('Erro ao carregar patrimônios:', error)
    } 

    console.log ('Patrimônios: ', listaPatrimonios);
    res.render('cadastrarPatrimonioAdm.ejs', {
      patrimonios: listaPatrimonios
    })
  })
});


  //cadastrar patrimônio
  // 1 => funcionando
  // 2 => em manutenção
  // 0 => quebrado 
app.post('/cadastrarPatrimonioAdm', (req, res) => {
  const nome = req.body.nome_patrimonio; 
  const detalhe = req.body.detalhe;

  console.log("nome do patrimônio:", nome);
  console.log("detalhe:", detalhe);

  db.query("INSERT INTO patrimonio (nome_patrimonio, detalhe_patrimonio, status_patrimonio) VALUES (?, ?, 1)", [nome, detalhe], (error, results) => {
    if (error) {
      console.log('Erro ao cadastrar patrimônio:', error);
      res.status(500).send('Erro ao cadastrar patrimônio');
    } else {
      console.log ('cadastrado')
      res.redirect('/patrimonioAdm');
    }
  });
});


app.get('/pesquisarPatrimonioAdm', (req, res) => {
  const pesquisa = req.query.pesquisa;
  console.log(pesquisa)
  db.query('SELECT * FROM patrimonio WHERE nome_patrimonio like ?', [`%${pesquisa}%`], (error, results) => {
    if (error) {
      console.log('Houve um erro ao recuperar os dados do patrimônio:', error);
      res.status(500).send('Erro ao recuperar dados');
  } else {
      // Mapear os resultados para adicionar o status
      const patrimonio = results.map((item) => {
          let status = '';
          if (item.status_patrimonio === 0) {
              status = 'quebrado';
          } else if (item.status_patrimonio === 1) {
              status = 'funcionando';
          } else if (item.status_patrimonio === 2) {
              status = 'em manutenção';
          } else {
              status = 'não definido';
          }
          return { ...item, status }; // Retorna um novo objeto com o status adicionado
      });

      res.render('patrimonioAdm', { patrimonio });
    }
  });
})

app.get('/infoPatrimonioAdm', (req, res) => {
  const cod = req.query.cod_patrimonio;

  carregarPatrimonios((error, listaPatrimonios) => {
    if (error) {
      console.log('Erro ao carregar patrimônio:', error);
      return res.status(500).send('Erro ao patrimônio ');
    }

    db.query('SELECT * FROM patrimonio WHERE cod_patrimonio = ?', [cod], (error, results) => {
      if (error) {
        console.log('Erro ao buscar o patrimônio com o cod_patrimonio', cod, error);
        return res.status(500).send('Erro ao buscar o patrimônio');
      }

      if (results.length > 0) {
        // Renderize a página com os dados do patrimônio
        res.render('infoPatrimonioAdm', {
          patrimonios: listaPatrimonios,
          patrimonio: results[0] // Passa o patrimônio encontrado para a visualização
        });

      } else {
        res.status(404).send('patrimonio não encontrado');
      }
    });
  });
});


app.post('/editarPatrimonioAdm/:cod_patrimonio', (req, res) => {
  const cod = req.params.cod_patrimonio;
  const nome = req.body.nome_patrimonio;
  const detalhe = req.body.detalhe;

  console.log (cod);


  db.query('UPDATE patrimonio SET nome_patrimonio = ?, detalhe_patrimonio = ? WHERE cod_patrimonio = ?', [nome, detalhe, cod], (error, results) => {
    if (error) {
      console.log('Erro ao editar o patrimônio.', error);
      res.status(500).send('Erro ao editar o patrimônio');
    } else {
      res.redirect('/patrimonioAdm');
      console.log ('editou')
    }
  });
});


app.post('/excluirPatrimonioAdm/:cod_patrimonio', (req, res) => {
  const cod = req.params.cod_patrimonio;
    

  db.query('DELETE FROM patrimonio WHERE cod_patrimonio = ?', [cod], (error, results) => {
    if (error) {
      console.log('Erro ao excluir o patrimõnio:', error);
      res.status(500).send('Erro ao excluir o patrimonio');
    } else {
      console.log('patrimônio excluído com sucesso');
      res.redirect('/patrimonioAdm');
    }
  });
});



// EVENTOS


// MOSTRA A PÁGINA PARA ADICIONAR EVENTOS - ADM
app.get('/adicionarEventosAdm', (req, res) => {
  // RENDERIZA O FORMULÁRIO PARA ADICIONAR UM NOVO EVENTO
  res.render('adicionarEventosAdm'); 
});


app.get('/adicionarEventosAdm', (req, res) => {
  // RENDERIZA O FORMULÁRIO PARA ADICIONAR UM NOVO EVENTO
  res.render('adicionarEventosAdm'); 
});

// MOSTRA A PÁGINA PARA ADICIONAR EVENTOS - ADM
app.get('/indicacoesAdm', (req, res) => {
  // RENDERIZA O FORMULÁRIO PARA ADICIONAR UM NOVO EVENTO
  res.render('indicacoesAdm'); 
});


app.get('/eventosAdm', (req, res) => {
  db.query('SELECT * FROM evento', (error, results) => {
      if (error) {
          console.log('Houve um erro ao recuperar os eventos', error);
          res.status(500).send('Erro interno do servidor');
      } else {
          console.log('Eventos recuperados:', results);
          res.render('eventosAdm', { evento: results });
      }
  });
});




//FUNÇÕES


