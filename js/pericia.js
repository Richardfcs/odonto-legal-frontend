const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");

// Recupera o token do localStorage
const token = localStorage.getItem("token");

// Função para carregar os dados do caso a partir do endpoint GET /api/case/:id
async function loadCaseData() {
  try {
    const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Erro ao buscar dados do caso.");
    }

    const caso = await res.json();

    document.getElementById("caseName").textContent = caso.nameCase;
    document.getElementById("caseDescription").textContent = caso.Description;
    document.getElementById("caseStatus").textContent = caso.status;
    document.getElementById("caseLocation").textContent = caso.location;
    document.getElementById("caseCategory").textContent = caso.category;
    if (caso.dateCase) {
      document.getElementById("caseDate").textContent = new Date(
        caso.dateCase
      ).toLocaleDateString("pt-BR");
    }
    if (caso.hourCase) {
      document.getElementById("caseHour").textContent = caso.hourCase;
    }

    const evidencesContainer = document.getElementById("evidencesContainer");
    evidencesContainer.innerHTML = "";
    if (caso.evidences && caso.evidences.length > 0) {
      caso.evidences.forEach((evidence) => {
        const evidenceCard = document.createElement("div");
        evidenceCard.className = "border p-4 rounded-lg shadow-sm";
        evidenceCard.innerHTML = `
              <h3 class="text-lg font-semibold text-blue-900">${evidence.title}</h3>
              <p class="text-gray-700">Tipo: ${evidence.evidenceType}</p>
            `;
        evidencesContainer.appendChild(evidenceCard);
      });
    } else {
      evidencesContainer.innerHTML =
        '<p class="text-gray-700">Nenhuma evidência cadastrada.</p>';
    }
  } catch (error) {
    console.error("Erro:", error);
    alert(error.message);
  }
}

// Botões
document.getElementById("addEvidenceBtn").addEventListener("click", () => {
  window.location.href = `evidence.html?caseId=${caseId}`;
});

document.getElementById("exportReportBtn").addEventListener("click", () => {
  window.location.href = `exportReport.html?caseId=${caseId}`;
});

document.getElementById("editCaseBtn").addEventListener("click", () => {
  window.location.href = `editCase.html?caseId=${caseId}`;
});

document.getElementById("deleteCaseBtn").addEventListener("click", async () => {
  if (!confirm("Tem certeza que deseja deletar este caso?")) return;
  try {
    const resDelete = await fetch(`http://localhost:3000/api/case/${caseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await resDelete.json();
    if (!resDelete.ok) {
      throw new Error(result.error || "Erro ao deletar o caso.");
    }
    alert(result.message || "Caso deletado com sucesso!");
    window.location.href = "home.html";
  } catch (error) {
    console.error("Erro:", error);
    alert(error.message);
  }
});

// Carrega os dados do caso assim que a página é carregada
loadCaseData();
