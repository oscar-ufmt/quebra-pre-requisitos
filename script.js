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

            if (prereq) {

                const wrapper = document.createElement("div");

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

                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);
                wrapper.appendChild(nota);

                container.appendChild(wrapper);
            }
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

    nova.querySelectorAll("input").forEach(input => {
        input.value = "";
        if (input.type === "text") input.style.display = "";
    });

    nova.querySelector(".disciplina-quebrada").selectedIndex = 0;

    const prereqContainer = nova.querySelector(".prereq-container");
    if (prereqContainer) prereqContainer.innerHTML = '';

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

        doc.text(`Solicitação ${i+1}`, 10, y); y+=6;
        doc.text(`Disciplina: ${nome}`, 10, y); y+=6;

        d.querySelectorAll(".prereq-item, div").forEach(pr => {

            const chk = pr.querySelector("input[type=checkbox]");
            const nota = pr.querySelector("input[type=text]");
            const label = pr.querySelector("label");

            if (chk && label) {
                let texto = chk.checked
                    ? `${label.textContent} - Cursada (${nota?.value || "-"})`
                    : `${label.textContent} - NÃO cursada`;

                doc.text(texto, 10, y);
                y+=6;
            }
        });

        doc.text(`Turma: ${turma}`, 10, y);
        y+=10;
    });

    doc.save("arquivo.pdf");
}

// =============================
window.addEventListener("DOMContentLoaded", carregarDisciplinasObrigatorias);