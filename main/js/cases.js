const API_URL = 'https://odonto-legal-backend.onrender.com';
// Arquivo: main/home.js
// Variável global para armazenar a role do usuário logado
let currentUserRole = null;

// --- Funções Auxiliares ---

// --- Função Refatorada para Exibir Casos ---
function displayCases(cases) {
    const container = document.getElementById("casesContainer");
    if (!container) {
        console.error("Container para casos não encontrado no DOM.");
        return;
    }
    container.innerHTML = ""; // Limpa o container antes de exibir novos casos
  
    if (cases && Array.isArray(cases) && cases.length > 0) { // Verifica se cases é um array válido
        cases.forEach((item) => {
            const card = document.createElement("div");
            card.className =
                "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-center text-center";
  
            card.innerHTML = `
                <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">${item.nameCase}</h2>
                <div class="flex flex-col items-center pb-10">
                    <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-black">${item.responsibleExpert?.name || "Expert não definido"}</h5>
                    <span class="text-sm text-gray-900 dark:text-gray-900">${item.responsibleExpert?.role || "Função não definida"}</span>
                    <span class="text-sm text-gray-500 dark:text-gray-500">Local: ${item.location}</span>
                    <span class="text-sm text-gray-500 dark:text-gray-500">${item.Description ? item.Description.substring(0, 40) + (item.Description.length > 40 ? '...' : '') : '—'}</span>
                    <span class="text-sm text-gray-600 dark:text-gray-900">Status: ${item.status}</span>
                </div>
                <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
                    <a href="consultaCase.html?id=${item._id}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        Consultar
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p class="text-gray-700 col-span-full text-center">Nenhum caso encontrado.</p>'; // Adicionado col-span-full e text-center para centralizar
    }
  }

// Função para adicionar o card "Novo Caso" ao container
function addNewCaseCard(container, userRole) {
    // Roles permitidas para adicionar novos casos
    const rolesAllowedToCreateCase = ['admin', 'perito'];

    if (userRole && rolesAllowedToCreateCase.includes(userRole)) {
        const newCaseCard = document.createElement("div");
        newCaseCard.className =
            "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-between text-center";

        newCaseCard.innerHTML = `
            <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">Novo Caso</h2>
            <img class="w-24 h-24 mb-3 mx-auto block" src="../img/add_icon.png" alt="add_icon"/>
             <div class="flex flex-col items-center pb-10">
                   
             </div>
            <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
              <a href="createCase.html" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Cadastrar
              </a>
            </div>
        `;
        container.appendChild(newCaseCard);
    }
}


// Função genérica para lidar com erros de requisição (fetch)
function handleFetchError(error, defaultMessage) {
    console.error(defaultMessage, error);
    alert(defaultMessage + (error.message ? `: ${error.message}` : ''));

    const container = document.getElementById('casesContainer');
    if(container) {
        container.innerHTML = '<p class="text-red-600 col-span-full text-center">Erro ao carregar casos.</p>';
        addNewCaseCard(container, currentUserRole); // Adiciona o card "Novo Caso" mesmo em caso de erro
    }
}


// --- Funções de Busca e Carregamento de Dados ---

// Carrega a lista inicial de todos os casos
async function loadInitialCases() {
    const token = localStorage.getItem("token");

    // checkPageAuthorization já verificou token e permissão.
    // currentUserRole já foi definido no escopo global.

    try {
        const response = await fetch(`${API_URL}/api/case`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro desconhecido." }));
            if (response.status === 401 || response.status === 403) {
                  alert("Sessão expirada ou não autorizada. Faça login novamente.");
                  localStorage.removeItem('token');
                  window.location.href = '../index.html'; // Redireciona para login
                  return;
             }
            throw new Error(errorData.message || "Erro ao buscar os casos iniciais.");
        }

        const cases = await response.json();
        displayCases(cases); // displayCases usa currentUserRole

    } catch (error) {
        handleFetchError(error, 'Não foi possível carregar os casos iniciais.'); // handleFetchError usa currentUserRole
    }
}


// Realiza a busca de casos por nome usando a barra de pesquisa
async function searchCasesByName() {
  const searchTerm = document.querySelector('.search-bar').value;

  if (searchTerm.trim() === "") {
      loadInitialCases();
      return;
  }

  const token = localStorage.getItem("token");

  try {
      const response = await fetch(`${API_URL}/api/case/fname?nameCase=${encodeURIComponent(searchTerm)}`, {
          headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Erro desconhecido." }));
          if (response.status >= 400 && response.status < 500) {
               displayCases([]);
               alert(errorData.message || `Nenhum caso encontrado com o nome "${searchTerm}".`);
               return;
          }
         throw new Error(errorData.message || `Erro na requisição de pesquisa: ${response.statusText}`);
      }

      const cases = await response.json();
      displayCases(cases);

      if (cases.length === 0) {
           alert(`Nenhum caso encontrado com o nome "${searchTerm}".`);
      }

  } catch (error) {
      handleFetchError(error, 'Erro ao pesquisar casos por nome.');
  }
}

// Função genérica para aplicar filtros
async function fetchFilteredCases(url) {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao filtrar casos." }));
           if (response.status >= 400 && response.status < 500) {
                displayCases([]);
                alert(errorData.message || `Nenhum caso encontrado para este filtro.`);
                return;
           }
           throw new Error(errorData.message || `Erro na requisição de filtro: ${response.statusText}`);
        }
        const data = await response.json();
        const cases = data.cases || data;
        displayCases(cases);

    } catch (error) {
        handleFetchError(error, 'Erro ao aplicar filtro.');
    }
}

function filterCasesNewest() {
    fetchFilteredCases(`${API_URL}/api/case/fdata?order=newest`);
}

function filterCasesOldest() {
    fetchFilteredCases(`${API_URL}/api/case/fdata?order=oldest`);
}

function filterCasesCompleted() {
    fetchFilteredCases(`${API_URL}/api/case/fstatus?status=finalizado`);
}

function filterCasesInProgress() {
    fetchFilteredCases(`${API_URL}/api/case/fstatus?status=em andamento`);
}

function filterCasesArchived() {
    fetchFilteredCases(`${API_URL}/api/case/fstatus?status=arquivado`);
}

// --- Nova Função para Filtrar por Categoria ---
async function filterCasesByCategory(category) {
    // Verifica se a categoria é válida antes de chamar a API
    const validCategories = ["acidente", "identificação de vítima", "exame criminal", "outros"];
    if (!validCategories.includes(category)) {
        console.error("Categoria inválida:", category);
        alert("Filtro de categoria inválido.");
        return;
    }
    fetchFilteredCases(`${API_URL}/api/case/fcat?category=${category}`);
}

// --- Funções e Listeners do Dropdown de Filtro ---

// Script para mostrar/ocultar o menu dropdown
function toggleDropdown() {
  const dropdown = document.getElementById("dropdown");
  if(dropdown) {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  } else {
      console.error("Elemento #dropdown não encontrado.");
  }
}

// Função chamada ao selecionar uma opção no dropdown
function selectFilter(element) {
    const selectedValue = element.dataset.value;
    const filterButton = document.getElementById("filterButton");

    if(filterButton) {
        filterButton.textContent = element.textContent + " ▾";
    } else {
        console.error("Elemento #filterButton não encontrado.");
    }

    const dropdown = document.getElementById("dropdown");
    if(dropdown) dropdown.style.display = "none";

    switch (selectedValue) {
        case "newest":
            filterCasesNewest();
            break;
        case "oldest":
            filterCasesOldest();
            break;
        case "finalizado":
            filterCasesCompleted();
            break;
        case "em andamento":
            filterCasesInProgress();
            break;
        case "arquivado":
            filterCasesArchived();
            break;
        case "acidente":
        case "identificação de vítima":
        case "exame criminal":
        case "outros":
            filterCasesByCategory(selectedValue);
            break;
        default:
            console.warn("Filtro desconhecido selecionado:", selectedValue);
            loadInitialCases();
    }
}


// Fecha o dropdown se clicar fora dele ou do botão de filtro
window.onclick = function (event) {
  if (!event.target.matches(".filter-button") && !event.target.closest('.dropdown-content')) {
    const dropdown = document.getElementById("dropdown");
    if (dropdown && dropdown.style.display === "block") {
      dropdown.style.display = "none";
    }
  }
};

// --- Inicialização Principal da Página ---

document.addEventListener('DOMContentLoaded', async () => {

    // PASSO CRUCIAL: VERIFICAÇÃO DE AUTORIZAÇÃO DA PÁGINA E OBTENÇÃO DA ROLE
    const allowedRolesForThisPage = ['admin', 'perito', 'assistente']; // Roles permitidas para main/home.html

    // checkPageAuthorization lida com a falta de token/token inválido e redireciona se a role não for permitida.
    const isAuthorized = checkPageAuthorization(allowedRolesForThisPage);

    if (!isAuthorized) {
        return; // Sai do listener se não for autorizado
    }

    // Se chegou até aqui, o usuário está logado E tem uma role permitida.
    // Agora podemos obter a role do usuário logado para uso nas lógicas condicionais da UI.
    const token = localStorage.getItem('token');

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const user = JSON.parse(payloadJson);
        currentUserRole = user.role; // Define a variável global

    } catch (error) {
        console.error("Erro ao decodificar token após autorização.", error);
        currentUserRole = null; // Define como null se houver um problema na decodificação
        // A verificação de token e redirecionamento já ocorreu em checkPageAuthorization.
        // O script continua, mas a UI será renderizada como se a role fosse desconhecida.
    }


    // --- Restante da Inicialização da Página ---

    // Adiciona listener para o clique no botão da lupa
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        searchButton.addEventListener('click', searchCasesByName);
    } else {
        console.error("Botão de pesquisa (.search-button) não encontrado no DOM.");
    }

    // Adiciona listener para a tecla "Enter" na barra de pesquisa
    const searchInput = document.querySelector('.search-bar');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' || event.keyCode === 13) {
                event.preventDefault();
                searchCasesByName();
            }
        });
    } else {
        console.error("Barra de pesquisa (.search-bar) não encontrado no DOM.");
    }

    // Carrega a lista inicial de casos ao carregar a página.
    // loadInitialCases chama displayCases, que usa currentUserRole.
    loadInitialCases();

}); // Fim do DOMContentLoaded