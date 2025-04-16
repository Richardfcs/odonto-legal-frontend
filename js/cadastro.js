document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar autenticado para acessar os casos.");
    // Redireciona o usuário para a página de login, se necessário
    window.location.href = "login.html";
    return;
  }

  // Seleciona o formulário pelo id
  const form = document.getElementById("cadastroForm");

  // Adiciona o listener de submit para o formulário
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o comportamento padrão de reload da página

    // Obtém os valores dos campos do formulário
    const name = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const telephone = document.getElementById("telefone").value;
    // O campo 'cpf' é utilizado para representar o CPF/CRO do usuário
    const cro = document.getElementById("cpf").value;
    const password = document.getElementById("senha").value;

    // Cria o objeto com os dados a serem enviados
    // O campo "createdAt" não é obrigatório, pois o model já tem um valor default,
    // mas podemos enviar a data atual se desejado.
    const data = {
      name,
      email,
      telephone,
      password,
      cro,
      createdAt: new Date(), // Opcional: o backend já define o default
    };

    try {
      // Envia a requisição POST para o endpoint de cadastro de usuário
      const response = await fetch("http://localhost:3000/api/user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data), // Converte o objeto para JSON
      });

      // Converte a resposta para JSON
      const result = await response.json();

      if (response.ok) {
        // Em caso de sucesso, exibe uma mensagem e opcionalmente limpa ou redireciona
        alert(result.message || "Usuário criado com sucesso!");
        form.reset();
      } else {
        // Em caso de erro, exibe a mensagem de erro recebida
        alert("Erro: " + (result.error || "Erro ao cadastrar usuário."));
      }
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      alert("Ocorreu um erro ao tentar cadastrar o usuário. Tente novamente.");
    }
  });
});
