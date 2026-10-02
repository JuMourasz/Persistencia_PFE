/* =========================================================
   dragdrop.js
   Arrastar o papel até a lixeira limpa o localStorage.
   ========================================================= */

const DragDrop = (() => {
  const papel   = document.getElementById("papel");
  const lixeira = document.getElementById("lixeira");
  const zona    = document.getElementById("zonaDrag");

  /* ----- Handlers ----- */
  function aoIniciarArraste(evento) {
    evento.dataTransfer.setData("text/plain", "papel");
    evento.dataTransfer.effectAllowed = "move";
    papel.classList.add("arrastando");
  }

  function aoTerminarArraste() {
    papel.classList.remove("arrastando");
    lixeira.classList.remove("ativa");
  }

  function aoPassarPorCima(evento) {
    evento.preventDefault();
    evento.dataTransfer.dropEffect = "move";
    lixeira.classList.add("ativa");
  }

  function aoSairDeCima() {
    lixeira.classList.remove("ativa");
  }

  function aoSoltar(evento) {
    evento.preventDefault();
    lixeira.classList.remove("ativa");
    papel.classList.remove("arrastando");

    // Animação de descarte
    papel.classList.add("descartado");

    // Limpa o localStorage
    StorageGPS.limpar();

    // Atualiza a UI da última localização
    Geolocalizacao.atualizarUltimaSalva();
    Geolocalizacao.mostrarToast("Localização apagada do armazenamento.", "🗑️");

    // Restaura o papel após a animação
    setTimeout(() => {
      papel.classList.remove("descartado");
    }, 500);
  }

  /* ----- Impede comportamento padrão do drop fora da lixeira ----- */
  function bloquearDropPadrao(evento) {
    evento.preventDefault();
  }

  /* ----- Inicialização ----- */
  function init() {
    papel.addEventListener("dragstart", aoIniciarArraste);
    papel.addEventListener("dragend", aoTerminarArraste);

    lixeira.addEventListener("dragover", aoPassarPorCima);
    lixeira.addEventListener("dragleave", aoSairDeCima);
    lixeira.addEventListener("drop", aoSoltar);

    // Evita que a página "abra" o arquivo solto
    zona.addEventListener("dragover", bloquearDropPadrao);
    zona.addEventListener("drop", bloquearDropPadrao);
    document.body.addEventListener("dragover", bloquearDropPadrao);
    document.body.addEventListener("drop", bloquearDropPadrao);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", DragDrop.init);