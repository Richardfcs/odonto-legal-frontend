// DROPDOWN FILTRO
function toggleDropdown() {
  const dropdown = document.getElementById("dropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

function selectFilter(element) {
  const selected = element.textContent;
  const filterButton = document.getElementById("filterButton");

  filterButton.textContent = selected + " ▾"; // Atualiza o botão com o texto selecionado
  document.getElementById("dropdown").style.display = "none";

  // Aqui você pode adicionar lógica para aplicar o filtro
  console.log(`Filtro aplicado: ${selected}`);
}

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

document.addEventListener("DOMContentLoaded", async () => {
  // Recupera o token armazenado no localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar autenticado para acessar esta página.");
    window.location.href = "index.html"; // Redireciona para login se o token não existir
    return;
  }

  try {
    // Faz a requisição GET para o endpoint de listagem de usuários
    const response = await fetch("http://localhost:3000/api/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Envia o token no cabeçalho
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar os usuários.");
    }

    const users = await response.json();

    // Seleciona o container onde os cards serão inseridos
    const container = document.getElementById("usersContainer");
    if (!container) {
      console.error("Container de usuários não encontrado no DOM.");
      return;
    }

    // Limpa o container antes de inserir os novos elementos
    container.innerHTML = "";

    // Itera sobre cada usuário retornado e cria um card para cada um
    users.forEach((user) => {
      // Cria um card com classes de estilização TailwindCSS
      const card = document.createElement("div");
      card.className =
        "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-between text-center";

      // Definição de imagem e role
      const defaultImage = "../img/default_profile.png";
      const roleText =
        user.role === "admin"
          ? "Administrador"
          : user.role === "perito"
          ? "Perito"
          : "Assistente";

      // Conteúdo do card com link que passa o id na URL
      card.innerHTML = `
          <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">${user.name}</h2>
          <div class="flex flex-col items-center pb-10">
            <img class="w-24 h-24 mb-3 rounded-full shadow-lg" src="${defaultImage}" alt="${user.name}" />
            <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-black">${user.name}</h5>
            <span class="text-sm text-gray-500 dark:text-gray-500">${user.email}</span>
            <span class="text-sm text-gray-600 dark:text-gray-900">${roleText}</span>
          </div>
          <!-- Botão para Gerenciar: passa o id do usuário na URL -->
          <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
            <a href="geral_pericia.html?id=${user._id}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              Visualizar
            </a>
          </div>
        `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar os usuários:", error);
    alert(
      "Não foi possível carregar os usuários. Verifique se o token é válido e se o servidor está ativo."
    );
  }
});
