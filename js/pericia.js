let currentCaseData = null;
const API_URL = 'https://odonto-legal-backend.onrender.com';

const params = new URLSearchParams(window.location.search);
const caseId = params.get("id");
const token = localStorage.getItem("token");

// Referências aos elementos dos formulários (Adição, Edição Caso, Edição Evidência)
const addEvidenceBtn = document.getElementById("addEvidenceBtn");
const addEvidenceSection = document.getElementById("addEvidenceSection");
const cancelAddEvidence = document.getElementById("cancelAddEvidence");
const addEvidenceForm = document.getElementById("addEvidenceForm"); // Certifique-se que este ID existe no HTML da add form
const textDataInput = document.getElementById("textDataInput"); // Add form text data div
const imageDataInput = document.getElementById("imageDataInput"); // Add form image data div
const evidenceTypeSelect = document.getElementById("evidenceType"); // Add form type select

const showEditCaseFormButton = document.getElementById("showEditCaseFormButton"); // Botão de edição do Caso
const editCaseSection = document.getElementById("editCaseSection"); // Seção do formulário de edição do Caso
const cancelEditCase = document.getElementById("cancelEditCase"); // Botão cancelar edição do Caso
const editCaseForm = document.getElementById("editCaseForm"); // Formulário de edição do Caso

// NOVAS REFERÊNCIAS PARA EDIÇÃO DE EVIDÊNCIA
const editEvidenceSection = document.getElementById("editEvidenceSection"); // Seção do formulário de edição da Evidência
const editEvidenceForm = document.getElementById("editEvidenceForm"); // Formulário de edição da Evidência
const cancelEditEvidenceForm = document.getElementById("cancelEditEvidenceForm"); // Botão cancelar edição da Evidência
const editingEvidenceIdInput = document.getElementById("editingEvidenceId"); // Input oculto para o ID da evidência
const editEvidenceTypeSelect = document.getElementById("editEvidenceType"); // Select do tipo de evidência no formulário de edição
const editEvidenceTitleInput = document.getElementById("editEvidenceTitle");
const editEvidenceDescriptionTextarea = document.getElementById("editEvidenceDescription");
const editTextDataInputEdit = document.getElementById("editTextDataInputEdit"); // Edit form text data div
const editEvidenceDataTextarea = document.getElementById("editEvidenceData"); // Textarea de dados no form de edição
const imageDataInputEdit = document.getElementById("imageDataInputEdit"); // Edit form image data div
const editEvidenceImageInput = document.getElementById("editEvidenceImage"); // File input da imagem no form de edição
const editImagePreview = document.getElementById("editImagePreview"); // Img para preview no form de edição
const editEvidenceCategorySelect = document.getElementById("editEvidenceCategory"); // Select de categoria no form de edição

// --- Lógica de team do caso ---
const teamManagementSection = document.getElementById("teamManagementSection");
const teamMembersList = document.getElementById("teamMembersList");
const noTeamMembers = document.getElementById("noTeamMembers");
const addTeamMemberFormContainer = document.getElementById("addTeamMemberFormContainer");
const addTeamMemberForm = document.getElementById("addTeamMemberForm");
const userSearchInput = document.getElementById("userSearchInput");
const searchUserBtn = document.getElementById("searchUserBtn");
const userSearchResults = document.getElementById("userSearchResults");
const selectedUserIdToAddInput = document.getElementById("selectedUserIdToAdd");
const selectedUserDisplay = document.getElementById("selectedUserDisplay");
const submitAddTeamMemberBtn = document.getElementById("submitAddTeamMemberBtn");

// --- Lógica para Análise com IA ---
const aiActionSelect = document.getElementById('aiActionSelect');
const analyzeWithAIButton = document.getElementById('analyzeWithAIButton');
const aiResultArea = document.getElementById('aiResultArea');
const aiLoadingIndicator = document.getElementById('aiLoadingIndicator');
const aiResponseOutput = document.getElementById('aiResponseOutput');
// const aiEvidenceSelection = document.getElementById('aiEvidenceSelection'); // Para seleção futura

// Habilita/desabilita o botão de análise baseado na seleção
if (aiActionSelect && analyzeWithAIButton) {
  aiActionSelect.addEventListener('change', () => {
    analyzeWithAIButton.disabled = !aiActionSelect.value;
    // Opcional: Mostrar/ocultar seleção de evidências se a ação for 'compare'
    // if (aiActionSelect.value === 'compare') {
    //     aiEvidenceSelection.classList.remove('hidden');
    // } else {
    //     aiEvidenceSelection.classList.add('hidden');
    // }
  });
  analyzeWithAIButton.disabled = true; // Começa desabilitado
}

// Event listener para o botão "Analisar com IA"
if (analyzeWithAIButton && aiActionSelect && aiLoadingIndicator && aiResponseOutput) {
  analyzeWithAIButton.addEventListener('click', async () => {
    const selectedAction = aiActionSelect.value;
    if (!selectedAction) {
      alert("Por favor, selecione um tipo de análise.");
      return;
    }

    // Limpa resultados anteriores e mostra carregando
    aiResponseOutput.textContent = '';
    aiLoadingIndicator.classList.remove('hidden');
    analyzeWithAIButton.disabled = true;
    aiActionSelect.disabled = true;

    // Prepara o corpo da requisição para o backend
    const requestBody = {
      action: selectedAction,
      // Opcional: Adicionar evidenceIds se implementou seleção
      // evidenceIds: getSelectedEvidenceIds() // Função para pegar IDs selecionados
    };

    try {
      const token = localStorage.getItem("token"); // Garante que temos o token mais recente
      const response = await fetch(`${API_URL}/api/case/${caseId}/analyze`, { // Chama a nova rota backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Erro na análise da IA.");
      }

      // Exibe a resposta da IA
      aiResponseOutput.textContent = result.analysis || "Nenhuma análise retornada.";

    } catch (error) {
      console.error("Erro ao chamar API de análise:", error);
      aiResponseOutput.textContent = `Erro ao realizar análise: ${error.message}`;
      alert(`Erro ao realizar análise: ${error.message}`);
    } finally {
      // Esconde carregando e reabilita controles
      aiLoadingIndicator.classList.add('hidden');
      analyzeWithAIButton.disabled = false;
      aiActionSelect.disabled = false;
    }
  });
} else {
  console.error("Elementos da interface de análise IA não encontrados.");
}


// Variável para armazenar as evidências atualmente exibidas (útil para preencher o formulário de edição)
let currentEvidences = [];


if (!token) {
  alert("Você precisa estar autenticado.");
  window.location.href = "../index.html";
}

// preenche a tela e o formulário de edição do Caso
async function loadCaseData() {
  try {
    const res = await fetch(`${API_URL}/api/case/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      let errorMsg = "Erro ao buscar dados do caso.";
      try {
        // Tenta obter uma mensagem de erro mais específica do corpo da resposta
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {
        // Se .json() falhar (ex: resposta não é JSON), usa o statusText ou a mensagem padrão
        errorMsg = res.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    // 1. Obter os dados do caso da resposta e armazenar em uma variável local
    const casoDataFromAPI = await res.json();

    // 2. Verificação crucial: garantir que recebemos um objeto válido
    if (!casoDataFromAPI || typeof casoDataFromAPI !== 'object') {
      console.error("Resposta do backend não é um objeto de caso válido:", casoDataFromAPI);
      throw new Error("Dados do caso recebidos do servidor são inválidos ou nulos.");
    }

    // 3. Atribuir os dados recebidos à variável global/módulo currentCaseData
    //    Isso torna os dados do caso acessíveis a outras funções que podem precisar deles.
    currentCaseData = casoDataFromAPI;

    // 4. Exibição dos dados do caso na UI, usando a variável local `casoDataFromAPI`
    //    Adicionando fallbacks para campos que podem ser nulos/undefined para evitar erros ou "undefined" na tela.
    document.getElementById("caseName").textContent = casoDataFromAPI.nameCase || "Nome não informado";
    document.getElementById("caseDescription").textContent = casoDataFromAPI.Description || "Descrição não informada";
    document.getElementById("caseStatus").textContent = casoDataFromAPI.status || "Status não informado";
    document.getElementById("caseLocation").textContent = casoDataFromAPI.location || "Local não informado";
    document.getElementById("caseCategory").textContent = casoDataFromAPI.category || "Categoria não informada";

    if (casoDataFromAPI.dateCase) {
      document.getElementById("caseDate").textContent = new Date(casoDataFromAPI.dateCase)
        .toLocaleDateString("pt-BR", { timeZone: 'UTC' }); // Adicionado timeZone para consistência
    } else {
      document.getElementById("caseDate").textContent = "Data não informada";
    }

    if (casoDataFromAPI.hourCase) {
      document.getElementById("caseHour").textContent = casoDataFromAPI.hourCase;
    } else {
      document.getElementById("caseHour").textContent = "Hora não informada";
    }

    // 5. Pré-preenchimento do formulário de edição do Caso, usando `casoDataFromAPI`
    document.getElementById("editNameCase").value = casoDataFromAPI.nameCase || "";
    document.getElementById("editDescription").value = casoDataFromAPI.Description || "";
    document.getElementById("editStatus").value = casoDataFromAPI.status || "em andamento"; // Pode definir um padrão
    document.getElementById("editLocation").value = casoDataFromAPI.location || "";
    // Para input date, o formato precisa ser YYYY-MM-DD
    document.getElementById("editDateCase").value = casoDataFromAPI.dateCase ? new Date(casoDataFromAPI.dateCase).toISOString().slice(0, 10) : "";
    document.getElementById("editHourCase").value = casoDataFromAPI.hourCase || "";
    document.getElementById("editCategory").value = casoDataFromAPI.category || "outros"; // Pode definir um padrão

    // 6. Chamar outras funções que dependem dos dados do caso
    //    Agora passamos explicitamente as partes relevantes de `casoDataFromAPI`
    loadEvidences(caseId); // Esta função geralmente só precisa do caseId

    // Estas funções precisam dos dados da equipe e do perito responsável
    displayTeamMembers(casoDataFromAPI.team, casoDataFromAPI.responsibleExpert);

    // checkTeamManagementPermissions agora usará `currentCaseData` (que foi atualizado)
    // ou pode ser modificada para receber `casoDataFromAPI.responsibleExpert` e a role do usuário logado.
    checkTeamManagementPermissions();

  } catch (err) {
    console.error("Erro ao carregar dados do caso:", err);
    alert("Erro ao carregar dados do caso: " + err.message);
    currentCaseData = null; // Limpa a variável global em caso de erro

    // Opcional: Limpar os campos da UI ou mostrar mensagens de erro mais visíveis neles
    document.getElementById("caseName").textContent = "Erro ao carregar dados";
    document.getElementById("caseDescription").textContent = "-";
    // ... (limpar outros campos ou exibir mensagens de erro neles)
    if (document.getElementById("teamMembersList")) {
      document.getElementById("teamMembersList").innerHTML = '<li>Falha ao carregar equipe.</li>';
    }
    if (document.getElementById("addTeamMemberFormContainer")) {
      document.getElementById("addTeamMemberFormContainer").classList.add('hidden');
    }
  }
}
// Função para carregar e exibir as evidências (MODIFICADA)
async function loadEvidences(caseId) {
  try {
    const res = await fetch(`${API_URL}/api/evidence/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Erro desconhecido ao buscar evidências." }));
      throw new Error(errorData.message || "Erro ao buscar evidências do caso.");
    }
    const data = await res.json();
    currentEvidences = data.evidences; // Armazena as evidências na variável global

    const evCont = document.getElementById("evidencesContainer");
    evCont.innerHTML = ""; // Limpa o container de evidências

    if (currentEvidences && currentEvidences.length > 0) {
      currentEvidences.forEach(e => {
        const card = document.createElement("div");
        // Use 'relative' para posicionar botões de edição/exclusão absolutamenete nos cantos
        card.className = "border p-4 rounded-lg shadow-md bg-white space-y-2 relative"; // Adicionado 'relative'

        let dataContent = "";
        // Renderiza dados da evidência
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
                  <p><strong>Coletado por:</strong> ${e.collectedBy?.name || "—"}</p>
                  ${dataContent}

                  <!-- Botões de Edição e Exclusão (Posicionados no canto superior direito) -->
                  <div class="absolute top-2 right-2 flex space-x-2">
                      <button class="edit-evidence-btn text-blue-600 hover:text-blue-800" data-evidence-id="${e._id}" title="Editar Evidência">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                              <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                          </svg>
                      </button>
                      <button class="delete-evidence-btn text-red-600 hover:text-red-800" data-evidence-id="${e._id}" title="Excluir Evidência">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm.071 4.243a1 1 0 011.415 0L10 13.586l1.515-1.516a1 1 0 011.415 1.414L11.414 15l1.516 1.515a1 1 0 01-1.414 1.415L10 16.414l-1.515 1.516a1 1 0 01-1.415-1.414L8.586 15l-1.516-1.515a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                      </button>
                      <input type="checkbox" class="evidence-select-checkbox mt-1" data-evidence-id="${e._id}" id="checkbox-ev-${e._id}">
              `;

        // Adiciona event listeners aos botões DEPOIS que o card é criado
        const editBtn = card.querySelector('.edit-evidence-btn');
        const deleteBtn = card.querySelector('.delete-evidence-btn');

        if (editBtn) {
          editBtn.addEventListener('click', () => handleEditEvidence(e._id));
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => handleDeleteEvidence(e._id));
        }

        evCont.appendChild(card);
      });
    } else {
      evCont.innerHTML = '<p class="text-gray-700">Nenhuma evidência cadastrada.</p>';
    }

  } catch (err) {
    console.error("Erro ao carregar evidências:", err);
    alert("Erro ao carregar evidências: " + err.message);
    // Opcional: Limpar a lista de evidências em caso de erro
    document.getElementById("evidencesContainer").innerHTML = '<p class="text-gray-700">Erro ao carregar evidências.</p>';
    currentEvidences = []; // Limpa o array de evidências no frontend também
  }
}

// --- Função para Excluir Evidência ---
async function handleDeleteEvidence(evidenceId) {
  if (!confirm("Tem certeza que deseja excluir esta evidência?")) {
    return; // Cancela se o usuário não confirmar
  }

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/api/evidence/${evidenceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || result.message || "Erro ao excluir evidência.");
    }

    alert(result.message || "Evidência excluída com sucesso!");
    loadEvidences(caseId); // Recarrega a lista de evidências após a exclusão

  } catch (err) {
    console.error("Erro ao excluir evidência:", err);
    alert("Erro ao excluir evidência: " + err.message);
  }
}

// --- Função para Abrir o Formulário de Edição de Evidência ---
function handleEditEvidence(evidenceId) {
  // Encontra a evidência nos dados atualmente carregados
  const evidenceToEdit = currentEvidences.find(e => e._id === evidenceId);

  if (!evidenceToEdit) {
    alert("Evidência não encontrada para edição.");
    return;
  }

  // Preenche o formulário de edição com os dados da evidência
  editingEvidenceIdInput.value = evidenceToEdit._id; // Guarda o ID
  editEvidenceTypeSelect.value = evidenceToEdit.evidenceType;
  editEvidenceTitleInput.value = evidenceToEdit.title;
  editEvidenceDescriptionTextarea.value = evidenceToEdit.description || "";
  editEvidenceCategorySelect.value = evidenceToEdit.category || "";

  // Lida com o campo de dados/imagem
  toggleEditEvidenceDataInput(evidenceToEdit.evidenceType); // Mostra/oculta o campo correto

  if (evidenceToEdit.evidenceType === "image") {
    // Se for imagem, mostra o preview da imagem existente (se houver data)
    if (evidenceToEdit.data && evidenceToEdit.data.startsWith("data:image")) {
      editImagePreview.src = evidenceToEdit.data;
      editImagePreview.classList.remove('hidden');
    } else {
      editImagePreview.src = '';
      editImagePreview.classList.add('hidden');
    }
    editEvidenceImageInput.value = null; // Limpa o input de arquivo para que o usuário precise selecionar um novo
  } else {
    // Se não for imagem, preenche o textarea de dados
    editEvidenceDataTextarea.value = evidenceToEdit.data || "";
    editImagePreview.src = ''; // Limpa e oculta o preview da imagem
    editImagePreview.classList.add('hidden');
  }


  // Oculta outros formulários e mostra o de edição de evidência
  addEvidenceSection.classList.add("hidden"); // Oculta formulário de adicionar
  editCaseSection.classList.add("hidden"); // Oculta formulário de editar caso
  editEvidenceSection.classList.remove("hidden"); // Mostra formulário de edição de evidência
}

// --- Função para Alternar os Campos de Dados no Formulário de Edição ---
function toggleEditEvidenceDataInput(selectedType) {
  if (selectedType === "image") {
    editTextDataInputEdit.classList.add("hidden");
    imageDataInputEdit.classList.remove("hidden");
  } else {
    editTextDataInputEdit.classList.remove("hidden");
    imageDataInputEdit.classList.add("hidden");
    // Garante que o input de imagem seja limpo e o preview oculto ao mudar para não-imagem
    editEvidenceImageInput.value = null;
    editImagePreview.src = '';
    editImagePreview.classList.add('hidden');
  }
}

// --- Event Listener para o Select de Tipo de Evidência no Formulário de Edição ---
editEvidenceTypeSelect.addEventListener("change", () => {
  toggleEditEvidenceDataInput(editEvidenceTypeSelect.value);
});


// --- Submissão do Formulário de Edição de Evidência ---
editEvidenceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const evidenceId = editingEvidenceIdInput.value; // Obtém o ID da evidência a ser editada
  const evidenceType = editEvidenceTypeSelect.value;
  const title = editEvidenceTitleInput.value;
  const description = editEvidenceDescriptionTextarea.value;
  const category = editEvidenceCategorySelect.value || undefined;

  let data;

  if (evidenceType === "image") {
    const imageFile = editEvidenceImageInput.files[0];
    if (imageFile) {
      // Se uma nova imagem foi selecionada, converte para Base64
      data = await convertImageToBase64(imageFile);
    } else {
      // Se o tipo é imagem, mas nenhuma nova imagem foi selecionada,
      // tenta manter a data existente da evidência original
      const originalEvidence = currentEvidences.find(e => e._id === evidenceId);
      data = originalEvidence ? originalEvidence.data : null;
      if (!data) {
        alert("Selecione uma nova imagem ou o tipo de evidência deve ser alterado.");
        return; // Impede o envio se não há data antiga e nem nova imagem
      }
    }
  } else {
    // Se não for imagem, pega os dados do textarea
    data = editEvidenceDataTextarea.value;
  }

  const updatedEvidencePayload = {
    evidenceType,
    title,
    description,
    data,
    category
  };

  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/api/evidence/${evidenceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updatedEvidencePayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || "Erro ao atualizar evidência.");
    }

    alert("Evidência atualizada com sucesso!");
    editEvidenceForm.reset(); // Limpa o formulário de edição
    editEvidenceSection.classList.add("hidden"); // Oculta o formulário
    loadEvidences(caseId); // Recarrega a lista de evidências

  } catch (err) {
    console.error("Erro ao atualizar evidência:", err);
    alert("Erro ao atualizar evidência: " + err.message);
  }
});


// --- Cancelamento do Formulário de Edição de Evidência ---
cancelEditEvidenceForm.addEventListener("click", () => {
  editEvidenceSection.classList.add("hidden"); // Oculta o formulário
  editEvidenceForm.reset(); // Opcional: Limpa o formulário ao cancelar
  editImagePreview.src = ''; // Limpa o preview da imagem
  editImagePreview.classList.add('hidden');
});


// toggle formulário de edição do Caso
const showBtn = document.getElementById("showEditCaseFormButton"); // Já definido acima, mantendo por clareza
const formSect = document.getElementById("editCaseSection");  // Já definido acima
const cancelBtn = document.getElementById("cancelEditCase");  // Já definido acima

showBtn.addEventListener("click", () => formSect.classList.toggle("hidden"));
cancelBtn.addEventListener("click", () => formSect.classList.add("hidden"));


// submit edição do Caso
document.getElementById("editCaseForm").addEventListener("submit", async e => {
  e.preventDefault();
  // ... (sua lógica de submissão de edição do Caso existente) ...
  const updates = {
    nameCase: document.getElementById("editNameCase").value,
    Description: document.getElementById("editDescription").value,
    status: document.getElementById("editStatus").value,
    location: document.getElementById("editLocation").value,
    dateCase: document.getElementById("editDateCase").value,
    hourCase: document.getElementById("editHourCase").value,
    category: document.getElementById("editCategory").value
  };

  const token = localStorage.getItem("token"); // Certifique-se que o token é acessível aqui

  try {
    const res = await fetch(`${API_URL}/api/case/${caseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Erro desconhecido ao atualizar caso." }));
      throw new Error(errorData.message || data.error || data.message);
    }
    alert("Caso atualizado com sucesso!");
    editCaseSection.classList.add("hidden"); // Usa a variável definida acima
    await loadCaseData(); // Recarrega os dados do caso e evidências
  } catch (err) {
    console.error(err);
    alert("Erro: " + err.message);
  }
});

// Botão Deletar Caso
document.getElementById("deleteCaseBtn").addEventListener("click", async () => {
  if (!confirm("Excluir este caso e todas as suas evidências?")) return; // Confirmar exclusão do caso inteiro
  const token = localStorage.getItem("token"); // Certifique-se que o token é acessível aqui
  try {
    const res = await fetch(`${API_URL}/api/case/${caseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const j = await res.json();
    if (!res.ok) {
      const errorData = j || { message: "Erro desconhecido ao excluir caso." };
      throw new Error(errorData.error || errorData.message);
    }
    alert("Caso excluído com sucesso!");
    window.location.href = "home.html"; // Redireciona após exclusão
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});


// Submissão do formulário de Adição de Evidência
addEvidenceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  // ... (sua lógica de submissão de adição de evidência existente) ...
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
    evidenceType,
    title,
    description,
    data,
    category
  };

  const token = localStorage.getItem("token"); // Certifique-se que o token é acessível aqui

  try {
    const response = await fetch(`${API_URL}/api/evidence/${caseId}`, {
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
      // Resetar visibilidade dos campos de dados para o estado padrão (texto)
      textDataInput.classList.remove("hidden");
      imageDataInput.classList.add("hidden");
      document.getElementById("imagePreview").src = ''; // Limpa preview da add form
      document.getElementById("imagePreview").classList.add('hidden');

      loadEvidences(caseId); // <-- Recarrega apenas as evidências para atualizar a lista

    } else {
      const errorData = result || { msg: "Erro desconhecido ao adicionar evidência." };
      alert(errorData.msg || errorData.message);
    }
  } catch (err) {
    console.error("Erro ao enviar evidência:", err);
    alert("Erro de conexão com o servidor ou ao enviar evidência.");
  }
});

// Referências dos elementos para Adição (Já definidos acima)
// const addEvidenceBtn = document.getElementById("addEvidenceBtn");
// const addEvidenceSection = document.getElementById("addEvidenceSection");
// const cancelAddEvidence = document.getElementById("cancelAddEvidence");
// const textDataInput = document.getElementById("textDataInput");
// const imageDataInput = document.getElementById("imageDataInput");
// const evidenceTypeSelect = document.getElementById("evidenceType");


// Mostra o formulário de Adição de Evidência
addEvidenceBtn.addEventListener("click", () => {
  addEvidenceSection.classList.remove("hidden");
  // Oculta outros formulários se estiverem abertos
  editCaseSection.classList.add("hidden");
  editEvidenceSection.classList.add("hidden");
});

// Oculta o formulário de Adição ao cancelar
cancelAddEvidence.addEventListener("click", () => {
  addEvidenceSection.classList.add("hidden");
  addEvidenceForm.reset(); // Limpa o formulário
  // Resetar visibilidade dos campos de dados para o estado padrão (texto)
  textDataInput.classList.remove("hidden");
  imageDataInput.classList.add("hidden");
  document.getElementById("imagePreview").src = ''; // Limpa preview da add form
  document.getElementById("imagePreview").classList.add('hidden');
});

// Alternar campos com base no tipo de evidência (para formulário de Adição)
evidenceTypeSelect.addEventListener("change", () => {
  const selectedType = evidenceTypeSelect.value;
  if (selectedType === "image") {
    textDataInput.classList.add("hidden");
    imageDataInput.classList.remove("hidden");
    // Limpa o campo de texto quando muda para imagem
    document.getElementById("evidenceData").value = "";
  } else {
    textDataInput.classList.remove("hidden");
    imageDataInput.classList.add("hidden");
    // Limpa o campo de imagem quando muda para texto
    document.getElementById("evidenceImage").value = ""; // Limpa o input file
    document.getElementById("imagePreview").src = ''; // Limpa preview
    document.getElementById("imagePreview").classList.add('hidden');
  }
});


// Função para converter imagem para Base64 (mantida)
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

// Opcional: Adicionar preview ao selecionar imagem no formulário de Adição
document.getElementById("evidenceImage").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const preview = document.getElementById("imagePreview");
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    }
    reader.readAsDataURL(file);
  } else {
    preview.src = '';
    preview.classList.add('hidden');
  }
});


// Opcional: Adicionar preview ao selecionar imagem no formulário de Edição
document.getElementById("editEvidenceImage").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const preview = document.getElementById("editImagePreview");
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    }
    reader.readAsDataURL(file);
  } else {
    // Se o usuário limpou a seleção, mostra o preview da imagem *original* se ela existir
    const evidenceId = editingEvidenceIdInput.value;
    const originalEvidence = currentEvidences.find(e => e._id === evidenceId);
    if (originalEvidence && originalEvidence.data && originalEvidence.data.startsWith("data:image")) {
      preview.src = originalEvidence.data;
      preview.classList.remove('hidden');
    } else {
      preview.src = '';
      preview.classList.add('hidden');
    }
  }
});


// tudo pronto: carrega de cara
loadCaseData();

const exportReportBtn = document.getElementById("exportReportBtn");
if (exportReportBtn) {
  exportReportBtn.addEventListener("click", async () => {
    const reportContent = prompt("Digite o conteúdo do laudo para o PDF:");
    if (reportContent === null) return; // Sai se cancelou
    if (!reportContent) { alert("Conteúdo do laudo não pode ser vazio."); return; }

    const token = localStorage.getItem("token");
    const caseId = params.get("id");
    exportReportBtn.disabled = true; // Desabilita durante o processo

    try {
      const response = await fetch(`${API_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ caseId: caseId, content: reportContent })
      });
      const result = await response.json();
      if (!response.ok) {
        const errorMessage = result.error || result.message || "Erro desconhecido ao gerar laudo.";
        throw new Error(errorMessage);
      }

      alert(result.message || "Laudo gerado com sucesso!");

      // Abre o PDF em nova aba (pode ser bloqueado por pop-up blocker)
      if (result.pdfUrl) {
        const pdfWindow = window.open(result.pdfUrl, '_blank');
        const reportDownloadArea = document.getElementById("reportDownloadArea");
        if (reportDownloadArea) {
          reportDownloadArea.innerHTML = `<p class="text-sm text-orange-600 mb-2">O navegador bloqueou a abertura automática do PDF? Clique no link abaixo:</p>`;
          const caseNameForFile = document.getElementById("caseName")?.textContent?.replace(/[^a-zA-Z0-9]/g, '_') || 'caso';
          const filename = `Laudo_${caseNameForFile}_${result.reportId?.slice(-6) || Date.now()}.pdf`;
          const downloadLink = document.createElement('a');
          downloadLink.href = result.pdfUrl;
          downloadLink.textContent = 'Abrir/Baixar Laudo Gerado';
          downloadLink.target = '_blank';
          downloadLink.download = filename; // Sugere download
          downloadLink.className = 'inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200 text-sm';
          reportDownloadArea.appendChild(downloadLink);
        } else {
          alert("Não foi possível abrir o PDF automaticamente. Verifique o bloqueador de pop-ups.\nURL: " + result.pdfUrl);
        }
      } else {
        alert("A URL do PDF não foi recebida do servidor.");
      }

    } catch (error) {
      console.error("Erro ao exportar laudo:", error);
      alert("Não foi possível gerar o laudo: " + error.message);
      const reportDownloadArea = document.getElementById("reportDownloadArea");
      if (reportDownloadArea) reportDownloadArea.innerHTML = `<p class="text-sm text-red-600">Falha ao gerar o laudo.</p>`;
    } finally {
      exportReportBtn.disabled = false; // Reabilita o botão
    }
  });
}

// Função para exibir os membros da equipe
function displayTeamMembers(teamArray, responsibleExpert) {
  teamMembersList.innerHTML = ''; // Limpa a lista atual

  // Adiciona o perito responsável primeiro (se existir)
  if (responsibleExpert) {
    const liResponsible = document.createElement('li');
    liResponsible.innerHTML = `
            ${responsibleExpert.name || 'Nome não disponível'} 
            (<span class="italic">${responsibleExpert.role || 'perito'}</span>) - 
            <span class="font-semibold text-blue-700">Perito Responsável</span>
        `;
    teamMembersList.appendChild(liResponsible);
  }

  if (teamArray && teamArray.length > 0) {
    noTeamMembers.classList.add('hidden');
    teamArray.forEach(member => {
      // Não listar o perito responsável novamente se ele estiver no array 'team' (pouco provável, mas seguro)
      if (responsibleExpert && member._id === responsibleExpert._id) {
        return;
      }
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center py-1';
      li.innerHTML = `
                <span>
                    ${member.name || 'Nome não disponível'} 
                    (<span class="italic">${member.role || 'Função não definida'}</span>)
                </span>
                <button class="remove-teammate-btn text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50" data-user-id="${member._id}" title="Remover da Equipe">
                    Remover
                </button>
            `;
      // Adiciona evento ao botão de remover APENAS se o usuário logado tiver permissão
      const removeBtn = li.querySelector('.remove-teammate-btn');
      if (canManageTeam()) { // Você precisará definir essa função
        removeBtn.addEventListener('click', () => handleRemoveTeamMember(member._id));
      } else {
        removeBtn.style.display = 'none'; // Oculta o botão se não tiver permissão
      }
      teamMembersList.appendChild(li);
    });
  } else if (!responsibleExpert || teamArray.length === 0) { // Se não há responsável e a equipe está vazia
    teamMembersList.innerHTML = ''; // Limpa "Carregando..."
    noTeamMembers.classList.remove('hidden');
  } else if (teamArray.length === 0) {
    const liEmpty = document.createElement('li');
    liEmpty.textContent = 'Nenhum membro adicional na equipe.';
    liEmpty.className = 'text-gray-500 italic';
    teamMembersList.appendChild(liEmpty);
  }
}

// Função para verificar se o usuário logado pode gerenciar a equipe
function canManageTeam() {
  if (!currentCaseData || !token) return false;
  const decodedToken = jwt_decode(token); // Você precisará da biblioteca jwt-decode
  const loggedInUserId = decodedToken.id;
  const loggedInUserRole = decodedToken.role;

  if (loggedInUserRole === 'admin') return true;
  if (currentCaseData.responsibleExpert && currentCaseData.responsibleExpert._id === loggedInUserId) return true;
  return false;
}

// Função para mostrar/ocultar o formulário de gerenciamento da equipe
function checkTeamManagementPermissions() {
  if (canManageTeam()) {
    addTeamMemberFormContainer.classList.remove('hidden');
  } else {
    addTeamMemberFormContainer.classList.add('hidden');
    // Oculta também os botões de remover individuais se já foram renderizados
    document.querySelectorAll('.remove-teammate-btn').forEach(btn => btn.style.display = 'none');
  }
}

// Event listener para buscar usuários
searchUserBtn.addEventListener("click", async () => {
    const searchTerm = userSearchInput.value.trim();
    if (searchTerm.length < 3) {
        alert("Digite pelo menos 3 caracteres para buscar.");
        return;
    }
    userSearchResults.innerHTML = '<p class="text-sm text-gray-500">Buscando...</p>';
    selectedUserIdToAddInput.value = "";
    selectedUserDisplay.textContent = "";
    submitAddTeamMemberBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/user/search?name=${encodeURIComponent(searchTerm)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || "Falha ao buscar usuários.");
        }

        const result = await response.json();
        const users = Array.isArray(result) ? result : result.users;

        userSearchResults.innerHTML = '';

        if (!users || users.length === 0) {
            userSearchResults.innerHTML = '<p class="text-sm text-gray-500">Nenhum usuário encontrado.</p>';
            return;
        }

        let eligibleUsersFound = 0;

        users.forEach(userInLoop => { // Renomeei para userInLoop para evitar confusão de escopo
            const isEligibleRole = userInLoop.role === 'perito' || userInLoop.role === 'assistente';
            const isNotResponsible = !currentCaseData.responsibleExpert || userInLoop._id !== currentCaseData.responsibleExpert._id;
            const isNotInTeam = !currentCaseData.team || !Array.isArray(currentCaseData.team) || !currentCaseData.team.some(tm => tm && tm._id === userInLoop._id);

            if (isEligibleRole && isNotResponsible && isNotInTeam) {
                eligibleUsersFound++;
                const userDiv = document.createElement('div');
                userDiv.className = 'p-2 border rounded hover:bg-gray-100 cursor-pointer user-search-item';
                userDiv.textContent = `${userInLoop.name} (${userInLoop.role}) - CRO: ${userInLoop.cro || 'N/A'}`;
                
                // Armazena os dados no dataset do elemento userDiv
                userDiv.dataset.userId = userInLoop._id;
                userDiv.dataset.userName = userInLoop.name;

                userDiv.addEventListener('click', function() { // Usar function() para que 'this' se refira ao userDiv
                    // 'this' aqui se refere ao userDiv que foi clicado

                    // Remove a classe 'selected' de qualquer outro item
                    document.querySelectorAll('.user-search-item').forEach(div => {
                        div.classList.remove('bg-blue-100', 'border-blue-400', 'font-semibold');
                    });
                    // Adiciona a classe 'selected' ao item clicado (this)
                    this.classList.add('bg-blue-100', 'border-blue-400', 'font-semibold');

                    // ----- Acessar os dados do dataset de 'this' (o userDiv clicado) -----
                    selectedUserIdToAddInput.value = this.dataset.userId; // CORREÇÃO AQUI
                    selectedUserDisplay.textContent = `Adicionar: ${this.dataset.userName}`; // CORREÇÃO AQUI
                    submitAddTeamMemberBtn.disabled = false;
                    
                    console.log("Usuário selecionado ID:", selectedUserIdToAddInput.value);
                    console.log("Usuário selecionado Nome:", this.dataset.userName); // Para depuração
                });
                userSearchResults.appendChild(userDiv);
            }
        });

        if (eligibleUsersFound === 0) {
             userSearchResults.innerHTML = '<p class="text-sm text-gray-500">Nenhum usuário elegível encontrado.</p>';
        }

    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        userSearchResults.innerHTML = `<p class="text-sm text-red-500">Erro ao buscar: ${error.message}</p>`;
        submitAddTeamMemberBtn.disabled = true;
    }
});
// Event listener para adicionar membro à equipe
addTeamMemberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = selectedUserIdToAddInput.value;
  if (!userId) {
    alert("Nenhum usuário selecionado para adicionar.");
    return;
  }

  submitAddTeamMemberBtn.disabled = true; // Desabilita durante a requisição

  try {
    const response = await fetch(`${API_URL}/api/case/${caseId}/team/${userId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || "Erro ao adicionar membro à equipe.");
    }

    alert(result.message || "Usuário adicionado à equipe com sucesso!");
    currentCaseData = result.case; // Atualiza os dados do caso com a nova equipe
    displayTeamMembers(currentCaseData.team, currentCaseData.responsibleExpert); // Re-renderiza a lista da equipe
    checkTeamManagementPermissions(); // Reavalia permissões

    // Limpa o formulário de adição
    userSearchInput.value = "";
    userSearchResults.innerHTML = "";
    selectedUserIdToAddInput.value = "";
    selectedUserDisplay.textContent = "";

  } catch (error) {
    console.error("Erro ao adicionar membro:", error);
    alert("Erro: " + error.message);
  } finally {
    if (selectedUserIdToAddInput.value) { // Só reabilita se ainda houver seleção válida
      submitAddTeamMemberBtn.disabled = false;
    } else {
      submitAddTeamMemberBtn.disabled = true;
    }
  }
});

// Função para remover membro da equipe
async function handleRemoveTeamMember(userId) {
  if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;

  try {
    const response = await fetch(`${API_URL}/api/case/${caseId}/team/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || "Erro ao remover membro da equipe.");
    }

    alert(result.message || "Membro removido da equipe com sucesso!");
    currentCaseData = result.case; // Atualiza os dados do caso
    displayTeamMembers(currentCaseData.team, currentCaseData.responsibleExpert);
    checkTeamManagementPermissions();

  } catch (error) {
    console.error("Erro ao remover membro:", error);
    alert("Erro: " + error.message);
  }
}

const generateSelectedEvidencesReportBtn = document.getElementById('generateSelectedEvidencesReportBtn');

if (generateSelectedEvidencesReportBtn) {
    generateSelectedEvidencesReportBtn.disabled = true; // Começa desabilitado

    // Habilitar/desabilitar o botão baseado na seleção de checkboxes
    document.getElementById('evidencesContainer').addEventListener('change', (event) => {
        if (event.target.classList.contains('evidence-select-checkbox')) {
            const selectedCheckboxes = document.querySelectorAll('.evidence-select-checkbox:checked');
            generateSelectedEvidencesReportBtn.disabled = selectedCheckboxes.length === 0;
        }
    });

    generateSelectedEvidencesReportBtn.addEventListener('click', async () => {
        const selectedCheckboxes = document.querySelectorAll('.evidence-select-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            alert("Selecione pelo menos uma evidência para gerar o laudo.");
            return;
        }

        const evidenceIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.evidenceId);
        const reportContent = prompt("Digite o conteúdo do laudo para as evidências selecionadas:");

        if (reportContent === null) return; // Cancelou
        if (!reportContent) {
            alert("Conteúdo do laudo não pode ser vazio.");
            return;
        }

        generateSelectedEvidencesReportBtn.disabled = true;
        // Opcional: Mudar texto do botão para "Gerando..."

        try {
            const token = localStorage.getItem("token");
            // Usar a nova rota do backend
            const response = await fetch(`${API_URL}/api/report/evidence`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    caseId: caseId, // caseId global da página
                    evidenceIds: evidenceIds,
                    content: reportContent
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || result.message || "Erro ao gerar laudo de evidências.");
            }

            alert(result.message || "Laudo de evidências gerado com sucesso!");
            // Lógica para exibir/baixar o PDF (similar ao que você já tem)
            if (result.pdfUrl) {
                // ... seu código para abrir/mostrar link de download ...
                // Exemplo:
                const reportDownloadArea = document.getElementById("reportDownloadArea"); // Reutilize ou crie nova área
                if (reportDownloadArea) {
                     // Limpar área anterior se houver
                    reportDownloadArea.innerHTML = `<p class="text-sm text-orange-600 mb-2">Clique no link abaixo para o laudo das evidências:</p>`;
                    const caseNameForFile = document.getElementById("caseName")?.textContent?.replace(/[^a-zA-Z0-9]/g, '_') || 'caso';
                    const filename = `Laudo_Evidencias_${caseNameForFile}_${result.reportId?.slice(-6) || Date.now()}.pdf`;
                    const downloadLink = document.createElement('a');
                    downloadLink.href = result.pdfUrl;
                    downloadLink.textContent = 'Abrir/Baixar Laudo de Evidências';
                    downloadLink.target = '_blank';
                    downloadLink.download = filename;
                    downloadLink.className = 'inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200 text-sm';
                    reportDownloadArea.appendChild(downloadLink);
                }
            }
            // Desmarcar checkboxes e desabilitar botão
            selectedCheckboxes.forEach(cb => cb.checked = false);
            generateSelectedEvidencesReportBtn.disabled = true;

        } catch (error) {
            console.error("Erro ao gerar laudo de evidências:", error);
            alert("Não foi possível gerar o laudo: " + error.message);
        } 
        // finally {
        //     // Reabilitar botão apenas se ainda houver checkboxes selecionados (pouco provável aqui, já que desmarcamos)
        //     // ou apenas reabilitar se o usuário puder tentar novamente.
        //     // Por simplicidade, vamos deixar que o evento 'change' nos checkboxes reabilite se necessário.
        //     // generateSelectedEvidencesReportBtn.disabled = document.querySelectorAll('.evidence-select-checkbox:checked').length === 0;
        //     // ou
        //     // generateSelectedEvidencesReportBtn.textContent = "Gerar Laudo para Evidências Selecionadas";
        // }
    });
}