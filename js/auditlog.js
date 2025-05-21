const API_URL = 'https://odonto-legal-backend.onrender.com';

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

// Variáveis globais para controle da paginação
let currentPage = 1;
const logsPerPage = 25; // Quantidade de logs a buscar por página (ajuste conforme necessário)
let totalPages = 1; // Será atualizado pela API

// --- Elementos do DOM ---
let auditLogContainer = null;
let prevPageBtn = null;
let nextPageBtn = null;
let currentPageSpan = null;
let totalPagesSpan = null;
let totalLogsInfo = null;
let loadingMessage = null;

// --- Funções Auxiliares ---

// Formata o timestamp para Data e Hora local
function formatTimestamp(isoString) {
    if (!isoString) return 'Data inválida';
    try {
        const date = new Date(isoString);
        const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        return `${date.toLocaleDateString('pt-BR', optionsDate)} ${date.toLocaleTimeString('pt-BR', optionsTime)}`;
    } catch (e) {
        return 'Data inválida';
    }
}

// Cria o HTML para um único card de log (MODIFICADO)
function createLogCard(log) {
    const card = document.createElement('div');
    // Adiciona overflow-hidden à div principal do card como uma garantia extra
    card.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 overflow-hidden';

    let detailsText = 'N/A';
    if (log.details) {
        try {
            // Formata o JSON com indentação para melhor leitura quando quebrado
            detailsText = JSON.stringify(log.details, null, 2);
            // Não truncar aqui, deixar o CSS cuidar do overflow/wrapping
        } catch (e) {
            detailsText = '[Erro ao formatar detalhes]';
        }
    }

    // Constrói o HTML interno do card
    card.innerHTML = `
        <div class="flex-grow mb-2 sm:mb-0 min-w-0">
            <p class="text-sm text-gray-800">
                <span class="font-semibold text-blue-700">${log.userId?.name || 'Usuário Desconhecido'}</span>
                (<span class="italic text-gray-600">${log.userId?.role || 'Role?'}</span>)
                realizou a ação
                <span class="font-semibold text-purple-700">${log.action || 'Ação Desconhecida'}</span>
            </p>
            <p class="text-xs text-gray-600 mt-1">
                Alvo: <span class="font-medium">${log.targetModel || '?'}</span> |
                ID Alvo: <span class="font-medium break-all">${log.targetId || '?'}</span>
            </p>
             <p class="text-xs text-gray-500 mt-1">
                 Detalhes:
                 <code class="block text-xs bg-gray-100 p-1 rounded whitespace-pre-wrap break-all overflow-x-auto">${detailsText}</code>
             </p>
        </div>
        <div class="flex-shrink-0 text-right text-xs text-gray-500 whitespace-nowrap">
            ${formatTimestamp(log.timestamp)}
        </div>
    `;
    return card;
}


// Exibe a lista de logs no container
function displayLogs(logs) {
    if (!auditLogContainer) return; // Sai se o container não for encontrado

    auditLogContainer.innerHTML = ''; // Limpa o container

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        // Mensagem se não houver logs para a página/filtro atual
        auditLogContainer.innerHTML = '<p class="text-center text-gray-600 py-10">Nenhum log de auditoria encontrado para esta página.</p>';
    } else {
        // Cria e adiciona um card para cada log
        logs.forEach(log => {
            const logCard = createLogCard(log);
            auditLogContainer.appendChild(logCard);
        });
    }
}

// Atualiza os botões e informações de paginação
function updatePaginationControls() {
    if (!currentPageSpan || !totalPagesSpan || !prevPageBtn || !nextPageBtn || !totalLogsInfo) return; // Sai se elementos não existem

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    totalLogsInfo.textContent = `Exibindo página ${currentPage} de ${totalPages}.`; // Exibe info da página total

    // Habilita/desabilita botão "Anterior"
    prevPageBtn.disabled = currentPage <= 1;
    // Habilita/desabilita botão "Próxima"
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Busca os logs da API para uma página específica
async function fetchAndDisplayLogs(page = 1) {
    const token = localStorage.getItem("token"); // Token já validado pelo checkPageAuthorization
    if (!auditLogContainer) return; // Não faz nada se o container não existe

    // Mostra mensagem de carregamento e desabilita botões
    if (loadingMessage) loadingMessage.style.display = 'block';
    auditLogContainer.innerHTML = ''; // Limpa logs antigos enquanto carrega
    if(prevPageBtn) prevPageBtn.disabled = true;
    if(nextPageBtn) nextPageBtn.disabled = true;

    try {
        // Constrói a URL da API com paginação
        const apiUrl = `${API_URL}/api/auditlog?page=${page}&limit=${logsPerPage}`;
        // Adicione aqui parâmetros de filtro se implementados no futuro: &userId=... &action=...

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Erro desconhecido." }));
             if (response.status === 401 || response.status === 403) { // Erro de autorização/autenticação
                  alert("Sessão expirada ou não autorizada. Faça login novamente.");
                  localStorage.removeItem('token');
                  window.location.href = '../index.html';
                  return;
             }
            throw new Error(errorData.message || "Erro ao buscar logs de auditoria.");
        }

        const result = await response.json();

        // Atualiza variáveis globais de paginação
        currentPage = result.currentPage || 1;
        totalPages = result.totalPages || 1;

        // Exibe os logs recebidos
        displayLogs(result.auditLogs || []);
        // Atualiza os controles de paginação
        updatePaginationControls();

    } catch (error) {
        console.error("Erro ao buscar e exibir logs:", error);
        alert("Erro ao carregar logs: " + error.message);
        if (auditLogContainer) {
            auditLogContainer.innerHTML = '<p class="text-center text-red-600 py-10">Falha ao carregar os logs de auditoria.</p>';
        }
         // Mantém paginação desabilitada em caso de erro
         if(currentPageSpan) currentPageSpan.textContent = '?';
         if(totalPagesSpan) totalPagesSpan.textContent = '?';
         if(totalLogsInfo) totalLogsInfo.textContent = 'Erro ao carregar.';

    } finally {
         // Esconde a mensagem de carregamento após a tentativa
         if (loadingMessage) loadingMessage.style.display = 'none';
         // Re-habilita os botões baseados nos dados atuais (updatePaginationControls faz isso se chamado)
         updatePaginationControls(); // Chama de novo para garantir o estado correto dos botões
    }
}

// --- Inicialização e Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {

    // PASSO CRUCIAL: VERIFICAÇÃO DE AUTORIZAÇÃO DA PÁGINA
    // Apenas 'admin' pode acessar os logs de auditoria
    const allowedRoles = ['admin'];
    const isAuthorized = checkPageAuthorization(allowedRoles);

    if (!isAuthorized) {
        return; // Sai se não for autorizado (redirecionamento já ocorreu)
    }

    // Obtém referências aos elementos do DOM após verificar autorização
    auditLogContainer = document.getElementById('auditLogContainer');
    prevPageBtn = document.getElementById('prevPageBtn');
    nextPageBtn = document.getElementById('nextPageBtn');
    currentPageSpan = document.getElementById('currentPageSpan');
    totalPagesSpan = document.getElementById('totalPagesSpan');
    totalLogsInfo = document.getElementById('totalLogsInfo');
    loadingMessage = document.getElementById('loadingMessage');

    // Verifica se todos os elementos de paginação foram encontrados
    if (!prevPageBtn || !nextPageBtn || !currentPageSpan || !totalPagesSpan || !totalLogsInfo) {
        console.error("Erro: Elementos de paginação não encontrados no DOM.");
        // Pode desabilitar a funcionalidade ou mostrar erro
    } else {
        // Adiciona listeners aos botões de paginação
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchAndDisplayLogs(currentPage - 1);
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                fetchAndDisplayLogs(currentPage + 1);
            }
        });
    }

    // Carrega a primeira página de logs ao inicializar
    fetchAndDisplayLogs(1);

}); // Fim do DOMContentLoaded