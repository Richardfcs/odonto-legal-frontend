const params = new URLSearchParams(window.location.search);
const userId = params.get('id'); // Lê o id a partir da URL

document.addEventListener('DOMContentLoaded', async () => {
  // Recupera o token armazenado no localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar autenticado para acessar esta página.');
    window.location.href = 'login.html';
    return;
  }

  // Função para converter arquivo de imagem para Base64
  function convertImageToBase64(inputElement) {
    return new Promise((resolve, reject) => {
      const file = inputElement.files[0];
      if (!file) {
        resolve(''); // Se nenhum arquivo for selecionado, resolve com string vazia
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove o prefixo e retorna somente a string Base64
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

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

      // Atualiza os dados do usuário na tela
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userEmail').textContent = `E-mail: ${user.email}`;
      document.getElementById('userTelefone').textContent = `Telefone: ${user.telephone}`;
      document.getElementById('userCro').textContent = `CRO: ${user.cro}`;
      if (user.createdAt) {
        const formattedDate = new Date(user.createdAt).toLocaleDateString('pt-BR');
        document.getElementById('userCreatedAt').textContent = `Data de Criação: ${formattedDate}`;
      }
      // Atualiza o cargo com base na role
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

      // Exibe a foto do usuário
      const defaultImage = '../img/default_icon.png';
      const photoUrl =
        user.photo && user.photo.trim().length > 0
          ? `data:image/png;base64,${user.photo}`
          : defaultImage;
      document.getElementById('userImg').src = photoUrl;

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

      // Pré-preenche o formulário de edição com os dados atuais
      document.getElementById('editName').value = user.name;
      document.getElementById('editEmail').value = user.email;
      document.getElementById('editTelefone').value = user.telephone;
      document.getElementById('editCro').value = user.cro;
    } catch (error) {
      console.error('Erro:', error);
      alert('Não foi possível carregar os dados do usuário.');
    }
  }

  // Carrega os dados do usuário ao iniciar
  await loadUserData();

  // --- Lógica para mostrar/ocultar o formulário de edição ---
  const showEditFormButton = document.getElementById('showEditFormButton');
  const editUserSection = document.getElementById('editUserSection');
  showEditFormButton.addEventListener('click', () => {
    // Alterna a classe "hidden" para mostrar/ocultar o formulário
    editUserSection.classList.toggle('hidden');
  });

  // --- Lógica para atualizar a role do usuário ---
  const updateRoleForm = document.getElementById('updateRoleForm');
  updateRoleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newRole = document.getElementById('roleSelect').value;
    try {
      const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ _id: userId, role: newRole })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao atualizar a role.');
      }
      alert(result.message || 'Role atualizada com sucesso.');
      await loadUserData();
    } catch (error) {
      console.error('Erro ao atualizar a role:', error);
      alert(error.message || 'Erro ao atualizar a role do usuário.');
    }
  });

  // --- Lógica para excluir o usuário ---
  const deleteUserButton = document.getElementById('deleteUser');
  deleteUserButton.addEventListener('click', async () => {
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
      window.location.href = 'gerenciar_func.html';
    } catch (error) {
      console.error('Erro ao deletar o usuário:', error);
      alert(error.message || 'Erro ao deletar o usuário.');
    }
  });

  // --- Lógica para editar os dados do usuário, incluindo nova foto ---
  const editUserForm = document.getElementById('editUserForm');
  editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtém os valores atualizados do formulário
    const updatedName = document.getElementById('editName').value;
    const updatedEmail = document.getElementById('editEmail').value;
    const updatedTelefone = document.getElementById('editTelefone').value;
    const updatedCro = document.getElementById('editCro').value;
    const editPhotoInput = document.getElementById('editPhoto');

    // Cria o objeto de atualização
    const updates = {
      name: updatedName,
      email: updatedEmail,
      telephone: updatedTelefone,
      cro: updatedCro,
    };

    // Se o usuário selecionou uma nova foto, converte para Base64 e adiciona ao objeto
    try {
      if (editPhotoInput.files && editPhotoInput.files.length > 0) {
        const base64Photo = await convertImageToBase64(editPhotoInput);
        updates.photo = base64Photo;
      }
    } catch (error) {
      console.error('Erro ao converter a nova foto:', error);
      alert("Erro ao processar a imagem. Tente novamente.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erro ao atualizar os dados.');
      }
      alert(result.message || 'Usuário atualizado com sucesso!');
      // Esconde o formulário de edição após a atualização
      editUserSection.classList.add('hidden');
      await loadUserData();
    } catch (error) {
      console.error('Erro ao atualizar o usuário:', error);
      alert(error.message || 'Erro ao atualizar os dados do usuário.');
    }
  });

  // --- Lógica dos botões de navegação do carrossel (prev/next) ---
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const carousel = document.getElementById('carrossel');
  let scrollPosition = 0;
  const scrollAmount = 300;
  prevButton.addEventListener('click', () => {
    scrollPosition = Math.max(scrollPosition - scrollAmount, 0);
    carousel.style.transform = `translateX(-${scrollPosition}px)`;
  });
  nextButton.addEventListener('click', () => {
    scrollPosition += scrollAmount;
    carousel.style.transform = `translateX(-${scrollPosition}px)`;
  });
});
