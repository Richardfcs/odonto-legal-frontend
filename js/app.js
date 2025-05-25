const API_URL = 'https://odonto-legal-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('#loginForm');
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#senha');
  // Seleciona o botão de submit
  const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

  if (!loginForm || !emailInput || !passwordInput || !submitButton) { // Adicionado submitButton à verificação
    console.error("Erro fatal: Elementos do formulário de login (ou botão) não encontrados. Verifique IDs/estrutura HTML.");
    if (submitButton) submitButton.disabled = true; // Desabilita se o form não estiver completo
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === '' || password === '') {
      alert('Por favor, preencha ambos os campos: E-mail e Senha.');
      return;
    }

    const data = {
      email: email,
      password: password
    };

    // ---> DESABILITAR BOTÃO E MOSTRAR FEEDBACK DE CARREGAMENTO <---
    submitButton.disabled = true;
    submitButton.textContent = 'Entrando...'; // Altera o texto do botão

    try {
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.msg || 'Login bem-sucedido!');
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.role); // Corrigido para "Role do usuário:"

        // Lógica de redirecionamento baseada na role
        if (result.role === 'admin') {
          window.location.href = 'components/home.html';
        } else if (result.role === 'perito' || result.role === 'assistente') {
          window.location.href = 'main/home.html';
        } else {
          console.warn('Role de usuário desconhecida recebida:', result.role);
          alert('Sua role de usuário é desconhecida. Redirecionando para a página principal padrão.');
          window.location.href = '../index.html'; // Redireciona para uma página padrão
        }
        // Não reabilitamos o botão aqui porque a página será redirecionada

      } else {
        // Se a resposta HTTP não for sucesso
        if (response.status === 401 || response.status === 403) {
          alert("Sessão expirada ou não autorizada. Faça login novamente.");
          localStorage.removeItem('token');
          localStorage.removeItem('role')
          window.location.href = '../index.html';
          return; // Sai da função após redirecionar
        }
        alert(result.msg || `Erro no login (Status: ${response.status}). Verifique suas credenciais.`);
        // ---> REABILITAR BOTÃO EM CASO DE ERRO DE LOGIN <---
        submitButton.disabled = false;
        submitButton.textContent = 'Entrar';
      }

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Ocorreu um erro de conexão ou no servidor. Por favor, tente novamente.');
      // ---> REABILITAR BOTÃO EM CASO DE ERRO DE REDE/SERVIDOR <---
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });
});