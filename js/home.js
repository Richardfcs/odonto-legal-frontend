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
  // Recupera o token salvo no localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar autenticado para acessar os casos.");
    // Redireciona o usuário para a página de login, se necessário
    window.location.href = "login.html";
    return;
  }

  try {
    // Faz a requisição GET incluindo o token no cabeçalho de autorização
    const response = await fetch("http://localhost:3000/api/case", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Adiciona o token para o middleware
      },
    });

    // Verifica se a resposta está OK
    if (!response.ok) {
      throw new Error("Erro ao buscar os casos.");
    }

    const cases = await response.json();

    // Seleciona o container onde os cards serão inseridos (certifique-se de que o elemento existe no HTML)
    const container = document.getElementById("casesContainer");
    if (!container) {
      console.error("Container para casos não encontrado no DOM.");
      return;
    }

    // Para cada caso, cria um card com as informações
    cases.forEach((item) => {
      // Cria o elemento card
      const card = document.createElement("div");
      card.className =
        "bg-white p-6 rounded-lg shadow-md min-h-[280px] w-full max-w-[250px] flex flex-col justify-center text-center";

      // Monta o conteúdo do card
      card.innerHTML = `
          <h2 class="text-xl font-semibold text-blue-900 mb-2 text-center">${
            item.nameCase
          }</h2>
          <div class="flex flex-col items-center pb-10">
            <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-black">${
              item.responsibleExpert?.name || "Expert não definido"
            }</h5>
            <span class="text-sm text-gray-900 dark:text-gray-900">${
              item.responsibleExpert?.role || "Função não definida"
            }</span>
            <span class="text-sm text-gray-500 dark:text-gray-500">Local: ${
              item.location
            }</span>
            <span class="text-sm text-gray-500 dark:text-gray-500">${item.Description.substring(
              0,
              40
            )}...</span>
            <span class="text-sm text-gray-600 dark:text-gray-900">Status: ${
              item.status
            }</span>
          </div>
          <div class="flex mt-4 md:mt-6 space-x-2 justify-center">
            <a href="pericia.html" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              Visualizar
            </a>
            <a class="py-2 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              Opções
            </a>
          </div>
        `;

      // Insere o card no container
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao obter os casos:", error);
    alert(
      "Não foi possível carregar os casos. Verifique se o token é válido e se o servidor está ativo."
    );
  }
});
