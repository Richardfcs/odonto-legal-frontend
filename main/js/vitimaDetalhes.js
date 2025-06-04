// ../js/vitimaDetalhes.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://odonto-legal-backend.onrender.com';
    const token = localStorage.getItem('token');
    let loggedInUserRole = null; 

    if (token && typeof jwt_decode === 'function') {
        try {
            loggedInUserRole = jwt_decode(token).role;
        } catch (e) { console.error("Erro ao decodificar token:", e); }
    } else if (token) { console.warn("jwt_decode não está disponível."); }

    // ... (Seu objeto 'elements' e 'itemContainers' e 'sections' como antes) ...
    const elements = { /* ... */ 
        victimCode: document.getElementById('victimCode'),
        identificationStatus: document.getElementById('identificationStatus'),
        name: document.getElementById('name'),
        ageAtDeath: document.getElementById('ageAtDeath'),
        estimatedAgeRange: document.getElementById('estimatedAgeRange'),
        gender: document.getElementById('gender'),
        ethnicityRace: document.getElementById('ethnicityRace'),
        statureCm: document.getElementById('statureCm'),
        bodyMassIndexCategory: document.getElementById('bodyMassIndexCategory'),
        contactTelephone: document.getElementById('contactTelephone'),
        contactEmail: document.getElementById('contactEmail'),
        addressStreet: document.getElementById('addressStreet'),
        addressNumber: document.getElementById('addressNumber'),
        addressComplement: document.getElementById('addressComplement'),
        addressNeighborhood: document.getElementById('addressNeighborhood'),
        addressCity: document.getElementById('addressCity'),
        addressState: document.getElementById('addressState'),
        addressZipCode: document.getElementById('addressZipCode'),
        addressCountry: document.getElementById('addressCountry'),
        dateOfDeath: document.getElementById('dateOfDeath'),
        timeOfDeath: document.getElementById('timeOfDeath'),
        dateOfDiscovery: document.getElementById('dateOfDiscovery'),
        timeOfDayDiscovery: document.getElementById('timeOfDayDiscovery'),
        discoveryLocationType: document.getElementById('discoveryLocationType'),
        discoveryLocationDescription: document.getElementById('discoveryLocationDescription'),
        discoveryLocationMunicipality: document.getElementById('discoveryLocationMunicipality'),
        discoveryLocationState: document.getElementById('discoveryLocationState'),
        discoveryLocationCoordinates: document.getElementById('discoveryLocationCoordinates'),
        mannerOfDeath: document.getElementById('mannerOfDeath'),
        causeOfDeathPrimary: document.getElementById('causeOfDeathPrimary'),
        dentalRecordStatus: document.getElementById('dentalRecordStatus'),
        dentalRecordSource: document.getElementById('dentalRecordSource'),
        otherDistinctivePhysicalFeatures: document.getElementById('otherDistinctivePhysicalFeatures'),
        skeletalFeatures: document.getElementById('skeletalFeatures'),
        odontogramStatus: document.getElementById('odontogramStatus'),
        postMortemMinHours: document.getElementById('postMortemMinHours'),
        postMortemMaxHours: document.getElementById('postMortemMaxHours'),
        postMortemEstimationMethod: document.getElementById('postMortemEstimationMethod'),
        toxicologyPerformed: document.getElementById('toxicologyPerformed'),
        toxicologyResultsSummary: document.getElementById('toxicologyResultsSummary'),
        dnaSampleCollected: document.getElementById('dnaSampleCollected'),
        dnaProfileObtained: document.getElementById('dnaProfileObtained'),
        dnaComparisonResult: document.getElementById('dnaComparisonResult'),
        fingerprintCollected: document.getElementById('fingerprintCollected'),
        fingerprintQuality: document.getElementById('fingerprintQuality'),
        fingerprintComparisonResult: document.getElementById('fingerprintComparisonResult'),
        photosUrls: document.getElementById('photosUrls'),
        additionalNotes: document.getElementById('additionalNotes'),
        createdBy: document.getElementById('createdBy'),
        createdAt: document.getElementById('createdAt'),
        lastUpdatedBy: document.getElementById('lastUpdatedBy'),
        updatedAt: document.getElementById('updatedAt')
    };
    const itemContainers = { /* ... seu objeto itemContainers ... */
        name: document.getElementById('itemName'),
        ageAtDeath: document.getElementById('itemAgeAtDeath'),
        estimatedAgeRange: document.getElementById('itemEstimatedAgeRange'),
        statureCm: document.getElementById('itemStatureCm'),
        contactTelephone: document.getElementById('itemContactTelephone'),
        contactEmail: document.getElementById('itemContactEmail'),
        addressStreet: document.getElementById('itemAddressStreet'),
        addressNumber: document.getElementById('itemAddressNumber'),
        addressComplement: document.getElementById('itemAddressComplement'),
        addressNeighborhood: document.getElementById('itemAddressNeighborhood'),
        addressCity: document.getElementById('itemAddressCity'),
        addressState: document.getElementById('itemAddressState'),
        addressZipCode: document.getElementById('itemAddressZipCode'),
        addressCountry: document.getElementById('itemAddressCountry'),
        dateOfDeath: document.getElementById('itemDateOfDeath'),
        timeOfDeath: document.getElementById('itemTimeOfDeath'),
        dateOfDiscovery: document.getElementById('itemDateOfDiscovery'),
        discoveryLocationDesc: document.getElementById('itemDiscoveryLocationDesc'),
        discoveryLocationMun: document.getElementById('itemDiscoveryLocationMun'),
        discoveryLocationState: document.getElementById('itemDiscoveryLocationState'),
        discoveryLocationCoords: document.getElementById('itemDiscoveryLocationCoords'),
        dentalRecordSource: document.getElementById('itemDentalRecordSource'),
        otherDistinctivePhysicalFeatures: document.getElementById('itemOtherDistinctivePhysicalFeatures'),
        skeletalFeatures: document.getElementById('itemSkeletalFeatures'),
        odontogramStatus: document.getElementById('itemOdontogramStatus'),
        postMortemMin: document.getElementById('itemPostMortemMin'),
        postMortemMax: document.getElementById('itemPostMortemMax'),
        postMortemMethod: document.getElementById('itemPostMortemMethod'),
        toxicologySummary: document.getElementById('itemToxicologySummary'),
        dnaComparison: document.getElementById('itemDnaComparison'),
        fingerprintQuality: document.getElementById('itemFingerprintQuality'),
        fingerprintComparison: document.getElementById('itemFingerprintComparison'),
        photosUrls: document.getElementById('itemPhotosUrls'),
        additionalNotes: document.getElementById('itemAdditionalNotes'),
        createdBy: document.getElementById('itemCreatedBy'),
        lastUpdatedBy: document.getElementById('itemLastUpdatedBy')
    };
    const sections = { /* ... seu objeto sections ... */
        identificacao: document.getElementById('sectionIdentificacao'),
        demograficos: document.getElementById('sectionDemograficos'),
        contatoEndereco: document.getElementById('sectionContatoEndereco'),
        contexto: document.getElementById('sectionContexto'),
        odontolegal: document.getElementById('sectionOdontolegal'),
        forenses: document.getElementById('sectionForenses'),
        metadados: document.getElementById('sectionMetadados')
    };

    const victimDetailsContainer = document.getElementById('victimDetailsContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const caseLink = document.getElementById('caseLink');
    const victimActionButtons = document.getElementById('victimActionButtons');
    const editVictimBtn = document.getElementById('editVictimBtn');
    const deleteVictimBtn = document.getElementById('deleteVictimBtn');
    const manageOdontogramBtn = document.getElementById('manageOdontogramBtn');
    const anteMortemOdontogramsListEl = document.getElementById('anteMortemOdontogramsList');
    const noAnteMortemMessageEl = document.getElementById('noAnteMortemMessage');
    const addAnteMortemOdontogramBtn = document.getElementById('addAnteMortemOdontogramBtn');

    let currentVictimData = null;
    let allOdontogramsForVictim = [];
    let victimId, caseIdFromURL;

    function formatDate(dateString) { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return 'Data inválida'; } }
    function formatDateTime(dateString) { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return 'Data/Hora inválida'; } }
    function populateField(elementKey, value, formatFn) { /* ... sua função ... */ 
        const element = elements[elementKey]; const container = itemContainers[elementKey];
        if (element) { let displayValue = value; if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) { displayValue = 'N/A'; if (container) container.classList.add('hidden'); } else { if (formatFn) displayValue = formatFn(value); element.textContent = displayValue; if (container) container.classList.remove('hidden'); }
        } else { /* console.warn(`Elemento ${elementKey} não encontrado.`); */ }
    }
    function populateList(elementKey, itemsArray) { /* ... sua função ... */ 
        const ulElement = elements[elementKey]; const container = itemContainers[elementKey];
        if (ulElement) { ulElement.innerHTML = ''; if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) { itemsArray.forEach(item => { if (item && typeof item === 'string' && item.trim() !== '') { const li = document.createElement('li'); li.textContent = item; ulElement.appendChild(li); } }); if (ulElement.children.length > 0 && container) container.classList.remove('hidden'); else if (container) container.classList.add('hidden');} else if (container) container.classList.add('hidden');
        } else { /* console.warn(`Elemento de lista ${elementKey} não encontrado.`); */ }
    }

    async function loadAllOdontogramsForVictim(vId) {
        if (!vId || !token) {
            allOdontogramsForVictim = []; // Garante que está resetado se não puder buscar
            return;
        }
        console.log(`Buscando todos os odontogramas para vítima ID: ${vId}`);
        try {
            const response = await fetch(`${API_URL}/api/odontogram/victim/${vId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errText = await response.text();
                console.error(`Erro ${response.status} ao buscar odontogramas da vítima ${vId}: ${errText}`);
                allOdontogramsForVictim = [];
                return;
            }
            const result = await response.json();
            allOdontogramsForVictim = Array.isArray(result) ? result : (result.odontograms || []);
            console.log("Odontogramas carregados para vítima:", allOdontogramsForVictim);
        } catch (error) {
            console.error("Erro na chamada para carregar todos odontogramas:", error);
            allOdontogramsForVictim = [];
        }
    }

    function displayOdontogramInfo() {
        console.log("displayOdontogramInfo chamada com:", allOdontogramsForVictim);
        const odontogramStatusEl = elements.odontogramStatus; // Span para o status do P.M.
        const itemOdontogramStatusEl = itemContainers.odontogramStatus; // Contêiner do item do P.M.

        const postMortemOdontogram = allOdontogramsForVictim.find(o => o.odontogramType === 'post_mortem');
        const anteMortemOdontograms = allOdontogramsForVictim.filter(o => o.odontogramType === 'ante_mortem_registro');

        console.log("Post-Mortem Encontrado:", postMortemOdontogram);
        console.log("Ante-Mortem Encontrados:", anteMortemOdontograms);

        // Status do Odontograma Post-Mortem Principal
        if (odontogramStatusEl && itemOdontogramStatusEl) {
            itemOdontogramStatusEl.classList.remove('hidden'); // Sempre mostrar o item container
            if (postMortemOdontogram && postMortemOdontogram._id) { // Verifica se o objeto e seu _id existem
                odontogramStatusEl.textContent = `Registrado em ${formatDate(postMortemOdontogram.examinationDate)}`;
                if (manageOdontogramBtn) manageOdontogramBtn.textContent = 'Ver/Editar Odontograma P.M.';
            } else {
                odontogramStatusEl.textContent = "Não registrado";
                if (manageOdontogramBtn) manageOdontogramBtn.textContent = 'Adicionar Odontograma P.M.';
            }
        } else {
            console.warn("Elementos para status do odontograma P.M. não encontrados.");
        }

        // Lista de Odontogramas Ante-Mortem
        if (anteMortemOdontogramsListEl && noAnteMortemMessageEl) {
            anteMortemOdontogramsListEl.innerHTML = ''; // Limpa
            if (anteMortemOdontograms.length > 0) {
                noAnteMortemMessageEl.classList.add('hidden');
                anteMortemOdontograms.forEach(am => {
                    if (!am || !am._id) return; // Pula se o objeto for inválido
                    const li = document.createElement('li');
                    li.className = 'p-2 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm';
                    li.innerHTML = `
                        <span>
                            Fonte: ${am.dentalRecordSource || 'Registro Ante-Mortem'} 
                            (Exame: ${formatDate(am.examinationDate)})
                            <em class="text-xs text-gray-500 ml-1">(ID: ${am._id.slice(-6)})</em>
                        </span>
                        <span class="text-xs text-blue-600 font-semibold">Ver/Editar</span>
                    `;
                    li.addEventListener('click', () => {
                        const caseIdForNav = currentVictimData?.case?._id || caseIdFromURL;
                        const basePath = loggedInUserRole === 'admin' ? '../main/' : '';
                        window.location.href = `${basePath}odontograma.html?victimId=${victimId}&caseId=${caseIdForNav}&odontogramId=${am._id}`;
                    });
                    anteMortemOdontogramsListEl.appendChild(li);
                });
            } else {
                noAnteMortemMessageEl.classList.remove('hidden');
            }
        } else {
            console.warn("Elementos para lista de odontogramas Ante-Mortem não encontrados.");
        }
    }

    async function loadVictimDetails() {
        if (!token) { /* ... login redirect ... */ return; }
        // ... (obtenção de victimId, caseIdFromURL) ...
        const urlParams = new URLSearchParams(window.location.search);
        victimId = urlParams.get('id');
        caseIdFromURL = urlParams.get('caseId');
        if (!victimId) { /* ... erro ... */ return; }
        if (loadingMessage) loadingMessage.classList.remove('hidden');

        try {
            const response = await fetch(`${API_URL}/api/victim/${victimId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // ... (tratamento de !response.ok) ...
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `Erro ${response.status}`);
            }
            currentVictimData = await response.json();
            if (!currentVictimData) { /* ... erro ... */ throw new Error("Dados nulos"); }
            
            console.log("Dados da Vítima Carregados (loadVictimDetails):", currentVictimData);

            // Preencher link do caso
            if (caseLink) { /* ... sua lógica de caseLink ... */ 
                const actualCaseId = currentVictimData.case?._id || caseIdFromURL;
                const caseName = currentVictimData.case?.nameCase;
                if (actualCaseId) {
                    caseLink.textContent = caseName || `Caso ID: ${actualCaseId}`;
                    const basePath = loggedInUserRole === 'admin' ? '../components/' : '';
                    caseLink.href = `${basePath}pericia.html?id=${actualCaseId}`;
                } else { caseLink.textContent = "Caso não associado"; caseLink.href = "#"; }
            }

            // Preencher campos da vítima
            // ... (SUAS CHAMADAS populateField e populateList COMPLETAS AQUI) ...
            populateField('victimCode', currentVictimData.victimCode);
            populateField('identificationStatus', currentVictimData.identificationStatus);
            populateField('name', currentVictimData.name);
            populateField('ageAtDeath', currentVictimData.ageAtDeath, (val) => val != null ? `${val} anos` : 'N/A');
            populateField('estimatedAgeRange', currentVictimData.estimatedAgeRange, (val) => (val && val.min != null && val.max != null) ? `${val.min}-${val.max} anos` : (val && val.min != null) ? `A partir de ${val.min} anos` : (val && val.max != null) ? `Até ${val.max} anos` : 'N/A');
            populateField('gender', currentVictimData.gender);
            populateField('ethnicityRace', currentVictimData.ethnicityRace);
            populateField('statureCm', currentVictimData.statureCm, (val) => val != null ? `${val} cm` : 'N/A');
            populateField('bodyMassIndexCategory', currentVictimData.bodyMassIndexCategory);

            const hasContact = currentVictimData.contact && (currentVictimData.contact.telephone || currentVictimData.contact.email);
            const hasAddress = currentVictimData.lastKnownAddress && Object.values(currentVictimData.lastKnownAddress).some(v => v && String(v).trim() !== '');
            if (sections.contatoEndereco) {
                if (hasContact || hasAddress) {
                    sections.contatoEndereco.classList.remove('hidden');
                    populateField('contactTelephone', currentVictimData.contact?.telephone);
                    populateField('contactEmail', currentVictimData.contact?.email);
                    populateField('addressStreet', currentVictimData.lastKnownAddress?.street);
                    populateField('addressNumber', currentVictimData.lastKnownAddress?.number);
                    populateField('addressComplement', currentVictimData.lastKnownAddress?.complement);
                    populateField('addressNeighborhood', currentVictimData.lastKnownAddress?.neighborhood);
                    populateField('addressCity', currentVictimData.lastKnownAddress?.city);
                    populateField('addressState', currentVictimData.lastKnownAddress?.state);
                    populateField('addressZipCode', currentVictimData.lastKnownAddress?.zipCode);
                    populateField('addressCountry', currentVictimData.lastKnownAddress?.country);
                } else {
                    sections.contatoEndereco.classList.add('hidden');
                }
            }
            
            populateField('dateOfDeath', currentVictimData.dateOfDeath, formatDate);
            populateField('timeOfDeath', currentVictimData.timeOfDeath);
            populateField('dateOfDiscovery', currentVictimData.dateOfDiscovery, formatDate);
            populateField('timeOfDayDiscovery', currentVictimData.timeOfDayDiscovery);
            populateField('discoveryLocationType', currentVictimData.discoveryLocation?.type);
            populateField('discoveryLocationDescription', currentVictimData.discoveryLocation?.description);
            populateField('discoveryLocationMunicipality', currentVictimData.discoveryLocation?.municipality);
            populateField('discoveryLocationState', currentVictimData.discoveryLocation?.state);
            populateField('discoveryLocationCoordinates', currentVictimData.discoveryLocation?.coordinates?.coordinates, (coords) => coords && coords.length === 2 ? `Lon: ${coords[0]}, Lat: ${coords[1]}` : 'N/A');
            populateField('mannerOfDeath', currentVictimData.mannerOfDeath);
            populateField('causeOfDeathPrimary', currentVictimData.causeOfDeathPrimary);
            populateField('dentalRecordStatus', currentVictimData.dentalRecordStatus);
            populateField('dentalRecordSource', currentVictimData.dentalRecordSource);
            populateList('otherDistinctivePhysicalFeatures', currentVictimData.otherDistinctivePhysicalFeatures);
            populateList('skeletalFeatures', currentVictimData.skeletalFeatures);            
            populateField('postMortemMinHours', currentVictimData.postMortemIntervalEstimate?.minHours);
            populateField('postMortemMaxHours', currentVictimData.postMortemIntervalEstimate?.maxHours);
            populateField('postMortemEstimationMethod', currentVictimData.postMortemIntervalEstimate?.estimationMethod);
            populateField('toxicologyPerformed', currentVictimData.toxicologyScreening?.performed, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('toxicologyResultsSummary', currentVictimData.toxicologyScreening?.resultsSummary);
            populateField('dnaSampleCollected', currentVictimData.dnaAnalysis?.sampleCollected, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('dnaProfileObtained', currentVictimData.dnaAnalysis?.profileObtained, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('dnaComparisonResult', currentVictimData.dnaAnalysis?.comparisonResult);
            populateField('fingerprintCollected', currentVictimData.fingerprintAnalysis?.collected, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('fingerprintQuality', currentVictimData.fingerprintAnalysis?.quality);
            populateField('fingerprintComparisonResult', currentVictimData.fingerprintAnalysis?.comparisonResult);

            if (elements.photosUrls && itemContainers.photosUrls) { 
                if (currentVictimData.photosUrls && currentVictimData.photosUrls.length > 0) {
                    elements.photosUrls.innerHTML = ''; 
                    currentVictimData.photosUrls.forEach(url => {
                        if (url && typeof url === 'string' && url.trim() !== '') {
                            const imgContainer = document.createElement('div'); imgContainer.className = 'inline-block mr-2 mb-2 p-1 border rounded';
                            const img = document.createElement('img'); img.src = url; img.alt = "Foto"; img.className = "w-32 h-32 object-cover rounded";
                            imgContainer.appendChild(img); elements.photosUrls.appendChild(imgContainer);
                        }
                    });
                    if (elements.photosUrls.children.length > 0) itemContainers.photosUrls.classList.remove('hidden');
                    else itemContainers.photosUrls.classList.add('hidden');
                } else { itemContainers.photosUrls.classList.add('hidden'); }
            }

            populateField('additionalNotes', currentVictimData.additionalNotes);
            populateField('createdBy', currentVictimData.createdBy?.name);
            populateField('createdAt', currentVictimData.createdAt, formatDateTime);
            populateField('lastUpdatedBy', currentVictimData.lastUpdatedBy?.name);
            populateField('updatedAt', currentVictimData.updatedAt, formatDateTime);


            // CRUCIAL: Carregar odontogramas DEPOIS que currentVictimData está definido
            await loadAllOdontogramsForVictim(victimId);
            displayOdontogramInfo(); // AGORA displayOdontogramInfo usará allOdontogramsForVictim populado


            // Mostrar seções que têm conteúdo visível
            Object.keys(sections).forEach(key => { /* ... sua lógica de mostrar seções ... */ 
                 const sectionElement = sections[key];
                if (sectionElement) {
                    const hasVisibleItems = Array.from(sectionElement.querySelectorAll('.detail-item:not(.hidden) .detail-value')).some(el => el.textContent !== 'N/A' && el.textContent.trim() !== '');
                    const hasListItems = Array.from(sectionElement.querySelectorAll('.detail-value-list')).some(ul => ul.children.length > 0);
                    if (hasVisibleItems || hasListItems) sectionElement.classList.remove('hidden');
                    else sectionElement.classList.add('hidden');
                }
            });

            if (loadingMessage) loadingMessage.classList.add('hidden');
            if (victimActionButtons) victimActionButtons.classList.remove('hidden');
            setupActionButtons();

        } catch (error) { /* ... seu tratamento de erro ... */ 
            console.error("Erro ao carregar detalhes da vítima:", error);
            if (loadingMessage) { loadingMessage.textContent = `Erro: ${error.message}`; loadingMessage.classList.remove('hidden');}
            if (victimActionButtons) victimActionButtons.classList.add('hidden');
            Object.values(sections).forEach(sec => {if(sec) sec.classList.add('hidden');});
        }
    }

    function setupActionButtons() {
        // ... (sua função setupActionButtons existente, incluindo a lógica para manageOdontogramBtn e addAnteMortemOdontogramBtn)
        if (!currentVictimData) return;
        const canModify = true; // Placeholder

        if (editVictimBtn) {
            editVictimBtn.disabled = !canModify;
            editVictimBtn.addEventListener('click', () => { 
                const caseIdForNav = currentVictimData.case?._id || caseIdFromURL;
                if (victimId && caseIdForNav) {
                    const basePath = loggedInUserRole === 'admin' ? '../main/' : '';
                    window.location.href = `${basePath}editar-vitima.html?id=${victimId}&caseId=${caseIdForNav}`;
                } else { alert("Não foi possível determinar IDs para edição."); }
            });
        }

        if (deleteVictimBtn) {
            deleteVictimBtn.disabled = !canModify;
            deleteVictimBtn.addEventListener('click', async () => { 
                 if (confirm(`Excluir vítima "${currentVictimData.name || currentVictimData.victimCode}"?`)) {
                    try { /* ... delete fetch ... */ 
                        const response = await fetch(`${API_URL}/api/victim/${victimId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                        const result = await response.json();
                        if (response.ok) {
                            alert(result.message || "Vítima excluída.");
                            const caseIdToReturn = currentVictimData.case?._id || caseIdFromURL;
                            const basePath = loggedInUserRole === 'admin' ? '../components/' : '';
                            if (caseIdToReturn) window.location.href = `${basePath}pericia.html?id=${caseIdToReturn}`;
                            else window.location.href = `${basePath}home.html`;
                        } else { throw new Error(result.error || result.message || "Erro ao excluir."); }
                    } catch (err) { console.error("Erro ao deletar:", err); alert("Erro: " + err.message); }
                }
            });
        }
        
        // Botão para Odontograma Post-Mortem Principal
        if (manageOdontogramBtn) {
            manageOdontogramBtn.addEventListener('click', () => {
                if (!victimId) { alert("ID da vítima não disponível."); return; }
                const caseIdForNav = currentVictimData.case?._id || caseIdFromURL;
                let odontogramPageUrl = `odontograma.html?victimId=${victimId}`;
                if (caseIdForNav) odontogramPageUrl += `&caseId=${caseIdForNav}`;
                
                const postMortemOdontogram = allOdontogramsForVictim.find(o => o.odontogramType === 'post_mortem');
                if (postMortemOdontogram) {
                    odontogramPageUrl += `&odontogramId=${postMortemOdontogram._id}`;
                } else {
                    odontogramPageUrl += `&type=post_mortem`;
                }
                const basePath = loggedInUserRole === 'admin' ? '../main/' : '';
                window.location.href = basePath + odontogramPageUrl;
            });
        }

        // Botão para Adicionar Novo Registro Ante-Mortem
        if (addAnteMortemOdontogramBtn) {
            addAnteMortemOdontogramBtn.addEventListener('click', () => {
                if (!victimId) { alert("ID da vítima não disponível."); return; }
                const caseIdForNav = currentVictimData.case?._id || caseIdFromURL;
                let createAnteMortemUrl = `odontograma.html?victimId=${victimId}`;
                if (caseIdForNav) createAnteMortemUrl += `&caseId=${caseIdForNav}`;
                createAnteMortemUrl += `&type=ante_mortem_registro`;
                
                const basePath = loggedInUserRole === 'admin' ? '../main/' : '';
                window.location.href = basePath + createAnteMortemUrl;
            });
        }
    }
    
    if (typeof jwt_decode !== 'function') {
        console.error("Biblioteca jwt-decode não carregada!");
    }

    loadVictimDetails();
});