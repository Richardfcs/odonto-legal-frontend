// Script para mostrar/ocultar o menu dropdown
document.querySelectorAll(".fa-pencil-alt").forEach((button) => {
  button.addEventListener("click", function () {
    const dropdown =
      this.closest(".relative").querySelector(".dropdown-content");
    dropdown.classList.toggle("hidden");
  });
});
