/* =========================================================
   storage.js
   Gerencia a persistência da localização no localStorage.
   ========================================================= */

const StorageGPS = (() => {
  const CHAVE = "mini-gps:ultima-localizacao";

  /**
   * Salva latitude e longitude no localStorage.
   */
  function salvar(lat, lng) {
    try {
      const dados = {
        lat: Number(lat),
        lng: Number(lng),
        timestamp: Date.now(),
      };
      localStorage.setItem(CHAVE, JSON.stringify(dados));
      return dados;
    } catch (e) {
      console.warn("Não foi possível salvar no localStorage:", e);
      return null;
    }
  }

  /**
   * Recupera o último dado salvo (ou null).
   */
  function obter() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      const dados = JSON.parse(bruto);
      if (typeof dados.lat !== "number" || typeof dados.lng !== "number") {
        return null;
      }
      return dados;
    } catch (e) {
      console.warn("Dados inválidos no localStorage:", e);
      return null;
    }
  }

  /**
   * Remove o dado salvo.
   */
  function limpar() {
    localStorage.removeItem(CHAVE);
  }

  return { salvar, obter, limpar };
})();