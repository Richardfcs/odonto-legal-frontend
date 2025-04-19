// Arquivo: main/home.js

// Variável global para armazenar a role do usuário logado
let currentUserRole = null;

// --- Funções Auxiliares ---

// Função para exibir os cards de casos no container principal
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
    // Exibe mensagem quando NENHUM caso é encontrado
    let messageHTML = '';
    if (currentUserRole === 'assistente') {
        // Mensagem específica para Assistentes sem casos
        messageHTML = `
            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded col-span-full text-center" role="alert">
                <p class="font-bold">Nenhum caso associado encontrado.</p>
                <p class="text-sm">Como Assistente, você visualizará apenas os casos em que foi designado como responsável ou membro da equipe.</p>
                <p class="text-sm mt-2">Consulte o Banco de Casos para visualizar todos os casos no sistema.</p>
            </div>
        `;
    } else {
        // Mensagem geral para Admin/Perito sem casos associados (o que é menos comum na "Meus Casos")
         messageHTML = `
            <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded col-span-full text-center" role="alert">
                <p class="font-bold">Nenhum caso associado encontrado.</p>
                <p class="text-sm">Você visualizará apenas os casos em que foi designado como responsável ou membro da equipe.</p>
                 <p class="text-sm mt-2">Clique em "Novo Caso" para cadastrar um novo caso pericial.</p>
            </div>
         `;
    }
    container.innerHTML = messageHTML;
  }

  // Adiciona o card "Novo Caso" no final da lista, condicionalmente
  addNewCaseCard(container, currentUserRole);
}


// Função para adicionar o card "Novo Caso" ao container, decide se adiciona com base na role
function addNewCaseCard(container, userRole) {
    // Roles permitidas para adicionar novos casos: Admin e Perito
    const rolesAllowedToCreateCase = ['admin', 'perito'];

    // Verifica se a role do usuário logado está na lista de roles permitidas para criar
    if (userRole && rolesAllowedToCreateCase.includes(userRole)) {
        const newCaseCard = document.createElement("div");
        // Aplica as mesmas classes de estilo dos outros cards para alinhamento consistente
        newCaseCard.className =
        "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-between text-center"; // Mesmas classes de estilo do card estático

        // Conteúdo HTML para o card "Novo Caso"
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
        container.appendChild(newCaseCard); // Adiciona o card "Novo Caso" ao container
    }
    // Se a role não for permitida, o card não é adicionado.
}


// Função genérica para lidar com erros de requisição (fetch)
// Exibe um alerta e loga o erro. Limpa a lista e adiciona o card "Novo Caso" condicionalmente.
function handleFetchError(error, defaultMessage) {
    console.error(defaultMessage, error); // Loga o erro completo para debug
    alert(defaultMessage + (error.message ? `: ${error.message}` : '')); // Exibe alerta

    const container = document.getElementById('casesContainer');
    if(container) {
        // Limpa o conteúdo atual e exibe uma mensagem de erro na interface
        container.innerHTML = '<p class="text-red-600 col-span-full text-center">Erro ao carregar casos.</p>';
        // Adiciona o card "Novo Caso" mesmo em caso de erro, se a role do usuário permitir
        addNewCaseCard(container, currentUserRole); // Passa a role para addNewCaseCard
    }
}


// --- Funções de Carregamento de Dados ---

// Carrega a lista de casos ASSOCIADOS ao usuário logado
async function loadMyCases() {
    const token = localStorage.getItem("token");
    // checkPageAuthorization já verificou token e permissão.
    // currentUserRole já foi definido no escopo global no DOMContentLoaded.

    try {
        // Faz a requisição GET para a rota que lista os casos do usuário logado
        const response = await fetch("http://localhost:3000/api/user/mycases", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // Envia o token para autenticação
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro desconhecido." }));
             // Se for erro 404 ou 200 com array vazio, o backend getMyCasesList já trata e retorna 200 com array vazio
             // Aqui, tratamos outros erros HTTP (ex: 401, 403, 500)
             if (response.status === 401 || response.status === 403) {
                  alert("Sessão expirada ou não autorizada. Faça login novamente.");
                  localStorage.removeItem('token');
                  window.location.href = '../index.html'; // Redireciona para login
                  return;
             }
            throw new Error(errorData.message || "Erro ao buscar seus casos.");
        }

        // Processa a resposta JSON (deve ser um array de casos)
        const cases = await response.json();
        // Exibe a lista de casos na tela
        displayCases(cases); // displayCases usa currentUserRole para adicionar o card

        // Opcional: Log se a lista estiver vazia
        if (cases.length === 0) {
             console.log("Nenhum caso associado encontrado para este usuário.");
        }


    } catch (error) {
        // Captura e lida com erros durante a requisição ou processamento
        handleFetchError(error, 'Não foi possível carregar seus casos.'); // handleFetchError usa currentUserRole
    }
}

// --- Funções e Listeners Removidos ---
// As funções toggleDropdown, selectFilter, filterCases*, searchCasesByName, fetchFilteredCases
// e o listener window.onclick para o dropdown NÃO ESTÃO NESTE ARQUIVO.

// --- Inicialização Principal da Página ---

// Executado quando o conteúdo HTML do DOM estiver completamente carregado.
document.addEventListener('DOMContentLoaded', async () => {

    // PASSO CRUCIAL: VERIFICAÇÃO DE AUTORIZAÇÃO DA PÁGINA E OBTENÇÃO DA ROLE
    // Esta deve ser a PRIMEIRA coisa a acontecer dentro deste listener.
    // A página main/home.html (Home Geral) deve ser acessível para Admin, Perito e Assistente.
    const allowedRolesForThisPage = ['admin', 'perito', 'assistente'];

    // checkPageAuthorization lida com a falta de token/token inválido e redireciona se a role não for permitida.
    // Se autorizado, retorna true.
    const isAuthorized = checkPageAuthorization(allowedRolesForThisPage);

    if (!isAuthorized) {
        // Sai do listener se não for autorizado (redirecionamento já ocorreu)
        console.log("Acesso à página negado ou token inválido/ausente. Redirecionamento já executado.");
        return;
    }

    // Se chegamos até aqui, o usuário está logado E tem uma role permitida para esta página.
    // Agora podemos obter a role do usuário logado para uso nas lógicas condicionais da UI.
    const token = localStorage.getItem('token'); // Token já validado que existe

    try {
        // Decodifica o payload do token para obter a role
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const user = JSON.parse(payloadJson);
        currentUserRole = user.role; // Define a variável global
        console.log("Role do usuário logado obtida do token para UI:", currentUserRole); // Confirmação da role para UI

    } catch (error) {
        console.error("Erro ao decodificar token para obter role após autorização.", error);
        currentUserRole = null; // Define como null em caso de erro. Lógicas de UI usarão null.
    }

    // Carrega a lista de casos ASSOCIADOS ao usuário logado ao carregar a página.
    // loadMyCases chama displayCases, que usa currentUserRole.
    loadMyCases();

}); // Fim do DOMContentLoaded