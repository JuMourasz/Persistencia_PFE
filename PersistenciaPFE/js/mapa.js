/* =========================================================
   mapa.js
   Cria o mapa Leaflet, mostra a localização do usuário
   e permite buscar endereços (Nominatim/OpenStreetMap).
   ========================================================= */

const MapaGPS = (() => {
  /* ----- Elementos ----- */
  const mapaEl         = document.getElementById("mapaLeaflet");
  const formBusca      = document.getElementById("buscaForm");
  const inputBusca     = document.getElementById("buscaInput");
  const btnBusca       = document.getElementById("buscaBtn");
  const listaResult    = document.getElementById("buscaResultados");
  const toastEl        = document.getElementById("toast");

  /* ----- Estado ----- */
  let mapa = null;
  let marcadorUsuario = null;
  let marcadorBusca = null;

  /* ----- Utilitários ----- */
  function mostrarToast(mensagem, icone = "✅") {
    if (!toastEl) return;
    toastEl.textContent = `${icone}  ${mensagem}`;
    toastEl.classList.add("visivel");
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      toastEl.classList.remove("visivel");
    }, 2800);
  }

  /* ----- Ícones personalizados ----- */
  function criarIconeUsuario() {
    return L.divIcon({
      className: "icone-usuario-wrapper",
      html: `
        <div class="marcador-gps">
          <span class="marcador-gps__onda"></span>
          <span class="marcador-gps__ponto"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  }

  function criarIconeBusca() {
    return L.divIcon({
      className: "icone-busca-wrapper",
      html: `<div class="marcador-busca"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -11],
    });
  }

  /* ----- Inicialização do mapa ----- */
  function init() {
    if (!mapaEl || typeof L === "undefined") {
      console.warn("Leaflet não carregou ou elemento do mapa não existe.");
      return;
    }

    // Mapa com centro inicial em visão global (será reposicionado depois)
    mapa = L.map("mapaLeaflet", {
      center: [-15.793889, -47.882778], // Brasília como fallback
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    });

    // Camada de tiles do OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);

    // Ajusta tamanho após render (evita bug visual do Leaflet)
    setTimeout(() => mapa.invalidateSize(), 200);

    // Liga eventos
    formBusca.addEventListener("submit", aoSubmeterBusca);
    listaResult.addEventListener("click", aoClicarResultado);

    // Se já existe localização salva no localStorage, mostra no mapa
    const salvo = typeof StorageGPS !== "undefined" ? StorageGPS.obter() : null;
    if (salvo) {
      mostrarLocalizacao(salvo.lat, salvo.lng, "Última localização salva", 13);
    }
  }

  /* ----- Mostrar localização do usuário no mapa ----- */
  function mostrarLocalizacao(lat, lng, tituloPopup = "Você está aqui", zoom = 15) {
    if (!mapa) return;

    // Remove marcador anterior do usuário
    if (marcadorUsuario) {
      mapa.removeLayer(marcadorUsuario);
    }

    marcadorUsuario = L.marker([lat, lng], {
      icon: criarIconeUsuario(),
      zIndexOffset: 1000,
    }).addTo(mapa);

    marcadorUsuario
      .bindPopup(
        `<strong>${tituloPopup}</strong>
         Lat: ${lat.toFixed(6)}<br>
         Lng: ${lng.toFixed(6)}`
      )
      .openPopup();

    mapa.setView([lat, lng], zoom);
  }

  /* ----- Busca por endereço (Nominatim) ----- */
  async function buscarEndereco(termo) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(termo)}`;

    const resp = await fetch(url, {
      headers: { "Accept-Language": "pt-BR" },
    });

    if (!resp.ok) throw new Error("Erro na busca");
    return resp.json();
  }

  /* ----- Handlers ----- */
  async function aoSubmeterBusca(evento) {
    evento.preventDefault();
    const termo = inputBusca.value.trim();
    if (!termo) return;

    listaResult.innerHTML = "";
    listaResult.classList.remove("aberto");
    btnBusca.disabled = true;
    btnBusca.textContent = "…";

    try {
      const resultados = await buscarEndereco(termo);

      if (!resultados.length) {
        listaResult.innerHTML =
          `<li><strong>Nada encontrado</strong><small>Tente outro termo.</small></li>`;
        listaResult.classList.add("aberto");
        return;
      }

      listaResult.innerHTML = resultados
        .map((r) => {
          const nome = r.display_name.split(",")[0] || r.display_name;
          const resto = r.display_name.split(",").slice(1).join(",").trim();
          return `
            <li data-lat="${r.lat}" data-lng="${r.lon}" data-nome="${nome}">
              <strong>${nome}</strong>
              <small>${resto}</small>
            </li>
          `;
        })
        .join("");
      listaResult.classList.add("aberto");
    } catch (e) {
      console.error(e);
      mostrarToast("Erro ao buscar endereço.", "⚠️");
    } finally {
      btnBusca.disabled = false;
      btnBusca.textContent = "Buscar";
    }
  }

  function aoClicarResultado(evento) {
    const li = evento.target.closest("li");
    if (!li || !li.dataset.lat) return;

    const lat = Number(li.dataset.lat);
    const lng = Number(li.dataset.lng);
    const nome = li.dataset.nome;

    // Remove marcador de busca anterior
    if (marcadorBusca) {
      mapa.removeLayer(marcadorBusca);
    }

    marcadorBusca = L.marker([lat, lng], { icon: criarIconeBusca() })
      .addTo(mapa)
      .bindPopup(
        `<strong>🔎 ${nome}</strong>
         Lat: ${lat.toFixed(6)}<br>
         Lng: ${lng.toFixed(6)}`
      )
      .openPopup();

    mapa.setView([lat, lng], 14);

    listaResult.classList.remove("aberto");
    inputBusca.value = nome;
    mostrarToast(`Local encontrado: ${nome}`, "🔎");
  }

  /* ----- API pública ----- */
  return {
    init,
    mostrarLocalizacao,
  };
})();

document.addEventListener("DOMContentLoaded", MapaGPS.init);