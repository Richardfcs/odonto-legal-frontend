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
            const response = await fetch(`http://localhost:3000/api/case/${caseId}/analyze`, { // Chama a nova rota backend
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
  // ... (sua função loadCaseData existente, sem mudanças) ...
    try {
      const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
           const errorData = await res.json().catch(() => ({ message: "Erro desconhecido ao buscar dados do caso." }));
           throw new Error(errorData.message || "Erro ao buscar dados do caso.");
      }
      const caso = await res.json();

      // Exibição dos dados do caso
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

      // Pré-preenchimento do formulário de edição do Caso
      document.getElementById("editNameCase").value    = caso.nameCase;
      document.getElementById("editDescription").value = caso.Description;
      document.getElementById("editStatus").value      = caso.status;
      document.getElementById("editLocation").value    = caso.location;
      document.getElementById("editDateCase").value    = caso.dateCase?.slice(0,10) || "";
      document.getElementById("editHourCase").value    = caso.hourCase || "";
      document.getElementById("editCategory").value    = caso.category;


    } catch (err) {
      console.error("Erro ao carregar dados do caso:", err);
      alert("Erro ao carregar dados do caso: " + err.message);
    }
}

// Função para carregar e exibir as evidências (MODIFICADA)
async function loadEvidences(caseId) {
  try {
      const res = await fetch(`http://localhost:3000/api/evidence/${caseId}`, {
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
                  </div>
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
        const res = await fetch(`http://localhost:3000/api/evidence/${evidenceId}`, {
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
        const response = await fetch(`http://localhost:3000/api/evidence/${evidenceId}`, {
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
const showBtn   = document.getElementById("showEditCaseFormButton"); // Já definido acima, mantendo por clareza
const formSect  = document.getElementById("editCaseSection");  // Já definido acima
const cancelBtn = document.getElementById("cancelEditCase");  // Já definido acima

showBtn.addEventListener("click", () => formSect.classList.toggle("hidden"));
cancelBtn.addEventListener("click", () => formSect.classList.add("hidden"));


// submit edição do Caso
document.getElementById("editCaseForm").addEventListener("submit", async e => {
  e.preventDefault();
  // ... (sua lógica de submissão de edição do Caso existente) ...
    const updates = {
      nameCase:    document.getElementById("editNameCase").value,
      Description: document.getElementById("editDescription").value,
      status:      document.getElementById("editStatus").value,
      location:    document.getElementById("editLocation").value,
      dateCase:    document.getElementById("editDateCase").value,
      hourCase:    document.getElementById("editHourCase").value,
      category:    document.getElementById("editCategory").value
    };

    const token = localStorage.getItem("token"); // Certifique-se que o token é acessível aqui

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
    const res = await fetch(`http://localhost:3000/api/case/${caseId}`, {
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
     caseId, // <-- usamos o valor já obtido da URL no topo
     evidenceType,
     title,
     description,
     data,
     category
   };

   const token = localStorage.getItem("token"); // Certifique-se que o token é acessível aqui

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
document.getElementById("evidenceImage").addEventListener("change", function(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("imagePreview");
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
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
document.getElementById("editEvidenceImage").addEventListener("change", function(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("editImagePreview");
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
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

document.getElementById("exportReportBtn").addEventListener("click", async () => {
  const reportContent = prompt("Digite o conteúdo do laudo para o PDF:");
  if (!reportContent) {
    alert("Conteúdo do laudo não pode ser vazio.");
    return;
  }

  const token = localStorage.getItem("token"); // Certifique-se que o token é acessível aqui (scoped corretamente)
  const caseId = params.get("id"); // Certifique-se que caseId é acessível aqui

  try {
    const response = await fetch("http://localhost:3000/api/report", { // Rota POST para gerar laudo
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ caseId: caseId, content: reportContent })
    });

    const result = await response.json(); // Espera o JSON de resposta

    if (!response.ok) {
      // Trata erros do backend (incluindo validações 400, não encontrado 404, auth 401/403, server error 500)
      const errorMessage = result.error || result.message || "Erro desconhecido ao gerar laudo.";
      throw new Error(errorMessage);
    }

    alert(result.message || "Laudo gerado com sucesso!"); // Mensagem de sucesso

    // Abre o PDF gerado em uma nova aba usando a URL retornada
    if (result.pdfUrl) {
      window.open(result.pdfUrl, '_blank');
    } else {
      alert("A URL do PDF não foi recebida do servidor.");
    }

  } catch (error) {
    console.error("Erro ao exportar laudo:", error);
    alert("Não foi possível gerar o laudo: " + error.message); // Exibe o erro para o usuário
  }
});
