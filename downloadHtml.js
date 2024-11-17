function gerarHTMLRelatorio(avaliacao) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Avaliação do Grupo ${avaliacao.grupo} - Turma ${avaliacao.turma}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container py-5">
        <h1 class="mb-4">Avaliação do Grupo ${avaliacao.grupo} - Turma ${avaliacao.turma}</h1>
        <p><strong>Turma:</strong> ${avaliacao.turma}</p>
        <p><strong>Grupo:</strong> ${avaliacao.grupo}</p>
        <h2 class="mt-4 mb-3">Notas:</h2>
        <div class="table-responsive">
            <table class="table table-dark table-striped table-hover">
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
                <tbody>
                    ${Object.entries(avaliacao.notasTotais).map(([membro, notaTotal]) => `
                        <tr>
                            <td>${membro}</td>
                            <td>${avaliacao.notas[membro].conteudoTeorico.toFixed(2)}</td>
                            <td>${avaliacao.notas[membro].projetoPratico.toFixed(2)}</td>
                            <td>${avaliacao.notas[membro].apresentacaoOral.toFixed(2)}</td>
                            <td>${avaliacao.notas[membro].participacaoGrupo.toFixed(2)}</td>
                            <td><strong>${notaTotal.toFixed(2)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
    `;
    return html;
}

function downloadHTMLFile(html, avaliacao) {
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${avaliacao.turma} - Grupo${avaliacao.grupo}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const avaliacao = obterDadosAvaliacao();
            
            if (avaliacao) {
                const html = gerarHTMLRelatorio(avaliacao);
                downloadHTMLFile(html, avaliacao);
            } else {
                console.error('Falha ao obter dados da avaliação');
            }
        });
    } else {
        console.error('Formulário não encontrado');
    }
});

function obterDadosAvaliacao() {
    const selectedGroup = document.getElementById('group-select')?.value;
    const selectedTurma = document.getElementById('turma-select')?.value;
    const groupsData = document.getElementById('group-select')?.getAttribute('data-groups');

    if (!selectedGroup || !selectedTurma || !groupsData) {
        console.error('Dados do formulário incompletos');
        return null;
    }

    const groups = JSON.parse(groupsData);
    const members = groups[selectedGroup];

    if (!members) {
        console.error('Membros do grupo não encontrados');
        return null;
    }

    const avaliacao = {
        grupo: selectedGroup,
        turma: selectedTurma,
        notas: {},
        notasTotais: {}
    };

    members.forEach(member => {
        // Obter valores dos inputs editáveis
        const conteudoTeorico = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="conteudoTeorico"]`).value) || 0;
        const projetoPratico = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="projetoPratico"]`).value) || 0;
        const apresentacaoOral = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="apresentacaoOral"]`).value) || 0;
        const participacaoGrupo = parseFloat(document.querySelector(`input[data-member="${member}"][data-type="participacaoGrupo"]`).value) || 0;

        avaliacao.notas[member] = {
            conteudoTeorico: conteudoTeorico,
            projetoPratico: projetoPratico,
            apresentacaoOral: apresentacaoOral,
            participacaoGrupo: participacaoGrupo
        };

        // Cálculo da nota total para cada membro
        const notaTotal = conteudoTeorico + projetoPratico + apresentacaoOral + participacaoGrupo;
        avaliacao.notasTotais[member] = notaTotal;
    });

    return avaliacao;
}
