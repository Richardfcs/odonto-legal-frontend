// // Exemplo de lógica para login e cadastro

// document.getElementById("loginForm").addEventListener("submit", function (e) {
//   e.preventDefault();

//   // Aqui você pode adicionar validação de dados e redirecionamento após login

//   alert("Login efetuado com sucesso!");
//   window.location.href = "components/home.html"; // Exemplo de redirecionamento para a tela do administrador
// });

// document
//   .getElementById("cadastroForm")
//   .addEventListener("submit", function (e) {
//     e.preventDefault();

//     // Aqui você pode adicionar validação de dados e redirecionamento após cadastro

//     alert("Cadastro realizado com sucesso!");
//     window.location.href = "components/home.html"; // Redireciona para o login
//   });

// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", () => {
  // Seleciona o formulário pelo id
  const form = document.querySelector("#loginForm");

  // Adiciona o evento de submit do formulário
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Previne o comportamento padrão (reload da página)

    // Pega os valores inseridos nos campos de e-mail e senha
    const email = document.querySelector("#email").value;
    const senha = document.querySelector("#senha").value;

    // Cria um objeto com os dados a serem enviados para o back-end
    const data = {
      email: email,
      password: senha, // Observação: o back espera a propriedade "password"
    };

    try {
      // Envia a requisição POST para a URL do endpoint de login
      const response = await fetch("http://localhost:3000/api/user/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // Converte o objeto JavaScript para JSON
      });

      // Converte a resposta para JSON
      const result = await response.json();

      // Verifica se a resposta HTTP indica sucesso
      if (response.ok) {
        // Exibe uma mensagem de sucesso e armazena o token se necessário
        alert(result.msg); // Mensagem de autenticação bem-sucedida
        // Exemplo: salvar o token no localStorage para uso posterior
        localStorage.setItem("token", result.token);
        window.location.href = "components/home.html";
        // Aqui você pode redirecionar o usuário ou atualizar a interface
      } else {
        // Caso ocorra algum erro (e-mail não encontrado ou senha inválida)
        alert(result.msg);
      }
    } catch (error) {
      // Em caso de erro na requisição, exibe uma mensagem e loga o erro no console
      console.error("Erro ao fazer login:", error);
      alert(
        "Ocorreu um erro ao tentar efetuar o login. Por favor, tente novamente."
      );
    }
  });
});
