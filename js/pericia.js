const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");
const token = localStorage.getItem("token");

//addEvidenceBtn

if (!token) {
  alert("Você precisa estar autenticado.");
  window.location.href = "login.html";
}

// preenche a tela e o formulário de edição
// Função para carregar os dados do caso
async function loadCaseData() {
  try {
    const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Erro ao buscar dados do caso.");
    const caso = await res.json();

    // Exibição dos dados do caso (igual ao código anterior)
    document.getElementById("caseName").textContent = caso.nameCase;
    document.getElementById("caseDescription").textContent = caso.Description;
    document.getElementById("caseStatus").textContent = caso.status;
    document.getElementById("caseLocation").textContent = caso.location;
    document.getElementById("caseCategory").textContent = caso.category;
    if (caso.dateCase)
      document.getElementById("caseDate").textContent = new Date(caso.dateCase)
        .toLocaleDateString("pt-BR");
    if (caso.hourCase)
      document.getElementById("caseHour").textContent = caso.hourCase;

    // Após carregar os dados do caso, carregamos as evidências
    loadEvidences(caseId); // Chama a função para carregar evidências

    // Pré-preenchimento do formulário de edição (igual ao código anterior)
    document.getElementById("editNameCase").value    = caso.nameCase;
    document.getElementById("editDescription").value = caso.Description;
    document.getElementById("editStatus").value      = caso.status;
    document.getElementById("editLocation").value    = caso.location;
    document.getElementById("editDateCase").value    = caso.dateCase?.slice(0,10) || "";
    document.getElementById("editHourCase").value    = caso.hourCase || "";
    document.getElementById("editCategory").value    = caso.category;


  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Nova função para carregar as evidências
async function loadEvidences(caseId) {
  try {
      const res = await fetch(`http://localhost:3000/api/evidence/${caseId}`, { // Usa a rota correta para evidências
          headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao buscar evidências do caso.");
      const data = await res.json(); // Espera a resposta como JSON
      const evidences = data.evidences; // Assume que a resposta tem um campo 'evidences' com a lista

      const evCont = document.getElementById("evidencesContainer");
      evCont.innerHTML = ""; // Limpa o container de evidências

      if (evidences && evidences.length > 0) { // Verifica se há evidências e se é um array
          evidences.forEach(e => {
              const card = document.createElement("div");
              card.className = "border p-4 rounded-lg shadow-md bg-white space-y-2";

              let dataContent = "";
              if (e.evidenceType === "image" && e.data?.startsWith("data:image")) {
                  dataContent = `<img src="${e.data}" alt="Evidência Imagem" class="mt-2 max-w-full rounded">`;
              } else {
                  dataContent = `<pre class="whitespace-pre-wrap bg-gray-100 p-2 rounded">${e.data || "—"}</pre>`;
              }

              card.innerHTML = `
                  <h3 class="text-lg font-semibold text-blue-900">${e.title}</h3>
                  <p><strong>Tipo:</strong> ${e.evidenceType}</p>
                  <p><strong>Descrição:</strong> ${e.description || "—"}</p>
                  <p><strong>Categoria:</strong> ${e.category || "—"}</p>
                  <p><strong>Coletado por:</strong> ${e.collectedBy || "—"}</p>
                  ${dataContent}
              `;
              evCont.appendChild(card);
          });
      } else {
          evCont.innerHTML = '<p class="text-gray-700">Nenhuma evidência cadastrada.</p>';
      }

  } catch (err) {
      console.error("Erro ao carregar evidências:", err);
      alert("Erro ao carregar evidências: " + err.message);
  }
}

// toggle formulário
const showBtn   = document.getElementById("showEditCaseFormButton");
const formSect  = document.getElementById("editCaseSection");
const cancelBtn = document.getElementById("cancelEditCase");

showBtn.addEventListener("click", () => formSect.classList.toggle("hidden"));
cancelBtn.addEventListener("click", () => formSect.classList.add("hidden"));

// submit edição
document.getElementById("editCaseForm").addEventListener("submit", async e => {
  e.preventDefault();
  const updates = {
    nameCase:    document.getElementById("editNameCase").value,
    Description: document.getElementById("editDescription").value,
    status:      document.getElementById("editStatus").value,
    location:    document.getElementById("editLocation").value,
    dateCase:    document.getElementById("editDateCase").value,
    hourCase:    document.getElementById("editHourCase").value,
    category:    document.getElementById("editCategory").value
  };

  try {
    const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message);
    alert("Caso atualizado com sucesso!");
    formSect.classList.add("hidden");
    await loadCaseData();
  } catch (err) {
    console.error(err);
    alert("Erro: " + err.message);
  }
});

document.getElementById("deleteCaseBtn").addEventListener("click", async () => {
  if (!confirm("Excluir este caso?")) return;
  try {
    const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || j.message);
    alert("Caso excluído com sucesso!");
    window.location.href = "home.html";
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

document.getElementById("exportReportBtn").addEventListener("click", async () => {
  // 1. Obter o conteúdo do laudo (você pode substituir isso por um editor mais elaborado no futuro)
  const reportContent = prompt("Digite o conteúdo do laudo para o PDF:");
  if (!reportContent) {
    alert("Conteúdo do laudo não pode ser vazio.");
    return; // Impede a requisição se o conteúdo estiver vazio
  }

  try {
    // 2. Fazer a requisição POST para o backend (rota /api/report)
    const response = await fetch("http://localhost:3000/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Inclui o token de autenticação
      },
      body: JSON.stringify({ caseId: caseId, content: reportContent }) // Envia caseId e conteúdo
    });

    // 3. Processar a resposta do backend
    if (!response.ok) {
      const message = await response.json();
      throw new Error(message.error || "Erro ao gerar o laudo.");
    }

    const reportData = await response.json(); // Espera a resposta JSON com pdfUrl e outros dados
    alert(reportData.message || "Laudo gerado com sucesso!"); // Mensagem de sucesso

    // 4. Oferecer opção para visualizar ou baixar o PDF (abre em nova aba para visualizar)
    if (reportData.pdfUrl) {
      window.open(reportData.pdfUrl, '_blank'); // Abre o PDF em uma nova aba para visualização
      // Se quiser oferecer download direto (sem visualizar), você pode usar a tag <a> para criar um link de download programaticamente
      // Exemplo (opcional - comente a linha window.open acima e descomente abaixo se preferir download):
      /*
      const downloadLink = document.createElement('a');
      downloadLink.href = reportData.pdfUrl;
      downloadLink.download = `laudo-caso-${caseId}.pdf`; // Define o nome do arquivo para download
      downloadLink.textContent = 'Baixar Laudo'; // Texto do link
      document.body.appendChild(downloadLink); // Adiciona o link ao body (ou a um elemento específico)
      downloadLink.click(); // Simula o clique no link para iniciar o download
      downloadLink.remove(); // Remove o link após o clique
      */
    } else {
      alert("URL do PDF não recebida do servidor.");
    }

  } catch (error) {
    console.error("Erro ao exportar laudo:", error);
    alert("Erro ao gerar o laudo: " + error.message); // Exibe mensagem de erro para o usuário
  }
});

// tudo pronto: carrega de cara
loadCaseData();

// Submissão do formulário
addEvidenceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Removido o localStorage aqui
  const evidenceType = document.getElementById("evidenceType").value;
  const title = document.getElementById("evidenceTitle").value;
  const description = document.getElementById("evidenceDescription").value;
  const category = document.getElementById("evidenceCategory").value || undefined;

  let data;

  if (evidenceType === "image") {
    const imageFile = document.getElementById("evidenceImage").files[0];
    if (!imageFile) {
      alert("Selecione uma imagem.");
      return;
    }
    data = await convertImageToBase64(imageFile);
  } else {
    data = document.getElementById("evidenceData").value;
  }

  const evidencePayload = {
    caseId, // <-- usamos o valor já obtido da URL no topo
    evidenceType,
    title,
    description,
    data,
    category
  };

  try {
    const response = await fetch("http://localhost:3000/api/evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Adicionei o token aqui também
      },
      body: JSON.stringify(evidencePayload)
    });

    const result = await response.json();

    if (response.ok) {
      alert("Evidência adicionada com sucesso!");
      addEvidenceForm.reset();
      addEvidenceSection.classList.add("hidden");
      textDataInput.classList.remove("hidden");
      imageDataInput.classList.add("hidden");
      loadCaseData(); // <-- usar a função já existente para atualizar tudo
    } else {
      alert(result.msg || "Erro ao adicionar evidência.");
    }
  } catch (err) {
    console.error("Erro ao enviar evidência:", err);
    alert("Erro de conexão com o servidor.");
  }
});

// Referências dos elementos
const addEvidenceBtn = document.getElementById("addEvidenceBtn");
const addEvidenceSection = document.getElementById("addEvidenceSection");
const cancelAddEvidence = document.getElementById("cancelAddEvidence");

// Mostra o formulário
addEvidenceBtn.addEventListener("click", () => {
  addEvidenceSection.classList.remove("hidden");
});

// Oculta o formulário ao cancelar
cancelAddEvidence.addEventListener("click", () => {
  addEvidenceSection.classList.add("hidden");
});

const textDataInput = document.getElementById("textDataInput");
const imageDataInput = document.getElementById("imageDataInput");
const evidenceTypeSelect = document.getElementById("evidenceType");

// Alternar campos com base no tipo de evidência
evidenceTypeSelect.addEventListener("change", () => {
  const selectedType = evidenceTypeSelect.value;
  
  if (selectedType === "image") {
    textDataInput.classList.add("hidden");
    imageDataInput.classList.remove("hidden");
  } else {
    textDataInput.classList.remove("hidden");
    imageDataInput.classList.add("hidden");
  }
});

function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      resolve(e.target.result); // resultado é uma string Base64 com o prefixo data:image/...
    };

    reader.onerror = function (error) {
      reject("Erro ao converter imagem para Base64: " + error);
    };

    reader.readAsDataURL(file);
  });
}
