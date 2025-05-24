let charts = {};
const API_BASE = 'https://odonto-legal-backend.onrender.com/api/dashboard';

let victimChartInstance = null;
let victimsTimelineChartInstance = null; // Para o gráfico de timeline de vítimas
let currentVictimView = 'identificationStatus'; // Vista padrão para o gráfico principal de vítimas

// Controle das abas
function showDashboard(dashboardId, event) {
    // Remove todas as classes ativas
    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-button').forEach(el => el.classList.remove('active'));

    // Ativa a seção correspondente
    const dashboardElement = document.getElementById(`${dashboardId}Dashboard`);
    if (dashboardElement) {
        dashboardElement.classList.add('active');
    }

    // Ativa o botão clicado
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback para inicialização
        const activeButton = document.querySelector(`.nav-button[onclick*="${dashboardId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
    if (dashboardId === 'victims') {
        populateVictimViewToggle();
    }

    loadDashboardData(dashboardId);
}

// Carregamento de dados
async function loadDashboardData(dashboardId) {
    // Determina qual filtro de período usar com base no dashboardId
    let periodFilterId;
    if (dashboardId === 'main') periodFilterId = 'mainFilter';
    else if (dashboardId === 'cases') periodFilterId = 'caseTimeFilter';
    else if (dashboardId === 'victims') periodFilterId = 'victimTimeFilter';
    else if (dashboardId === 'users') periodFilterId = 'userTimeFilter';
    else if (dashboardId === 'locations') periodFilterId = 'locationTimeFilter';
    // 'activity' não usa filtro de período da mesma forma

    const periodElement = document.getElementById(periodFilterId);
    const period = periodElement ? periodElement.value : 'all';

    switch (dashboardId) {
        case 'main':
            await loadMainData(period);
            break;
        case 'cases':
            // 'period' já está sendo pego dentro de loadCaseData
            await loadCaseData();
            break;
        case 'victims': // Adicionado
            await loadVictimData(); // Nova função a ser criada
            break;
        case 'users':
            await loadUserData();
            break;
        case 'locations':
            await loadLocationData();
            break;
        case 'activity':
            await loadActivityData();
            break;
    }
}

// Implementações específicas de cada dashboard
async function loadMainData(period) {
    const token = localStorage.getItem('token');
    try {
        const [mainRes, timelineRes] = await Promise.all([
            fetch(`${API_BASE}/main-stats?period=${period}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(`${API_BASE}/cases-timeline?period=${period}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        if (!mainRes.ok || !timelineRes.ok) {
            throw new Error('Erro ao carregar dados');
        }

        const [mainData, timelineData] = await Promise.all([
            mainRes.json(),
            timelineRes.json()
        ]);

        if (!mainData?.totals || !timelineData) {
            throw new Error('Dados inválidos da API');
        }

        document.getElementById('mainTotalCases').textContent = mainData.totals.cases || 0;
        document.getElementById('mainTotalVictims').textContent = mainData.totals.victims || 0;
        document.getElementById('mainTotalUsers').textContent = mainData.totals.users || 0;
        document.getElementById('totalEvidences').textContent = mainData.totals.evidences || 0;

        updateChart('timelineChart', 'line', {
            labels: timelineData.map(item => item._id || item.date),
            data: timelineData.map(item => item.count)
        }, 'Casos ao Longo do Tempo'); // Adicionando label do dataset

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Tente novamente mais tarde.');
        document.getElementById('mainTotalCases').textContent = 0;
        document.getElementById('mainTotalVictims').textContent = 0;
        document.getElementById('mainTotalUsers').textContent = 0; // Corrigido aqui
        document.getElementById('totalEvidences').textContent = 0;
    }
}

let currentView = 'status';
let caseChartInstance = null;

async function loadCaseData() {
    try {
        const period = document.getElementById('caseTimeFilter').value;
        const params = new URLSearchParams({
            type: currentView,
        });
        if (period !== 'all') {
            params.append('period', period);
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/case-stats?${params}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Erro ao carregar dados');

        const { stats, total } = await res.json();

        const totalElement = document.getElementById('totalCases');
        totalElement.textContent = total ?? 0;

        updateCaseChart(stats);

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados dos casos');
        document.getElementById('totalCases').textContent = 0;
    }
}

function updateCaseChart(data) {
    const ctx = document.getElementById('caseChart');
    if (!ctx) return; // Adiciona verificação se o elemento existe
    const isStatus = currentView === 'status';

    if (caseChartInstance) {
        caseChartInstance.destroy();
    }

    caseChartInstance = new Chart(ctx, {
        type: isStatus ? 'doughnut' : 'bar',
        data: {
            labels: data.map(item =>
                item.name === 'identificação de vítima' ? 'Ident. Vítima' :
                    item.name === 'exame criminal' ? 'Exame Criminal' :
                        item.name
            ),
            datasets: [{
                label: 'Casos',
                data: data.map(item => item.count),
                backgroundColor: isStatus
                    ? ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'] // Adicionadas mais cores
                    : '#10B981',
                borderWidth: 0,
                borderRadius: isStatus ? 0 : 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    display: isStatus
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    display: !isStatus
                },
                x: {
                    grid: { display: !isStatus },
                    ticks: { maxRotation: 0 }
                }
            }
        }
    });
}

document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;

        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentView = this.dataset.type;
        loadCaseData();
    });
});

const caseTimeFilterElement = document.getElementById('caseTimeFilter');
if (caseTimeFilterElement) {
    caseTimeFilterElement.addEventListener('change', loadCaseData);
}

function updateChart(canvasId, type, { labels, data }, datasetLabel = 'Quantidade') { // Adicionando label do dataset
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: datasetLabel, // Usando o label do dataset
                data: data,
                backgroundColor: (type === 'line' || type === 'bar') ? '#10B981' : ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                borderColor: (type === 'line') ? '#10B981' : undefined, // Para gráficos de linha
                fill: (type === 'line') ? false : undefined, // Para gráficos de linha
                borderWidth: (type === 'line') ? 2 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Importante para controlar altura com CSS
            plugins: {
                legend: { position: 'bottom', display: type !== 'line' && type !== 'bar' } // Ocultar legenda para linha/barra simples
            },
            scales: (type === 'line' || type === 'bar') ? {
                y: { beginAtZero: true },
                x: { grid: { display: false } }
            } : {}
        }
    });
}

let userChartInstance = null;

async function loadUserData() {
    try {
        const role = document.getElementById('userRoleFilter').value;
        const period = document.getElementById('userTimeFilter').value;

        const params = new URLSearchParams();
        if (role !== 'all') params.append('role', role);
        if (period !== 'all') params.append('period', period);

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/users-stats?${params}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Erro ao carregar dados de usuários');

        const { total, roles } = await res.json();

        document.getElementById('totalUsers').textContent = total || 0;
        updateUserChart(roles || []);

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados dos usuários');
        document.getElementById('totalUsers').textContent = 0;
    }
}

function updateUserChart(rolesData) {
    const ctx = document.getElementById('userRolesChart');
    if (!ctx) return;

    if (userChartInstance) {
        userChartInstance.destroy();
    }

    userChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: rolesData.map(item => {
                switch (item.role) {
                    case 'admin': return 'Administradores';
                    case 'perito': return 'Peritos';
                    case 'assistente': return 'Assistentes';
                    default: return item.role;
                }
            }),
            datasets: [{
                label: 'Usuários por Função',
                data: rolesData.map(item => item.count),
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

const userRoleFilterElement = document.getElementById('userRoleFilter');
if (userRoleFilterElement) {
    userRoleFilterElement.addEventListener('change', loadUserData);
}
const userTimeFilterElement = document.getElementById('userTimeFilter');
if (userTimeFilterElement) {
    userTimeFilterElement.addEventListener('change', loadUserData);
}

let locationChartInstance = null;

async function loadLocationData() {
    try {
        const period = document.getElementById('locationTimeFilter').value;
        const params = new URLSearchParams();
        if (period !== 'all') params.append('period', period);

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/location-stats?${params}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Erro ao carregar dados geográficos');

        const { locations, uniqueCount, topLocation } = await res.json();

        document.getElementById('uniqueLocations').textContent = uniqueCount || 0;
        document.getElementById('topLocation').textContent = topLocation?.name || '-';
        updateLocationChart(locations || []);

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados geográficos');
        document.getElementById('uniqueLocations').textContent = 0;
        document.getElementById('topLocation').textContent = '-';
    }
}

function updateLocationChart(locationsData) {
    const ctx = document.getElementById('locationsChart');
    if (!ctx) return;

    if (locationChartInstance) {
        locationChartInstance.destroy();
    }

    locationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locationsData.map(item => item._id || item.name), // Adicionado fallback para item.name
            datasets: [{
                label: 'Casos por Local',
                data: locationsData.map(item => item.count),
                backgroundColor: '#10B981',
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 10 } // Melhorias para labels do eixo X
                }
            }
        }
    });
}

const locationTimeFilterElement = document.getElementById('locationTimeFilter');
if (locationTimeFilterElement) {
    locationTimeFilterElement.addEventListener('change', loadLocationData);
}

async function loadActivityData() {
    try {
        const limit = document.getElementById('activityLimit').value;
        const params = new URLSearchParams({ limit });

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/recent-activity?${params}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Erro ao carregar atividades');

        const { cases, evidences, reports, victims } = await res.json();

        updateActivityList('recentCases', cases || [], 'nameCase', 'title');
        updateActivityList('recentEvidences', evidences || [], 'title', 'description'); // Usando description como fallback
        updateActivityList('recentReports', reports || [], 'caseId', 'reportNumber'); // Usando reportNumber como fallback
        updateActivityList('recentVictims', victims || [], 'victimCode', 'name');

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar atividades recentes');
        updateActivityList('recentCases', [], 'nameCase');
        updateActivityList('recentEvidences', [], 'title');
        updateActivityList('recentReports', [], 'caseId');
    }
}

function updateActivityList(listId, items, primaryField, secondaryField = null) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = items.map(item => {
        const titleText = item[primaryField] || (secondaryField ? item[secondaryField] : 'N/A');
        const dateText = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Data N/A';
        return `
        <li class="activity-item">
            <div class="activity-title" title="${titleText}">${titleText}</div>
            <div class="activity-date">${dateText}</div>
        </li>
    `;
    }).join('');
    if (items.length === 0) {
        list.innerHTML = `<li class="activity-item"><div class="activity-title">Nenhuma atividade recente.</div></li>`;
    }
}

const activityLimitElement = document.getElementById('activityLimit');
if (activityLimitElement) {
    activityLimitElement.addEventListener('change', loadActivityData);
}

async function handleExport(type) {
    try {
        const filters = {};
        if (type === 'cases') {
            filters.period = document.getElementById('caseTimeFilter')?.value || 'all';
            // Adicionar outros filtros de caso se existirem e forem relevantes para exportação
            // filters.status = document.getElementById('caseStatusFilter')?.value || 'all';
            // filters.category = document.getElementById('caseCategoryFilter')?.value || 'all';
        } else if (type === 'users') {
            filters.period = document.getElementById('userTimeFilter')?.value || 'all';
            filters.role = document.getElementById('userRoleFilter')?.value || 'all';
        } else if (type === 'victims') { // Adicionado
            filters.period = document.getElementById('victimTimeFilter')?.value || 'all';
            // Adicionar filtros específicos de vítima que você deseja para exportação
            // Ex: filters.identificationStatus = document.getElementById('victimStatusFilter')?.value || 'all';
            // Por agora, vamos usar apenas o período.
            const activeVictimToggle = document.querySelector('#victimViewToggle .toggle-btn.active');
            if (activeVictimToggle) {
                // Este é o 'groupBy' para o gráfico, não necessariamente um filtro de exportação direto
                // filters.groupBy = activeVictimToggle.dataset.type;
            }
        };
        // Adicionar mais tipos e seus filtros aqui se necessário

        const params = new URLSearchParams();
        for (const key in filters) {
            if (filters[key] && filters[key] !== 'all') { // Só adiciona se tiver valor e não for 'all'
                params.append(key, filters[key]);
            }
        }

        const url = `${API_BASE}/export/${type}?${params}`;

        const res = await fetch(url);

        if (!res.ok) {
            let errorText = 'Falha na exportação';
            try {
                const errorJson = await res.json(); // Tenta parsear como JSON
                errorText = errorJson.message || errorJson.error || JSON.stringify(errorJson);
            } catch (e) {
                errorText = await res.text(); // Senão, pega como texto
            }
            throw new Error(errorText);
        }

        const contentDisposition = res.headers.get('Content-Disposition');
        console.log("Raw Content-Disposition Header:", contentDisposition);

        // Nome padrão mais único, caso a extração do header falhe
        let filename = `${type}_export_${Date.now()}.csv`;

        if (contentDisposition) {
            let extractedName = null;

            // 1. Tenta o padrão mais comum com aspas: filename="nome.ext"
            const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
            if (quotedMatch && quotedMatch[1]) {
                extractedName = quotedMatch[1];
                console.log("Extracted from quoted pattern:", `"${extractedName}"`);
            } else {
                // 2. Tenta o padrão filename*= (para nomes de arquivo codificados com charset)
                // Ex: filename*=UTF-8''Report%20%E2%82%AC.csv
                const filenameStarMatch = contentDisposition.match(/filename\*=([^']+)'([^']*)'([^;]+)/i);
                if (filenameStarMatch && filenameStarMatch[3]) {
                    try {
                        extractedName = decodeURIComponent(filenameStarMatch[3]);
                        console.log("Extracted and decoded from filename* pattern:", `"${extractedName}"`);
                    } catch (e) {
                        console.warn("Could not decode URI component from filename*:", filenameStarMatch[3], e);
                        // Se a decodificação falhar, podemos tentar usar o valor bruto ou um fallback
                        // Para este caso, vamos tentar o próximo padrão se a decodificação falhar.
                    }
                }

                // 3. Se ainda não encontrou, tenta o padrão sem aspas (mais genérico): filename=nome.ext
                // Este deve vir depois de filename* porque filename* é mais específico.
                if (!extractedName) {
                    const unquotedMatch = contentDisposition.match(/filename=([^;]+)/i);
                    if (unquotedMatch && unquotedMatch[1]) {
                        // O valor pode estar entre aspas opcionais aqui também, ou ser apenas o nome
                        extractedName = unquotedMatch[1].replace(/^"|"$/g, ''); // Remove aspas se presentes
                        console.log("Extracted from unquoted pattern (raw, no quotes):", `"${extractedName}"`);
                    }
                }
            }

            if (extractedName) {
                // LIMPEZA RIGOROSA da string extraída:
                // a. Trim de espaços em branco no início e fim
                filename = extractedName.trim();

                // b. Remover quaisquer caracteres de controle não imprimíveis ASCII (0-31 e 127)
                // (exceto tab, newline, CR que são raros em nomes de arquivo mas poderiam ser mantidos se necessário)
                // Esta regex remove todos os caracteres de controle U+0000–U+001F e U+007F.
                filename = filename.replace(/[\u0000-\u001F\u007F]/g, '');

                // c. Opcional: Normalizar para formulário NFC (útil para caracteres acentuados compostos)
                // Isso pode ajudar se houver problemas com caracteres Unicode.
                if (filename.normalize) { // Verifica se o método normalize está disponível (browsers modernos)
                    filename = filename.normalize('NFC');
                }

                console.log("Sanitized filename:", `"${filename}"`);
            } else {
                console.log("Could not parse filename from Content-Disposition. Using default (timestamped):", `"${filename}"`);
            }
        } else {
            console.log("No Content-Disposition header found. Using default (timestamped):", `"${filename}"`);
        }

        // Log dos códigos dos caracteres do nome do arquivo final ANTES do download
        let charCodes = [];
        for (let i = 0; i < filename.length; i++) {
            charCodes.push(filename.charCodeAt(i));
        }
        console.log("Final filename to be used for download attribute:", `"${filename}"`);
        console.log("Character codes for filename:", charCodes.join(', '));
        // Esperado para ".csv": 46 (.), 99 (c), 115 (s), 118 (v) nos últimos 4 códigos.

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename; // AQUI É O PONTO CRÍTICO
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        console.error('Erro na exportação:', error);
        alert(`Erro na exportação: ${error.message}`);
    }
}

const victimGroupByOptions = [
    { type: 'identificationStatus', label: 'Identificação', chartType: 'pie', endpoint: 'victim-demographics-stats' },
    { type: 'gender', label: 'Gênero', chartType: 'pie', endpoint: 'victim-demographics-stats' },
    { type: 'ethnicityRace', label: 'Etnia/Raça', chartType: 'bar', endpoint: 'victim-demographics-stats' },
    { type: 'ageDistribution', label: 'Faixa Etária', chartType: 'bar', endpoint: 'victim-age-stats' }, // Endpoint específico para idade
    { type: 'mannerOfDeath', label: 'Circunstância da Morte', chartType: 'bar', endpoint: 'victim-demographics-stats' },
    { type: 'discoveryLocation.type', label: 'Local Descoberta', chartType: 'bar', endpoint: 'victim-demographics-stats' },
    { type: 'victimsTimeline', label: 'Timeline', chartType: 'line', endpoint: 'victims-timeline' }
    // Adicione mais opções conforme os campos do seu modelo Victim e os endpoints do backend
];

// NOVA FUNÇÃO para carregar dados do gráfico principal de vítimas
// Função para carregar dados do gráfico principal de vítimas
async function loadVictimData() {
    const selectedOption = victimGroupByOptions.find(opt => opt.type === currentVictimView);

    if (!selectedOption) {
        console.error("Opção de visualização de vítima não encontrada:", currentVictimView);
        // Limpar gráfico e mostrar mensagem de erro na UI se a opção for inválida
        const ctx = document.getElementById('victimChart');
        if (ctx && victimChartInstance) {
            victimChartInstance.destroy();
            victimChartInstance = null;
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            context.textAlign = 'center';
            context.fillText('Opção de gráfico inválida.', ctx.width / 2, ctx.height / 2);
        }
        const totalElement = document.getElementById('totalVictimsInPeriod');
        if (totalElement) totalElement.textContent = 'Erro';
        return;
    }

    const endpointName = selectedOption.endpoint;
    const chartType = selectedOption.chartType;
    const datasetLabel = selectedOption.label; // Usar para o título do gráfico
    const periodElement = document.getElementById('victimTimeFilter');
    const period = periodElement ? periodElement.value : 'all';

    const params = new URLSearchParams();
    // Apenas 'victim-demographics-stats' usa 'groupBy' explicitamente no backend.
    // 'victim-age-stats' e 'victims-timeline' têm endpoints dedicados que já sabem como agregar.
    if (endpointName === 'victim-demographics-stats') {
        params.append('groupBy', currentVictimView);
    }
    if (period !== 'all') {
        params.append('period', period);
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Token de autenticação não encontrado.");
        alert("Sessão expirada ou inválida. Por favor, faça login novamente.");
        // Idealmente, redirecionar para a página de login
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/${endpointName}?${params}`, {
             headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({})); // Tenta pegar erro do JSON
            throw new Error(errorData.error || errorData.message || `Erro ${res.status} ao carregar estatísticas de vítimas (${datasetLabel})`);
        }

        const resultData = await res.json();
        console.log(`Dados recebidos para ${datasetLabel}:`, resultData); // Log para depuração

        const totalElement = document.getElementById('totalVictimsInPeriod');

        // A estrutura de 'resultData' varia:
        // Para timeline, é um array de { _id: 'data', count: N }
        // Para demographics/age, é um objeto { stats: [...], total: N }
        if (currentVictimView === 'victimsTimeline') {
            updateVictimChart(resultData || [], chartType, datasetLabel); // resultData é o array da timeline
            if (totalElement) {
                // Calcula o total da timeline se necessário, ou mostra '-'
                const timelineTotal = (resultData || []).reduce((sum, item) => sum + item.count, 0);
                totalElement.textContent = timelineTotal > 0 ? timelineTotal : "-";
            }
        } else {
            const { stats, total } = resultData;
            if (totalElement) totalElement.textContent = total || 0;
            updateVictimChart(stats || [], chartType, datasetLabel);
        }

    } catch (error) {
        console.error(`Erro ao carregar dados de vítimas (${datasetLabel}):`, error);
        alert(`Erro ao carregar dados de vítimas (${datasetLabel}): ${error.message}`);
        
        const totalElement = document.getElementById('totalVictimsInPeriod');
        if (totalElement) totalElement.textContent = 0;
        
        // Limpar gráfico em caso de erro
        const ctx = document.getElementById('victimChart');
        if (ctx) {
            if (victimChartInstance) {
                victimChartInstance.destroy();
                victimChartInstance = null;
            }
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            context.textAlign = 'center';
            context.fillStyle = '#cc0000'; // Cor para mensagem de erro
            context.fillText(`Erro ao carregar gráfico (${datasetLabel}).`, ctx.width / 2, ctx.height / 2);
        }
    }
}

// NOVA FUNÇÃO para atualizar o gráfico principal de vítimas
function updateVictimChart(data, chartType, datasetLabel) {
    const ctx = document.getElementById('victimChart');
    if (!ctx) return;

    if (victimChartInstance) {
        victimChartInstance.destroy();
    }
    let chartDataConfig;
    let chartOptionsConfig;

    if (chartType === 'line') { // Configuração para gráfico de linha (timeline)
        chartDataConfig = {
            labels: data.map(item => item._id || item.date), // _id vem da agregação da timeline
            datasets: [{
                label: datasetLabel,
                data: data.map(item => item.count),
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: '#EF4444',
                tension: 0.1,
                fill: true
            }]
        };
        chartOptionsConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, title: { display: true, text: datasetLabel } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
        };
    } else { // Configuração para pie/bar
        chartDataConfig = {
            labels: data.map(item => item.name || 'Não Especificado'),
            datasets: [{
                label: datasetLabel,
                data: data.map(item => item.count),
                backgroundColor: chartType === 'bar'
                    ? '#3B82F6'
                    : ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#EC4899', '#F97316'],
                borderWidth: chartType === 'bar' ? 0 : 1,
                borderRadius: chartType === 'bar' ? 8 : 0,
            }]
        };
        chartOptionsConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', display: chartType !== 'bar' },
                title: { display: true, text: `Distribuição por ${datasetLabel}` }
            },
            scales: (chartType === 'bar') ? {
                y: { beginAtZero: true },
                x: { grid: { display: false }, ticks: { autoSkip: true, maxRotation: 45 } }
            } : {}
        };
    }

    victimChartInstance = new Chart(ctx, {
        type: chartType,
        data: chartDataConfig,
        options: chartOptionsConfig
    });
}

// NOVA FUNÇÃO para carregar dados da timeline de vítimas
async function loadVictimsTimelineData() {
    const period = document.getElementById('victimTimeFilter').value; // Usa o mesmo filtro de período
    const params = new URLSearchParams();
    if (period !== 'all') {
        params.append('period', period);
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE}/victims-timeline?${params}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Erro ao carregar timeline de vítimas');

        const timelineData = await res.json();
        updateVictimsTimelineChart(timelineData || []);

    } catch (error) {
        console.error('Erro ao carregar timeline de vítimas:', error);
        // Não mostrar alert para este gráfico secundário, apenas logar ou mostrar msg no gráfico
        if (victimsTimelineChartInstance) {
            victimsTimelineChartInstance.destroy();
            victimsTimelineChartInstance = null;
        }
        const ctx = document.getElementById('victimsTimelineChart');
        if (ctx) {
            const context = ctx.getContext('2d');
            context.clearRect(0, 0, ctx.width, ctx.height);
            context.textAlign = 'center';
            context.fillText('Erro ao carregar timeline.', ctx.width / 2, ctx.height / 2);
        }
    }
}

// NOVA FUNÇÃO para atualizar o gráfico de timeline de vítimas
function updateVictimsTimelineChart(timelineData) {
    const ctx = document.getElementById('victimsTimelineChart');
    if (!ctx) return;

    if (victimsTimelineChartInstance) {
        victimsTimelineChartInstance.destroy();
    }

    victimsTimelineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.map(item => item._id || item.date), // _id vem da agregação
            datasets: [{
                label: 'Vítimas Registradas (por Data de Descoberta)',
                data: timelineData.map(item => item.count),
                backgroundColor: 'rgba(239, 68, 68, 0.2)', // Cor vermelha suave
                borderColor: '#EF4444', // Cor vermelha
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }, // Forçar ticks inteiros
                x: { grid: { display: false } }
            }
        }
    });
}

function updateVictimAgeChart(ageData) {
    const ctx = document.getElementById('victimAgeChart');
    if (!ctx) return;

    if (victimAgeChartInstance) {
        victimAgeChartInstance.destroy();
    }

    victimAgeChartInstance = new Chart(ctx, {
        type: 'bar', // Ou 'pie' se preferir
        data: {
            labels: ageData.map(item => item.name),
            datasets: [{
                label: 'Distribuição Etária de Vítimas',
                data: ageData.map(item => item.count),
                backgroundColor: [ // Cores diferentes para cada faixa
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, // Pode ocultar se o título do gráfico for suficiente
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Função para popular os botões de toggle do dashboard de vítimas
function populateVictimViewToggle() {
    const toggleContainer = document.getElementById('victimViewToggle');
    if (!toggleContainer) return;

    toggleContainer.innerHTML = ''; // Limpa botões existentes

    victimGroupByOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'toggle-btn';
        if (index === 0) { // Ativa o primeiro botão por padrão
            button.classList.add('active');
            currentVictimView = option.type; // Define a view padrão
        }
        button.dataset.type = option.type;
        button.dataset.chartType = option.chartType; // Armazena o tipo de gráfico preferido
        button.dataset.endpoint = option.endpoint;   // Armazena o endpoint a ser chamado
        button.textContent = option.label;

        button.addEventListener('click', function () {
            if (this.classList.contains('active')) return;
            document.querySelectorAll('#victimViewToggle .toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentVictimView = this.dataset.type;
            loadVictimData(); // Recarrega os dados do gráfico principal de vítimas
        });
        toggleContainer.appendChild(button);
    });
}

// Event Listeners para o Dashboard de Vítimas
document.querySelectorAll('#victimViewToggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;

        document.querySelectorAll('#victimViewToggle .toggle-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentVictimView = this.dataset.type; // Atualiza o tipo de agrupamento
        loadVictimData(); // Recarrega os dados com o novo agrupamento
    });
});

// Adicionar event listener para o filtro de tempo do dashboard de vítimas
const victimTimeFilterElement = document.getElementById('victimTimeFilter');
if (victimTimeFilterElement) {
    victimTimeFilterElement.addEventListener('change', () => {
        loadVictimData(); // Recarrega o gráfico principal // Recarrega a timeline
    });
}

// const victimDateFieldElement = document.getElementById('victimDateField'); // Para filtro de campo de data futuro
// if (victimDateFieldElement) {
//     victimDateFieldElement.addEventListener('change', loadVictimData);
// }

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para filtros globais de cada dashboard (que não foram configurados acima)
    const mainFilterElement = document.getElementById('mainFilter');
    if (mainFilterElement) {
        mainFilterElement.addEventListener('change', () => loadDashboardData('main'));
    }
    // Os outros filtros já têm seus listeners específicos ou são tratados dentro de loadDashboardData

    showDashboard('main', null); // Passa null para o evento na inicialização
});

// Função auxiliar para configurar os filtros de período customizados
function setupCustomDateFilters() {
    const timeFilterSelects = document.querySelectorAll('.time-filter-select');

    timeFilterSelects.forEach(selectElement => {
        const customControlsId = selectElement.dataset.customControls; // ex: 'caseCustomDateControls'
        const customControlsElement = document.getElementById(customControlsId);
        
        if (!customControlsElement) return;

        const startDateInput = customControlsElement.querySelector('.date-input[id$="StartDate"]'); // ex: #caseStartDate
        const endDateInput = customControlsElement.querySelector('.date-input[id$="EndDate"]');   // ex: #caseEndDate
        const applyButton = customControlsElement.querySelector('.apply-custom-date-btn');     // ex: #applyCaseCustomDate

        if (!startDateInput || !endDateInput || !applyButton) return;

        selectElement.addEventListener('change', function() {
            if (this.value === 'custom') {
                customControlsElement.classList.remove('hidden');
            } else {
                customControlsElement.classList.add('hidden');
                // Se uma opção pré-definida for selecionada, recarrega os dados do dashboard associado
                const dashboardId = this.id.replace('TimeFilter', '').replace('Filter', ''); // main, case, user, etc.
                loadDashboardData(dashboardId);
            }
        });

        applyButton.addEventListener('click', function() {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            if (!startDate || !endDate) {
                alert("Por favor, selecione as datas de início e fim.");
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                alert("A data de início não pode ser posterior à data de fim.");
                return;
            }
            // Recarrega os dados do dashboard associado com o período customizado
            const dashboardId = selectElement.id.replace('TimeFilter', '').replace('Filter', '');
            loadDashboardData(dashboardId);
        });
    });
}