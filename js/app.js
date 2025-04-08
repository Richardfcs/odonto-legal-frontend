// Exemplo de lógica para login e cadastro
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Aqui você pode adicionar validação de dados e redirecionamento após login
    alert('Login efetuado com sucesso!');
    window.location.href = 'admin.html'; // Exemplo de redirecionamento para a tela do administrador
});

document.getElementById('cadastroForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Aqui você pode adicionar validação de dados e redirecionamento após cadastro
    alert('Cadastro realizado com sucesso!');
    window.location.href = 'index.html'; // Redireciona para o login
});
