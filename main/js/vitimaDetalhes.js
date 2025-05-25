document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://odonto-legal-backend.onrender.com'; // Ou sua URL da API
    const token = localStorage.getItem('token');

    // Elementos da UI para dados
    const victimDetailsContainer = document.getElementById('victimDetailsContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const caseLink = document.getElementById('caseLink');

    // Referências para todos os spans/divs que exibirão dados
    const elements = {
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
        otherDistinctivePhysicalFeatures: document.getElementById('otherDistinctivePhysicalFeatures'), // ul
        skeletalFeatures: document.getElementById('skeletalFeatures'), // ul
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
        photosUrls: document.getElementById('photosUrls'), // div
        additionalNotes: document.getElementById('additionalNotes'), // p
        createdBy: document.getElementById('createdBy'),
        createdAt: document.getElementById('createdAt'),
        lastUpdatedBy: document.getElementById('lastUpdatedBy'),
        updatedAt: document.getElementById('updatedAt')
    };

    // Referências para os contêineres de itens (para ocultar se o valor estiver vazio)
    const itemContainers = {
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
    
    // Referências para as seções inteiras
    const sections = {
        identificacao: document.getElementById('sectionIdentificacao'),
        demograficos: document.getElementById('sectionDemograficos'),
        contatoEndereco: document.getElementById('sectionContatoEndereco'),
        contexto: document.getElementById('sectionContexto'),
        odontolegal: document.getElementById('sectionOdontolegal'),
        forenses: document.getElementById('sectionForenses'),
        metadados: document.getElementById('sectionMetadados')
    };


    // Botões de Ação
    const victimActionButtons = document.getElementById('victimActionButtons');
    const editVictimBtn = document.getElementById('editVictimBtn');
    const deleteVictimBtn = document.getElementById('deleteVictimBtn');
    const manageOdontogramBtn = document.getElementById('manageOdontogramBtn');

    let currentVictimData = null; // Para armazenar os dados da vítima carregada
    let victimId, caseIdFromURL; // IDs da URL

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return 'Data inválida'; }
    }
    function formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return 'Data/Hora inválida'; }
    }

    // Função para preencher um campo e ocultar seu contêiner se o valor for nulo/vazio
    function populateField(elementKey, value, formatFn) {
        const element = elements[elementKey];
        const container = itemContainers[elementKey];

        if (element) {
            let displayValue = value;
            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                displayValue = 'N/A';
                if (container) container.classList.add('hidden'); // Oculta o item inteiro
            } else {
                if (formatFn) displayValue = formatFn(value);
                element.textContent = displayValue;
                if (container) container.classList.remove('hidden'); // Mostra o item
            }
        } else {
            console.warn(`Elemento com chave '${elementKey}' não encontrado no DOM.`);
        }
    }
    
    // Função para popular listas (ul)
    function populateList(elementKey, itemsArray) {
        const ulElement = elements[elementKey];
        const container = itemContainers[elementKey];
        if (ulElement) {
            ulElement.innerHTML = ''; // Limpa
            if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) {
                itemsArray.forEach(item => {
                    if(item && typeof item === 'string' && item.trim() !== ''){
                        const li = document.createElement('li');
                        li.textContent = item;
                        ulElement.appendChild(li);
                    }
                });
                if (ulElement.children.length > 0 && container) {
                     container.classList.remove('hidden');
                } else if (container) {
                     container.classList.add('hidden');
                }
            } else if (container) {
                container.classList.add('hidden');
            }
        }
    }


    async function loadVictimDetails() {
        if (!token) {
            alert("Autenticação necessária. Redirecionando para o login.");
            window.location.href = '../index.html'; // Ajuste
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        victimId = urlParams.get('id');
        caseIdFromURL = urlParams.get('caseId'); // Para o link de volta e permissões

        if (!victimId) {
            loadingMessage.textContent = "Erro: ID da vítima não fornecido na URL.";
            victimDetailsContainer.classList.remove('hidden'); // Mostrar container para exibir erro
            Object.values(sections).forEach(sec => sec.classList.add('hidden'));
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/victim/${victimId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `Erro ${response.status} ao buscar dados da vítima.`);
            }

            currentVictimData = await response.json();
            console.log("Dados da Vítima Carregados:", currentVictimData);

            if (!currentVictimData) {
                 throw new Error("Dados da vítima retornados são nulos ou inválidos.");
            }

            const role = localStorage.getItem("role");

            // Preencher link do caso
            if (caseLink) {
                if (currentVictimData.case && typeof currentVictimData.case === 'object' && currentVictimData.case._id && role === "admin") {
                    caseLink.textContent = currentVictimData.case.nameCase || `Caso ID: ${currentVictimData.case._id}`;
                    caseLink.href = `../components/pericia.html?id=${currentVictimData.case._id}`;
                } if (currentVictimData.case && typeof currentVictimData.case === 'object' && currentVictimData.case._id && role !== "admin") {
                    caseLink.textContent = currentVictimData.case.nameCase || `Caso ID: ${currentVictimData.case._id}`;
                    caseLink.href = `../components/pericia.html?id=${currentVictimData.case._id}`;
                }
                 else if (caseIdFromURL && role === "admin") { // Fallback para o caseId da URL se não vier populado
                    caseLink.textContent = currentVictimData.case.nameCase || `Caso ID: ${currentVictimData.case._id}`;
                    caseLink.href = `../components/pericia.html?id=${caseIdFromURL}`;
                }
                else if (caseIdFromURL && role !== "admin") { // Fallback para o caseId da URL se não vier populado
                    caseLink.textContent = currentVictimData.case.nameCase || `Caso ID: ${currentVictimData.case._id}`;
                    caseLink.href = `pericia.html?id=${caseIdFromURL}`;
                } else {
                    caseLink.textContent = "Caso não associado";
                    caseLink.href = "#";
                }
            }


            // Preencher campos
            populateField('victimCode', currentVictimData.victimCode);
            populateField('identificationStatus', currentVictimData.identificationStatus);
            populateField('name', currentVictimData.name);
            populateField('ageAtDeath', currentVictimData.ageAtDeath, (val) => val ? `${val} anos` : 'N/A');
            populateField('estimatedAgeRange', currentVictimData.estimatedAgeRange, (val) => 
                (val && val.min != null && val.max != null) ? `${val.min}-${val.max} anos` : 
                (val && val.min != null) ? `A partir de ${val.min} anos` :
                (val && val.max != null) ? `Até ${val.max} anos` : 'N/A'
            );
            populateField('gender', currentVictimData.gender);
            populateField('ethnicityRace', currentVictimData.ethnicityRace);
            populateField('statureCm', currentVictimData.statureCm, (val) => val ? `${val} cm` : 'N/A');
            populateField('bodyMassIndexCategory', currentVictimData.bodyMassIndexCategory);

            // Contato e Endereço (ocultar seção inteira se não houver dados de contato ou endereço)
            const hasContact = currentVictimData.contact && (currentVictimData.contact.telephone || currentVictimData.contact.email);
            const hasAddress = currentVictimData.lastKnownAddress && Object.values(currentVictimData.lastKnownAddress).some(v => v);
            if (hasContact || hasAddress) {
                if(sections.contatoEndereco) sections.contatoEndereco.classList.remove('hidden');
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
                 if(sections.contatoEndereco) sections.contatoEndereco.classList.add('hidden');
            }


            populateField('dateOfDeath', currentVictimData.dateOfDeath, formatDate);
            populateField('timeOfDeath', currentVictimData.timeOfDeath);
            populateField('dateOfDiscovery', currentVictimData.dateOfDiscovery, formatDate);
            populateField('timeOfDayDiscovery', currentVictimData.timeOfDayDiscovery);
            populateField('discoveryLocationType', currentVictimData.discoveryLocation?.type);
            populateField('discoveryLocationDescription', currentVictimData.discoveryLocation?.description);
            populateField('discoveryLocationMunicipality', currentVictimData.discoveryLocation?.municipality);
            populateField('discoveryLocationState', currentVictimData.discoveryLocation?.state);
            populateField('discoveryLocationCoordinates', currentVictimData.discoveryLocation?.coordinates?.coordinates, (coords) => 
                coords && coords.length === 2 ? `Lon: ${coords[0]}, Lat: ${coords[1]}` : 'N/A'
            );
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
            // toxicologyScreening.substancesDetected precisaria de uma lista

            populateField('dnaSampleCollected', currentVictimData.dnaAnalysis?.sampleCollected, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('dnaProfileObtained', currentVictimData.dnaAnalysis?.profileObtained, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('dnaComparisonResult', currentVictimData.dnaAnalysis?.comparisonResult);

            populateField('fingerprintCollected', currentVictimData.fingerprintAnalysis?.collected, (val) => val ? 'Sim' : (val === false ? 'Não' : 'N/A'));
            populateField('fingerprintQuality', currentVictimData.fingerprintAnalysis?.quality);
            populateField('fingerprintComparisonResult', currentVictimData.fingerprintAnalysis?.comparisonResult);
            
            // Fotos
            if (elements.photosUrls && currentVictimData.photosUrls && currentVictimData.photosUrls.length > 0) {
                elements.photosUrls.innerHTML = ''; // Limpa
                currentVictimData.photosUrls.forEach(url => {
                    if (url && typeof url === 'string' && url.trim() !== '') {
                        const img = document.createElement('img');
                        img.src = url;
                        img.alt = "Foto da Vítima";
                        img.className = "w-32 h-32 object-cover rounded mr-2 mb-2 inline-block"; // Exemplo de estilo
                        elements.photosUrls.appendChild(img);
                         // Ou links:
                        // const link = document.createElement('a');
                        // link.href = url; link.textContent = url; link.target = "_blank";
                        // link.className = "block text-blue-600 hover:underline";
                        // elements.photosUrls.appendChild(link);
                    }
                });
                 if (itemContainers.photosUrls && elements.photosUrls.children.length > 0) itemContainers.photosUrls.classList.remove('hidden');
                 else if (itemContainers.photosUrls) itemContainers.photosUrls.classList.add('hidden');
            } else if (itemContainers.photosUrls) {
                itemContainers.photosUrls.classList.add('hidden');
            }


            populateField('additionalNotes', currentVictimData.additionalNotes);
            populateField('createdBy', currentVictimData.createdBy?.name); // Assumindo que createdBy é populado com 'name'
            populateField('createdAt', currentVictimData.createdAt, formatDateTime);
            populateField('lastUpdatedBy', currentVictimData.lastUpdatedBy?.name); // Assumindo que lastUpdatedBy é populado
            populateField('updatedAt', currentVictimData.updatedAt, formatDateTime);


            // Mostrar seções que têm conteúdo visível
            Object.keys(sections).forEach(key => {
                const sectionElement = sections[key];
                if (sectionElement) {
                    // Verifica se a seção tem algum .detail-item que não está hidden OU algum .detail-value-list com filhos
                    const hasVisibleItems = Array.from(sectionElement.querySelectorAll('.detail-item'))
                                               .some(item => !item.classList.contains('hidden'));
                    const hasListItems = Array.from(sectionElement.querySelectorAll('.detail-value-list'))
                                              .some(ul => ul.children.length > 0);
                    if (hasVisibleItems || hasListItems) {
                        sectionElement.classList.remove('hidden');
                    } else {
                        sectionElement.classList.add('hidden');
                    }
                }
            });


            loadingMessage.classList.add('hidden');
            victimActionButtons.classList.remove('hidden');
            setupActionButtons(); // Configura os botões após carregar os dados

        } catch (error) {
            console.error("Erro ao carregar detalhes da vítima:", error);
            loadingMessage.textContent = `Erro ao carregar dados: ${error.message}`;
            loadingMessage.classList.remove('hidden'); // Garante que a mensagem de erro seja visível
            victimActionButtons.classList.add('hidden');
            Object.values(sections).forEach(sec => sec.classList.add('hidden'));
        }
    }

    function setupActionButtons() {
        if (!currentVictimData) return;

        // Lógica de permissão (simplificada - idealmente viria do backend ou token decodificado)
        // Aqui, estamos assumindo que o backend já filtrou o acesso à vítima em si.
        // Para editar/deletar, podemos ter uma checagem mais fina.
        // Por enquanto, vamos habilitar os botões.
        // Uma checagem real envolveria verificar se o usuário logado é ADM ou o perito responsável/membro da equipe do caso da vítima.
        // const userRole = jwt_decode(token).role; // Exemplo se você decodificar token
        // const isAllowedToModify = userRole === 'admin' || (currentVictimData.case && (currentVictimData.case.responsibleExpert === decodedToken.id || currentVictimData.case.team.includes(decodedToken.id)));


        if (editVictimBtn) {
            // editVictimBtn.disabled = !isAllowedToModify; // Lógica de permissão
            editVictimBtn.addEventListener('click', () => {
                if (victimId && caseIdFromURL) { // Garante que temos os IDs
                    // Navega para a página de edição, passando o ID da vítima e o ID do caso
                    window.location.href = `editar-vitima.html?id=${victimId}&caseId=${caseIdFromURL}`;
                } else if (victimId && currentVictimData && currentVictimData.case) {
                     // Fallback se caseIdFromURL não estiver disponível mas currentVictimData.case sim
                    window.location.href = `editar-vitima.html?id=${victimId}&caseId=${currentVictimData.case._id}`;
                }
                else {
                    alert("Não foi possível determinar o ID da vítima ou do caso para edição.");
                }
            });
        }

        if (deleteVictimBtn) {
            // deleteVictimBtn.disabled = !isAllowedToModify;
            deleteVictimBtn.addEventListener('click', async () => {
                if (confirm(`Tem certeza que deseja excluir a vítima "${currentVictimData.name || currentVictimData.victimCode}"? Esta ação não pode ser desfeita.`)) {
                    try {
                        const response = await fetch(`${API_URL}/api/victim/${victimId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        if (response.ok) {
                            alert(result.message || "Vítima excluída com sucesso.");
                            // Redirecionar para a página do caso ou lista de vítimas
                            window.location.href = `pericia.html?id=${caseIdFromURL || currentVictimData.case?._id}`;
                        } else {
                            throw new Error(result.error || result.message || "Erro ao excluir vítima.");
                        }
                    } catch (err) {
                        console.error("Erro ao deletar vítima:", err);
                        alert("Erro ao excluir vítima: " + err.message);
                    }
                }
            });
        }

        if (manageOdontogramBtn) {
            manageOdontogramBtn.addEventListener('click', () => {
                // Futuro: Levar para a página de odontograma
                alert(`Gerenciar Odontograma para Vítima ID: ${victimId} (funcionalidade a ser implementada).`);
                // window.location.href = `odontograma.html?victimId=${victimId}&caseId=${caseIdFromURL || currentVictimData.case?._id}`;
            });
        }
    }

    // Carregar os detalhes da vítima ao iniciar a página
    loadVictimDetails();
});