// ../js/odontograma.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    const token = localStorage.getItem('token');
    let loggedInUser = null;
    try {
        if (token && typeof jwt_decode === 'function') {
            loggedInUser = jwt_decode(token);
        } else if (token) {
            console.warn("jwt_decode não está disponível. Não foi possível decodificar o token.");
        }
    } catch (e) {
        console.error("Erro ao decodificar token na inicialização:", e);
    }

    // --- Elementos do DOM ---
    const odontogramForm = document.getElementById('odontogramForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorMessageElement = document.getElementById('odontogramErrorMessage');
    const pageTitleElement = document.querySelector('h1');

    const backToVictimLink = document.getElementById('backToVictimLink');
    const caseLinkOdontogram = document.getElementById('caseLinkOdontogram');
    const victimIdentifierSpan = document.getElementById('victimIdentifier');

    const victimIdInput = document.getElementById('victimId');
    const caseIdInput = document.getElementById('caseId');
    const odontogramIdInput = document.getElementById('odontogramId');
    const odontogramTypeSelect = document.getElementById('odontogramType');
    const examinationDateInput = document.getElementById('examinationDate');
    const examinerNameInput = document.getElementById('examinerName');
    const examinerIdInput = document.getElementById('examinerId');
    
    // Para imagem
    const odontogramImageFileInput = document.getElementById('odontogramImageFile');
    const odontogramImagePreview = document.getElementById('odontogramImagePreview');
    const odontogramImageBase64Input = document.getElementById('odontogramImageBase64');
    const odontogramImageNotesInput = document.getElementById('odontogramImageNotes');

    const teethEntriesContainer = document.getElementById('teethEntriesContainer');
    const initializeTeethButton = document.getElementById('initializeTeethButton');

    const generalObservationsTextarea = document.getElementById('generalObservations');
    const summaryForIdentificationTextarea = document.getElementById('summaryForIdentification');
    
    const comparisonSection = document.getElementById('comparisonSection');
    const anteMortemDataSourcesTextarea = document.getElementById('anteMortemDataSources');
    const identificationConclusionStatusSelect = document.getElementById('identificationConclusionStatus');
    const identificationConclusionJustificationTextarea = document.getElementById('identificationConclusionJustification');

    const cancelOdontogramBtn = document.getElementById('cancelOdontogramBtn');
    const saveOdontogramBtn = document.getElementById('saveOdontogramBtn');
    const formActionButtons = document.getElementById('formActionButtons'); // Container dos botões Salvar/Cancelar/Excluir


    let currentVictimId = null;
    let currentCaseId = null;
    let currentOdontogramId = null;
    let isEditMode = false;
    let currentOdontogramData = null;

    // --- FUNÇÕES AUXILIARES ---
    function toggleLoading(isLoading) {
        if (loadingOverlay) loadingOverlay.classList.toggle('hidden', !isLoading);
        if (odontogramForm) odontogramForm.classList.toggle('hidden', isLoading || (errorMessageElement && errorMessageElement.textContent !== ''));
    }

    function showError(message, isFatal = false) {
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
            errorMessageElement.classList.remove('hidden');
        }
        console.error("Erro Odontograma:", message);
        if (isFatal && odontogramForm) {
            odontogramForm.classList.add('hidden');
        }
    }
    function clearError() {
        if (errorMessageElement) {
            errorMessageElement.textContent = '';
            errorMessageElement.classList.add('hidden');
        }
    }
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error("Data inválida para formatação");
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) { console.error("Erro ao formatar data:", dateString, e); return ''; }
    }
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    async function initializePage() {
        toggleLoading(true);
        clearError();

        if (!token || !loggedInUser) {
            showError("Autenticação necessária. Redirecionando para o login.", true);
            setTimeout(() => window.location.href = '../index.html', 3000);
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        currentVictimId = urlParams.get('victimId');
        currentCaseId = urlParams.get('caseId');
        currentOdontogramId = urlParams.get('odontogramId');
        const initialTypeFromUrl = urlParams.get('type'); // Para pré-selecionar tipo na criação

        if (!currentVictimId) {
            showError("ID da Vítima não fornecido na URL. Não é possível prosseguir.", true);
            toggleLoading(false);
            return;
        }
        
        if(victimIdInput) victimIdInput.value = currentVictimId;
        if(caseIdInput && currentCaseId) caseIdInput.value = currentCaseId;

        await fetchVictimAndCaseInfo();

        if (currentOdontogramId) {
            isEditMode = true;
            if(odontogramIdInput) odontogramIdInput.value = currentOdontogramId;
            if(saveOdontogramBtn) saveOdontogramBtn.textContent = 'Salvar Alterações';
            if(pageTitleElement) pageTitleElement.textContent = 'Editar/Visualizar Odontograma';
            if(initializeTeethButton) initializeTeethButton.textContent = 'Recarregar Dados dos Dentes';
            createDeleteButton();
            await loadOdontogramData();
        } else {
            isEditMode = false;
            if(saveOdontogramBtn) saveOdontogramBtn.textContent = 'Salvar Novo Odontograma';
            if(pageTitleElement) pageTitleElement.textContent = 'Novo Odontograma';
            if(examinationDateInput) examinationDateInput.value = formatDateForInput(new Date().toISOString());
            if(initializeTeethButton) initializeTeethButton.textContent = 'Iniciar Registro dos 32 Dentes';
            if (initialTypeFromUrl && odontogramTypeSelect) { // Pré-seleciona o tipo se vindo da URL
                odontogramTypeSelect.value = initialTypeFromUrl;
            }
            initializeTeethInputs();
            toggleLoading(false);
        }
        
        if (loggedInUser && examinerNameInput && examinerIdInput && !isEditMode) {
            examinerNameInput.value = loggedInUser.name || 'Usuário Logado';
            examinerIdInput.value = loggedInUser.id;
        }
        
        setupEventListeners();
        toggleComparisonSectionVisibility();
    }

    async function fetchVictimAndCaseInfo() {
        // ... (Implementação de fetchVictimAndCaseInfo da resposta anterior, garantindo que os links sejam preenchidos)
        if (!currentVictimId) return;
        try {
            const victimRes = await fetch(`${API_URL}/api/victim/${currentVictimId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (victimRes.ok) {
                const victimData = await victimRes.json();
                if (victimIdentifierSpan) victimIdentifierSpan.textContent = victimData.name || victimData.victimCode || `ID: ${currentVictimId}`;
            } else {
                if (victimIdentifierSpan) victimIdentifierSpan.textContent = `ID: ${currentVictimId} (Erro ao carregar nome)`;
            }

            const caseIdForLinks = currentCaseId || (await victimRes.json()).case?._id; // Re-parse se necessário ou pegue de victimData se já parseado
            const victimReturnLinkHref = `vitima-detalhes.html?id=${currentVictimId}${caseIdForLinks ? '&caseId=' + caseIdForLinks : ''}`;
            if (backToVictimLink) {
                const basePathVictim = loggedInUser.role === 'admin' ? '../main/' : '';
                backToVictimLink.href = basePathVictim + victimReturnLinkHref;
            }


            if (caseLinkOdontogram && caseIdForLinks) {
                 const caseRes = await fetch(`${API_URL}/api/case/${caseIdForLinks}`, { headers: { 'Authorization': `Bearer ${token}` } });
                 if (caseRes.ok) {
                     const caseDataFromServer = await caseRes.json();
                     caseLinkOdontogram.textContent = caseDataFromServer.nameCase || `ID: ${caseIdForLinks}`;
                 } else {
                     caseLinkOdontogram.textContent = `ID: ${caseIdForLinks}`;
                 }
                const basePathCase = loggedInUser.role === 'admin' ? '../components/' : '';
                caseLinkOdontogram.href = `${basePathCase}pericia.html?id=${caseIdForLinks}`;
            } else if (caseLinkOdontogram) {
                caseLinkOdontogram.textContent = 'N/A (Caso não informado)';
                caseLinkOdontogram.href = '#';
            }
        } catch (error) {
            console.error("Erro ao buscar info da vítima/caso para header:", error);
        }
    }
    
    function toggleComparisonSectionVisibility() {
        // ... (Implementação de toggleComparisonSectionVisibility da resposta anterior)
        if (!odontogramTypeSelect || !comparisonSection) return;
        const type = odontogramTypeSelect.value;
        let show = false;
        if (type === 'comparativo') {
            show = true;
        } else if (isEditMode && currentOdontogramData) {
            const hasAnteMortem = currentOdontogramData.anteMortemDataSources && currentOdontogramData.anteMortemDataSources.length > 0;
            const hasMeaningfulConclusion = currentOdontogramData.identificationConclusion && currentOdontogramData.identificationConclusion.status && currentOdontogramData.identificationConclusion.status !== 'pendente';
            show = hasAnteMortem || hasMeaningfulConclusion;
        }
        comparisonSection.classList.toggle('hidden', !show);
    }

    const fdiPermanentTeeth = [ "18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28", "48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38" ];
    
    function createToothEntryHTML(fdi) {
        // ... (Implementação de createToothEntryHTML da resposta anterior)
        const toothNames = {
            "18": "3º Molar Sup. Dir. (Siso)", "17": "2º Molar Sup. Dir.", "16": "1º Molar Sup. Dir.", "15": "2º Pré-Molar Sup. Dir.", "14": "1º Pré-Molar Sup. Dir.", "13": "Canino Sup. Dir.", "12": "Incisivo Lateral Sup. Dir.", "11": "Incisivo Central Sup. Dir.",
            "21": "Incisivo Central Sup. Esq.", "22": "Incisivo Lateral Sup. Esq.", "23": "Canino Sup. Esq.", "24": "1º Pré-Molar Sup. Esq.", "25": "2º Pré-Molar Sup. Esq.", "26": "1º Molar Sup. Esq.", "27": "2º Molar Sup. Esq.", "28": "3º Molar Sup. Esq. (Siso)",
            "48": "3º Molar Inf. Dir. (Siso)", "47": "2º Molar Inf. Dir.", "46": "1º Molar Inf. Dir.", "45": "2º Pré-Molar Inf. Dir.", "44": "1º Pré-Molar Inf. Dir.", "43": "Canino Inf. Dir.", "42": "Incisivo Lateral Inf. Dir.", "41": "Incisivo Central Inf. Dir.",
            "31": "Incisivo Central Inf. Esq.", "32": "Incisivo Lateral Inf. Esq.", "33": "Canino Inf. Esq.", "34": "1º Pré-Molar Inf. Esq.", "35": "2º Pré-Molar Inf. Esq.", "36": "1º Molar Inf. Esq.", "37": "2º Molar Inf. Esq.", "38": "3º Molar Inf. Esq. (Siso)"
        };
        const toothName = toothNames[fdi] || `Dente ${fdi}`;
        return `
            <div class="tooth-entry-form" data-fdi="${fdi}">
                <h4>${toothName} (FDI: ${fdi})</h4>
                <div class="tooth-grid">
                    <div class="detail-item">
                        <label for="tooth_${fdi}_status" class="text-sm font-medium">Status:</label>
                        <select id="tooth_${fdi}_status" name="teeth[${fdi}][status]" class="w-full p-1 border border-gray-300 rounded text-sm mt-1">
                            <option value="nao_examinado">Não Examinado</option>
                            <option value="presente_higido">Presente Hígido</option>
                            <option value="presente_cariado">Presente Cariado</option>
                            <option value="presente_restaurado">Presente Restaurado</option>
                            <option value="presente_trat_endodontico">Trat. Endodôntico</option>
                            <option value="presente_com_protese_fixa">Prótese Fixa</option>
                            <option value="ausente_extraido">Ausente (Extraído)</option>
                            <option value="ausente_nao_erupcionado">Ausente (Não Erupcionado)</option>
                            <option value="ausente_agenesia">Ausente (Agenesia)</option>
                            <option value="fraturado">Fraturado</option>
                            <option value="desgaste_acentuado">Desgaste Acentuado</option>
                            <option value="mobilidade_patologica">Mobilidade Patológica</option>
                            <option value="extrusao">Extrusão</option>
                            <option value="intrusao">Intrusão</option>
                            <option value="giroversao">Giroversão</option>
                            <option value="implante">Implante</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>
                    <div class="detail-item col-span-full md:col-span-1 col-span-full-if-possible">
                        <label for="tooth_${fdi}_observations" class="text-sm font-medium">Observações Específicas:</label>
                        <input type="text" id="tooth_${fdi}_observations" name="teeth[${fdi}][observations]" class="w-full p-1 border border-gray-300 rounded text-sm mt-1" placeholder="Ex: Mancha branca">
                    </div>
                </div>
            </div>`;
    }


    function initializeTeethInputs(teethDataArray = []) {
        // ... (Implementação de initializeTeethInputs da resposta anterior)
         if (!teethEntriesContainer) return;
        teethEntriesContainer.innerHTML = '';
        const teethMap = new Map((teethDataArray || []).map(t => [t.fdiNumber, t]));

        fdiPermanentTeeth.forEach(fdi => {
            teethEntriesContainer.insertAdjacentHTML('beforeend', createToothEntryHTML(fdi));
            const existingToothData = teethMap.get(fdi);
            if (existingToothData) {
                const statusSelect = document.getElementById(`tooth_${fdi}_status`);
                const obsInput = document.getElementById(`tooth_${fdi}_observations`);
                if (statusSelect) statusSelect.value = existingToothData.status || 'nao_examinado';
                if (obsInput) obsInput.value = existingToothData.observations || '';
            }
        });
    }

    async function loadOdontogramData() {
        // ... (Implementação de loadOdontogramData da resposta anterior, incluindo a lógica de permissão para edição)
        if (!currentOdontogramId) { /* ... */ return; }
        toggleLoading(true);
        console.log(`Carregando dados do Odontograma ID: ${currentOdontogramId}`);
        try {
            const response = await fetch(`${API_URL}/api/odontogram/${currentOdontogramId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { /* ... */ throw new Error("Erro ao buscar dados"); }
            currentOdontogramData = await response.json();
            if (!currentOdontogramData) throw new Error("Dados não retornados.");

            if (odontogramTypeSelect) odontogramTypeSelect.value = currentOdontogramData.odontogramType || 'post_mortem';
            if (examinationDateInput) examinationDateInput.value = formatDateForInput(currentOdontogramData.examinationDate);
            if(currentOdontogramData.examiner && examinerNameInput && examinerIdInput){
                examinerNameInput.value = currentOdontogramData.examiner.name || `ID: ${currentOdontogramData.examiner._id}`;
                examinerIdInput.value = currentOdontogramData.examiner._id;
                if (loggedInUser && loggedInUser.id !== currentOdontogramData.examiner._id && loggedInUser.role !== 'admin') {
                    if(saveOdontogramBtn) { saveOdontogramBtn.disabled = true; saveOdontogramBtn.title = "Apenas o examinador original ou admin podem editar."; saveOdontogramBtn.classList.add('opacity-50', 'cursor-not-allowed');}
                    const deleteBtn = document.getElementById('deleteOdontogramBtn');
                    if(deleteBtn) { deleteBtn.disabled = true; deleteBtn.title = "Apenas o examinador original ou admin podem excluir."; deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');}
                }
            }
            if (currentOdontogramData.odontogramImageBase64 && odontogramImagePreview && odontogramImageBase64Input) { // Para Base64
                odontogramImagePreview.src = currentOdontogramData.odontogramImageBase64;
                odontogramImagePreview.classList.remove('hidden');
                odontogramImageBase64Input.value = currentOdontogramData.odontogramImageBase64;
            }
            if (odontogramImageNotesInput) odontogramImageNotesInput.value = currentOdontogramData.odontogramImageNotes || '';

            if (generalObservationsTextarea) generalObservationsTextarea.value = currentOdontogramData.generalObservations || '';
            if (summaryForIdentificationTextarea) summaryForIdentificationTextarea.value = currentOdontogramData.summaryForIdentification || '';
            if (anteMortemDataSourcesTextarea) anteMortemDataSourcesTextarea.value = (currentOdontogramData.anteMortemDataSources || []).join(', ');
            if (currentOdontogramData.identificationConclusion) {
                if (identificationConclusionStatusSelect) identificationConclusionStatusSelect.value = currentOdontogramData.identificationConclusion.status || 'pendente';
                if (identificationConclusionJustificationTextarea) identificationConclusionJustificationTextarea.value = currentOdontogramData.identificationConclusion.justification || '';
            }
            initializeTeethInputs(currentOdontogramData.teeth || []);
            toggleComparisonSectionVisibility();
        } catch (error) { showError(`Erro ao carregar dados do odontograma: ${error.message}`);
        } finally { toggleLoading(false); }
    }

    async function handleFormSubmit(event) {
        // ... (Implementação de handleFormSubmit da resposta anterior, com Base64)
        event.preventDefault();
        toggleLoading(true); clearError();
        if (saveOdontogramBtn) { saveOdontogramBtn.disabled = true; saveOdontogramBtn.textContent = isEditMode ? 'Salvando...' : 'Salvando...';}

        const teethArray = [];
        fdiPermanentTeeth.forEach(fdi => {
            const statusEl = document.getElementById(`tooth_${fdi}_status`);
            const obsEl = document.getElementById(`tooth_${fdi}_observations`);
            if (statusEl) {
                const toothData = {
                    fdiNumber: fdi,
                    status: statusEl.value,
                    ...(obsEl && obsEl.value.trim() && { observations: obsEl.value.trim() })
                };
                teethArray.push(toothData);
            }
        });
        const payload = {
            victim: victimIdInput.value, case: caseIdInput.value,
            odontogramType: odontogramTypeSelect.value,
            examinationDate: examinationDateInput.value || null,
            examiner: examinerIdInput.value,
            odontogramImageBase64: odontogramImageBase64Input.value || undefined, // Usa Base64
            odontogramImageNotes: odontogramImageNotesInput.value.trim() || undefined,
            teeth: teethArray,
            generalObservations: generalObservationsTextarea.value.trim() || undefined,
            summaryForIdentification: summaryForIdentificationTextarea.value.trim() || undefined,
            anteMortemDataSources: anteMortemDataSourcesTextarea.value ? anteMortemDataSourcesTextarea.value.split(',').map(s => s.trim()).filter(s => s) : [],
            identificationConclusion: (comparisonSection && !comparisonSection.classList.contains('hidden') && identificationConclusionStatusSelect.value) ? {
                status: identificationConclusionStatusSelect.value,
                justification: identificationConclusionJustificationTextarea.value.trim() || undefined
            } : undefined
        };
        Object.keys(payload).forEach(key => { /* ... sua lógica de limpeza de payload ... */
            if (payload[key] === undefined) delete payload[key];
            else if (payload[key] && typeof payload[key] === 'object' && !(payload[key] instanceof Array)) {
                const isEmptyObject = Object.values(payload[key]).every(v => v === undefined || v === null || v === '');
                if (isEmptyObject) delete payload[key];
            }
        });
        if (payload.identificationConclusion && Object.values(payload.identificationConclusion).every(v => v === undefined || v === null || v === '')) {
            delete payload.identificationConclusion;
        }

        console.log("Payload Odontograma:", JSON.stringify(payload, null, 2));
        const url = isEditMode ? `${API_URL}/api/odontogram/${currentOdontogramId}` : `${API_URL}/api/odontogram`;
        const method = isEditMode ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || result.details || `Erro.`);
            alert(result.message || `Sucesso!`);
            const returnVictimId = victimIdInput.value || currentVictimId;
            const returnCaseId = caseIdInput.value || currentCaseId;
            const basePath = loggedInUser.role === 'admin' ? '../main/' : '';
            window.location.href = `${basePath}vitima-detalhes.html?id=${returnVictimId}&caseId=${returnCaseId}`;
        } catch (err) { showError(`Erro: ${err.message}`);
        } finally { if (saveOdontogramBtn) { saveOdontogramBtn.disabled = false; saveOdontogramBtn.textContent = isEditMode ? 'Salvar Alterações' : 'Salvar Novo';} toggleLoading(false); }
    }

    async function handleDeleteOdontogram() {
        // ... (Implementação de handleDeleteOdontogram da resposta anterior)
        if (!isEditMode || !currentOdontogramId) { /* ... */ return; }
        if (!confirm("Tem certeza?")) return;
        toggleLoading(true); clearError();
        const deleteButton = document.getElementById('deleteOdontogramBtn');
        if(deleteButton) deleteButton.disabled = true;
        try {
            const response = await fetch(`${API_URL}/api/odontogram/${currentOdontogramId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || result.message || "Erro ao excluir.");
            alert(result.message || "Excluído com sucesso.");
            const returnVictimId = victimIdInput.value || currentVictimId;
            const returnCaseId = caseIdInput.value || currentCaseId;
            const basePath = loggedInUser.role === 'admin' ? '../main/' : '';
            window.location.href = `${basePath}vitima-detalhes.html?id=${returnVictimId}&caseId=${returnCaseId}`;
        } catch (err) { showError(`Erro ao excluir: ${err.message}`); if(deleteButton) deleteButton.disabled = false;
        } finally { toggleLoading(false); }
    }

    function createDeleteButton() {
        if (document.getElementById('deleteOdontogramBtn') || !formActionButtons) return; 
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'deleteOdontogramBtn';
        button.className = 'px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md w-full sm:w-auto';
        button.textContent = 'Excluir Odontograma';
        button.addEventListener('click', handleDeleteOdontogram);
        // Adiciona antes do botão Cancelar se ele existir, senão ao final do container
        if (cancelOdontogramBtn) {
            formActionButtons.insertBefore(button, cancelOdontogramBtn);
        } else {
            formActionButtons.appendChild(button);
        }
    }

    function setupEventListeners() {
        if (odontogramForm) odontogramForm.addEventListener('submit', handleFormSubmit);
        if (initializeTeethButton) {
            initializeTeethButton.addEventListener('click', () => {
                let teethToInit = [];
                if (isEditMode && currentOdontogramData && currentOdontogramData.teeth) {
                    if (confirm("Recarregar os dados dos dentes com os valores originais deste odontograma? Quaisquer alterações não salvas nos campos dos dentes serão perdidas.")) {
                        teethToInit = currentOdontogramData.teeth;
                    } else { return; }
                } else if (teethEntriesContainer && teethEntriesContainer.children.length > 0) {
                     if (!confirm("Limpar todos os campos dos dentes e iniciar um novo registro?")) return;
                     // teethToInit já é []
                }
                initializeTeethInputs(teethToInit);
            });
        }
        if (odontogramTypeSelect) odontogramTypeSelect.addEventListener('change', toggleComparisonSectionVisibility);
        if (cancelOdontogramBtn) {
            cancelOdontogramBtn.addEventListener('click', () => {
                const returnVictimId = victimIdInput.value || currentVictimId;
                const returnCaseId = caseIdInput.value || currentCaseId;
                if (returnVictimId) {
                    const basePath = loggedInUser && loggedInUser.role === 'admin' ? '../main/' : '';
                    window.location.href = `${basePath}vitima-detalhes.html?id=${returnVictimId}&caseId=${returnCaseId || ''}`;
                } else {
                    const basePath = loggedInUser && loggedInUser.role === 'admin' ? '../components/' : '';
                    window.location.href = `${basePath}home.html`;
                }
            });
        }
        // Event listener para o input de arquivo de imagem
        if (odontogramImageFileInput) {
            odontogramImageFileInput.addEventListener('change', async function(event) {
                const file = event.target.files[0];
                if (file) {
                    try {
                        const base64String = await convertFileToBase64(file);
                        if (odontogramImagePreview) {
                            odontogramImagePreview.src = base64String;
                            odontogramImagePreview.classList.remove('hidden');
                        }
                        if (odontogramImageBase64Input) {
                            odontogramImageBase64Input.value = base64String;
                        }
                    } catch (error) {
                        console.error("Erro ao converter imagem:", error);
                        alert("Erro ao processar a imagem.");
                        if (odontogramImagePreview) { odontogramImagePreview.src = '#'; odontogramImagePreview.classList.add('hidden'); }
                        if (odontogramImageBase64Input) odontogramImageBase64Input.value = '';
                    }
                } else {
                    if (odontogramImagePreview) { odontogramImagePreview.src = '#'; odontogramImagePreview.classList.add('hidden'); }
                    if (odontogramImageBase64Input) odontogramImageBase64Input.value = '';
                }
            });
        }
    }

    // --- INICIAR A PÁGINA ---
    if (typeof jwt_decode === 'undefined') {
        console.error("Biblioteca jwt-decode não está carregada! Algumas funcionalidades podem falhar.");
        // Opcional: mostrar um erro mais visível ao usuário ou impedir o carregamento.
    }
    initializePage();
});