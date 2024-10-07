document.addEventListener('DOMContentLoaded', () => {
    const studentContainer = document.getElementById('student-container');
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadInput = document.getElementById('uploadInput');

    // Esconder o botão de download inicialmente
    downloadBtn.style.display = 'none';

    // Map de nomes de estudantes para grupos (0 = não agrupado)
    let estudantes = new Map();

    // Função para criar um card de estudante
    function criarCardEstudante(nome) {
        const card = document.createElement('div');
        card.className = 'card mb-2 draggable';
        card.setAttribute('draggable', 'true');
        card.innerHTML = `<div class="card-body">${nome}</div>`;
        card.dataset.nome = nome; // Armazenar o nome como um atributo de dados
        
        // Adicionar eventos de drag
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
        
        return card;
    }

    // Função para ordenar os cards de estudantes alfabeticamente
    function ordenarEstudantes() {
        const cards = Array.from(studentContainer.children);
        cards.sort((a, b) => a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR'));
        cards.forEach(card => studentContainer.appendChild(card));
    }

    // Criar e adicionar cards de estudantes
    const fragment = document.createDocumentFragment();
    Array.from(estudantes.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(nome => {
        const card = criarCardEstudante(nome);
        fragment.appendChild(card);
    });
    studentContainer.appendChild(fragment);

    // Configurar as áreas de drop (grupos e container de estudantes)
    const grupos = document.querySelectorAll('.group-container');
    grupos.forEach(grupo => {
        grupo.addEventListener('dragover', dragOver);
        grupo.addEventListener('dragleave', dragLeave);
        grupo.addEventListener('drop', drop);
    });

    // Adicionar eventos de drop ao container de estudantes
    studentContainer.addEventListener('dragover', dragOver);
    studentContainer.addEventListener('dragleave', dragLeave);
    studentContainer.addEventListener('drop', drop);

    // Funções de drag and drop
    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.nome);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function dragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function dragOver(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    function dragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    function drop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        const nome = e.dataTransfer.getData('text/plain');
        const draggable = document.querySelector(`[data-nome="${nome}"]`);
        if (draggable) {
            const targetContainer = e.target.closest('.group-container') || studentContainer;
            
            // Verificar se o alvo é um grupo e se já tem 4 estudantes
            if (targetContainer.classList.contains('group-container') && targetContainer.children.length >= 4) {
                alert('Este grupo já tem 4 estudantes!');
                return;
            }
            
            // Atualizar o Map com o novo grupo do estudante
            const grupoNumero = targetContainer.id === 'student-container' ? 0 : parseInt(targetContainer.id.replace('group', ''));
            estudantes.set(nome, grupoNumero);
            
            // Mover o estudante para o novo container
            targetContainer.appendChild(draggable);

            // Se o alvo for o container de estudantes, reordenar
            if (targetContainer === studentContainer) {
                ordenarEstudantes();
            }

            // Log para debug
            console.log(`Estudante ${nome} movido para o grupo ${grupoNumero}`);
            console.log(estudantes);
        }
    }

    // Função para gerar o arquivo JSON e iniciar o download
    function downloadGruposJSON() {
        const gruposObj = {};
        estudantes.forEach((grupo, nome) => {
            if (!gruposObj[grupo]) {
                gruposObj[grupo] = [];
            }
            gruposObj[grupo].push(nome);
        });

        const jsonString = JSON.stringify(gruposObj, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'grupos.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Função para carregar estudantes do JSON
    function carregarEstudantesDoJSON(jsonData) {
        estudantes.clear();
        studentContainer.innerHTML = '';
        for (const [grupo, nomes] of Object.entries(jsonData)) {
            nomes.forEach(nome => {
                estudantes.set(nome, parseInt(grupo));
                const card = criarCardEstudante(nome);
                if (grupo === '0') {
                    studentContainer.appendChild(card);
                } else {
                    const grupoContainer = document.getElementById(`group${grupo}`);
                    if (grupoContainer) {
                        grupoContainer.appendChild(card);
                    }
                }
            });
        }
        ordenarEstudantes();
        
        // Mostrar o botão de download após o carregamento bem-sucedido
        downloadBtn.style.display = 'inline-block';
    }

    // Função para lidar com o upload do arquivo
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/json') {
                alert('Por favor, selecione um arquivo JSON válido.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    validarJSON(jsonData);
                    carregarEstudantesDoJSON(jsonData);
                } catch (error) {
                    console.error('Erro ao processar o arquivo JSON:', error);
                    alert(`Erro ao carregar o arquivo: ${error.message}`);
                }
            };
            reader.readAsText(file);
        }
    }

    // Função para validar o formato do JSON
    function validarJSON(jsonData) {
        if (typeof jsonData !== 'object' || jsonData === null) {
            throw new Error('O arquivo JSON deve conter um objeto.');
        }

        for (const [grupo, nomes] of Object.entries(jsonData)) {
            if (!/^\d+$/.test(grupo)) {
                throw new Error('As chaves do objeto devem ser números (como strings).');
            }
            if (!Array.isArray(nomes)) {
                throw new Error(`O valor para o grupo ${grupo} deve ser um array.`);
            }
            if (nomes.some(nome => typeof nome !== 'string')) {
                throw new Error(`Todos os nomes no grupo ${grupo} devem ser strings.`);
            }
        }
    }

    // Adicionar evento de clique ao botão de upload
    uploadBtn.addEventListener('click', () => {
        uploadInput.click();
    });

    // Adicionar evento de mudança ao input de arquivo
    uploadInput.addEventListener('change', handleFileUpload);

    // Adicionar evento de clique ao botão de download
    downloadBtn.addEventListener('click', downloadGruposJSON);
});