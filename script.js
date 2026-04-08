let disciplinasData = [];

// =============================
// CARREGAR JSON
// =============================
async function carregarDisciplinasObrigatorias() {
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
}

// =============================
// PRÉ-REQUISITOS
// =============================
function atualizarPrerequisitos(event) {

    const codigo = event.target.value;

    const disciplina = disciplinasData.find(d =>
        String(d.codigo).trim() === String(codigo).trim()
    );

    const container = event.target.closest(".disciplina").querySelector(".prereq-container");
    container.innerHTML = '';

    if (disciplina && disciplina.prerequisitos?.length > 0) {

        disciplina.prerequisitos.forEach(cod => {

            const prereq = disciplinasData.find(d =>
                String(d.codigo).trim() === String(cod).trim()
            );

            if (!prereq) return;

            const div = document.createElement("div");
            div.classList.add("prereq-item");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            const label = document.createElement("label");
            label.textContent = `${prereq.codigo} - ${prereq.nome}`;

            const nota = document.createElement("input");
            nota.type = "text";
            nota.placeholder = "Nota";
            nota.style.display = "none";

            checkbox.addEventListener("change", () => {
                nota.style.display = checkbox.checked ? "inline-block" : "none";
                if (!checkbox.checked) nota.value = "";
            });

            div.appendChild(checkbox);
            div.appendChild(label);
            div.appendChild(nota);

            container.appendChild(div);
        });

    } else {
        container.textContent = "Nenhum pré-requisito";
    }
}

// =============================
// ADD DISCIPLINA
// =============================
function addDisciplina() {

    const container = document.getElementById("disciplinas-container");

    const original = document.querySelector("#disciplinas-container .disciplina");
    const nova = original.cloneNode(true);

    // limpar inputs
    nova.querySelectorAll("input").forEach(input => {
        input.value = "";
        input.style.display = "";
    });

    // reset select
    nova.querySelector(".disciplina-quebrada").selectedIndex = 0;

    // limpar prerequisitos
    const prereqContainer = nova.querySelector(".prereq-container");
    if (prereqContainer) prereqContainer.innerHTML = '';

    // reativar evento
    nova.querySelector(".disciplina-quebrada")
        .addEventListener("change", atualizarPrerequisitos);

    container.appendChild(nova);
}

// =============================
// PDF
// =============================
function gerarPDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 15;

    document.querySelectorAll(".disciplina").forEach((d, i) => {

        const nome = d.querySelector(".disciplina-quebrada").selectedOptions[0]?.text || "-";
        const turma = d.querySelector(".turma").value || "-";

        doc.text(`Solicitação ${i + 1}`, 10, y); y += 6;
        doc.text(`Disciplina: ${nome}`, 10, y); y += 6;

        const prereqs = d.querySelectorAll(".prereq-item");

        if (prereqs.length === 0) {
            doc.text("Nenhum pré-requisito", 10, y);
            y += 6;
        }

        prereqs.forEach(pr => {

            const chk = pr.querySelector("input[type=checkbox]");
            const nota = pr.querySelector("input[type=text]");
            const label = pr.querySelector("label");

            if (chk && label) {

                let texto;

                if (chk.checked) {
                    texto = `${label.textContent} - Cursada (${nota?.value || "-"})`;
                } else {
                    texto = `${label.textContent} - NÃO cursada`;
                }

                doc.text(texto, 10, y);
                y += 6;
            }
        });

        doc.text(`Turma: ${turma}`, 10, y);
        y += 10;
    });

    doc.save("arquivo.pdf");
}

// =============================
// INICIALIZAÇÃO
// =============================
window.addEventListener("DOMContentLoaded", carregarDisciplinasObrigatorias);

// 🔥 IMPORTANTE (resolve teu erro)
window.addDisciplina = addDisciplina;
window.gerarPDF = gerarPDF;