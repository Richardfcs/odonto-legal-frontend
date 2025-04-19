const API_URL = 'https://odonto-legal-backend.onrender.com';

// Função para exibir os cards de usuários no container
function displayUsers(users) {
  const container = document.getElementById('usersContainer');
  if (!container) {
      console.error('Container de usuários (#usersContainer) não encontrado no DOM.');
      return;
  }
  container.innerHTML = ''; // Limpa o container

  if (users && Array.isArray(users) && users.length > 0) {
    users.forEach(user => {
      const defaultImage = '../img/default_icon.png';
      // Cria URL para foto do usuário (assumindo Base64) ou usa a padrão
      const photoUrl = user.photo && typeof user.photo === 'string' && user.photo.trim().length > 0
        ? `data:image/png;base64,${user.photo}`
        : defaultImage;

      // Mapeia a role para texto amigável
      const roleText =
        user.role === 'admin'
          ? 'Administrador'
          : user.role === 'perito'
          ? 'Perito'
          : 'Assistente';

      const card = document.createElement('div');
      card.className = 'bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-between text-center';

      // Estrutura interna do card de usuário
      card.innerHTML = `
        <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">${user.name || 'Nome não informado'}</h2>
        <div class="flex flex-col items-center pb-10">
          <img class="w-24 h-24 mb-3 rounded-full shadow-lg object-cover" src="${photoUrl}" alt="${user.name || 'Usuário'}" />
          <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-black">${user.name || 'Nome não informado'}</h5>
          <span class="text-sm text-gray-500 dark:text-gray-500">${user.email || 'Email não informado'}</span>
          <span class="text-sm text-gray-600 dark:text-gray-900">${roleText}</span>
        </div>
        <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
          <a href="gerenciar_perms1.html?id=${user._id}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Gerenciar
          </a>
        </div>
      `;
      container.appendChild(card);
    });
  } else {
    container.innerHTML = '<p class="text-gray-700 col-span-full text-center">Nenhum funcionário encontrado.</p>';
  }

  // Adiciona o card "Novo funcionário" no final da lista
  addNewUserCard(container);
}

// Função para adicionar o card "Novo funcionário" (MODIFICADA)
function addNewUserCard(container) {
    const newUserCard = document.createElement("div");
    newUserCard.className =
        "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-between text-center";

    // Estrutura interna do card "Novo funcionário", replicando a do card de usuário
    newUserCard.innerHTML = `
        <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">Novo funcionário</h2>
        <div class="flex flex-col items-center pb-10">
             <img class="w-24 h-24 mb-3 mx-auto block" src="../img/add_icon.png" alt="add_icon"/>
             <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-black"> </h5> 
             <span class="text-sm text-gray-500 dark:text-gray-500"> </span> 
             <span class="text-sm text-gray-600 dark:text-gray-900"> </span> 
         </div>
        <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
          <a href="cadastro.html" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Cadastrar
          </a>
        </div>
    `;
    container.appendChild(newUserCard);
}


// Função genérica para lidar com erros de requisição e exibir mensagem/card de adição
function handleFetchError(error, defaultMessage) {
    console.error(defaultMessage, error);
    alert(defaultMessage + (error.message ? `: ${error.message}` : ''));

    const container = document.getElementById('usersContainer');
    if(container) {
        container.innerHTML = '<p class="text-red-600 col-span-full text-center">Erro ao carregar funcionários.</p>';
        addNewUserCard(container); // Adiciona o card de adição mesmo com erro
    }
}


// --- Funções de Busca e Carregamento ---

// Carrega a lista inicial de todos os usuários
async function loadInitialUsers() {
  const token = localStorage.getItem('token');
  if (!token) {
      alert('Você precisa estar autenticado para acessar esta página.');
      window.location.href = '../index.html'; // Ajuste o caminho se necessário
      return;
  }
  try {
      const response = await fetch(`${API_URL}/api/user`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          }
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: "Erro desconhecido." }));
         throw new Error(errorData.message || "Erro ao buscar usuários iniciais.");
      }

      const users = await response.json();
      displayUsers(users); // Exibe a lista completa

  } catch (error) {
      handleFetchError(error, 'Não foi possível carregar os usuários iniciais.');
  }
}

// Realiza a busca de usuários por nome
async function searchUsersByName() {
    const searchTerm = document.querySelector('.search-bar').value;

    if (searchTerm.trim() === "") {
        loadInitialUsers(); // Carrega todos os usuários se a busca estiver vazia
        return;
    }

    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${API_URL}/api/user/fname?name=${encodeURIComponent(searchTerm)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro desconhecido." }));
            if (response.status >= 400 && response.status < 500) {
                 displayUsers([]);
                 alert(errorData.message || `Nenhum funcionário encontrado com o nome "${searchTerm}".`);
                 return;
            }
           throw new Error(errorData.message || `Erro na requisição de pesquisa: ${response.statusText}`);
        }

        const users = await response.json();
        displayUsers(users);

        if (users.length === 0) {
             alert(`Nenhum funcionário encontrado com o nome "${searchTerm}".`);
        }

    } catch (error) {
        handleFetchError(error, 'Erro ao pesquisar funcionários.');
    }
}


// --- Inicialização e Event Listeners ---

// Espera o DOM carregar antes de adicionar listeners e carregar dados
document.addEventListener('DOMContentLoaded', () => {
  // --- Passo de Verificação de Autorização ---
  const allowedRoles = ['admin']; // <-- Defina as roles permitidas para ESTA página
  if (!checkPageAuthorization(allowedRoles)) {
      // Se a autorização falhou dentro da função, ela já redirecionou.
      // Apenas saia do resto do script para evitar erros.
      return;
  }
  // Adiciona listener para o clique no botão da lupa
  const searchButton = document.querySelector('.search-button');
  if (searchButton) {
      searchButton.addEventListener('click', searchUsersByName);
  } else {
      console.error("Botão de pesquisa (.search-button) não encontrado no DOM.");
  }

  // Adiciona listener para a tecla "Enter" na barra de pesquisa
  const searchInput = document.querySelector('.search-bar');
  if (searchInput) {
      searchInput.addEventListener('keypress', function(event) {
          if (event.key === 'Enter' || event.keyCode === 13) {
              event.preventDefault();
              searchUsersByName();
          }
      });
  } else {
      console.error("Barra de pesquisa (.search-bar) não encontrado no DOM.");
  }

   // Chamada para carregar a lista inicial de usuários quando a página carregar
   loadInitialUsers();

   // --- Mantenha outros Listeners ou Funções se existirem ---
   // Ex: Funções e listeners para dropdowns (se aplicável nesta página)
   // Ex: window.onclick para fechar elementos, etc.
   // Ex: Script para mostrar/ocultar o menu dropdown (se ainda usado e aplicável nesta página)
});