// Arquivo: pericia.js - Versão APENAS CONSULTA

// Obtém o ID do caso a partir dos parâmetros da URL
const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");

// Obtém o token JWT do localStorage
const token = localStorage.getItem("token");

// Variável global para armazenar a role do usuário logado (útil para verificar se é apenas consulta)
let currentUserRole = null;

// --- Funções Auxiliares ---

// Função para carregar e exibir os dados do caso
async function loadCaseData() {
    // A verificação de token e autorização da página já é feita no DOMContentLoaded.
    // O token já está disponível no escopo global.

    try {
        // Faz a requisição GET para buscar os dados do caso pelo ID
        const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
            headers: { Authorization: `Bearer ${token}` } // Envia o token
        });

        // Verifica se a resposta HTTP foi bem-sucedida (status 2xx)
        if (!res.ok) {
             // Tenta obter a mensagem de erro do backend
             const errorData = await res.json().catch(() => ({ message: "Erro desconhecido." }));
             // Se for erro 404, exibe mensagem específica
             if (res.status === 404) {
                  alert("Caso não encontrado.");
                  // Opcional: redirecionar para a home
                  // window.location.href = 'home.html';
                  return; // Sai da função
             }
             // Para outros erros, lança o erro
             throw new Error(errorData.message || "Erro ao buscar dados do caso.");
        }

        // Processa a resposta JSON (deve ser o objeto do caso)
        const caso = await res.json();

        // Exibe os dados do caso nos elementos HTML correspondentes
        document.getElementById("caseName").textContent = caso.nameCase || 'Nome não informado';
        document.getElementById("caseDescription").textContent = caso.Description || 'Descrição não informada';
        document.getElementById("caseStatus").textContent = caso.status || 'Não informado';
        document.getElementById("caseLocation").textContent = caso.location || 'Não informado';
        document.getElementById("caseCategory").textContent = caso.category || 'Não informado';
        // Formata e exibe a data e hora do caso
        if (caso.dateCase) {
            document.getElementById("caseDate").textContent = new Date(caso.dateCase).toLocaleDateString("pt-BR");
        } else {
             document.getElementById("caseDate").textContent = 'Não informada';
        }
        if (caso.hourCase) {
            document.getElementById("caseHour").textContent = caso.hourCase;
        } else {
            document.getElementById("caseHour").textContent = 'Não informada';
        }

        // Após carregar os dados do caso, carrega e exibe as evidências associadas
        loadEvidences(caseId); // Chama a função para carregar evidências

    } catch (err) {
        // Captura e lida com erros durante a requisição ou processamento
        console.error("Erro ao carregar dados do caso:", err);
        alert("Erro ao carregar dados do caso: " + err.message);
        // Opcional: Exibir mensagem de erro na interface
        document.getElementById("caseName").textContent = 'Erro ao carregar caso';
        // Limpar ou preencher outros campos com erro...
    }
}


// Função para carregar e exibir as evidências associadas a este caso (apenas exibição)
async function loadEvidences(caseId) {
    // A verificação de token e autorização da página já é feita no DOMContentLoaded.
    // O token já está disponível no escopo global.

    try {
        // Faz a requisição GET para buscar as evidências pelo ID do caso
        const res = await fetch(`http://localhost:3000/api/evidence/${caseId}`, {
            headers: { Authorization: `Bearer ${token}` } // Envia o token
        });

        // Verifica se a resposta HTTP foi bem-sucedida (status 2xx)
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Erro desconhecido ao buscar evidências." }));
             // Se for erro 404 ou 200 com array vazio, o backend getEvidencesByCaseId já trata e retorna 200 com array vazio
             // Aqui, tratamos outros erros HTTP (ex: 401, 403, 500)
             if (res.status === 401 || res.status === 403) {
                  // Redirecionamento já deve ter sido feito pelo checkPageAuthorization
                  console.error("Autorização falhou ao buscar evidências.");
                  return;
             }
            throw new Error(errorData.message || "Erro ao buscar evidências do caso.");
        }

        // Processa a resposta JSON (deve ser um objeto com { msg: ..., evidences: [...] })
        const data = await res.json();
        const evidences = data.evidences; // Obtém o array de evidências

        const evCont = document.getElementById("evidencesContainer");
        if (!evCont) {
            console.error("Container para evidências (#evidencesContainer) não encontrado no DOM.");
            return;
        }
        evCont.innerHTML = ""; // Limpa o container de evidências antes de exibir

        // Verifica se há evidências para exibir
        if (evidences && Array.isArray(evidences) && evidences.length > 0) {
            evidences.forEach(e => {
                // Cria um elemento div para o card de cada evidência
                const card = document.createElement("div");
                // Aplica classes de estilização. Removido 'relative' pois não haverá botões posicionados.
                card.className = "border p-4 rounded-lg shadow-md bg-white space-y-2";

                // Prepara o conteúdo dos dados da evidência (texto ou imagem Base64)
                let dataContent = "";
                if (e.evidenceType === "image" && e.data?.startsWith("data:image")) {
                    // Se for imagem Base64, cria uma tag <img>
                    dataContent = `<img src="${e.data}" alt="Evidência Imagem" class="mt-2 max-w-full rounded">`;
                } else {
                    // Para outros tipos, exibe como texto formatado
                    dataContent = `<pre class="whitespace-pre-wrap bg-gray-100 p-2 rounded">${e.data || "—"}</pre>`;
                }

                // Define o conteúdo HTML do card de evidência
                card.innerHTML = `
                    <h3 class="text-lg font-semibold text-blue-900">${e.title || 'Sem Título'}</h3>
                    <p><strong>Tipo:</strong> ${e.evidenceType || 'Desconhecido'}</p>
                    <p><strong>Descrição:</strong> ${e.description || "—"}</p>
                    <p><strong>Categoria:</strong> ${e.category || "—"}</p>
                    <p><strong>Coletado por:</strong> ${e.collectedBy?.name || "—"}</p>
                    ${dataContent}
                `;
                // Adiciona o card da evidência ao container
                evCont.appendChild(card);
            })
        } else {
            // Mensagem se nenhuma evidência for encontrada
            evCont.innerHTML = '<p class="text-gray-700">Nenhuma evidência cadastrada para este caso.</p>';
        }

    } catch (err) {
        // Captura e lida com erros na requisição de evidências
        console.error("Erro ao carregar evidências:", err);
        alert("Erro ao carregar evidências: " + err.message);
        // Exibe mensagem de erro na interface das evidências
        const evCont = document.getElementById("evidencesContainer");
         if(evCont) {
             evCont.innerHTML = '<p class="text-red-600">Erro ao carregar evidências.</p>';
         }
    }
}

// --- Funções de Edição/Exclusão/Adição de Evidências e Casos (REMOVIDAS) ---
// removemos todas as funções e referências relacionadas a:
// handleEditEvidence, handleDeleteEvidence, toggleEditEvidenceDataInput,
// listeners para edit/delete buttons, addEvidenceBtn, editCaseSection, editEvidenceSection, etc.
// submit listeners para add/edit forms
// funções convertImageToBase64 (se não forem usadas para preview na consulta, o que é improvável)


// --- Inicialização Principal da Página ---

// Executado quando o conteúdo HTML do DOM estiver completamente carregado.
document.addEventListener('DOMContentLoaded', async () => {

    // PASSO CRUCIAL: VERIFICAÇÃO DE AUTORIZAÇÃO DA PÁGINA E OBTENÇÃO DA ROLE
    // Esta página (pericia.html) deve ser acessível para Admin, Perito e Assistente (apenas para consulta).
    const allowedRolesForThisPage = ['admin', 'perito', 'assistente'];

    // checkPageAuthorization lida com a falta de token/token inválido e redireciona se a role não for permitida.
    // Se autorizado, retorna true.
    const isAuthorized = checkPageAuthorization(allowedRolesForThisPage);

    if (!isAuthorized) {
        // Sai do listener se não for autorizado (redirecionamento já ocorreu)
        console.log("Acesso à página de consulta negado ou token inválido/ausente. Redirecionamento já executado.");
        return;
    }

    // Se chegamos até aqui, o usuário está logado E tem uma role permitida para acessar esta página.
    // Obtemos a role para uso futuro (embora nesta página de consulta a role não seja usada para ocultar nada,
    // é um bom padrão manter a lógica de obter a role após a autorização).
    // No seu caso, a role não afeta a UI nesta versão de consulta.
    const token = localStorage.getItem('token'); // Token já validado que existe

    try {
        // Decodifica o payload do token para obter a role
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const user = JSON.parse(payloadJson);
        currentUserRole = user.role; // Define a variável global
        console.log("Role do usuário logado obtida do token:", currentUserRole); // Confirmação da role

    } catch (error) {
        console.error("Erro ao decodificar token após autorização.", error);
        currentUserRole = null; // Define como null em caso de erro.
    }

    // Carrega os dados do caso (que por sua vez carregará as evidências)
    // Esta é a única chamada de carregamento de dados nesta página de consulta.
    loadCaseData();

    // --- Todos os Listeners e Referências a Botões/Formulários de Edição/Adição foram REMOVIDOS ---

}); // Fim do DOMContentLoaded