let disciplinasData = [];

// Carrega disciplinas do JSON
async function carregarDisciplinasObrigatorias() {
    try {
        const response = await fetch("disciplinas_obrigatorias.json");
        disciplinasData = await response.json();

        document.querySelectorAll(".disciplina-quebrada").forEach(sel => {
            sel.innerHTML = '<option value="">Selecione</option>';
            disciplinasData.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.codigo;
                opt.textContent = `${d.codigo} - ${d.nome}`;
                sel.appendChild(opt);
            });

            sel.addEventListener("change", atualizarPrerequisitos);
        });
    } catch (err) {
        console.error("Erro ao carregar disciplinas:", err);
    }
}

// Atualiza pré-requisitos com checkboxes + nota
function atualizarPrerequisitos(event) {
    const codigo = event.target.value;
    const disciplina = disciplinasData.find(d => d.codigo === codigo);

    const container = event.target.closest(".disciplina").querySelector(".prereq-container");
    container.innerHTML = '';

    if (disciplina && Array.isArray(disciplina.prerequisitos) && disciplina.prerequisitos.length > 0) {
        disciplina.prerequisitos.forEach(cod => {
            const prereq = disciplinasData.find(d => d.codigo === cod);
            if (prereq) {
                const wrapper = document.createElement("div");
                wrapper.classList.add("prereq-item");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.classList.add("prereq-checkbox");
                checkbox.value = prereq.codigo;

                const label = document.createElement("label");
                label.textContent = `${prereq.codigo} - ${prereq.nome}`;

                const notaInput = document.createElement("input");
                notaInput.type = "text";
                notaInput.placeholder = "Nota";
                notaInput.classList.add("nota-prereq");
                notaInput.style.display = "none";

                checkbox.addEventListener("change", () => {
                    notaInput.style.display = checkbox.checked ? "inline-block" : "none";
                });

                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);
                wrapper.appendChild(notaInput);

                container.appendChild(wrapper);
            }
        });
    } else {
        container.textContent = "Nenhum pré-requisito";
    }
}

// Adiciona nova disciplina
function addDisciplina() {
    const container = document.getElementById("disciplinas");
    const nova = container.firstElementChild.cloneNode(true);

    // Limpa todos os inputs
    nova.querySelectorAll("input").forEach(input => {
        input.value = "";
        if (input.classList.contains("turma")) {
            input.placeholder = "Digite a turma"; // garante placeholder no clone
        }
    });

    // Limpa todos os selects (só restou o disciplina-quebrada)
    nova.querySelectorAll("select").forEach(sel => sel.selectedIndex = 0);

    // Limpa os pré-requisitos do clone
    nova.querySelector(".prereq-container").innerHTML = '';

    // Reatribui o evento do select
    nova.querySelector(".disciplina-quebrada").addEventListener("change", atualizarPrerequisitos);

    container.appendChild(nova);
}

// Gera PDF
async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 15;
    const lineHeight = 7;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Solicitação de Quebra de Pré-requisito", 105, y, { align: "center" });
    y += lineHeight * 2;

    const disciplinas = document.querySelectorAll(".disciplina");
    disciplinas.forEach((d, idx) => {
        if (y + 40 > 280) {
            doc.addPage();
            y = 15;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`Solicitação ${idx + 1}:`, 10, y);
        y += lineHeight;

        doc.setFont("helvetica", "normal");
        const disciplinaQuebrada = d.querySelector(".disciplina-quebrada").selectedOptions[0]?.text || "-";
        const turma = d.querySelector(".turma").value || "-";
        doc.text(`Disciplina a ser quebrada: ${disciplinaQuebrada}`, 10, y);
        y += lineHeight;

        const prereqItems = d.querySelectorAll(".prereq-item");
        if (prereqItems.length > 0) {
            prereqItems.forEach(item => {
                const checkbox = item.querySelector(".prereq-checkbox");
                const nota = item.querySelector(".nota-prereq").value || "-";
                if (checkbox.checked) {
                    const label = item.querySelector("label").textContent;
                    doc.text(`Pré-requisito: ${label} | Nota: ${nota}`, 10, y);
                    y += lineHeight;
                }
            });
        } else {
            doc.text("Nenhum pré-requisito", 10, y);
            y += lineHeight;
        }

        doc.text(`Turma: ${turma}`, 10, y);
        y += lineHeight * 2;
    });

    doc.save("quebra_pre_requisito.pdf");
}

// Inicializa
window.addEventListener("DOMContentLoaded", carregarDisciplinasObrigatorias);
