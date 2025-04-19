const API_URL = 'https://odonto-legal-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  // Seleciona o formulário e os campos de input
  const loginForm = document.querySelector('#loginForm'); // Verifique se o ID do FORMULÁRIO é este
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#senha'); // Usando o ID 'senha' do HTML

  // Verifica se os elementos essenciais foram encontrados. Se não, loga um erro e sai.
  if (!loginForm || !emailInput || !passwordInput) {
    console.error("Erro fatal: Elementos do formulário de login não encontrados no DOM. Verifique os IDs no HTML.");
    // Opcional: desabilitar o botão de submit ou mostrar uma mensagem de erro na tela
    const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    if(submitButton) submitButton.disabled = true;
    return;
  }

  // Adiciona um event listener para o evento de submit do formulário
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Previne o comportamento padrão do formulário (recarregar a página)

    // Obtém os valores dos campos de e-mail e senha, removendo espaços em branco no início/fim
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validação básica no frontend: verifica se os campos não estão vazios
    if (email === '' || password === '') {
      alert('Por favor, preencha ambos os campos: E-mail e Senha.');
      return; // Para a execução se a validação falhar
    }

    // Prepara o corpo da requisição no formato JSON
    const data = {
      email: email,
      password: password
    };

    try {
      // Exibe uma mensagem de "Carregando..." ou similar (opcional)
      // Ex: submitButton.textContent = 'Entrando...'; submitButton.disabled = true;

      // Envia a requisição POST para o endpoint de login no backend
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Indica que o corpo é JSON
        },
        body: JSON.stringify(data) // Converte o objeto JavaScript para uma string JSON
      });

      // Processa a resposta do backend como JSON
      const result = await response.json();

      // Verifica se a resposta HTTP indica sucesso (status 2xx)
      if (response.ok) {
        alert(result.msg || 'Login bem-sucedido!'); // Exibe a mensagem de sucesso do backend

        // Salva o token JWT recebido no localStorage para uso posterior
        localStorage.setItem('token', result.token);
        console.log(result.role)

        // *** Lógica de redirecionamento baseada na role do usuário (CORRIGIDA) ***
        // Verifica a 'role' retornada pelo backend
        if (result.role === 'admin') {
          // Redireciona para a home do administrador
          window.location.href = 'components/home.html';
        } else if (result.role === 'perito' || result.role === 'assistente') {
          // Redireciona para a home de peritos/assistentes (sua main/home.html)
          window.location.href = 'main/home.html';
        } else {
          // Trata roles inesperadas
          console.warn('Role de usuário desconhecida recebida:', result.role);
          alert('Sua role de usuário é desconhecida. Redirecionando para a página principal padrão.');
          window.location.href = '../index.html'; // Redireciona para uma página padrão segura
        }

      } else {
        // Se a resposta HTTP não for sucesso (ex: 404, 422), exibe a mensagem de erro do backend
        alert(result.msg || `Erro desconhecido (Status: ${response.status})`);
         // Opcional: Reativar o botão de submit e remover texto "carregando"
         // submitButton.textContent = 'Entrar'; submitButton.disabled = false;
      }

    } catch (error) {
      // Captura e lida com erros que ocorreram durante a requisição (ex: erro de rede, servidor offline)
      console.error('Erro ao fazer login:', error);
      alert('Ocorreu um erro de conexão ou no servidor ao tentar efetuar o login. Por favor, tente novamente.');
       // Opcional: Reativar o botão de submit e remover texto "carregando"
       // submitButton.textContent = 'Entrar'; submitButton.disabled = false;
    }
  });
});