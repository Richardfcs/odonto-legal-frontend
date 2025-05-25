// ../js/cadastrarVitima.js

document.addEventListener('DOMContentLoaded', () => {
    const victimForm = document.getElementById('victimForm');
    const caseIdInput = document.getElementById('caseId'); // Input hidden
    const identificationStatusSelect = document.getElementById('identificationStatus');
    const nameFieldContainer = document.getElementById('nameFieldContainer');
    const nameInput = document.getElementById('name');
    const contactAddressSection = document.getElementById('contactAddressSection'); // Seção de contato/endereço

    const API_URL = 'https://odonto-legal-backend.onrender.com'; // Ou sua URL da API
    const token = localStorage.getItem('token');

    if (!token) {
        alert("Autenticação necessária. Você será redirecionado para o login.");
        window.location.href = '../index.html'; // Ajuste para sua página de login
        return;
    }

    // 1. Pegar o caseId da URL e preencher o input hidden
    const urlParams = new URLSearchParams(window.location.search);
    const caseIdFromUrl = urlParams.get('caseId');

    if (caseIdFromUrl) {
        caseIdInput.value = caseIdFromUrl;
    } else {
        alert("ID do caso não encontrado na URL. Não é possível cadastrar vítima.");
        // Desabilitar o formulário ou redirecionar
        victimForm.querySelector('button[type="submit"]').disabled = true;
        return;
    }

    // 2. Lógica para mostrar/ocultar campos com base no status de identificação
    function toggleConditionalFields() {
        const status = identificationStatusSelect.value;
        const isIdentified = status === 'identificada';
        const isPartiallyOrIdentified = status === 'identificada' || status === 'parcialmente_identificada';

        if (isPartiallyOrIdentified) {
            nameFieldContainer.classList.remove('hidden'); // Mostra o campo nome
            nameInput.required = true; // Torna obrigatório
            if (isIdentified && contactAddressSection) { // Mostra contato/endereço apenas se totalmente identificada
                contactAddressSection.classList.remove('hidden');
            } else if (contactAddressSection) {
                contactAddressSection.classList.add('hidden');
            }
        } else { // Não identificada ou em processo
            nameFieldContainer.classList.add('hidden');
            nameInput.required = false;
            nameInput.value = ''; // Limpa o nome
            if (contactAddressSection) {
                contactAddressSection.classList.add('hidden');
            }
        }
    }

    if (identificationStatusSelect) {
        identificationStatusSelect.addEventListener('change', toggleConditionalFields);
        toggleConditionalFields(); // Chama uma vez para o estado inicial
    }


    // 3. Event Listener para submissão do formulário
    if (victimForm) {
        victimForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = victimForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Cadastrando...';

            const formData = new FormData(victimForm);
            const payload = {
                case: formData.get('caseId'), // Pega do input hidden
                victimCode: formData.get('victimCode'),
                identificationStatus: formData.get('identificationStatus'),
                // Nome é pego apenas se o container não estiver oculto (ou se for obrigatório)
                name: nameInput.required ? formData.get('name') : (formData.get('identificationStatus') === 'nao_identificada' ? 'Desconhecida' : undefined),
                
                // Dados Demográficos
                ageAtDeath: formData.get('ageAtDeath') ? parseInt(formData.get('ageAtDeath')) : undefined,
                estimatedAgeRange: {
                    min: formData.get('estimatedAgeMin') ? parseInt(formData.get('estimatedAgeMin')) : undefined,
                    max: formData.get('estimatedAgeMax') ? parseInt(formData.get('estimatedAgeMax')) : undefined,
                },
                gender: formData.get('gender'),
                ethnicityRace: formData.get('ethnicityRace'),
                statureCm: formData.get('statureCm') ? parseFloat(formData.get('statureCm')) : undefined,
                bodyMassIndexCategory: formData.get('bodyMassIndexCategory'),

                // Contato e Endereço (coletar apenas se a seção estiver visível)
                contact: (contactAddressSection && !contactAddressSection.classList.contains('hidden')) ? {
                    telephone: formData.get('contactTelephone') || undefined,
                    email: formData.get('contactEmail') || undefined,
                } : undefined,
                lastKnownAddress: (contactAddressSection && !contactAddressSection.classList.contains('hidden')) ? {
                    street: formData.get('addressStreet') || undefined,
                    number: formData.get('addressNumber') || undefined,
                    complement: formData.get('addressComplement') || undefined,
                    neighborhood: formData.get('addressNeighborhood') || undefined,
                    city: formData.get('addressCity') || undefined,
                    state: formData.get('addressState') || undefined,
                    zipCode: formData.get('addressZipCode') || undefined,
                    // country: 'Brasil' (o modelo tem default, não precisa enviar se for Brasil)
                } : undefined,

                // Contexto da Descoberta / Morte
                dateOfDeath: formData.get('dateOfDeath') || undefined,
                timeOfDeath: formData.get('timeOfDeath') || undefined,
                dateOfDiscovery: formData.get('dateOfDiscovery') || undefined,
                timeOfDayDiscovery: formData.get('timeOfDayDiscovery'),
                discoveryLocation: {
                    description: formData.get('discoveryLocationDescription') || undefined,
                    type: formData.get('discoveryLocationType'),
                    municipality: formData.get('discoveryLocationMunicipality') || undefined,
                    state: formData.get('discoveryLocationState') || undefined,
                    // Coordenadas não estão no formulário de criação inicial
                },
                mannerOfDeath: formData.get('mannerOfDeath'),
                causeOfDeathPrimary: formData.get('causeOfDeathPrimary'),

                // Dados Odontolegais e Identificação Física
                dentalRecordStatus: formData.get('dentalRecordStatus'),
                dentalRecordSource: formData.get('dentalRecordSource') || undefined,
                // Transforma strings separadas por vírgula em arrays
                otherDistinctivePhysicalFeatures: formData.get('otherDistinctivePhysicalFeatures')
                    ? formData.get('otherDistinctivePhysicalFeatures').split(',').map(s => s.trim()).filter(s => s)
                    : [],
                skeletalFeatures: formData.get('skeletalFeatures')
                    ? formData.get('skeletalFeatures').split(',').map(s => s.trim()).filter(s => s)
                    : [],
                
                // Dados Forenses Adicionais
                postMortemIntervalEstimate: {
                    minHours: formData.get('postMortemMinHours') ? parseInt(formData.get('postMortemMinHours')) : undefined,
                    maxHours: formData.get('postMortemMaxHours') ? parseInt(formData.get('postMortemMaxHours')) : undefined,
                    estimationMethod: formData.get('postMortemEstimationMethod') || undefined,
                },
                toxicologyScreening: {
                    performed: formData.get('toxicologyPerformed') === 'true', // Converte string para boolean
                    resultsSummary: formData.get('toxicologyResultsSummary') || undefined,
                    // substancesDetected: [] // Adicionar na edição
                },
                dnaAnalysis: {
                    sampleCollected: formData.get('dnaSampleCollected') === 'true',
                    profileObtained: formData.get('dnaProfileObtained') === 'true',
                    comparisonResult: formData.get('dnaComparisonResult') || undefined,
                },
                fingerprintAnalysis: {
                    collected: formData.get('fingerprintCollected') === 'true',
                    quality: formData.get('fingerprintQuality') || undefined,
                    comparisonResult: formData.get('fingerprintComparisonResult') || undefined,
                },

                // Metadados
                photosUrls: formData.get('photosUrls')
                    ? formData.get('photosUrls').split(',').map(s => s.trim()).filter(s => s)
                    : [],
                additionalNotes: formData.get('additionalNotes') || undefined,
            };
            
            // Limpar propriedades que são objetos vazios ou apenas com undefined
            // (Exceto estimatedAgeRange que pode ter min/max parciais)
            ['contact', 'lastKnownAddress', 'discoveryLocation', 'postMortemIntervalEstimate', 'toxicologyScreening', 'dnaAnalysis', 'fingerprintAnalysis'].forEach(objKey => {
                if (payload[objKey] && Object.values(payload[objKey]).every(v => v === undefined || (Array.isArray(v) && v.length === 0))) {
                    // Se o objeto 'contact', por exemplo, for { telephone: undefined, email: undefined }, remove-o
                    // Isso ajuda a não enviar objetos como { min: undefined, max: undefined } se nada for preenchido.
                    // Mas cuidado com estimatedAgeRange se um dos min/max for válido e o outro não.
                    // Para estimatedAgeRange, é melhor enviar o objeto mesmo que parcial.
                    if (objKey !== 'estimatedAgeRange' || (payload[objKey].min === undefined && payload[objKey].max === undefined)) {
                         delete payload[objKey];
                    }
                }
            });
            // Ajuste fino para estimatedAgeRange: se ambos min e max são undefined, remove o objeto.
            if (payload.estimatedAgeRange && payload.estimatedAgeRange.min === undefined && payload.estimatedAgeRange.max === undefined) {
                delete payload.estimatedAgeRange;
            }


            console.log("Payload para criar vítima:", JSON.stringify(payload, null, 2)); // Para depuração

            try {
                const response = await fetch(`${API_URL}/api/victim`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                const role = localStorage.getItem("role");

                if (response.ok) {
                    alert(result.message || "Vítima cadastrada com sucesso!");
                    if (role === 'admin') {
                        window.location.href = `../components/pericia.html?id=${caseIdFromUrl}`;
                    } else {
                        // Redirecionar para a página de detalhes do caso ou da vítima
                        window.location.href = `pericia.html?id=${caseIdFromUrl}`; // Volta para detalhes do caso
                    }
                } else {
                    throw new Error(result.error || result.details || "Erro desconhecido ao cadastrar vítima.");
                }

            } catch (err) {
                console.error("Erro na requisição:", err);
                alert("Erro ao cadastrar vítima: " + err.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Cadastrar Vítima';
            }
        });
    }
});