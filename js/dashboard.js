let charts = {};
const API_BASE = 'https://odonto-legal-backend.onrender.com/api/dashboard';

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

    loadDashboardData(dashboardId);
}

// Carregamento de dados
async function loadDashboardData(dashboardId) {
    // Determina qual filtro de período usar com base no dashboardId
    let periodFilterId;
    if (dashboardId === 'main') periodFilterId = 'mainFilter';
    else if (dashboardId === 'cases') periodFilterId = 'caseTimeFilter';
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

        const { cases, evidences, reports } = await res.json();

        updateActivityList('recentCases', cases || [], 'nameCase', 'title');
        updateActivityList('recentEvidences', evidences || [], 'title', 'description'); // Usando description como fallback
        updateActivityList('recentReports', reports || [], 'caseId', 'reportNumber'); // Usando reportNumber como fallback

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
        }
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