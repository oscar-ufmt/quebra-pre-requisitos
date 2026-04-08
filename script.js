let disciplinasData = [];

async function carregarDados() {
    try {
        const response = await fetch("disciplinas_obrigatorias.json");
        disciplinasData = await response.json();
        carregarInfoAdicional();
        addDisciplina();
    } catch (e) {
        console.error("Erro ao carregar JSON", e);
    }
}

function salvarInfoAdicional() {
    const sei = document.getElementById('alunoSEI').value;
    localStorage.setItem('sei_quebra_ufmt', sei);
}

function carregarInfoAdicional() {
    const savedSei = localStorage.getItem('sei_quebra_ufmt');
    if (savedSei) document.getElementById('alunoSEI').value = savedSei;
}

function limparFormulario() {
    if(confirm("Deseja limpar todos os campos?")) {
        localStorage.removeItem('sei_quebra_ufmt');
        window.location.reload();
    }
}

function addDisciplina() {
    const container = document.getElementById("disciplinas-container");
    const id = Date.now();
    const div = document.createElement("div");
    div.className = "card disciplina-block";
    div.id = `block-${id}`;

    div.innerHTML = `
        <div class="card-header">
            <h4>Solicitação</h4>
            <button onclick="removerBloco('${id}')" class="btn-remove">Excluir</button>
        </div>
        
        <div class="form-group">
            <label>Disciplina a ser quebrada:</label>
            <select class="select-disciplina" onchange="atualizarPrerequisitos(this, '${id}')">
                <option value="">Selecione...</option>
                ${disciplinasData.map(d => `<option value="${d.codigo}">${d.codigo} - ${d.nome}</option>`).join('')}
            </select>
        </div>

        <div id="prereq-area-${id}" class="prereq-list-container"></div>

        <div class="form-group">
            <label>Turma:</label>
            <input type="text" class="input-turma" placeholder="Ex: VE1">
        </div>
    `;
    container.appendChild(div);
}

function removerBloco(id) {
    const blocks = document.querySelectorAll('.disciplina-block');
    if (blocks.length > 1) document.getElementById(`block-${id}`).remove();
}

function atualizarPrerequisitos(select, id) {
    const codigo = select.value;
    const container = document.getElementById(`prereq-area-${id}`);
    container.innerHTML = '';
    const disciplina = disciplinasData.find(d => String(d.codigo) === String(codigo));

    if (disciplina && disciplina.prerequisitos?.length > 0) {
        const subheader = document.createElement("div");
        subheader.className = "prereq-header-row";
        subheader.innerHTML = "<span>Pré-requisito</span><span>Nota</span>";
        container.appendChild(subheader);

        disciplina.prerequisitos.forEach(codPre => {
            const preObj = disciplinasData.find(d => String(d.codigo) === String(codPre));
            if (!preObj) return;

            const item = document.createElement("div");
            item.className = "prereq-row";
            item.innerHTML = `
                <div class="left-side">
                    <input type="checkbox" id="chk-${id}-${codPre}" onchange="toggleNota(this)">
                    <label for="chk-${id}-${codPre}">${preObj.codigo} - ${preObj.nome}</label>
                </div>
                <div class="right-side">
                    <input type="text" class="input-nota" placeholder="0,00" style="visibility:hidden">
                </div>
            `;
            container.appendChild(item);
        });
    }
}

function toggleNota(checkbox) {
    const notaInput = checkbox.closest('.prereq-row').querySelector('.input-nota');
    notaInput.style.visibility = checkbox.checked ? "visible" : "hidden";
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const sei = document.getElementById('alunoSEI').value || "Não informado";

    let y = 20;
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("UNIVERSIDADE FEDERAL DE MATO GROSSO", 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(12);
    doc.text("REQUERIMENTO DE QUEBRA DE PRÉ-REQUISITO", 105, y, { align: "center" });
    y += 15;

    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Processo SEI: ${sei}`, 15, y);
    y += 10;
    doc.line(15, y, 195, y);
    y += 10;

    document.querySelectorAll(".disciplina-block").forEach((bloco, index) => {
        const discSelect = bloco.querySelector(".select-disciplina");
        if (discSelect.value === "") return;
        const discNome = discSelect.options[discSelect.selectedIndex].text;
        const turma = bloco.querySelector(".input-turma").value || "Não informada";

        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. DISCIPLINA: ${discNome} (Turma: ${turma})`, 15, y);
        y += 7;
        doc.setFont("helvetica", "normal");

        bloco.querySelectorAll(".prereq-row").forEach(row => {
            const chk = row.querySelector("input[type=checkbox]");
            const label = row.querySelector("label").textContent;
            const nota = row.querySelector(".input-nota").value || "0,00";

            const status = chk.checked ? `Cursada (Nota: ${nota})` : "NÃO cursada";
            doc.text(`   - ${label}: ${status}`, 20, y);
            y += 6;
        });
        y += 4;
    });

    doc.save(`Requerimento_Quebra_SEI_${sei.replace(/\//g, '-')}.pdf`);
}

window.onload = carregarDados;