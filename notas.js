document.addEventListener('DOMContentLoaded', function() {
    // Adicionar evento de clique no botão de upload
    document.getElementById('uploadBtn').addEventListener('click', function() {
        document.getElementById('uploadInput').click();
    });

    // Adicionar evento de mudança no input de arquivo
    document.getElementById('uploadInput').addEventListener('change', handleFileUpload);

    // Adicionar evento de submissão do formulário
    document.querySelector('form').addEventListener('submit', handleSubmit);

    // Adicionar evento de mudança para todos os selects de notas
    document.querySelectorAll('select[name]').forEach(select => {
        select.addEventListener('change', function() {
            updateSelectColor(this);
            updateTotalScore();
        });
    });

    // Inicializar a nota total como 0.00
    // updateTotalScore();

    // Esconder o formulário inicialmente
    document.getElementById('avaliacaoForm').style.display = 'none';

    // Inicializar os selects
    initializeSelects();
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const groups = JSON.parse(e.target.result);
                createGroupSelector(groups);
                document.getElementById('avaliacaoForm').style.display = 'block';
            } catch (error) {
                console.error('Erro ao analisar o arquivo JSON:', error);
                // Remova ou comente esta linha
                // alert('Erro ao carregar o arquivo. Certifique-se de que é um JSON válido.');
            }
        };
        reader.readAsText(file);
    }
}

function createGroupSelector(groups) {
    const form = document.querySelector('form');
    let groupContainer = document.getElementById('group-select-container');
    
    if (!groupContainer) {
        groupContainer = document.createElement('div');
        groupContainer.id = 'group-select-container';
        groupContainer.className = 'mb-4';
        form.insertBefore(groupContainer, form.firstChild);
    }

    groupContainer.innerHTML = `
        <div class="mb-3">
            <label for="group-select" class="form-label">Selecione o Grupo:</label>
            <select id="group-select" class="form-select">
                <option value="">Escolha um grupo...</option>
                ${Object.entries(groups).map(([key, value]) => `
                    <option value="${key}">Grupo ${key}: ${value.join(', ')}</option>
                `).join('')}
            </select>
        </div>
        <div class="mb-3">
            <label for="turma-select" class="form-label">Selecione a Turma:</label>
            <select id="turma-select" class="form-select">
                <option value="">Escolha uma turma...</option>
                <option value="2W">2W</option>
                <option value="2X">2X</option>
                <option value="2Y">2Y</option>
            </select>
        </div>
    `;

    // Adicione este evento após criar o seletor de grupos
    document.getElementById('group-select').addEventListener('change', function() {
        const selectedGroup = this.value;
        resetAllSelects();
        if (selectedGroup) {
            createApresentacaoOralFields(groups[selectedGroup]);
            updateTotalScore();
        } else {
            document.getElementById('apresentacao-oral-container').innerHTML = '';
            document.getElementById('group-members-container').innerHTML = '';
        }
    });

    // Adicione este atributo para armazenar os dados dos grupos
    document.getElementById('group-select').setAttribute('data-groups', JSON.stringify(groups));
}

function createApresentacaoOralFields(members) {
    const container = document.getElementById('apresentacao-oral-container');
    container.innerHTML = '';

    members.forEach(member => {
        container.innerHTML += `
            <div class="mb-3">
                <h5 class="text-warning">${member}</h5>
                <div class="mb-2">
                    <label for="participacao_${member}" class="form-label">Participação (0.75 ponto):</label>
                    <select id="participacao_${member}" class="form-select" name="participacao_${member}">
                        <option value="0" selected>Escolha uma nota...</option>
                        <option value="0.75" class="excelente">Excelente (0.75 ponto)</option>
                        <option value="0.5" class="bom">Bom (0.5 ponto)</option>
                        <option value="0.25" class="regular">Regular (0.25 ponto)</option>
                    </select>
                </div>
                <div class="mb-2">
                    <label for="clareza_apresentacao_${member}" class="form-label">Clareza e Efetividade (0.75 ponto):</label>
                    <select id="clareza_apresentacao_${member}" class="form-select" name="clareza_apresentacao_${member}">
                        <option value="0" selected>Escolha uma nota...</option>
                        <option value="0.75" class="excelente">Excelente (0.75 ponto)</option>
                        <option value="0.5" class="bom">Bom (0.5 ponto)</option>
                        <option value="0.25" class="regular">Regular (0.25 ponto)</option>
                    </select>
                </div>
            </div>
        `;
    });

    // Adicionar eventos de mudança para os novos selects
    container.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function() {
            updateSelectColor(this);
            updateTotalScore();
        });
    });

    updateTotalScore(); // Atualizar as notas totais após criar os campos
}

function updateSelectColor(select) {
    const selectedOption = select.options[select.selectedIndex];
    select.className = 'form-select ' + selectedOption.className;
}

function updateTotalScore() {
    const groupSelect = document.getElementById('group-select');
    if (!groupSelect || !groupSelect.value) return;

    const selectedGroup = groupSelect.value;
    if (!selectedGroup) return;

    const groups = JSON.parse(groupSelect.getAttribute('data-groups') || '{}');
    const members = groups[selectedGroup];
    if (!members) return;

    const notaGrupo = calcularNotaGrupo();

    members.forEach(member => {
        const notaIndividual = calcularNotaIndividual(member);
        const notaTotal = notaIndividual + notaGrupo;
        // Remova ou comente esta linha
        // const notaTotalElement = document.getElementById(`nota-total-${member}`);
        // if (notaTotalElement) {
        //     notaTotalElement.textContent = notaTotal.toFixed(2);
        // }
    });

    // Atualizar a tabela de notas totais
    updateTotalScoreTable(members, notaGrupo);
}

function updateTotalScoreTable(members, notaGrupo) {
    const groupMembersContainer = document.getElementById('group-members-container');
    groupMembersContainer.innerHTML = '<h3 class="mb-3 text-light">Detalhes das Notas:</h3>';

    const detailedTable = document.createElement('table');
    detailedTable.className = 'table table-dark table-bordered table-striped';
    detailedTable.innerHTML = `
        <thead>
            <tr>
                <th>Membro</th>
                <th>Conteúdo Teórico</th>
                <th>Projeto Prático</th>
                <th>Apresentação Oral</th>
                <th>Participação</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const conteudoTeorico = parseFloat(document.getElementById('abrangencia').value) + parseFloat(document.getElementById('clareza').value);
    const projetoPratico = parseFloat(document.getElementById('implementacao').value) + parseFloat(document.getElementById('qualidade_codigo').value);
    const participacaoGrupo = parseFloat(document.getElementById('trabalho_equipe').value) + parseFloat(document.getElementById('prazos').value);

    members.forEach(member => {
        const apresentacaoOral = parseFloat(document.getElementById(`participacao_${member}`).value) + parseFloat(document.getElementById(`clareza_apresentacao_${member}`).value);
        const notaTotal = conteudoTeorico + projetoPratico + apresentacaoOral + participacaoGrupo;

        const detailedRow = detailedTable.querySelector('tbody').insertRow();
        detailedRow.innerHTML = `
            <td>${member}</td>
            <td><input type="number" class="form-control" value="${conteudoTeorico.toFixed(2)}" step="0.01" data-member="${member}" data-type="conteudoTeorico"></td>
            <td><input type="number" class="form-control" value="${projetoPratico.toFixed(2)}" step="0.01" data-member="${member}" data-type="projetoPratico"></td>
            <td><input type="number" class="form-control" value="${apresentacaoOral.toFixed(2)}" step="0.01" data-member="${member}" data-type="apresentacaoOral"></td>
            <td><input type="number" class="form-control" value="${participacaoGrupo.toFixed(2)}" step="0.01" data-member="${member}" data-type="participacaoGrupo"></td>
            <td><input type="number" class="form-control" value="${notaTotal.toFixed(2)}" step="0.01" readonly data-member="${member}" data-type="total"></td>
        `;
    });

    groupMembersContainer.appendChild(detailedTable);

    // Adicionar eventos de mudança para atualizar o total
    detailedTable.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', function() {
            const member = this.getAttribute('data-member');
            updateMemberTotal(member);
        });
    });
}

function updateMemberTotal(member) {
    const conteudoTeorico = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="conteudoTeorico"]`).value) || 0;
    const projetoPratico = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="projetoPratico"]`).value) || 0;
    const apresentacaoOral = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="apresentacaoOral"]`).value) || 0;
    const participacaoGrupo = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="participacaoGrupo"]`).value) || 0;

    const notaTotal = conteudoTeorico + projetoPratico + apresentacaoOral + participacaoGrupo;
    const totalInput = document.querySelector(`input[data-member="${member}"][data-type="total"]`);
    totalInput.value = notaTotal.toFixed(2);
}

function calcularNotaIndividual(member) {
    return parseFloat(document.getElementById(`participacao_${member}`).value) +
           parseFloat(document.getElementById(`clareza_apresentacao_${member}`).value);
}

function calcularNotaGrupo() {
    return parseFloat(document.getElementById('abrangencia').value) +
           parseFloat(document.getElementById('clareza').value) +
           parseFloat(document.getElementById('implementacao').value) +
           parseFloat(document.getElementById('qualidade_codigo').value) +
           parseFloat(document.getElementById('trabalho_equipe').value) +
           parseFloat(document.getElementById('prazos').value);
}

function handleSubmit(event) {
    event.preventDefault();
    
    const selectedGroup = document.getElementById('group-select').value;
    const selectedTurma = document.getElementById('turma-select').value;
    if (!selectedGroup || !selectedTurma) {
        return; // Saia silenciosamente se o grupo ou turma não estiverem selecionados
    }

    const formData = new FormData(event.target);
    const avaliacao = {
        grupo: selectedGroup,
        turma: selectedTurma,
        notas: {}
    };

    const groups = JSON.parse(document.getElementById('group-select').getAttribute('data-groups'));
    const members = groups[selectedGroup];

    members.forEach(member => {
        avaliacao.notas[member] = {
            participacao: parseFloat(formData.get(`participacao_${member}`)) || 0,
            clareza_apresentacao: parseFloat(formData.get(`clareza_apresentacao_${member}`)) || 0
        };
    });

    for (let [key, value] of formData.entries()) {
        if (!key.includes('_')) {
            avaliacao.notas[key] = parseFloat(value) || 0;
        }
    }

    avaliacao.notasTotais = {};
    members.forEach(member => {
        const notaIndividual = calcularNotaIndividual(member);
        const notaGrupo = calcularNotaGrupo();
        avaliacao.notasTotais[member] = notaIndividual + notaGrupo;
    });

    // Remova ou comente esta linha
    // console.log('Avaliação enviada:', avaliacao);

    // Remova ou comente este alerta
    // alert(`Avaliação do Grupo ${selectedGroup} da Turma ${selectedTurma} enviada com sucesso!`);

    // Aqui você pode adicionar código para enviar a avaliação para um servidor ou salvá-la localmente
}

function resetAllSelects() {
    document.querySelectorAll('select[name]').forEach(select => {
        select.value = "0";
        updateSelectColor(select);
    });

    // Garantir que abrangencia e clareza iniciem com "Escolha uma nota..."
    document.getElementById('abrangencia').value = "0";
    document.getElementById('clareza').value = "0";
}

// Adicione esta função para inicializar os selects quando a página carregar
function initializeSelects() {
    document.getElementById('abrangencia').value = "0";
    document.getElementById('clareza').value = "0";
    document.querySelectorAll('select[name]').forEach(select => {
        updateSelectColor(select);
    });
}
