const timerRecupero = document.querySelector("#timerRecupero");
const titoloRecupero = document.querySelector("#titoloRecupero");
const tempoRecupero = document.querySelector("#tempoRecupero");
const pulsanteAnnulla = document.querySelector("#annullaRecupero");

const selettoriGiorno = document.querySelectorAll(".selettore-giorno");
const contenutiGiorno = document.querySelectorAll(".contenuto-giorno");

const listaStorico = document.querySelector("#listaStorico");
const pulsanteResetStorico = document.querySelector("#resetStorico");
const selettoreEsercizio = document.querySelector("#selettoreEsercizio");
const graficoPesi = document.querySelector("#graficoPesi");

const chiaveAllenamenti = "allenamentiCompletati";
const chiaveStorico = "storicoAllenamenti";
const chiavePesi = "pesiUsati";
const chiaveModificheScheda = "modificheScheda";
const chiaveEserciziPersonalizzati = "eserciziPersonalizzati";

let allenamentiSalvati = {};
let storicoAllenamenti = [];
let pesiUsati = {};
let modificheScheda = {};
let eserciziPersonalizzati = [];
let fineRecupero;
let intervalloRecupero;

function leggiDatiSalvati(chiave, valorePredefinito) {
  try {
    const dati = JSON.parse(
      localStorage.getItem(chiave) || JSON.stringify(valorePredefinito)
    );

    return dati;
  } catch {
    return valorePredefinito;
  }
}

allenamentiSalvati = leggiDatiSalvati(chiaveAllenamenti, {});
storicoAllenamenti = leggiDatiSalvati(chiaveStorico, []);
pesiUsati = leggiDatiSalvati(chiavePesi, {});
modificheScheda = leggiDatiSalvati(chiaveModificheScheda, {});
eserciziPersonalizzati = leggiDatiSalvati(
  chiaveEserciziPersonalizzati,
  []
);

if (Array.isArray(allenamentiSalvati)) {
  allenamentiSalvati = { 1: allenamentiSalvati };
}

if (!Array.isArray(storicoAllenamenti)) {
  storicoAllenamenti = [];
}

if (typeof pesiUsati !== "object" || pesiUsati === null) {
  pesiUsati = {};
}

if (typeof modificheScheda !== "object" || modificheScheda === null) {
  modificheScheda = {};
}

if (!Array.isArray(eserciziPersonalizzati)) {
  eserciziPersonalizzati = [];
}

function tuttiEsercizi() {
  return [...document.querySelectorAll(".esercizio")];
}

function eserciziDelGiorno(giorno) {
  return tuttiEsercizi().filter((esercizio) => {
    return esercizio.closest(".contenuto-giorno").dataset.giorno === giorno;
  });
}

function chiaveModifica(esercizio) {
  const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;

  return `${giorno}-${esercizio.dataset.esercizio}`;
}

function nomeDaEsercizio(esercizio) {
  return esercizio.closest("label").querySelector("strong").textContent.trim();
}

function dettagliEsercizio(esercizio) {
  const etichetta = esercizio.closest("label");

  const righeTesto = [...etichetta.childNodes].filter((nodo) => {
    return nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim() !== "";
  });

  return {
    nome: nomeDaEsercizio(esercizio),
    serie: righeTesto[0].textContent.trim(),
    recupero: righeTesto[1].textContent
      .trim()
      .replace("Recupero:", "")
      .trim()
  };
}

function secondiDalRecupero(recupero) {
  const testo = recupero.toLowerCase();

  const formatoMinutiSecondi = testo.match(/(\d+)\s*:\s*(\d+)/);

  if (formatoMinutiSecondi) {
    return Number(formatoMinutiSecondi[1]) * 60 +
      Number(formatoMinutiSecondi[2]);
  }

  const minuti = testo.match(/(\d+)\s*min/);
  const secondi = testo.match(/(\d+)\s*sec/);

  const totale = (minuti ? Number(minuti[1]) * 60 : 0) +
    (secondi ? Number(secondi[1]) : 0);

  return totale > 0 ? totale : null;
}

function salvaAllenamenti() {
  localStorage.setItem(
    chiaveAllenamenti,
    JSON.stringify(allenamentiSalvati)
  );
}

function salvaPesiUsati() {
  localStorage.setItem(chiavePesi, JSON.stringify(pesiUsati));
}

function salvaModificheScheda() {
  localStorage.setItem(
    chiaveModificheScheda,
    JSON.stringify(modificheScheda)
  );
}

function salvaEserciziPersonalizzati() {
  localStorage.setItem(
    chiaveEserciziPersonalizzati,
    JSON.stringify(eserciziPersonalizzati)
  );
}

function aggiornaStatoGiorno(giorno) {
  allenamentiSalvati[giorno] = eserciziDelGiorno(giorno)
    .filter((esercizio) => esercizio.checked)
    .map((esercizio) => esercizio.dataset.esercizio);

  salvaAllenamenti();
  aggiornaPulsanteCompleta(giorno);
}

function aggiornaPulsanteCompleta(giorno) {
  const esercizi = eserciziDelGiorno(giorno);

  const pulsante = document.querySelector(
    `.completa-giorno[data-giorno="${giorno}"]`
  );

  const completati = esercizi.filter(
    (esercizio) => esercizio.checked
  ).length;

  if (completati === esercizi.length) {
    pulsante.textContent = `Giorno ${giorno} completato ✓`;
    pulsante.disabled = true;
  } else {
    pulsante.textContent =
      `Completa tutti gli esercizi (${completati}/${esercizi.length})`;

    pulsante.disabled = false;
  }
}

function formattaTempo(secondi) {
  const minuti = Math.floor(secondi / 60);
  const secondiRimanenti = secondi % 60;

  return `${minuti}:${String(secondiRimanenti).padStart(2, "0")}`;
}

function aggiornaTimer() {
  const secondiRimanenti = Math.max(
    0,
    Math.ceil((fineRecupero - Date.now()) / 1000)
  );

  tempoRecupero.textContent = formattaTempo(secondiRimanenti);

  if (secondiRimanenti === 0) {
    clearInterval(intervalloRecupero);
    titoloRecupero.textContent = "Recupero terminato ✓";
    pulsanteAnnulla.textContent = "Chiudi timer";
  }
}

function avviaRecupero(secondi, nomeEsercizio) {
  clearInterval(intervalloRecupero);

  timerRecupero.hidden = false;
  titoloRecupero.textContent = `Recupero: ${nomeEsercizio}`;
  pulsanteAnnulla.textContent = "Annulla timer";

  fineRecupero = Date.now() + secondi * 1000;
  aggiornaTimer();

  intervalloRecupero = setInterval(aggiornaTimer, 1000);
}

function pesiDelGiorno(giorno) {
  return eserciziDelGiorno(giorno)
    .map((esercizio) => {
      const chiavePeso = `${giorno}-${esercizio.dataset.esercizio}`;

      return {
        esercizio: nomeDaEsercizio(esercizio),
        peso: pesiUsati[chiavePeso] || ""
      };
    })
    .filter((esercizio) => esercizio.peso !== "");
}

function mostraStorico() {
  listaStorico.textContent = "";

  if (storicoAllenamenti.length === 0) {
    const voceVuota = document.createElement("li");
    voceVuota.textContent = "Nessun allenamento registrato.";
    listaStorico.appendChild(voceVuota);
    return;
  }

  storicoAllenamenti.forEach((allenamento) => {
    const voce = document.createElement("li");

    const pesiRegistrati = (allenamento.pesi || [])
      .map((peso) => `${peso.esercizio}: ${peso.peso} kg`)
      .join(" · ");

    voce.textContent =
      `Giorno ${allenamento.giorno} completato — ${allenamento.data}` +
      (pesiRegistrati ? ` — ${pesiRegistrati}` : "");

    listaStorico.appendChild(voce);
  });
}

function registraAllenamentoCompletato(giorno) {
  const data = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  storicoAllenamenti.unshift({
    giorno: giorno,
    data: data,
    pesi: pesiDelGiorno(giorno)
  });

  localStorage.setItem(
    chiaveStorico,
    JSON.stringify(storicoAllenamenti)
  );

  mostraStorico();
  aggiornaSelettoreGrafico();
}

function creaElementoSvg(nome, attributi) {
  const elemento = document.createElementNS(
    "http://www.w3.org/2000/svg",
    nome
  );

  Object.entries(attributi).forEach(([attributo, valore]) => {
    elemento.setAttribute(attributo, valore);
  });

  return elemento;
}

function datiEsercizio(nomeEsercizio) {
  return storicoAllenamenti
    .slice()
    .reverse()
    .flatMap((allenamento) => {
      return (allenamento.pesi || [])
        .filter((peso) => peso.esercizio === nomeEsercizio)
        .map((peso) => ({
          data: allenamento.data,
          peso: Number(peso.peso)
        }));
    });
}

function disegnaGrafico() {
  graficoPesi.textContent = "";

  const nomeEsercizio = selettoreEsercizio.value;

  if (!nomeEsercizio) {
    graficoPesi.textContent =
      "Completa un allenamento con almeno un peso per vedere il grafico.";
    return;
  }

  const dati = datiEsercizio(nomeEsercizio);

  if (dati.length === 0) {
    graficoPesi.textContent =
      "Non sono ancora disponibili dati per questo esercizio.";
    return;
  }

  const larghezza = 560;
  const altezza = 280;
  const margine = 45;

  const pesi = dati.map((dato) => dato.peso);
  const pesoMinimo = Math.max(0, Math.min(...pesi) - 5);
  const pesoMassimo = Math.max(...pesi) + 5;
  const intervalloPesi = pesoMassimo - pesoMinimo || 1;

  const svg = creaElementoSvg("svg", {
    viewBox: `0 0 ${larghezza} ${altezza}`,
    role: "img",
    "aria-label": `Grafico dei pesi per ${nomeEsercizio}`
  });

  svg.style.width = "100%";
  svg.style.height = "auto";

  svg.appendChild(creaElementoSvg("line", {
    x1: margine,
    y1: altezza - margine,
    x2: larghezza - 10,
    y2: altezza - margine,
    stroke: "#64748b"
  }));

  svg.appendChild(creaElementoSvg("line", {
    x1: margine,
    y1: 15,
    x2: margine,
    y2: altezza - margine,
    stroke: "#64748b"
  }));

  for (let indice = 0; indice <= 4; indice += 1) {
    const valore = pesoMinimo + (intervalloPesi / 4) * indice;
    const y = altezza - margine -
      ((valore - pesoMinimo) / intervalloPesi) * (altezza - margine - 25);

    svg.appendChild(creaElementoSvg("line", {
      x1: margine,
      y1: y,
      x2: larghezza - 10,
      y2: y,
      stroke: "#e2e8f0"
    }));

    const etichetta = creaElementoSvg("text", {
      x: 5,
      y: y + 4,
      fill: "#475569",
      "font-size": "12"
    });

    etichetta.textContent = `${valore.toFixed(1)} kg`;
    svg.appendChild(etichetta);
  }

  const punti = dati.map((dato, indice) => {
    const x = dati.length === 1
      ? larghezza / 2
      : margine + (
        indice * (larghezza - margine - 25) / (dati.length - 1)
      );

    const y = altezza - margine -
      ((dato.peso - pesoMinimo) / intervalloPesi) * (altezza - margine - 25);

    return { x, y, ...dato };
  });

  svg.appendChild(creaElementoSvg("polyline", {
    points: punti.map((punto) => `${punto.x},${punto.y}`).join(" "),
    fill: "none",
    stroke: "#2563eb",
    "stroke-width": "3"
  }));

  punti.forEach((punto) => {
    svg.appendChild(creaElementoSvg("circle", {
      cx: punto.x,
      cy: punto.y,
      r: 5,
      fill: "#2563eb"
    }));

    const peso = creaElementoSvg("text", {
      x: punto.x,
      y: punto.y - 10,
      fill: "#1e3a8a",
      "font-size": "12",
      "text-anchor": "middle"
    });

    peso.textContent = `${punto.peso} kg`;
    svg.appendChild(peso);

    const data = creaElementoSvg("text", {
      x: punto.x,
      y: altezza - 18,
      fill: "#475569",
      "font-size": "11",
      "text-anchor": "middle"
    });

    data.textContent = punto.data;
    svg.appendChild(data);
  });

  graficoPesi.appendChild(svg);
}

function aggiornaSelettoreGrafico() {
  const eserciziConPesi = [
    ...new Set(
      storicoAllenamenti.flatMap((allenamento) =>
        (allenamento.pesi || []).map((peso) => peso.esercizio)
      )
    )
  ].sort();

  const esercizioSelezionato = selettoreEsercizio.value;

  selettoreEsercizio.textContent = "";

  if (eserciziConPesi.length === 0) {
    const opzioneVuota = document.createElement("option");
    opzioneVuota.value = "";
    opzioneVuota.textContent = "Nessun esercizio disponibile";
    selettoreEsercizio.appendChild(opzioneVuota);
    disegnaGrafico();
    return;
  }

  eserciziConPesi.forEach((nomeEsercizio) => {
    const opzione = document.createElement("option");
    opzione.value = nomeEsercizio;
    opzione.textContent = nomeEsercizio;
    selettoreEsercizio.appendChild(opzione);
  });

  selettoreEsercizio.value = eserciziConPesi.includes(esercizioSelezionato)
    ? esercizioSelezionato
    : eserciziConPesi[0];

  disegnaGrafico();
}

function applicaModifica(esercizio, modifica) {
  const etichetta = esercizio.closest("label");

  const righeTesto = [...etichetta.childNodes].filter((nodo) => {
    return nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim() !== "";
  });

  etichetta.querySelector("strong").textContent = modifica.nome;
  righeTesto[0].textContent = `\n        ${modifica.serie}`;
  righeTesto[1].textContent = `\n        Recupero: ${modifica.recupero}`;

  const elementoLista = esercizio.closest("li");
  const pulsanteRecupero = elementoLista.querySelector(".avvia-recupero");

  pulsanteRecupero.dataset.nome = modifica.nome;
  pulsanteRecupero.textContent =
    `Avvia recupero — ${modifica.recupero}`;

  const secondi = secondiDalRecupero(modifica.recupero);

  if (secondi !== null) {
    pulsanteRecupero.dataset.secondi = secondi;
  }
}

function aggiungiCampoPeso(esercizio) {
  const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;
  const chiavePeso = `${giorno}-${esercizio.dataset.esercizio}`;
  const elementoLista = esercizio.closest("li");
  const pulsanteRecupero = elementoLista.querySelector(".avvia-recupero");

  const contenitorePeso = document.createElement("div");
  contenitorePeso.className = "contenitore-peso";

  const etichettaPeso = document.createElement("label");
  etichettaPeso.textContent = "Peso usato (kg): ";

  const campoPeso = document.createElement("input");
  campoPeso.type = "number";
  campoPeso.min = "0";
  campoPeso.step = "0.5";
  campoPeso.className = "campo-peso";
  campoPeso.placeholder = "es. 20";
  campoPeso.value = pesiUsati[chiavePeso] || "";

  campoPeso.addEventListener("input", () => {
    if (campoPeso.value === "") {
      delete pesiUsati[chiavePeso];
    } else {
      pesiUsati[chiavePeso] = campoPeso.value;
    }

    salvaPesiUsati();
  });

  etichettaPeso.appendChild(campoPeso);
  contenitorePeso.appendChild(etichettaPeso);

  elementoLista.insertBefore(contenitorePeso, pulsanteRecupero);
}

function aggiungiPulsanteModifica(esercizio) {
  const elementoLista = esercizio.closest("li");
  const contenitorePeso = elementoLista.querySelector(".contenitore-peso");

  const pulsanteModifica = document.createElement("button");
  pulsanteModifica.type = "button";
  pulsanteModifica.className = "modifica-esercizio";
  pulsanteModifica.textContent = "Modifica esercizio";

  pulsanteModifica.addEventListener("click", () => {
    const dettagli = dettagliEsercizio(esercizio);

    const nome = window.prompt("Nome dell'esercizio:", dettagli.nome);

    if (nome === null) {
      return;
    }

    const serie = window.prompt(
      "Serie e ripetizioni:",
      dettagli.serie
    );

    if (serie === null) {
      return;
    }

    const recupero = window.prompt(
      "Recupero (esempio: 1 min e 30 sec):",
      dettagli.recupero
    );

    if (recupero === null) {
      return;
    }

    if (!nome.trim() || !serie.trim() || !recupero.trim()) {
      window.alert("Nome, serie e recupero non possono essere vuoti.");
      return;
    }

    if (secondiDalRecupero(recupero) === null) {
      window.alert(
        "Usa un formato come: 1 min, 30 sec o 1 min e 30 sec."
      );
      return;
    }

    const modifica = {
      nome: nome.trim(),
      serie: serie.trim(),
      recupero: recupero.trim()
    };

    modificheScheda[chiaveModifica(esercizio)] = modifica;

    salvaModificheScheda();
    applicaModifica(esercizio, modifica);
  });

  elementoLista.insertBefore(pulsanteModifica, contenitorePeso);
}

function inizializzaEsercizio(esercizio) {
  if (esercizio.dataset.inizializzato === "si") {
    return;
  }

  esercizio.dataset.inizializzato = "si";

  const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;
  const completati = allenamentiSalvati[giorno] || [];
  const modificaSalvata = modificheScheda[chiaveModifica(esercizio)];

  if (modificaSalvata) {
    applicaModifica(esercizio, modificaSalvata);
  }

  esercizio.checked = completati.includes(esercizio.dataset.esercizio);

  esercizio.addEventListener("change", () => {
    aggiornaStatoGiorno(giorno);
  });

  const pulsanteRecupero = esercizio
    .closest("li")
    .querySelector(".avvia-recupero");

  pulsanteRecupero.addEventListener("click", () => {
    avviaRecupero(
      Number(pulsanteRecupero.dataset.secondi),
      pulsanteRecupero.dataset.nome
    );
  });

  aggiungiCampoPeso(esercizio);
  aggiungiPulsanteModifica(esercizio);
}

function creaRigaEsercizio(esercizioPersonalizzato) {
  const elementoLista = document.createElement("li");
  const etichetta = document.createElement("label");

  const casella = document.createElement("input");
  casella.type = "checkbox";
  casella.className = "esercizio";
  casella.dataset.esercizio = esercizioPersonalizzato.id;

  const nome = document.createElement("strong");
  nome.textContent = esercizioPersonalizzato.nome;

  const pulsanteRecupero = document.createElement("button");
  pulsanteRecupero.type = "button";
  pulsanteRecupero.className = "avvia-recupero";
  pulsanteRecupero.dataset.nome = esercizioPersonalizzato.nome;
  pulsanteRecupero.dataset.secondi =
    secondiDalRecupero(esercizioPersonalizzato.recupero);

  pulsanteRecupero.textContent =
    `Avvia recupero — ${esercizioPersonalizzato.recupero}`;

  etichetta.appendChild(casella);
  etichetta.appendChild(document.createTextNode(" "));
  etichetta.appendChild(nome);
  etichetta.appendChild(document.createElement("br"));
  etichetta.appendChild(
    document.createTextNode(`\n        ${esercizioPersonalizzato.serie}`)
  );
  etichetta.appendChild(document.createElement("br"));
  etichetta.appendChild(
    document.createTextNode(
      `\n        Recupero: ${esercizioPersonalizzato.recupero}`
    )
  );

  elementoLista.appendChild(etichetta);
  elementoLista.appendChild(pulsanteRecupero);

  return elementoLista;
}

function ripristinaEserciziPersonalizzati() {
  eserciziPersonalizzati.forEach((esercizioPersonalizzato) => {
    const sezione = document.querySelector(
      `.contenuto-giorno[data-giorno="${esercizioPersonalizzato.giorno}"]`
    );

    if (!sezione) {
      return;
    }

    const elenco = sezione.querySelector("ul");
    elenco.appendChild(creaRigaEsercizio(esercizioPersonalizzato));
  });
}

function aggiungiPulsanteNuovoEsercizio(sezione) {
  const giorno = sezione.dataset.giorno;
  const pulsanteCompleta = sezione.querySelector(".completa-giorno");

  const pulsante = document.createElement("button");
  pulsante.type = "button";
  pulsante.className = "aggiungi-esercizio";
  pulsante.textContent = "Aggiungi esercizio";

  pulsante.addEventListener("click", () => {
    const nome = window.prompt("Nome dell'esercizio:");

    if (nome === null || !nome.trim()) {
      return;
    }

    const serie = window.prompt(
      "Serie e ripetizioni:",
      "3 serie × 10 ripetizioni"
    );

    if (serie === null || !serie.trim()) {
      return;
    }

    const recupero = window.prompt(
      "Recupero (esempio: 1 min e 30 sec):",
      "1 min"
    );

    if (recupero === null || !recupero.trim()) {
      return;
    }

    if (secondiDalRecupero(recupero) === null) {
      window.alert(
        "Usa un formato come: 1 min, 30 sec o 1 min e 30 sec."
      );
      return;
    }

    const nuovoEsercizio = {
      id: `personalizzato-${Date.now()}`,
      giorno: giorno,
      nome: nome.trim(),
      serie: serie.trim(),
      recupero: recupero.trim()
    };

    eserciziPersonalizzati.push(nuovoEsercizio);
    salvaEserciziPersonalizzati();

    const elenco = sezione.querySelector("ul");
    const riga = creaRigaEsercizio(nuovoEsercizio);

    elenco.appendChild(riga);
    inizializzaEsercizio(riga.querySelector(".esercizio"));

    aggiornaPulsanteCompleta(giorno);
  });

  sezione.insertBefore(pulsante, pulsanteCompleta);
}

ripristinaEserciziPersonalizzati();

tuttiEsercizi().forEach(inizializzaEsercizio);

contenutiGiorno.forEach(aggiungiPulsanteNuovoEsercizio);

document.querySelectorAll(".completa-giorno").forEach((pulsante) => {
  pulsante.addEventListener("click", () => {
    const giorno = pulsante.dataset.giorno;

    eserciziDelGiorno(giorno).forEach((esercizio) => {
      esercizio.checked = true;
    });

    aggiornaStatoGiorno(giorno);
    registraAllenamentoCompletato(giorno);
  });
});

document.querySelectorAll(".ricomincia-giorno").forEach((pulsante) => {
  pulsante.addEventListener("click", () => {
    const giorno = pulsante.dataset.giorno;

    eserciziDelGiorno(giorno).forEach((esercizio) => {
      esercizio.checked = false;
    });

    aggiornaStatoGiorno(giorno);
  });
});

pulsanteAnnulla.addEventListener("click", () => {
  clearInterval(intervalloRecupero);
  timerRecupero.hidden = true;
});

selettoriGiorno.forEach((selettore) => {
  selettore.addEventListener("click", () => {
    const giornoScelto = selettore.dataset.giorno;

    selettoriGiorno.forEach((pulsante) => {
      pulsante.classList.toggle(
        "giorno-attivo",
        pulsante === selettore
      );
    });

    contenutiGiorno.forEach((contenuto) => {
      contenuto.hidden = contenuto.dataset.giorno !== giornoScelto;
    });
  });
});

selettoreEsercizio.addEventListener("change", disegnaGrafico);

pulsanteResetStorico.addEventListener("click", () => {
  const conferma = window.confirm(
    "Vuoi cancellare definitivamente tutto lo storico degli allenamenti?"
  );

  if (!conferma) {
    return;
  }

  storicoAllenamenti = [];
  localStorage.removeItem(chiaveStorico);

  mostraStorico();
  aggiornaSelettoreGrafico();
});

document.querySelectorAll(".completa-giorno").forEach((pulsante) => {
  aggiornaPulsanteCompleta(pulsante.dataset.giorno);
});

mostraStorico();
aggiornaSelettoreGrafico();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
const chiaveEserciziNascosti = "eserciziNascosti";
let eserciziNascosti = leggiDatiSalvati(chiaveEserciziNascosti, []);

if (!Array.isArray(eserciziNascosti)) {
  eserciziNascosti = [];
}

function chiaveEsercizioNascosto(esercizio) {
  const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;

  return `${giorno}-${esercizio.dataset.esercizio}`;
}

function salvaEserciziNascosti() {
  localStorage.setItem(
    chiaveEserciziNascosti,
    JSON.stringify(eserciziNascosti)
  );
}

function aggiungiPulsanteElimina(esercizio) {
  const elementoLista = esercizio.closest("li");

  if (elementoLista.querySelector(".elimina-esercizio")) {
    return;
  }

  const pulsanteElimina = document.createElement("button");
  pulsanteElimina.type = "button";
  pulsanteElimina.className = "elimina-esercizio";
  pulsanteElimina.textContent = "Elimina esercizio";

  pulsanteElimina.addEventListener("click", () => {
    const nome = nomeDaEsercizio(esercizio);

    const conferma = window.confirm(
      `Vuoi rimuovere "${nome}" dalla scheda?`
    );

    if (!conferma) {
      return;
    }

    const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;
    const idEsercizio = esercizio.dataset.esercizio;
    const chiaveNascosto = chiaveEsercizioNascosto(esercizio);
    const chiavePeso = `${giorno}-${idEsercizio}`;

    if (!eserciziNascosti.includes(chiaveNascosto)) {
      eserciziNascosti.push(chiaveNascosto);
      salvaEserciziNascosti();
    }

    eserciziPersonalizzati = eserciziPersonalizzati.filter((esercizioSalvato) => {
      return !(
        esercizioSalvato.giorno === giorno &&
        esercizioSalvato.id === idEsercizio
      );
    });

    salvaEserciziPersonalizzati();

    allenamentiSalvati[giorno] = (allenamentiSalvati[giorno] || [])
      .filter((id) => id !== idEsercizio);

    delete pesiUsati[chiavePeso];
    delete modificheScheda[chiaveNascosto];

    salvaAllenamenti();
    salvaPesiUsati();
    salvaModificheScheda();

    elementoLista.remove();
    aggiornaPulsanteCompleta(giorno);
  });

  elementoLista.appendChild(pulsanteElimina);
}

tuttiEsercizi().forEach((esercizio) => {
  const chiaveNascosto = chiaveEsercizioNascosto(esercizio);

  if (eserciziNascosti.includes(chiaveNascosto)) {
    esercizio.closest("li").remove();
  } else {
    aggiungiPulsanteElimina(esercizio);
  }
});

const osservatoreEsercizi = new MutationObserver((modifiche) => {
  modifiche.forEach((modifica) => {
    modifica.addedNodes.forEach((nodo) => {
      if (!(nodo instanceof HTMLElement)) {
        return;
      }

      nodo.querySelectorAll(".esercizio").forEach((esercizio) => {
        aggiungiPulsanteElimina(esercizio);
      });
    });
  });
});

osservatoreEsercizi.observe(document.querySelector("main"), {
  childList: true,
  subtree: true
});
const chiaveEserciziRimossi = "eserciziRimossi";
let eserciziRimossi = leggiDatiSalvati(chiaveEserciziRimossi, []);

if (!Array.isArray(eserciziRimossi)) {
  eserciziRimossi = [];
}

function salvaEserciziRimossi() {
  localStorage.setItem(
    chiaveEserciziRimossi,
    JSON.stringify(eserciziRimossi)
  );
}

const sezioneRimossi = document.createElement("section");
sezioneRimossi.id = "eserciziRimossi";

const titoloRimossi = document.createElement("h2");
titoloRimossi.textContent = "Esercizi rimossi";

const listaRimossi = document.createElement("ul");

sezioneRimossi.appendChild(titoloRimossi);
sezioneRimossi.appendChild(listaRimossi);

document.querySelector("main").after(sezioneRimossi);

function mostraEserciziRimossi() {
  listaRimossi.textContent = "";

  if (eserciziRimossi.length === 0) {
    const voceVuota = document.createElement("li");
    voceVuota.textContent = "Nessun esercizio nel cestino.";
    listaRimossi.appendChild(voceVuota);
    return;
  }

  eserciziRimossi.forEach((esercizioRimosso) => {
    const voce = document.createElement("li");

    const testo = document.createElement("span");
    testo.textContent =
      `Giorno ${esercizioRimosso.giorno} — ${esercizioRimosso.nome}`;

    const pulsanteRipristina = document.createElement("button");
    pulsanteRipristina.type = "button";
    pulsanteRipristina.className = "ripristina-esercizio";
    pulsanteRipristina.textContent = "Ripristina";

    pulsanteRipristina.addEventListener("click", () => {
      const chiaveNascosto =
        `${esercizioRimosso.giorno}-${esercizioRimosso.id}`;

      eserciziNascosti = eserciziNascosti.filter(
        (chiave) => chiave !== chiaveNascosto
      );

      if (
        esercizioRimosso.personalizzato &&
        !eserciziPersonalizzati.some(
          (esercizio) => esercizio.id === esercizioRimosso.id
        )
      ) {
        eserciziPersonalizzati.push({
          id: esercizioRimosso.id,
          giorno: esercizioRimosso.giorno,
          nome: esercizioRimosso.nome,
          serie: esercizioRimosso.serie,
          recupero: esercizioRimosso.recupero
        });

        salvaEserciziPersonalizzati();
      }

      eserciziRimossi = eserciziRimossi.filter(
        (esercizio) => esercizio.id !== esercizioRimosso.id
      );

      salvaEserciziNascosti();
      salvaEserciziRimossi();

      window.location.reload();
    });

    voce.appendChild(testo);
    voce.appendChild(pulsanteRipristina);
    listaRimossi.appendChild(voce);
  });
}

document.addEventListener("click", (evento) => {
  const pulsante = evento.target.closest(".elimina-esercizio");

  if (!pulsante) {
    return;
  }

  const elementoLista = pulsante.closest("li");
  const esercizio = elementoLista.querySelector(".esercizio");
  const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;
  const dettagli = dettagliEsercizio(esercizio);

  const esercizioRimosso = {
    id: esercizio.dataset.esercizio,
    giorno: giorno,
    nome: dettagli.nome,
    serie: dettagli.serie,
    recupero: dettagli.recupero,
    personalizzato: esercizio.dataset.esercizio.startsWith("personalizzato-")
  };

  window.setTimeout(() => {
    if (document.body.contains(elementoLista)) {
      return;
    }

    if (
      eserciziRimossi.some(
        (esercizioSalvato) =>
          esercizioSalvato.id === esercizioRimosso.id &&
          esercizioSalvato.giorno === esercizioRimosso.giorno
      )
    ) {
      return;
    }

    eserciziRimossi.push(esercizioRimosso);
    salvaEserciziRimossi();
    mostraEserciziRimossi();
  }, 0);
}, true);

mostraEserciziRimossi();
const sezioneBackup = document.createElement("section");
sezioneBackup.id = "backupDati";

const titoloBackup = document.createElement("h2");
titoloBackup.textContent = "Backup dati";

const testoBackup = document.createElement("p");
testoBackup.textContent =
  "Esporta una copia della scheda, dei pesi e dello storico.";

const pulsanteEsporta = document.createElement("button");
pulsanteEsporta.type = "button";
pulsanteEsporta.className = "esporta-backup";
pulsanteEsporta.textContent = "Esporta backup";

const pulsanteImporta = document.createElement("button");
pulsanteImporta.type = "button";
pulsanteImporta.className = "importa-backup";
pulsanteImporta.textContent = "Importa backup";

const inputImporta = document.createElement("input");
inputImporta.type = "file";
inputImporta.accept = "application/json";
inputImporta.hidden = true;

sezioneBackup.appendChild(titoloBackup);
sezioneBackup.appendChild(testoBackup);
sezioneBackup.appendChild(pulsanteEsporta);
sezioneBackup.appendChild(pulsanteImporta);
sezioneBackup.appendChild(inputImporta);

document.querySelector("#eserciziRimossi").after(sezioneBackup);

function datiBackup() {
  return {
    versione: 1,
    esportatoIl: new Date().toISOString(),
    allenamentiSalvati,
    storicoAllenamenti,
    pesiUsati,
    modificheScheda,
    eserciziPersonalizzati,
    eserciziNascosti,
    eserciziRimossi
  };
}

pulsanteEsporta.addEventListener("click", () => {
  const contenuto = JSON.stringify(datiBackup(), null, 2);
  const file = new Blob([contenuto], {
    type: "application/json"
  });

  const collegamento = document.createElement("a");
  collegamento.href = URL.createObjectURL(file);

  const data = new Date().toISOString().slice(0, 10);
  collegamento.download = `backup-palestra-${data}.json`;

  collegamento.click();

  URL.revokeObjectURL(collegamento.href);
});

pulsanteImporta.addEventListener("click", () => {
  inputImporta.click();
});

inputImporta.addEventListener("change", async () => {
  const file = inputImporta.files[0];

  if (!file) {
    return;
  }

  try {
    const contenuto = await file.text();
    const backup = JSON.parse(contenuto);

    if (backup.versione !== 1) {
      throw new Error("Versione del backup non supportata.");
    }

    const conferma = window.confirm(
      "L'importazione sostituirà tutti i dati attuali dell'app. Vuoi continuare?"
    );

    if (!conferma) {
      return;
    }

    localStorage.setItem(
      chiaveAllenamenti,
      JSON.stringify(backup.allenamentiSalvati || {})
    );

    localStorage.setItem(
      chiaveStorico,
      JSON.stringify(backup.storicoAllenamenti || [])
    );

    localStorage.setItem(
      chiavePesi,
      JSON.stringify(backup.pesiUsati || {})
    );

    localStorage.setItem(
      chiaveModificheScheda,
      JSON.stringify(backup.modificheScheda || {})
    );

    localStorage.setItem(
      chiaveEserciziPersonalizzati,
      JSON.stringify(backup.eserciziPersonalizzati || [])
    );

    localStorage.setItem(
      chiaveEserciziNascosti,
      JSON.stringify(backup.eserciziNascosti || [])
    );

    localStorage.setItem(
      chiaveEserciziRimossi,
      JSON.stringify(backup.eserciziRimossi || [])
    );

    window.location.reload();
  } catch {
    window.alert(
      "Il file selezionato non è un backup valido dell'app palestra."
    );
  } finally {
    inputImporta.value = "";
  }
});
const titoloPrincipale = document.querySelector("h1");

const navigazionePrincipale = document.createElement("nav");
navigazionePrincipale.className = "navigazione-principale";
navigazionePrincipale.setAttribute("aria-label", "Navigazione principale");

const areaPagine = document.createElement("div");
areaPagine.className = "area-pagine";

const pagine = [
  {
    id: "workout",
    nome: "Workout",
    elementi: [
      document.querySelector("main"),
      document.querySelector("#eserciziRimossi")
    ]
  },
  {
    id: "progressione",
    nome: "Progressione",
    elementi: [
      document.querySelector("#progressiPesi")
    ]
  },
  {
    id: "storico",
    nome: "Storico Workout",
    elementi: [
      document.querySelector("#storicoAllenamenti")
    ]
  },
  {
    id: "backup",
    nome: "Backup Dati",
    elementi: [
      document.querySelector("#backupDati")
    ]
  }
];

function mostraPagina(idPagina) {
  document.querySelectorAll(".pagina-app").forEach((pagina) => {
    pagina.hidden = pagina.id !== `pagina-${idPagina}`;
  });

  navigazionePrincipale.querySelectorAll("button").forEach((pulsante) => {
    pulsante.classList.toggle(
      "pagina-attiva",
      pulsante.dataset.pagina === idPagina
    );
  });
}

pagine.forEach((pagina) => {
  const contenitorePagina = document.createElement("section");

  contenitorePagina.id = `pagina-${pagina.id}`;
  contenitorePagina.className = "pagina-app";
  contenitorePagina.hidden = pagina.id !== "workout";

  pagina.elementi.forEach((elemento) => {
    if (elemento) {
      contenitorePagina.appendChild(elemento);
    }
  });

  const pulsantePagina = document.createElement("button");

  pulsantePagina.type = "button";
  pulsantePagina.textContent = pagina.nome;
  pulsantePagina.dataset.pagina = pagina.id;

  if (pagina.id === "workout") {
    pulsantePagina.classList.add("pagina-attiva");
  }

  pulsantePagina.addEventListener("click", () => {
    mostraPagina(pagina.id);
  });

  navigazionePrincipale.appendChild(pulsantePagina);
  areaPagine.appendChild(contenitorePagina);
});

titoloPrincipale.after(navigazionePrincipale);
navigazionePrincipale.after(areaPagine);
const dettaglioStorico = document.createElement("div");
dettaglioStorico.id = "dettaglioStorico";
dettaglioStorico.hidden = true;

document
  .querySelector("#storicoAllenamenti")
  .appendChild(dettaglioStorico);

function mostraDettaglioAllenamento(allenamento) {
  dettaglioStorico.textContent = "";
  dettaglioStorico.hidden = false;

  const titolo = document.createElement("h3");
  titolo.textContent = `Giorno ${allenamento.giorno}`;

  const data = document.createElement("p");
  data.textContent = `Completato: ${allenamento.data}`;

  dettaglioStorico.appendChild(titolo);
  dettaglioStorico.appendChild(data);

  if (!allenamento.pesi || allenamento.pesi.length === 0) {
    const nessunPeso = document.createElement("p");
    nessunPeso.textContent =
      "Non erano stati registrati pesi per questo allenamento.";

    dettaglioStorico.appendChild(nessunPeso);
    return;
  }

  const elencoPesi = document.createElement("ul");

  allenamento.pesi.forEach((peso) => {
    const voce = document.createElement("li");
    voce.textContent = `${peso.esercizio}: ${peso.peso} kg`;

    elencoPesi.appendChild(voce);
  });

  dettaglioStorico.appendChild(elencoPesi);
}

listaStorico.addEventListener("click", (evento) => {
  const voceCliccata = evento.target.closest("li");

  if (!voceCliccata) {
    return;
  }

  const vociStorico = [...listaStorico.querySelectorAll("li")];
  const indice = vociStorico.indexOf(voceCliccata);
  const allenamento = storicoAllenamenti[indice];

  if (!allenamento) {
    return;
  }

  const eraGiaSelezionato = voceCliccata.classList.contains(
    "allenamento-selezionato"
  );

  vociStorico.forEach((voce) => {
    voce.classList.remove("allenamento-selezionato");
  });

  if (eraGiaSelezionato) {
    dettaglioStorico.hidden = true;
    return;
  }

  voceCliccata.classList.add("allenamento-selezionato");
  mostraDettaglioAllenamento(allenamento);
});
const chiaveSerieCompletate = "serieCompletate";
let serieCompletate = leggiDatiSalvati(chiaveSerieCompletate, {});

if (typeof serieCompletate !== "object" || serieCompletate === null) {
  serieCompletate = {};
}

function salvaSerieCompletate() {
  localStorage.setItem(
    chiaveSerieCompletate,
    JSON.stringify(serieCompletate)
  );
}

function chiaveSerie(esercizio) {
  const giorno = esercizio.closest(".contenuto-giorno").dataset.giorno;

  return `${giorno}-${esercizio.dataset.esercizio}`;
}

function numeroSerieEsercizio(esercizio) {
  const dettagli = dettagliEsercizio(esercizio);
  const corrispondenza = dettagli.serie.match(/(\d+)\s*serie/i);

  return corrispondenza ? Number(corrispondenza[1]) : 1;
}

function aggiornaAspettoSerie(esercizio) {
  const chiave = chiaveSerie(esercizio);
  const serieFatte = serieCompletate[chiave] || [];
  const pulsanti = esercizio
    .closest("li")
    .querySelectorAll(".pulsante-serie");

  pulsanti.forEach((pulsante) => {
    const numero = Number(pulsante.dataset.numeroSerie);
    const completata = serieFatte.includes(numero);

    pulsante.classList.toggle("serie-completata", completata);
    pulsante.setAttribute("aria-pressed", String(completata));
  });
}

function sincronizzaEsercizioConSerie(esercizio) {
  const chiave = chiaveSerie(esercizio);
  const serieNecessarie = numeroSerieEsercizio(esercizio);
  const serieFatte = serieCompletate[chiave] || [];

  esercizio.dataset.sincronizzatoSerie = "si";
  esercizio.checked = serieFatte.length === serieNecessarie;
  esercizio.dispatchEvent(new Event("change"));
  delete esercizio.dataset.sincronizzatoSerie;
}

function creaControlliSerie(esercizio) {
  const elementoLista = esercizio.closest("li");
  const vecchioContenitore = elementoLista.querySelector(".controlli-serie");

  if (vecchioContenitore) {
    vecchioContenitore.remove();
  }

  const chiave = chiaveSerie(esercizio);
  const serieNecessarie = numeroSerieEsercizio(esercizio);

  if (!Array.isArray(serieCompletate[chiave])) {
    serieCompletate[chiave] = esercizio.checked
      ? Array.from({ length: serieNecessarie }, (_, indice) => indice + 1)
      : [];
  }

  serieCompletate[chiave] = serieCompletate[chiave]
    .filter((numero) => numero <= serieNecessarie);

  salvaSerieCompletate();

  const contenitore = document.createElement("div");
  contenitore.className = "controlli-serie";

  const titolo = document.createElement("span");
  titolo.textContent = "Serie completate:";

  contenitore.appendChild(titolo);

  for (let numero = 1; numero <= serieNecessarie; numero += 1) {
    const pulsante = document.createElement("button");

    pulsante.type = "button";
    pulsante.className = "pulsante-serie";
    pulsante.textContent = numero;
    pulsante.dataset.numeroSerie = numero;
    pulsante.setAttribute("aria-pressed", "false");

    pulsante.addEventListener("click", () => {
      const serieFatte = serieCompletate[chiave] || [];

      if (serieFatte.includes(numero)) {
        serieCompletate[chiave] = serieFatte.filter(
          (serie) => serie !== numero
        );
      } else {
        serieCompletate[chiave] = [...serieFatte, numero].sort(
          (a, b) => a - b
        );
      }

      salvaSerieCompletate();
      aggiornaAspettoSerie(esercizio);
      sincronizzaEsercizioConSerie(esercizio);
    });

    contenitore.appendChild(pulsante);
  }

  const contenitorePeso = elementoLista.querySelector(".contenitore-peso");

  elementoLista.insertBefore(contenitore, contenitorePeso);

  aggiornaAspettoSerie(esercizio);
}

function inizializzaSerie(esercizio) {
  if (esercizio.dataset.serieInizializzate === "si") {
    return;
  }

  esercizio.dataset.serieInizializzate = "si";

  creaControlliSerie(esercizio);

  esercizio.addEventListener("change", () => {
    if (esercizio.dataset.sincronizzatoSerie === "si") {
      return;
    }

    const chiave = chiaveSerie(esercizio);
    const serieNecessarie = numeroSerieEsercizio(esercizio);

    serieCompletate[chiave] = esercizio.checked
      ? Array.from({ length: serieNecessarie }, (_, indice) => indice + 1)
      : [];

    salvaSerieCompletate();
    aggiornaAspettoSerie(esercizio);
  });
}

tuttiEsercizi().forEach(inizializzaSerie);

document.querySelectorAll(".completa-giorno").forEach((pulsante) => {
  pulsante.addEventListener("click", () => {
    const giorno = pulsante.dataset.giorno;

    eserciziDelGiorno(giorno).forEach((esercizio) => {
      const chiave = chiaveSerie(esercizio);
      const numeroSerie = numeroSerieEsercizio(esercizio);

      serieCompletate[chiave] = Array.from(
        { length: numeroSerie },
        (_, indice) => indice + 1
      );

      aggiornaAspettoSerie(esercizio);
    });

    salvaSerieCompletate();
  });
});

document.querySelectorAll(".ricomincia-giorno").forEach((pulsante) => {
  pulsante.addEventListener("click", () => {
    const giorno = pulsante.dataset.giorno;

    eserciziDelGiorno(giorno).forEach((esercizio) => {
      serieCompletate[chiaveSerie(esercizio)] = [];
      aggiornaAspettoSerie(esercizio);
    });

    salvaSerieCompletate();
  });
});

const osservatoreSerie = new MutationObserver((modifiche) => {
  modifiche.forEach((modifica) => {
    modifica.addedNodes.forEach((nodo) => {
      if (!(nodo instanceof HTMLElement)) {
        return;
      }

      nodo.querySelectorAll(".esercizio").forEach(inizializzaSerie);
    });
  });
});

osservatoreSerie.observe(document.querySelector("main"), {
  childList: true,
  subtree: true
});
const chiaveWorkoutAttivo = "workoutAttivo";
let workoutAttivo = leggiDatiSalvati(chiaveWorkoutAttivo, null);
let intervalloWorkout;

if (
  !workoutAttivo ||
  typeof workoutAttivo.iniziato !== "number"
) {
  workoutAttivo = null;
}

const pannelloWorkout = document.createElement("section");
pannelloWorkout.id = "timerWorkout";

const titoloWorkout = document.createElement("p");
titoloWorkout.id = "titoloWorkout";

const tempoWorkout = document.createElement("p");
tempoWorkout.id = "tempoWorkout";

const pulsanteIniziaWorkout = document.createElement("button");
pulsanteIniziaWorkout.type = "button";
pulsanteIniziaWorkout.id = "iniziaWorkout";
pulsanteIniziaWorkout.textContent = "Inizia allenamento";

const pulsanteTerminaWorkout = document.createElement("button");
pulsanteTerminaWorkout.type = "button";
pulsanteTerminaWorkout.id = "terminaWorkout";
pulsanteTerminaWorkout.textContent = "Termina timer";

pannelloWorkout.appendChild(titoloWorkout);
pannelloWorkout.appendChild(tempoWorkout);
pannelloWorkout.appendChild(pulsanteIniziaWorkout);
pannelloWorkout.appendChild(pulsanteTerminaWorkout);

document.querySelector("main").prepend(pannelloWorkout);

function formattaDurataWorkout(secondi) {
  const ore = Math.floor(secondi / 3600);
  const minuti = Math.floor((secondi % 3600) / 60);
  const secondiRimanenti = secondi % 60;

  if (ore > 0) {
    return `${ore}:${String(minuti).padStart(2, "0")}:${String(
      secondiRimanenti
    ).padStart(2, "0")}`;
  }

  return `${minuti}:${String(secondiRimanenti).padStart(2, "0")}`;
}

function secondiWorkoutTrascorsi() {
  if (!workoutAttivo) {
    return 0;
  }

  return Math.floor((Date.now() - workoutAttivo.iniziato) / 1000);
}

function aggiornaTimerWorkout() {
  if (!workoutAttivo) {
    titoloWorkout.textContent = "Nessun workout in corso";
    tempoWorkout.hidden = true;
    tempoWorkout.textContent = "0:00";
    pulsanteIniziaWorkout.hidden = false;
    pulsanteTerminaWorkout.hidden = true;
    return;
  }

  titoloWorkout.textContent = "Workout in corso";
  tempoWorkout.hidden = false;
  tempoWorkout.textContent = formattaDurataWorkout(
    secondiWorkoutTrascorsi()
  );

  pulsanteIniziaWorkout.hidden = true;
  pulsanteTerminaWorkout.hidden = false;
}

function avviaTimerWorkout() {
  workoutAttivo = {
    iniziato: Date.now()
  };

  localStorage.setItem(
    chiaveWorkoutAttivo,
    JSON.stringify(workoutAttivo)
  );

  clearInterval(intervalloWorkout);
  intervalloWorkout = setInterval(aggiornaTimerWorkout, 1000);

  aggiornaTimerWorkout();
}

function fermaTimerWorkout() {
  clearInterval(intervalloWorkout);

  workoutAttivo = null;
  localStorage.removeItem(chiaveWorkoutAttivo);

  aggiornaTimerWorkout();
}

pulsanteIniziaWorkout.addEventListener("click", () => {
  avviaTimerWorkout();
});

pulsanteTerminaWorkout.addEventListener("click", () => {
  const conferma = window.confirm(
    "Vuoi terminare il timer senza registrare un allenamento nello storico?"
  );

  if (conferma) {
    fermaTimerWorkout();
  }
});

document.querySelectorAll(".completa-giorno").forEach((pulsante) => {
  pulsante.addEventListener("click", () => {
    if (!workoutAttivo || !storicoAllenamenti[0]) {
      return;
    }

    const durataSecondi = secondiWorkoutTrascorsi();

    storicoAllenamenti[0].inizioWorkout = workoutAttivo.iniziato;
    storicoAllenamenti[0].durataSecondi = durataSecondi;

    localStorage.setItem(
      chiaveStorico,
      JSON.stringify(storicoAllenamenti)
    );

    mostraStorico();
    fermaTimerWorkout();
  });
});

listaStorico.addEventListener("click", (evento) => {
  const voceCliccata = evento.target.closest("li");

  if (!voceCliccata) {
    return;
  }

  const vociStorico = [...listaStorico.querySelectorAll("li")];
  const indice = vociStorico.indexOf(voceCliccata);
  const allenamento = storicoAllenamenti[indice];

  window.setTimeout(() => {
    if (
      !allenamento ||
      dettaglioStorico.hidden ||
      !allenamento.durataSecondi
    ) {
      return;
    }

    if (dettaglioStorico.querySelector(".durata-workout")) {
      return;
    }

    const durata = document.createElement("p");
    durata.className = "durata-workout";

    const oraInizio = new Date(
      allenamento.inizioWorkout
    ).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    });

    durata.textContent =
      `Inizio: ${oraInizio} — Durata: ${formattaDurataWorkout(
        allenamento.durataSecondi
      )}`;

    dettaglioStorico.insertBefore(
      durata,
      dettaglioStorico.querySelector("ul") ||
        dettaglioStorico.lastElementChild.nextSibling
    );
  }, 0);
}, true);

if (workoutAttivo) {
  intervalloWorkout = setInterval(aggiornaTimerWorkout, 1000);
}

aggiornaTimerWorkout();
