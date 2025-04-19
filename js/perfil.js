const API_URL = 'https://odonto-legal-backend.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
    // Recupera o token armazenado no localStorage
    const token = localStorage.getItem('token');

    // Se o token não existe, redireciona para a página de login
    if (!token) {
        alert('Você precisa estar autenticado para ver seu perfil.');
        window.location.href = '../index.html'; // Ajuste o caminho para sua página de login
        return;
    }

    // Referências para os elementos onde as informações serão exibidas
    const userPhotoImg = document.getElementById('userPhoto');
    const userNameH2 = document.getElementById('userName');
    const userEmailSpan = document.getElementById('userEmail');
    const userTelephoneSpan = document.getElementById('userTelephone');
    const userRoleSpan = document.getElementById('userRole');
    const userCroSpan = document.getElementById('userCro');
    const userCreatedAtSpan = document.getElementById('userCreatedAt');
    const caseCountP = document.getElementById('caseCount');
    const userCasesListDiv = document.getElementById('userCasesList'); // Opcional: para listar casos
    const logoutBtn = document.getElementById('logoutBtn');


    // Função para buscar e exibir os dados do usuário logado
    async function loadUserProfile() {
        try {
            // Faz a requisição GET para a nova rota /api/user/me
            const response = await fetch(`${API_URL}/api/user/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Envia o token para autenticação
                }
            });

            // Verifica se a resposta foi bem-sucedida
            if (!response.ok) {
                 // Tenta obter a mensagem de erro do backend
                 const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao carregar perfil." }));
                 // Se for um erro de autenticação (401, 403), talvez o token seja inválido/expirado
                 if(response.status === 401 || response.status === 403) {
                      alert("Sessão expirada ou não autorizada. Faça login novamente.");
                      // Opcional: Limpar token inválido
                      // localStorage.removeItem('token');
                      window.location.href = '../index.html'; // Redireciona para login
                      return; // Sai da função
                 }
                // Para outros erros, lança o erro
                throw new Error(errorData.message || `Erro na requisição: ${response.statusText}`);
            }

            // Processa a resposta JSON que contém os dados do usuário
            const user = await response.json();

            // Exibe os dados do usuário nos elementos HTML
            userNameH2.textContent = user.name || 'Nome não informado';
            userEmailSpan.textContent = user.email || 'Email não informado';
            userTelephoneSpan.textContent = user.telephone || 'Telefone não informado';
            userCroSpan.textContent = user.cro || 'CRO não informado';
            userCreatedAtSpan.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Data não informada';

            // Mapeia a role para exibição amigável
             const roleText =
               user.role === 'admin'
                 ? 'Administrador'
                 : user.role === 'perito'
                 ? 'Perito'
                 : 'Assistente';
            userRoleSpan.textContent = roleText;


            // Exibe a foto do usuário (se disponível em Base64) ou a padrão
            const defaultImage = '../img/default_icon.png';
             const photoUrl = user.photo && typeof user.photo === 'string' && user.photo.trim().length > 0
               ? `data:image/png;base64,${user.photo}` // Assume que user.photo é Base64
               : defaultImage;
            userPhotoImg.src = photoUrl;
            userPhotoImg.alt = user.name || 'Usuário';


            // --- Lida com a contagem/lista de casos (se populados) ---
            if (user.cases && Array.isArray(user.cases)) {
                caseCountP.textContent = `Você está associado a ${user.cases.length} caso(s).`;

                 // Opcional: Listar brevemente os casos
                 if (userCasesListDiv) { // Verifica se o container de lista de casos existe no HTML
                     userCasesListDiv.innerHTML = ''; // Limpa a lista antes de adicionar
                     if (user.cases.length > 0) {
                          // Exibe uma lista simples dos casos
                         user.cases.forEach(caso => {
                             const caseElement = document.createElement('p');
                             caseElement.className = 'text-gray-800'; // Adicione classes para estilização
                              caseElement.innerHTML = `<span class="font-semibold">${caso.nameCase || 'Caso sem nome'}</span> (${caso.status || 'status desconhecido'})`;
                              // Opcional: adicionar link para o caso
                              // caseElement.innerHTML += ` <a href="pericia.html?id=${caso._id}" class="text-blue-600 hover:underline">(Ver Detalhes)</a>`;
                             userCasesListDiv.appendChild(caseElement);
                         });
                     } else {
                          userCasesListDiv.innerHTML = '<p class="text-gray-700">Nenhum caso associado encontrado.</p>';
                     }
                 }

            } else {
                 // Se o campo 'cases' não veio ou não é um array (pode acontecer se não foi populado)
                caseCountP.textContent = 'Não foi possível carregar a contagem de casos.';
                 if (userCasesListDiv) userCasesListDiv.innerHTML = ''; // Limpa a lista
            }


        } catch (error) {
            // Captura e lida com erros durante a requisição ou processamento
            console.error('Erro ao carregar perfil:', error);
            alert('Não foi possível carregar seu perfil. Detalhes: ' + error.message);
            // Opcional: Limpar os campos e mostrar mensagem de erro na tela
            userNameH2.textContent = 'Erro ao carregar perfil';
             // Limpar outros campos...
        }
    }

    // --- Lógica de Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Remove o token do localStorage
            localStorage.removeItem('token');
            // Redireciona para a página de login
            alert('Você foi desconectado.');
            window.location.href = '../index.html'; // Ajuste o caminho para sua página de login
        });
    } else {
        console.error("Botão de logout (#logoutBtn) não encontrado no DOM.");
    }


    // Carrega o perfil do usuário quando a página é carregada
    loadUserProfile();

}); // Fim do DOMContentLoaded