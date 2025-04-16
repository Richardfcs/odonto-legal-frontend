// DROPDOWN FILTRO
function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  // Fecha todos os outros dropdowns
  document.querySelectorAll(".dropdown-content").forEach((d) => {
    if (d.id !== id) d.style.display = "none";
  });
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

// Fecha dropdowns se clicar fora
window.addEventListener("click", function (event) {
  if (!event.target.matches(".dropdown-button")) {
    document
      .querySelectorAll(".dropdown-content")
      .forEach((d) => (d.style.display = "none"));
  }
});

// Ação para opções de evidência
function handleOption(option) {
  alert(`Opção selecionada: ${option}`);
  document.getElementById("evidenciaDropdown").style.display = "none";
}

// Ação para salvar alterações
function salvarAlteracoes() {
  alert("Alterações salvas!");
}

// Script para mostrar/ocultar o menu dropdown
document.querySelectorAll(".fa-pencil-alt").forEach((button) => {
  button.addEventListener("click", function () {
    const dropdown =
      this.closest(".relative").querySelector(".dropdown-content");
    dropdown.classList.toggle("hidden");
  });
});
