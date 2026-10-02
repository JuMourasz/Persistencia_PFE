/* =========================================================
   geolocalizacao.js
   Captura a posição real do usuário via API Geolocation.
   ========================================================= */

const Geolocalizacao = (() => {
  /* ----- Elementos da UI ----- */
  const coordsDisplay = document.getElementById("coordsDisplay");
  const statusMsg     = document.getElementById("statusMsg");
  const ultimaTexto   = document.getElementById("ultimaTexto");
  const ultimaLocal   = document.getElementById("ultimaLocal");
  const gpsCard       = document.getElementById("gpsCard");
  const btnAtualizar  = document.getElementById("btnAtualizar");
  const toastEl       = document.getElementById("toast");

  /* ----- Utilitários ----- */
  function mostrarToast(mensagem, icone = "✅") {
    toastEl.textContent = `${icone}  ${mensagem}`;
    toastEl.classList.add("visivel");
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove("visivel");
    }, 2800);
  }

  function atualizarUltimaSalva() {
    const dados = StorageGPS.obter();
    if (dados) {
      ultimaTexto.innerHTML =
        `Sua última localização salva foi: ` +
        `<strong>${dados.lat.toFixed(6)}, ${dados.lng.toFixed(6)}</strong>`;
      ultimaLocal.classList.add("ativa");
    } else {
      ultimaTexto.textContent = "Nenhuma localização salva ainda.";
      ultimaLocal.classList.remove("ativa");
    }
  }

  /* ----- Estado ----- */
  function setStatus(texto) {
    statusMsg.textContent = texto;
  }

  function setCoords(lat, lng) {
    coordsDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  function limparCoords() {
    coordsDisplay.textContent = "--, --";
  }

  /* ----- Ação principal ----- */
  function buscarLocalizacao() {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocalização não suportada pelo navegador.");
      limparCoords();
      gpsCard.classList.add("erro");
      setTimeout(() => gpsCard.classList.remove("erro"), 500);
      return;
    }

    gpsCard.classList.add("atualizando");
    setStatus("📡 Obtendo sua localização real…");
    limparCoords();

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const { latitude: lat, longitude: lng } = posicao.coords;

        gpsCard.classList.remove("atualizando");
        setCoords(lat, lng);
        setStatus("✅ Localização capturada com sucesso.");

        // Persiste no localStorage
        StorageGPS.salvar(lat, lng);
        atualizarUltimaSalva();
        ultimaLocal.classList.add("pulsar");
        setTimeout(() => ultimaLocal.classList.remove("pulsar"), 900);

        // Atualiza o mapa (se o módulo MapaGPS existir)
        if (window.MapaGPS && typeof MapaGPS.mostrarLocalizacao === "function") {
          MapaGPS.mostrarLocalizacao(lat, lng, "Você está aqui");
        }

        mostrarToast("Localização atualizada!", "📍");
      },
      (erro) => {
        gpsCard.classList.remove("atualizando");
        gpsCard.classList.add("erro");
        setTimeout(() => gpsCard.classList.remove("erro"), 500);

        let msg = "Não foi possível obter sua localização.";
        switch (erro.code) {
          case erro.PERMISSION_DENIED:
            msg = "🚫 Permissão negada. Habilite o acesso à localização.";
            break;
          case erro.POSITION_UNAVAILABLE:
            msg = "📡 Sinal de GPS indisponível.";
            break;
          case erro.TIMEOUT:
            msg = "⏱️ Tempo esgotado ao buscar localização.";
            break;
        }
        setStatus(msg);
        limparCoords();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  /* ----- Inicialização ----- */
  function init() {
    atualizarUltimaSalva();
    btnAtualizar.addEventListener("click", buscarLocalizacao);
    // Busca automaticamente ao carregar
    buscarLocalizacao();
  }

  return {
    init,
    atualizarUltimaSalva,
    mostrarToast,
    buscarLocalizacao,
  };
})();

document.addEventListener("DOMContentLoaded", Geolocalizacao.init);