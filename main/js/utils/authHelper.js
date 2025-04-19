// Arquivo: ../js/utils/authHelper.js

/**
 * Verifica se o usuário logado tem uma das roles permitidas para acessar uma página.
 * Redireciona para a página de login ou uma página de acesso negado se não tiver permissão.
 * @param {string[]} allowedRoles - Array de strings contendo as roles permitidas (ex: ['admin', 'perito']).
 * @returns {boolean} - Retorna true se autorizado e false se não autorizado (e já redirecionou).
 */
function checkPageAuthorization(allowedRoles) {
    const token = localStorage.getItem('token'); // Obtém o token do armazenamento local

    // 1. Verifica se o token existe
    if (!token) {
        // Se não há token, o usuário não está logado
        alert('Você precisa estar logado para acessar esta página.');
        // Redireciona para a página de login (ajuste o caminho se necessário)
        window.location.href = '../index.html'; // Assumindo que '../index.html' é a página de login
        return false; // Indica que a autorização falhou
    }

    try {
        // 2. Decodifica o payload do token (NO FRONTEND)
        // Esta decodificação é apenas para LER a role do token no frontend.
        // Ela NÃO valida a assinatura do token (isso é feito APENAS no backend por segurança).
        // Se um usuário modificar o token no cliente, a decodificação pode funcionar,
        // mas as requisições API subsequentes falharão no backend.
        const base64Url = token.split('.')[1]; // Pega a parte do payload (segunda parte do token)
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Converte base64url para base64 padrão
        const payloadJson = decodeURIComponent(atob(base64).split('').map(function(c) { // Decodifica base64 para string JSON
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const user = JSON.parse(payloadJson); // Parseia a string JSON para objeto JavaScript

        // 3. Obtém a role do usuário do payload decodificado
        const userRole = user.role;

        // 4. Verifica se a role do usuário está na lista de roles permitidas para esta página
        if (!allowedRoles.includes(userRole)) {
            // Se a role não for permitida
            alert(`Acesso negado. Sua role (${userRole || 'não definida'}) não tem permissão para acessar esta página.`);
            // Redireciona para uma página segura (ex: home geral ou página de acesso negado)
            window.location.href = 'main/home.html'; // Ajuste o caminho para sua home geral ou página de acesso negado
            return false; // Indica que a autorização falhou
        }

        // 5. Se a role for permitida, a função retorna true e o script da página continua
        console.log(`Acesso autorizado para a role: ${userRole}`);
        return true; // Indica que a autorização foi bem-sucedida

    } catch (error) {
        // 6. Captura e lida com erros ao decodificar o token (token inválido, malformado, etc.)
        console.error('Erro ao verificar ou decodificar token no frontend:', error);
        alert('Token de autenticação inválido ou expirado. Faça login novamente.');
        // Remove o token inválido do localStorage
        localStorage.removeItem('token');
        // Redireciona para a página de login
        window.location.href = '../index.html'; // Caminho para sua página de login
        return false; // Indica que a autorização falhou
    }
}