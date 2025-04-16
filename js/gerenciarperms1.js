const params = new URLSearchParams(window.location.search);
const userId = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    // Recupera o token armazenado no localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Você precisa estar autenticado para acessar esta página.');
      window.location.href = 'login.html';
      return;
    }
  
    // Definindo o id do usuário (para este exemplo, fixo; se desejado, pode ser lido da URL)
  
    // Função para carregar os dados do usuário e preencher o DOM
    async function loadUserData() {
      try {
        const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Erro ao obter os dados do usuário.');
        }
        const user = await response.json();
  
        // Atualiza os dados do usuário
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = `E-mail: ${user.email}`;
        document.getElementById('userTelefone').textContent = `Telefone: ${user.telephone}`;
        document.getElementById('userCro').textContent = `CRO: ${user.cro}`;
        if (user.createdAt) {
          const formattedDate = new Date(user.createdAt).toLocaleDateString('pt-BR');
          document.getElementById('userCreatedAt').textContent = `Data de Criação: ${formattedDate}`;
        }
        // Define o cargo com base na role
        let roleText;
        switch (user.role) {
          case 'admin':
            roleText = 'Administrador';
            break;
          case 'perito':
            roleText = 'Perito';
            break;
          default:
            roleText = 'Assistente';
            break;
        }
        document.getElementById('userCargo').textContent = `Cargo: ${roleText}`;
  
        // Atualiza o carrossel com os casos (perícias) documentados
        const carouselContainer = document.getElementById('carrossel');
        carouselContainer.innerHTML = '';
        if (user.cases && user.cases.length > 0) {
          user.cases.forEach((pericia) => {
            const caseCard = document.createElement('div');
            caseCard.className = 'w-full sm:w-80 p-4 bg-gray-100 rounded-lg mx-2';
            caseCard.innerHTML = `
              <h4 class="font-semibold text-blue-900">${pericia.nameCase}</h4>
              <p class="text-gray-700">${pericia.status}</p>
            `;
            carouselContainer.appendChild(caseCard);
          });
        } else {
          carouselContainer.innerHTML = '<p class="p-4 text-gray-700">Nenhuma perícia documentada.</p>';
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível carregar os dados do usuário.');
      }
    }
  
    // Carrega os dados do usuário ao iniciar
    await loadUserData();
  
    // Lógica para atualizar a role do usuário via PUT
    const updateRoleForm = document.getElementById('updateRoleForm');
    updateRoleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // Obtém a nova role selecionada
      const newRole = document.getElementById('roleSelect').value;
  
      try {
        const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            _id: userId,
            role: newRole
          })
        });
  
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Erro ao atualizar a role.');
        }
        alert(result.message || 'Role atualizada com sucesso.');
        // Atualiza os dados do usuário na tela para refletir a nova role
        await loadUserData();
      } catch (error) {
        console.error('Erro ao atualizar a role:', error);
        alert(error.message || 'Erro ao atualizar a role do usuário.');
      }
    });
  
    // (Opcional) Lógica dos botões de navegação do carrossel (prev/next)
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const carousel = document.getElementById('carrossel');
  
    let scrollPosition = 0;
    const scrollAmount = 300; // Quantidade de pixels para rolar a cada clique
  
    prevButton.addEventListener('click', () => {
      scrollPosition = Math.max(scrollPosition - scrollAmount, 0);
      carousel.style.transform = `translateX(-${scrollPosition}px)`;
    });
  
    nextButton.addEventListener('click', () => {
      // Para garantir que não role além do conteúdo, poderia calcular o máximo
      scrollPosition += scrollAmount;
      carousel.style.transform = `translateX(-${scrollPosition}px)`;
    });

    // Função para deletar
    const deleteUserButton = document.getElementById('deleteUser');
  deleteUserButton.addEventListener('click', async () => {
    // Confirmação extra para evitar deleção acidental
    if (!confirm("Tem certeza de que deseja excluir este usuário? Essa ação não poderá ser desfeita.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar o usuário.');
      }
      alert(result.message || 'Usuário excluído com sucesso.');
      // Após a deleção, redireciona para a página de listagem de usuários ou home
      window.location.href = 'gerenciar_func.html';
    } catch (error) {
      console.error('Erro ao deletar o usuário:', error);
      alert(error.message || 'Erro ao deletar o usuário.');
    }
  });
  });    