// ../js/editarVitima.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://odonto-legal-backend.onrender.com'; // Ou sua URL da API
    const token = localStorage.getItem('token');

    const editVictimForm = document.getElementById('editVictimForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const errorMessageElement = document.getElementById('errorMessage');
    const backToCaseLink = document.getElementById('backToCaseLink');
    const cancelEditVictimBtn = document.getElementById('cancelEditVictimBtn');

    // Inputs do formulário (pegue todos os IDs do seu HTML editar-vitima.html)
    const caseIdInput = document.getElementById('caseId');
    const victimIdInput = document.getElementById('victimId'); // Para guardar o ID da vítima sendo editada
    const victimCodeInput = document.getElementById('victimCode');
    const identificationStatusSelect = document.getElementById('identificationStatus');
    const nameFieldContainer = document.getElementById('nameFieldContainer');
    const nameInput = document.getElementById('name');
    const contactAddressSection = document.getElementById('contactAddressSection');

    // Demográficos
    const ageAtDeathInput = document.getElementById('ageAtDeath');
    const estimatedAgeMinInput = document.getElementById('estimatedAgeMin');
    const estimatedAgeMaxInput = document.getElementById('estimatedAgeMax');
    const genderSelect = document.getElementById('gender');
    const ethnicityRaceSelect = document.getElementById('ethnicityRace');
    const statureCmInput = document.getElementById('statureCm');
    const bodyMassIndexCategorySelect = document.getElementById('bodyMassIndexCategory');

    // Contato (dentro de contactAddressSection)
    const contactTelephoneInput = document.getElementById('contactTelephone');
    const contactEmailInput = document.getElementById('contactEmail');

    // Endereço (dentro de contactAddressSection)
    const addressStreetInput = document.getElementById('addressStreet');
    const addressNumberInput = document.getElementById('addressNumber');
    const addressComplementInput = document.getElementById('addressComplement');
    const addressNeighborhoodInput = document.getElementById('addressNeighborhood');
    const addressCityInput = document.getElementById('addressCity');
    const addressStateInput = document.getElementById('addressState');
    const addressZipCodeInput = document.getElementById('addressZipCode');
    // addressCountry não está no form, assume Brasil ou pode ser adicionado

    // Contexto Descoberta/Morte
    const dateOfDeathInput = document.getElementById('dateOfDeath');
    const timeOfDeathInput = document.getElementById('timeOfDeath');
    const dateOfDiscoveryInput = document.getElementById('dateOfDiscovery');
    const timeOfDayDiscoverySelect = document.getElementById('timeOfDayDiscovery');
    const discoveryLocationTypeSelect = document.getElementById('discoveryLocationType');
    const discoveryLocationDescriptionInput = document.getElementById('discoveryLocationDescription');
    const discoveryLocationMunicipalityInput = document.getElementById('discoveryLocationMunicipality');
    const discoveryLocationStateInput = document.getElementById('discoveryLocationState');
    const mannerOfDeathSelect = document.getElementById('mannerOfDeath');
    const causeOfDeathPrimarySelect = document.getElementById('causeOfDeathPrimary');

    // Odontolegais e Identificação Física
    const dentalRecordStatusSelect = document.getElementById('dentalRecordStatus');
    const dentalRecordSourceInput = document.getElementById('dentalRecordSource');
    const otherDistinctivePhysicalFeaturesTextarea = document.getElementById('otherDistinctivePhysicalFeatures');
    const skeletalFeaturesTextarea = document.getElementById('skeletalFeatures');

    // Forenses Adicionais
    const postMortemMinHoursInput = document.getElementById('postMortemMinHours');
    const postMortemMaxHoursInput = document.getElementById('postMortemMaxHours');
    const postMortemEstimationMethodInput = document.getElementById('postMortemEstimationMethod');
    const toxicologyPerformedSelect = document.getElementById('toxicologyPerformed');
    const toxicologyResultsSummaryInput = document.getElementById('toxicologyResultsSummary');
    const dnaSampleCollectedSelect = document.getElementById('dnaSampleCollected');
    const dnaProfileObtainedSelect = document.getElementById('dnaProfileObtained');
    const dnaComparisonResultInput = document.getElementById('dnaComparisonResult');
    const fingerprintCollectedSelect = document.getElementById('fingerprintCollected');
    const fingerprintQualitySelect = document.getElementById('fingerprintQuality');
    const fingerprintComparisonResultInput = document.getElementById('fingerprintComparisonResult');
    
    // Metadados
    const photosUrlsTextarea = document.getElementById('photosUrls');
    const additionalNotesTextarea = document.getElementById('additionalNotes');


    let currentVictimId = null;
    let currentCaseIdForNav = null; // Para navegação de volta

    if (!token) {
        showError("Autenticação necessária. Você será redirecionado para o login.");
        setTimeout(() => window.location.href = '../index.html', 3000);
        return;
    }

    // Função para mostrar/ocultar overlay de carregamento
    function toggleLoading(isLoading) {
        if (isLoading) {
            loadingOverlay.classList.remove('hidden');
            editVictimForm.classList.add('hidden'); // Oculta formulário durante carregamento
        } else {
            loadingOverlay.classList.add('hidden');
            editVictimForm.classList.remove('hidden'); // Mostra formulário após carregar
        }
    }

    function showError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.classList.remove('hidden');
        loadingOverlay.classList.add('hidden');
        editVictimForm.classList.add('hidden');
    }
    function clearError() {
        errorMessageElement.textContent = '';
        errorMessageElement.classList.add('hidden');
    }


    // Lógica para mostrar/ocultar campos com base no status de identificação
    function toggleConditionalFieldsForEdit() {
        const status = identificationStatusSelect.value;
        const isIdentified = status === 'identificada';
        const isPartiallyOrIdentified = status === 'identificada' || status === 'parcialmente_identificada';

        if (nameFieldContainer) { // Verifica se o container existe
            if (isPartiallyOrIdentified) {
                nameFieldContainer.classList.remove('hidden');
                nameInput.required = true;
            } else {
                nameFieldContainer.classList.add('hidden');
                nameInput.required = false;
                // Não limpar o valor aqui, pois estamos pré-preenchendo. A lógica de payload cuidará disso.
            }
        }
        if (contactAddressSection) { // Verifica se a seção existe
            if (isIdentified) {
                contactAddressSection.classList.remove('hidden');
            } else {
                contactAddressSection.classList.add('hidden');
            }
        }
    }


    async function loadVictimDataForEdit() {
        toggleLoading(true);
        clearError();
        const urlParams = new URLSearchParams(window.location.search);
        currentVictimId = urlParams.get('id');
        currentCaseIdForNav = urlParams.get('caseId'); // Pega o caseId para o link de volta
        const role = localStorage.getItem("role");

        victimIdInput.value = currentVictimId; // Guarda o victimId no form (embora não seja enviado no corpo do PUT)
        if (currentCaseIdForNav) {
            caseIdInput.value = currentCaseIdForNav; // Guarda para o caso de precisar
            if (backToCaseLink && role === 'admin') backToCaseLink.href = `../components/pericia.html?id=${currentCaseIdForNav}`;
            else backToCaseLink.href = `pericia.html?id=${currentCaseIdForNav}`;
        } else {
            if (backToCaseLink) backToCaseLink.classList.add('hidden'); // Oculta se não tiver caseId
        }


        if (!currentVictimId) {
            showError("ID da vítima não fornecido na URL.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/victim/${currentVictimId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || `Erro ${response.status} ao buscar dados da vítima.`);
            }

            const victimData = await response.json();
            if (!victimData) throw new Error("Dados da vítima não encontrados ou inválidos.");

            // Preencher o formulário
            victimCodeInput.value = victimData.victimCode || '';
            identificationStatusSelect.value = victimData.identificationStatus || 'nao_identificada';
            nameInput.value = victimData.name || '';
            
            ageAtDeathInput.value = victimData.ageAtDeath ?? '';
            estimatedAgeMinInput.value = victimData.estimatedAgeRange?.min ?? '';
            estimatedAgeMaxInput.value = victimData.estimatedAgeRange?.max ?? '';
            genderSelect.value = victimData.gender || 'desconhecido';
            ethnicityRaceSelect.value = victimData.ethnicityRace || 'desconhecida';
            statureCmInput.value = victimData.statureCm ?? '';
            bodyMassIndexCategorySelect.value = victimData.bodyMassIndexCategory || 'desconhecido';

            contactTelephoneInput.value = victimData.contact?.telephone || '';
            contactEmailInput.value = victimData.contact?.email || '';
            addressStreetInput.value = victimData.lastKnownAddress?.street || '';
            addressNumberInput.value = victimData.lastKnownAddress?.number || '';
            addressComplementInput.value = victimData.lastKnownAddress?.complement || '';
            addressNeighborhoodInput.value = victimData.lastKnownAddress?.neighborhood || '';
            addressCityInput.value = victimData.lastKnownAddress?.city || '';
            addressStateInput.value = victimData.lastKnownAddress?.state || '';
            addressZipCodeInput.value = victimData.lastKnownAddress?.zipCode || '';
            // addressCountryInput.value = victimData.lastKnownAddress?.country || 'Brasil';

            dateOfDeathInput.value = victimData.dateOfDeath ? new Date(victimData.dateOfDeath).toISOString().split('T')[0] : '';
            timeOfDeathInput.value = victimData.timeOfDeath || '';
            dateOfDiscoveryInput.value = victimData.dateOfDiscovery ? new Date(victimData.dateOfDiscovery).toISOString().split('T')[0] : '';
            timeOfDayDiscoverySelect.value = victimData.timeOfDayDiscovery || 'desconhecido';
            discoveryLocationTypeSelect.value = victimData.discoveryLocation?.type || 'desconhecido';
            discoveryLocationDescriptionInput.value = victimData.discoveryLocation?.description || '';
            discoveryLocationMunicipalityInput.value = victimData.discoveryLocation?.municipality || '';
            discoveryLocationStateInput.value = victimData.discoveryLocation?.state || '';
            // Coordenadas precisariam de inputs separados para longitude/latitude se editáveis aqui

            mannerOfDeathSelect.value = victimData.mannerOfDeath || 'pendente_de_investigacao';
            causeOfDeathPrimarySelect.value = victimData.causeOfDeathPrimary || 'indeterminada_medicamente';

            dentalRecordStatusSelect.value = victimData.dentalRecordStatus || 'desconhecido';
            dentalRecordSourceInput.value = victimData.dentalRecordSource || '';
            otherDistinctivePhysicalFeaturesTextarea.value = (victimData.otherDistinctivePhysicalFeatures || []).join(', ');
            skeletalFeaturesTextarea.value = (victimData.skeletalFeatures || []).join(', ');

            postMortemMinHoursInput.value = victimData.postMortemIntervalEstimate?.minHours ?? '';
            postMortemMaxHoursInput.value = victimData.postMortemIntervalEstimate?.maxHours ?? '';
            postMortemEstimationMethodInput.value = victimData.postMortemIntervalEstimate?.estimationMethod || '';
            
            toxicologyPerformedSelect.value = victimData.toxicologyScreening?.performed?.toString() || 'false'; // Selects de boolean
            toxicologyResultsSummaryInput.value = victimData.toxicologyScreening?.resultsSummary || '';
            
            dnaSampleCollectedSelect.value = victimData.dnaAnalysis?.sampleCollected?.toString() || 'false';
            dnaProfileObtainedSelect.value = victimData.dnaAnalysis?.profileObtained?.toString() || 'false';
            dnaComparisonResultInput.value = victimData.dnaAnalysis?.comparisonResult || '';

            fingerprintCollectedSelect.value = victimData.fingerprintAnalysis?.collected?.toString() || 'false';
            fingerprintQualitySelect.value = victimData.fingerprintAnalysis?.quality || '';
            fingerprintComparisonResultInput.value = victimData.fingerprintAnalysis?.comparisonResult || '';

            photosUrlsTextarea.value = (victimData.photosUrls || []).join(', ');
            additionalNotesTextarea.value = victimData.additionalNotes || '';

            toggleConditionalFieldsForEdit(); // Aplica visibilidade inicial
            toggleLoading(false);

        } catch (error) {
            console.error("Erro ao carregar dados da vítima para edição:", error);
            showError("Erro ao carregar dados da vítima: " + error.message);
        }
    }

    if (identificationStatusSelect) {
        identificationStatusSelect.addEventListener('change', toggleConditionalFieldsForEdit);
    }

    if (editVictimForm) {
        editVictimForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = editVictimForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
            clearError();

            const formData = new FormData(editVictimForm);
            const payload = {
                // Não enviamos caseId ou victimCode no corpo de um PUT para esses campos
                identificationStatus: formData.get('identificationStatus'),
                name: nameInput.required ? formData.get('name') : (formData.get('identificationStatus') === 'nao_identificada' ? 'Desconhecida' : undefined),

                ageAtDeath: formData.get('ageAtDeath') ? parseInt(formData.get('ageAtDeath')) : null, // Enviar null se vazio para limpar
                estimatedAgeRange: {
                    min: formData.get('estimatedAgeMin') ? parseInt(formData.get('estimatedAgeMin')) : null,
                    max: formData.get('estimatedAgeMax') ? parseInt(formData.get('estimatedAgeMax')) : null,
                },
                gender: formData.get('gender'),
                ethnicityRace: formData.get('ethnicityRace'),
                statureCm: formData.get('statureCm') ? parseFloat(formData.get('statureCm')) : null,
                bodyMassIndexCategory: formData.get('bodyMassIndexCategory'),

                contact: {
                    telephone: formData.get('contactTelephone') || null,
                    email: formData.get('contactEmail') || null,
                },
                lastKnownAddress: {
                    street: formData.get('addressStreet') || null,
                    number: formData.get('addressNumber') || null,
                    complement: formData.get('addressComplement') || null,
                    neighborhood: formData.get('addressNeighborhood') || null,
                    city: formData.get('addressCity') || null,
                    state: formData.get('addressState') || null,
                    zipCode: formData.get('addressZipCode') || null,
                },
                dateOfDeath: formData.get('dateOfDeath') || null,
                timeOfDeath: formData.get('timeOfDeath') || null,
                dateOfDiscovery: formData.get('dateOfDiscovery') || null,
                timeOfDayDiscovery: formData.get('timeOfDayDiscovery'),
                discoveryLocation: {
                    description: formData.get('discoveryLocationDescription') || null,
                    type: formData.get('discoveryLocationType'),
                    municipality: formData.get('discoveryLocationMunicipality') || null,
                    state: formData.get('discoveryLocationState') || null,
                },
                mannerOfDeath: formData.get('mannerOfDeath'),
                causeOfDeathPrimary: formData.get('causeOfDeathPrimary'),
                dentalRecordStatus: formData.get('dentalRecordStatus'),
                dentalRecordSource: formData.get('dentalRecordSource') || null,
                otherDistinctivePhysicalFeatures: formData.get('otherDistinctivePhysicalFeatures') ? formData.get('otherDistinctivePhysicalFeatures').split(',').map(s => s.trim()).filter(s => s) : [],
                skeletalFeatures: formData.get('skeletalFeatures') ? formData.get('skeletalFeatures').split(',').map(s => s.trim()).filter(s => s) : [],
                postMortemIntervalEstimate: {
                    minHours: formData.get('postMortemMinHours') ? parseInt(formData.get('postMortemMinHours')) : null,
                    maxHours: formData.get('postMortemMaxHours') ? parseInt(formData.get('postMortemMaxHours')) : null,
                    estimationMethod: formData.get('postMortemEstimationMethod') || null,
                },
                toxicologyScreening: {
                    performed: formData.get('toxicologyPerformed') === 'true',
                    resultsSummary: formData.get('toxicologyResultsSummary') || null,
                },
                dnaAnalysis: {
                    sampleCollected: formData.get('dnaSampleCollected') === 'true',
                    profileObtained: formData.get('dnaProfileObtained') === 'true',
                    comparisonResult: formData.get('dnaComparisonResult') || null,
                },
                fingerprintAnalysis: {
                    collected: formData.get('fingerprintCollected') === 'true',
                    quality: formData.get('fingerprintQuality') || null,
                    comparisonResult: formData.get('fingerprintComparisonResult') || null,
                },
                photosUrls: formData.get('photosUrls') ? formData.get('photosUrls').split(',').map(s => s.trim()).filter(s => s) : [],
                additionalNotes: formData.get('additionalNotes') || null,
            };
            
            // Limpeza de payload para objetos que podem ter todos os campos nulos/undefined
             Object.keys(payload).forEach(key => {
                if (payload[key] && typeof payload[key] === 'object' && !(payload[key] instanceof Array)) {
                    // Se for um objeto (não array) e todos os seus valores são null, undefined ou string vazia
                    // ou se for estimatedAgeRange e ambos min/max são null
                    const isEmptyObject = Object.values(payload[key]).every(v => v === null || v === undefined || v === '');
                    if (isEmptyObject) {
                        if (key === 'estimatedAgeRange' && (payload[key].min !== null || payload[key].max !== null)) {
                            // Não deletar se pelo menos um de min/max estiver preenchido para estimatedAgeRange
                        } else if (key !== 'estimatedAgeRange') {
                             payload[key] = undefined; // ou delete payload[key];
                        }
                         if (key === 'estimatedAgeRange' && payload[key].min === null && payload[key].max === null) {
                             payload[key] = undefined;
                         }
                    }
                } else if (payload[key] === undefined || payload[key] === '') {
                     payload[key] = null; // Para campos de string vazios, enviar null para o backend para possível remoção/limpeza
                }
            });


            console.log("Payload para ATUALIZAR vítima:", JSON.stringify(payload, null, 2));

            try {
                const response = await fetch(`${API_URL}/api/victim/${currentVictimId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (response.ok) {
                    alert(result.message || "Vítima atualizada com sucesso!");
                    // Redirecionar para a página de detalhes da vítima
                    window.location.href = `vitima-detalhes.html?id=${currentVictimId}&caseId=${caseIdInput.value}`;
                } else {
                    throw new Error(result.error || result.details || "Erro desconhecido ao atualizar vítima.");
                }
            } catch (err) {
                console.error("Erro na requisição de atualização:", err);
                errorMessageElement.textContent = "Erro ao salvar alterações: " + err.message;
                errorMessageElement.classList.remove('hidden');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Alterações';
            }
        });
    }

    if (cancelEditVictimBtn) {
        cancelEditVictimBtn.addEventListener('click', () => {
            if (currentVictimId && (caseIdInput.value || currentCaseIdForNav)) {
                window.location.href = `vitima-detalhes.html?id=${currentVictimId}&caseId=${caseIdInput.value || currentCaseIdForNav}`;
            } else {
                // Fallback se não tiver IDs, talvez voltar para a lista de casos
                window.location.href = 'home.html';
            }
        });
    }

    // Carregar dados da vítima ao iniciar
    loadVictimDataForEdit();
});