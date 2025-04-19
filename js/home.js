// Fecha o dropdown se clicar fora
window.onclick = function (event) {
  if (!event.target.matches(".filter-button")) {
    const dropdown = document.getElementById("dropdown");
    if (dropdown && dropdown.style.display === "block") {
      dropdown.style.display = "none";
    }
  }
};

// Script para mostrar/ocultar o menu dropdown
document.querySelectorAll(".fa-pencil-alt").forEach((button) => {
  button.addEventListener("click", function () {
    const dropdown =
      this.closest(".relative").querySelector(".dropdown-content");
    dropdown.classList.toggle("hidden");
  });
});
// Fecha o dropdown se clicar fora
window.onclick = function (event) {
  if (!event.target.matches(".filter-button") && !event.target.closest('.dropdown-content')) { // Adicionado .closest('.dropdown-content') para não fechar ao clicar DENTRO do dropdown
    const dropdown = document.getElementById("dropdown");
    if (dropdown && dropdown.style.display === "block") {
      dropdown.style.display = "none";
    }
  }
};

document.addEventListener("DOMContentLoaded", async () => {
    

  // Carregamento inicial dos casos (sem filtros, todos os casos)
  loadInitialCases();
  
});

async function loadInitialCases() {
  const token = localStorage.getItem("token");

  if (!token) {
      alert("Você precisa estar autenticado para acessar os casos.");
      window.location.href = "../index.html";
      return;
  }

  try {
      const response = await fetch("http://localhost:3000/api/case", { // Rota para buscar todos os casos (sem filtro)
          method: "GET",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
          },
      });

      if (!response.ok) {
          // Tenta obter uma mensagem de erro mais detalhada do backend
          const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao buscar casos iniciais." }));
          throw new Error(errorData.message || "Erro ao buscar os casos iniciais.");
      }

      const cases = await response.json();
      displayCases(cases); // Chama a função para exibir os casos
  } catch (error) {
      console.error("Erro ao obter os casos iniciais:", error);
      alert(
          "Não foi possível carregar os casos iniciais. Verifique se o token é válido e se o servidor está ativo. Detalhes: " + error.message
      );
  }
}

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
                  <a href="pericia.html?id=${item._id}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                      Visualizar
                  </a>
              </div>
          `;
          container.appendChild(card);
      });
  } else {
      container.innerHTML = '<p class="text-gray-700 col-span-full text-center">Nenhum caso encontrado.</p>'; // Adicionado col-span-full e text-center para centralizar
  }

  // --- Adiciona o card "Novo Caso" DINAMICAMENTE no final ---
  const newCaseCard = document.createElement("div");
  newCaseCard.className =
      "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-between text-center"; // Mesmas classes de estilo do card estático

  newCaseCard.innerHTML = `
      <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">Novo Caso</h2>
      <img class="w-24 h-24 mb-3 mx-auto block" src="../img/add_icon.png" alt="add_icon"/>
      <!-- Ações: Link para Cadastrar -->
      <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
        <a href="createCase.html" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          Cadastrar
        </a>
      </div>
  `;

  container.appendChild(newCaseCard);
}

// --- Funções de Filtro de Status e Data (ajustadas para usar fetch e display) ---
async function fetchFilteredCases(url) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Você precisa estar autenticado.");
        window.location.href = "../index.html";
        return;
    }
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
           // Tenta obter uma mensagem de erro mais detalhada do backend
           const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao filtrar casos." }));
           throw new Error(errorData.message || `Erro na requisição de filtro: ${response.statusText}`);
        }
        const data = await response.json();
         // Supondo que as rotas de filtro retornem diretamente o array de casos ou um objeto com { cases: [...] }
        const cases = data.cases || data; // Ajuste aqui dependendo do formato exato da resposta do backend
        displayCases(cases);
    } catch (error) {
        console.error("Erro ao buscar casos filtrados:", error);
        alert("Erro ao aplicar filtro: " + error.message);
         // Opcional: limpar a lista ou mostrar mensagem de erro na tela
        displayCases([]); // Limpa a lista em caso de erro
    }
}

function filterCasesNewest() {
    fetchFilteredCases(`http://localhost:3000/api/case/fdata?order=newest`);
}

function filterCasesOldest() {
    fetchFilteredCases(`http://localhost:3000/api/case/fdata?order=oldest`);
}

function filterCasesCompleted() {
    fetchFilteredCases(`http://localhost:3000/api/case/fstatus?status=finalizado`);
}

function filterCasesInProgress() {
    fetchFilteredCases(`http://localhost:3000/api/case/fstatus?status=em andamento`);
}

function filterCasesArchived() {
    fetchFilteredCases(`http://localhost:3000/api/case/fstatus?status=arquivado`);
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
    fetchFilteredCases(`http://localhost:3000/api/case/fcat?category=${category}`);
}


// --- Função de Pesquisa ---
async function searchCasesByName() {
  const searchTerm = document.querySelector('.search-bar').value;
  if (searchTerm.trim() === "") {
      // Se a barra de pesquisa estiver vazia, recarrega todos os casos
      loadInitialCases();
      return;
  }
  const token = localStorage.getItem("token");
  try {
      const response = await fetch(`http://localhost:3000/api/case/fname?nameCase=${encodeURIComponent(searchTerm)}`, { // Use encodeURIComponent para termos com espaços/caracteres especiais
          headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao pesquisar por nome." }));
          // Se o erro for 404 (nenhum caso encontrado), não lança erro, apenas exibe a mensagem vazia
          if(response.status === 404) {
               displayCases([]); // Limpa a exibição
               alert(errorData.message || "Nenhum caso encontrado com esse nome.");
               return; // Sai da função
          }
           // Para outros erros, lança o erro
          throw new Error(errorData.message || `Erro na requisição de pesquisa: ${response.statusText}`);
      }
      const cases = await response.json();
      displayCases(cases);
  } catch (error) {
      console.error("Erro ao pesquisar casos por nome:", error);
      alert("Erro ao pesquisar casos por nome: " + error.message);
       // Opcional: limpar a lista ou mostrar mensagem de erro na tela
      displayCases([]); // Limpa a lista em caso de erro
  }
}

// --- Dropdown Filtro (modificado para chamar as funções de filtro) ---
function toggleDropdown() {
  const dropdown = document.getElementById("dropdown");
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

function selectFilter(element) {
    const selectedValue = element.dataset.value; // Pega o valor do data-value
    const filterButton = document.getElementById("filterButton");
    filterButton.textContent = element.textContent + " ▾"; // Atualiza o botão com o texto visível
    document.getElementById("dropdown").style.display = "none";

    // Chama a função de filtro correspondente com base no data-value
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
        // NOVOS CASES PARA CATEGORIAS
        case "acidente":
        case "identificação de vítima":
        case "exame criminal":
        case "outros":
            filterCasesByCategory(selectedValue); // Chama a nova função com o valor da categoria
            break;
        // FIM DOS NOVOS CASES
        default:
            console.log("Filtro não reconhecido:", selectedValue);
             // Opcional: carregar todos os casos novamente ou mostrar uma mensagem
             loadInitialCases(); // Carrega todos os casos se o filtro não for reconhecido
    }
}


// --- Event Listeners ---
document.querySelector('.search-button').addEventListener('click', searchCasesByName); // Listener para o botão de pesquisa

// Opcional: Adicionar listener para Enter na barra de pesquisa
document.querySelector('.search-bar').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Impede o envio de formulário padrão se a barra estiver dentro de um form
        searchCasesByName();
    }
});


// Observação sobre o carregamento inicial:
// O script atual chama loadInitialCases() quando o DOM estiver pronto.
// Se você quiser que, por padrão, a página já carregue com o filtro "Mais recentes",
// substitua a linha `loadInitialCases();` por `filterCasesNewest();` dentro do `DOMContentLoaded`.