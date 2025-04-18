const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

document.addEventListener("DOMContentLoaded", async () => {
  // Recupera o token armazenado no localStorage
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar autenticado para acessar esta página.");
    window.location.href = "index.html";
    return;
  }

  // Definindo o id do usuário (para este exemplo, fixo; se desejado, pode ser lido da URL)

  // Função para carregar os dados do usuário e preencher o DOM
  async function loadUserData() {
    try {
      const response = await fetch(`http://localhost:3000/api/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erro ao obter os dados do usuário.");
      }
      const user = await response.json();

      // Atualiza os dados do usuário
      document.getElementById("userName").textContent = user.name;
      document.getElementById(
        "userEmail"
      ).textContent = `E-mail: ${user.email}`;
      document.getElementById(
        "userTelefone"
      ).textContent = `Telefone: ${user.telephone}`;
      document.getElementById("userCro").textContent = `CRO: ${user.cro}`;
      if (user.createdAt) {
        const formattedDate = new Date(user.createdAt).toLocaleDateString(
          "pt-BR"
        );
        document.getElementById(
          "userCreatedAt"
        ).textContent = `Data de Criação: ${formattedDate}`;
      }
      // Define o cargo com base na role
      let roleText;
      switch (user.role) {
        case "admin":
          roleText = "Administrador";
          break;
        case "perito":
          roleText = "Perito";
          break;
        default:
          roleText = "Assistente";
          break;
      }
      document.getElementById("userCargo").textContent = `Cargo: ${roleText}`;

      // Atualiza o carrossel com os casos (perícias) documentados
      const carouselContainer = document.getElementById("carrossel");
      carouselContainer.innerHTML = "";
      if (user.cases && user.cases.length > 0) {
        user.cases.forEach((pericia) => {
          const caseCard = document.createElement("div");
          caseCard.className = "w-full sm:w-80 p-4 bg-gray-100 rounded-lg mx-2";
          caseCard.innerHTML = `
              <h4 class="font-semibold text-blue-900">${pericia.nameCase}</h4>
              <p class="text-gray-700">${pericia.status}</p>
            `;
          carouselContainer.appendChild(caseCard);
        });
      } else {
        carouselContainer.innerHTML =
          '<p class="p-4 text-gray-700">Nenhuma perícia documentada.</p>';
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível carregar os dados do usuário.");
    }
  }
});
