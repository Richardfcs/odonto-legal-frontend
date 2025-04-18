document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Você precisa estar autenticado para acessar os casos.');
    window.location.href = '../login.html';
    return;
  }

  // Seleciona o formulário pelo id
  const form = document.getElementById('cadastroForm');

  // Função para converter a imagem selecionada para Base64
  function convertImageToBase64(inputElement) {
    return new Promise((resolve, reject) => {
      const file = inputElement.files[0]; // Pega o primeiro arquivo, se houver
      if (!file) {
        // Se nenhum arquivo foi selecionado, resolve com uma string vazia
        resolve('');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = function () {
        // Extrai apenas a parte da string Base64, sem o prefixo (ex: "data:image/png;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };

      reader.onerror = error => reject(error);
      reader.readAsDataURL(file); // Inicia a conversão do arquivo em Base64
    });
  }

  // Adiciona o listener de submit para o formulário
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o comportamento padrão de reload da página

    // Obtém os valores dos campos do formulário
    const name = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telephone = document.getElementById('telefone').value;
    const cro = document.getElementById('cpf').value; // CPF ou CRO
    const password = document.getElementById('senha').value;
    const photoInput = document.getElementById('photo');

    try {
      // Converte a imagem para Base64 (retorna uma string ou uma string vazia)
      const base64Photo = await convertImageToBase64(photoInput);

      // Cria o objeto com os dados a serem enviados
      const data = {
        name,
        email,
        telephone,
        password,
        cro,
        photo: base64Photo, // Envia a foto convertida para Base64
        createdAt: new Date() // Opcional: o backend já define um default para createdAt
      };

      // Envia a requisição POST para o endpoint de cadastro de usuário
      const response = await fetch('http://localhost:3000/api/user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      // Converte a resposta para JSON
      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Usuário criado com sucesso!");
        form.reset();
      } else {
        alert("Erro: " + (result.error || "Erro ao cadastrar usuário."));
      }
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      alert("Ocorreu um erro ao tentar cadastrar o usuário. Tente novamente.");
    }
  });
});