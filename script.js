function formatarPeso(valor) {
  return Math.round(valor).toLocaleString('pt-BR');
}

function nomeBonitoTipo(tipo){
  if(tipo === "brf") return "BRF";
  if(tipo === "tampas") return "Tampas";
  if(tipo === "laminacao") return "1ª Lam.";
  return tipo;
}

function nomeCompletoTipo(tipo){
  if(tipo === "brf") return "BRF";
  if(tipo === "tampas") return "Tampas";
  if(tipo === "laminacao") return "1ª Laminação";
  return tipo;
}

/* ================= BANCO DE DADOS ================= */

const tipoSelect = document.getElementById("tipoSelect");
const itemSelect = document.getElementById("itemSelect");
const versaoSelect = document.getElementById("versaoSelect");
const saldoAtual = document.getElementById("saldoAtual");
const totalGeralLabel = document.getElementById("totalGeral");
const totalBrfLabel = document.getElementById("totalBrf");
const totalTampasLabel = document.getElementById("totalTampas");
const totalLaminacaoLabel = document.getElementById("totalLaminacao");
const barraBrf = document.getElementById("barraBrf");
const barraTampas = document.getElementById("barraTampas");
const barraLaminacao = document.getElementById("barraLaminacao");
const dataInicio = document.getElementById("dataInicio");
const dataFim = document.getElementById("dataFim");

const banco = {

  brf: {
    "2000047": {
      "1":  { tamanho: "66 x 60" },
      "2":  { tamanho: "68.5 x 42.5" },
      "4":  { tamanho: "68.5 x 50" },
      "6":  { tamanho: "52 x 60" },
      "12": { tamanho: "75 x 42.5" },
      "14": { tamanho: "75 x 50" },
      "16": { tamanho: "74 x 42.5" },
      "20": { tamanho: "99 x 20" },
      "23": { tamanho: "65 x 78" },
      "25": { tamanho: "83 x 51" },
      "26": { tamanho: "111 x 68" },
      "27": { tamanho: "117 x 73" },
      "28": { tamanho: "87 x 35" },
      "30": { tamanho: "66 x 50" },
      "31": { tamanho: "86 x 100" },
      "33": { tamanho: "111 x 73" },
      "34": { tamanho: "67.5 x 42.5" },
      "35": { tamanho: "108 x 20" },
      "36": { tamanho: "52 x 50" },
      "37": { tamanho: "74 x 50" },
      "38": { tamanho: "83 x 38" }
   
   
      
    }
  },

  tampas: {
    "1503685": {
      "1": { tamanho: "69 x 78" },
      "2": { tamanho: "89 x 78" }
    },
    "1600100": {
      "1": { tamanho: "92 x 58" }
    },
    "1501826": {
      "8":  { tamanho: "83.5 x 78" },
      "2":  { tamanho: "64.5 x 78" },
      "10": { tamanho: "105 x 58" },
      "4":  { tamanho: "93 x 78" },
      "7":  { tamanho: "91.5 x 58" },
      "9":  { tamanho: "87 x 58" },
      "6":  { tamanho: "94 x 58" }
    },
    "1500767": {
      "3": { tamanho: "95 x 78" }
    },
    "1500768": {
      "6": { tamanho: "91.5 x 58" }
    },
    "1500483": {
      "3": { tamanho: "101 x 58" }
    }
  },

  laminacao: {
    "175813-4": {
      "01": { tamanho: "87.5 x 78" }
    },
    "168383-4": {
      "02": { tamanho: "58.5 x 76" }
    },
    "1121221-4": {
      "2.0": { tamanho: "70.5 x 37" }
    }
  }

};

/* ================= ESTADO ================= */

let estoque = {};
let historico = [];

function carregarDados() {
  estoque = JSON.parse(localStorage.getItem("estoque")) || {};
  historico = JSON.parse(localStorage.getItem("historico")) || [];

  atualizarTabela();
  atualizarHistorico();
}

function salvarDados() {
  localStorage.setItem("estoque", JSON.stringify(estoque));
  localStorage.setItem("historico", JSON.stringify(historico));
}

let selecionado = null;
let ultimoItem = null;
let backup = null;

let ordemEstoque = { coluna: null, asc: true };
let filtroTipoEstoque = 0; // 0=todos, 1=B, 2=T, 3=1ª
let filtroTipoHistorico = 0; // 0=todos, 1=B, 2=T, 3=1ª
let ordemHistorico = { coluna: null, estado: 'none' };
let filtroMovimentacao = 0; // 0=todos, 1=E, 2=S, 3=C, 4=P

document.addEventListener("DOMContentLoaded", function () {
  carregarDados();
});

/* ================= NAVEGAÇÃO ================= */

window.mostrarTela = function(t){

  // Esconde TODAS as telas corretamente
    document.getElementById("movimentar").classList.add("hidden");
  document.getElementById("estoque").classList.add("hidden");
  document.getElementById("historico").classList.add("hidden");
  document.getElementById("detalhesTipo").classList.add("hidden");

  // Mostra apenas a escolhida
  document.getElementById(t).classList.remove("hidden");

  // Atualiza abas
  document.querySelectorAll('.nav-top button')
    .forEach(btn => btn.classList.remove('ativo'));

  document.querySelector(`.nav-top button[onclick="mostrarTela('${t}')"]`)
    .classList.add('ativo');

  const btnExpandir = document.getElementById("btnExpandir");
  const btnExportar = document.getElementById("btnExportarGlobal");

  if (t === "movimentar") {
    btnExpandir.style.display = "none";
    btnExportar.style.display = "none";
  } else {
    btnExpandir.style.display = "block";
    btnExportar.style.display = "block";
  }

  atualizarTabela();
  atualizarHistorico();
}

/* ================= CLASSIFICAÇÃO ================= */

function classificar(item){
if(item.startsWith("2000047")) return "brf";
if(item.includes("-4")) return "laminacao";
return "tampas";
}

/* ================= FILTRO POR TIPO ================= */

function filtrarPorTipo(){

itemSelect.innerHTML='<option value="">Selecionar item</option>';
versaoSelect.innerHTML='<option value="">Selecionar versão</option>';

let tipo = tipoSelect.value;

if(!banco[tipo]) return;

Object.keys(banco[tipo]).forEach(item=>{
  let opt = document.createElement('option');
  opt.value = item;
  opt.textContent = item;
  itemSelect.appendChild(opt);
});

}

itemSelect.addEventListener("change", function(){



  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';

  let tipo = tipoSelect.value;
  let item = itemSelect.value;

  if(!banco[tipo]) return;
  if(!banco[tipo][item]) return;

  Object.keys(banco[tipo][item]).forEach(v => {

    let tamanho = banco[tipo] [item] [v].tamanho;

    let opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v + " (" + tamanho + ")";

    versaoSelect.appendChild(opt);

  });
  if (saldoAtual) {
    saldoAtual.innerHTML = "";
}

});

function atualizarSaldoAtual(item, versao){

  if(!item || !versao){
    if(saldoAtual){
      saldoAtual.innerHTML = "";
    }
    return;
  }

  let identificador = item + " - V" + versao;
  let saldo = estoque[identificador] || 0;

  if(saldoAtual){
    saldoAtual.innerHTML = "Saldo atual: <strong>" + saldo + " kg</strong>";
  }
}

versaoSelect.addEventListener("change", function(){

  let tipo = tipoSelect.value;
  let item = itemSelect.value;
  let versao = versaoSelect.value;

  if(versao !== ""){

    atualizarSaldoAtual(item, versao);

    let tamanho = "";
    if (banco[tipo] && banco[tipo][item] && banco[tipo][item][versao]) {
      tamanho = banco[tipo][item][versao].tamanho;
    }

    document.getElementById('buscaItem').value = item + " - V" + versao + " (" + tamanho + ")";

    quantidade.focus();

  }else{
    if (saldoAtual) saldoAtual.innerHTML = "";
    document.getElementById('buscaItem').value = '';
  }

});



/* ================= BUSCA MANUAL ================= */

function selecionarManual(){
}

function filtrar(){

let termo = buscaItem.value.toLowerCase();
sugestoes.innerHTML = '';

if(!termo){
  sugestoes.classList.add('hidden');
  return;
}

Object.keys(banco).forEach(tipo => {

  Object.keys(banco[tipo]).forEach(item => {

    Object.keys(banco[tipo][item]).forEach(versao => {

      let tamanho = banco[tipo][item][versao].tamanho;

      let textoCompleto = item + " - V" + versao + " (" + tamanho + ")";

      if(textoCompleto.toLowerCase().includes(termo)){

        let d = document.createElement('div');
        d.textContent = textoCompleto;

        d.onclick = function(){

          tipoSelect.value = tipo;

          filtrarPorTipo();
          itemSelect.value = item;

          itemSelect.dispatchEvent(new Event("change"));

          versaoSelect.value = versao;
	  atualizarSaldoAtual(item, versao);

          buscaItem.value = textoCompleto;
          sugestoes.classList.add('hidden');
	  quantidade.focus();

        };

        sugestoes.appendChild(d);
      }

    });

  });

});

sugestoes.classList.remove('hidden');
}
function limparBusca(){

buscaItem.value = '';
sugestoes.innerHTML = '';
sugestoes.classList.add('hidden');

tipoSelect.value = '';
itemSelect.innerHTML = '<option value="">Selecionar item</option>';
versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
quantidade.value = '';
document.getElementById('buscaItem').value = '';

}

/* ================= REPETIR ÚLTIMO ================= */

function usarUltimo(){

  if(!ultimoItem){
    alert("Nenhum item");
    return;
  }

  console.log("Último item:", ultimoItem);

  // Se não tiver versão, cancela
  if(!ultimoItem.includes(" - V")){
    alert("Último item não possui versão registrada");
    return;
  }

  let partes = ultimoItem.split(" - V");

  let item = partes[0];
  let versao = partes[1];

  let tipoEncontrado = null;

  Object.keys(banco).forEach(tipo => {
    if(banco[tipo][item]){
      tipoEncontrado = tipo;
    }
  });

  if(!tipoEncontrado){
    alert("Item não encontrado no banco");
    return;
  }

  tipoSelect.value = tipoEncontrado;
  filtrarPorTipo();
  itemSelect.value = item;

  // recria versões
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';

  Object.keys(banco[tipoEncontrado][item]).forEach(v => {

    let tamanho = banco[tipoEncontrado][item][v].tamanho;

    let opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v + " (" + tamanho + ")";

    versaoSelect.appendChild(opt);
  });

  versaoSelect.value = versao;

// ✅ ATUALIZA SALDO AUTOMATICAMENTE
let identificador = item + " - V" + versao;
let saldo = estoque[identificador] || 0;

if(saldoAtual){
  saldoAtual.innerHTML = "Saldo atual: <strong>" + saldo + " kg</strong>";
}

let tamanho = "";
if (banco[tipoEncontrado][item] && banco[tipoEncontrado][item][versao]) {
  tamanho = banco[tipoEncontrado][item][versao].tamanho;
}
document.getElementById('buscaItem').value = item + " - V" + versao + " (" + tamanho + ")";

quantidade.value = '';
quantidade.focus();
}

/* ================= MOVIMENTAÇÃO ================= */

function movimentar(tipoMov){

console.log("movimentar chamada", tipoMov);

let tipo = tipoSelect.value;
let item = itemSelect.value;
let versao = versaoSelect.value;

let faltando = [];

if(!tipo) faltando.push("tipo");
if(!item) faltando.push("item");
if(!versao) faltando.push("versão");

if(faltando.length > 0){
  alert("Insira: " + faltando.join(", "));
  return;
}

let qtd = parseFloat(quantidade.value);
if(!qtd){
  alert("Informe o peso");
  return;
}

let identificador = item + " - V" + versao;

if(!estoque[identificador]){
  estoque[identificador] = 0;
}

if(tipoMov === 'remove'){
  if(!estoque[identificador] || estoque[identificador] <= 0){
    alert("Sem saldo");
    return;
  }
  if(qtd > estoque[identificador]){
    alert("Peso maior que o saldo disponível");
    return;
  }
  abrirModalSaida(identificador, qtd);
  return;
}else{
  estoque[identificador] += qtd;
}

historico.push({
  data: new Date().toLocaleString(),
  tipo: tipoMov === 'add' ? 'Entrada' : 'Saída',
  item: identificador,
  qtd: qtd
});

ultimoItem = identificador;

salvarDados();

atualizarTabela();
console.log("atualizando historico...");
atualizarHistorico();

tipoSelect.value = '';
itemSelect.innerHTML = '<option value="">Selecionar item</option>';
versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
quantidade.value = '';
document.getElementById('buscaItem').value = '';
sugestoes.innerHTML = '';
sugestoes.classList.add('hidden');

let mensagem = identificador + (tipoMov === 'add' ? " Adicionado" : " Removido");

if (navigator.vibrate) {
  navigator.vibrate(tipoMov === 'add' ? [100] : [100]);
}

alert(mensagem);

}

/* ================= ESTOQUE ================= */

function ordenarEstoque(coluna) {

  // Tratamento especial para tipo
  if (coluna === 'tipo') {
    filtroTipoEstoque++;
    if (filtroTipoEstoque > 3) filtroTipoEstoque = 0;

    let thTipo = document.querySelector('#estoque thead th[onclick="ordenarEstoque(\'tipo\')"]');
    if (thTipo) {
      let letras = ['', 'B', 'T', '1ª'];
      let letra = letras[filtroTipoEstoque];
      thTipo.innerHTML = 'Tipo<span class="sort-arrow">' + (letra ? ' (' + letra + ')' : '') + '</span>';
    }

    atualizarTabela();
    return;
  }

  if (ordemEstoque.coluna === coluna) {
    ordemEstoque.asc = !ordemEstoque.asc;
  } else {
    ordemEstoque.coluna = coluna;
    ordemEstoque.asc = true;
  }

  document.querySelectorAll('#estoque thead th.sortable').forEach(th => {
    if (!th.getAttribute('onclick').includes('tipo')) {
      th.classList.remove('asc', 'desc', 'none');
      th.classList.add('none');
    }
  });

  const thAtivo = document.querySelector(
    `#estoque thead th[onclick="ordenarEstoque('${coluna}')"]`
  );
  if (thAtivo) {
    thAtivo.classList.remove('none');
    thAtivo.classList.add(ordemEstoque.asc ? 'asc' : 'desc');
  }

  atualizarTabela();
}

function atualizarTabela(){
tabela.innerHTML='';
let termo=buscaEstoque.value.toLowerCase();
let pesoTotal = 0;
let totalBrf = 0;
let totalTampas = 0;
let totalLaminacao = 0;

let dados = Object.keys(estoque)
.map(i => {

 let partes = i.split(" - ");

if (partes.length < 2) return null;

let item = partes[0];
let versao = partes[1].replace("V", "").trim();

  let tipoEncontrado = "";

  Object.keys(banco).forEach(tipo => {
    if (banco[tipo] && banco[tipo][item]) {
      tipoEncontrado = tipo;
    }
  });

  if (
    !banco[tipoEncontrado] ||
    !banco[tipoEncontrado][item] ||
    !banco[tipoEncontrado][item][versao]
  ) {
    return null;
  }

  let tamanho = banco[tipoEncontrado][item][versao].tamanho;
  let peso = estoque[i];
// ✅ Calcular quantidade de entradas (só as que compõem o saldo atual)
let pesoAtual = estoque[i] || 0;
let entradasItem = historico.filter(h => h.item === i && h.tipo === "Entrada");
let quantidadeEntradas = 0;
let somaTemp = 0;

for (let idx = entradasItem.length - 1; idx >= 0; idx--) {
  if (somaTemp >= pesoAtual) break;
  somaTemp += entradasItem[idx].qtd;
  quantidadeEntradas++;
}

// ✅ SOMA TOTAL GERAL
pesoTotal += peso;

// ✅ SOMA POR TIPO
if (tipoEncontrado === "brf") {
  totalBrf += peso;
}
if (tipoEncontrado === "tampas") {
  totalTampas += peso;
}
if (tipoEncontrado === "laminacao") {
  totalLaminacao += peso;
}

  return {
  identificador: i,
  tipo: tipoEncontrado,
  item: item,
  versao: versao,
  tamanho: tamanho,
  peso: peso,
  qtdEntradas: quantidadeEntradas
};

})
.filter(d => {
  let textoCompleto = `
    ${nomeBonitoTipo(d.tipo)}
    ${d.item}
    ${d.versao}
    ${d.tamanho}
    ${d.peso}
    ${d.qtdEntradas}
  `.toLowerCase();

  return textoCompleto.includes(termo);
});

  // Ordenação por tipo (B, T, 1ª)
  if (filtroTipoEstoque > 0) {
    let prioridades = [null, 'brf', 'tampas', 'laminacao'];
    let tipoPrioritario = prioridades[filtroTipoEstoque];

    dados.sort((a, b) => {
      let aPri = (a.tipo === tipoPrioritario) ? 0 : 1;
      let bPri = (b.tipo === tipoPrioritario) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      let ordem = { 'brf': 1, 'tampas': 2, 'laminacao': 3 };
      return (ordem[a.tipo] || 4) - (ordem[b.tipo] || 4);
    });
  }

if(ordemEstoque.coluna){

  dados.sort((a,b)=>{

    let v1 = a[ordemEstoque.coluna];
    let v2 = b[ordemEstoque.coluna];

    // ✅ Tratamento especial para tamanho
    if(ordemEstoque.coluna === "tamanho"){

      let p1 = v1.split(" x ");
      let p2 = v2.split(" x ");

      let largura1 = parseFloat(p1[0]);
      let largura2 = parseFloat(p2[0]);

      let altura1 = parseFloat(p1[1]);
      let altura2 = parseFloat(p2[1]);

      if(largura1 !== largura2){
        return ordemEstoque.asc ? largura1 - largura2 : largura2 - largura1;
      }

      return ordemEstoque.asc ? altura1 - altura2 : altura2 - altura1;
    }

    // ✅ Tratamento especial para colunas numéricas
if (ordemEstoque.coluna === "peso" || ordemEstoque.coluna === "qtdEntradas") {
  v1 = Number(v1);
  v2 = Number(v2);
} else {
  if (typeof v1 === "string") v1 = v1.toLowerCase();
  if (typeof v2 === "string") v2 = v2.toLowerCase();
}

if (v1 > v2) return ordemEstoque.asc ? 1 : -1;
if (v1 < v2) return ordemEstoque.asc ? -1 : 1;
return 0;

  });

}

// ✅ ATUALIZA TOTAL GERAL
if(totalGeralLabel){
  totalGeralLabel.innerHTML = formatarPeso(pesoTotal) + " kg";
}

if(totalBrfLabel){
  totalBrfLabel.innerHTML = formatarPeso(totalBrf) + " kg";
}

if(totalTampasLabel){
  totalTampasLabel.innerHTML = formatarPeso(totalTampas) + " kg";
}

if(totalLaminacaoLabel){
  totalLaminacaoLabel.innerHTML = formatarPeso(totalLaminacao) + " kg";
}

// ✅ CALCULAR PORCENTAGENS

let percBrf = pesoTotal ? (totalBrf / pesoTotal) * 100 : 0;
let percTampas = pesoTotal ? (totalTampas / pesoTotal) * 100 : 0;
let percLaminacao = pesoTotal ? (totalLaminacao / pesoTotal) * 100 : 0;

// ✅ Função única para atualizar qualquer barra
function atualizarBarra(barra, percentual) {

  let valor = Math.round(percentual);

  if (valor === 0) {
    barra.style.width = "0%";
    barra.textContent = "";
    barra.style.paddingLeft = "0";
    return;
  }

  barra.style.width = valor + "%";
  barra.textContent = valor + "%";
  barra.style.paddingLeft = "6px";
}

// ✅ Atualiza cada barra
if (barraBrf) atualizarBarra(barraBrf, percBrf);
if (barraTampas) atualizarBarra(barraTampas, percTampas);
if (barraLaminacao) atualizarBarra(barraLaminacao, percLaminacao);


// ✅ Renderiza tabela
dados.forEach(d=>{
  tabela.innerHTML += `
    <tr>
      <td>${nomeBonitoTipo(d.tipo)}</td>
      <td>${d.item}</td>
      <td>${d.versao}</td>
      <td>${d.tamanho}</td>
      <td>${d.peso}</td>
      <td>${d.qtdEntradas}</td>
      <td><button class='btn-remove' onclick="remover('${d.identificador}')">🗑</button></td>
    </tr>
  `;
});
}

function remover(item){

  if(!confirm("Tem certeza que deseja remover este item do estoque?")){
    return;
  }

  backup = { tipo:'estoque', item, valor:estoque[item] };

delete estoque[item];

salvarDados();
atualizarTabela();

mostrarToast(() => {
  estoque[item] = backup.valor;
  salvarDados();
  atualizarTabela();
});

}/* ================= HISTÓRICO ================= */

function ordenarHistorico(coluna) {

  // Tratamento especial para tipo
  if (coluna === 'tipo') {
    filtroTipoHistorico++;
    if (filtroTipoHistorico > 3) filtroTipoHistorico = 0;

    let thTipo = document.querySelector('#historico thead th[onclick="ordenarHistorico(\'tipo\')"]');
    if (thTipo) {
            let letras = ['', 'B', 'T', '1ª'];
      let letra = letras[filtroTipoHistorico];
      thTipo.innerHTML = 'Tipo<span class="sort-arrow">' + (letra ? ' (' + letra + ')' : '') + '</span>';
    }

    atualizarHistorico();
    return;
  }

  // Tratamento especial para movimentação
  if (coluna === 'movimentacao') {
    filtroMovimentacao++;
    if (filtroMovimentacao > 4) filtroMovimentacao = 0;

       let thMov = document.querySelector('#historico thead th[onclick="ordenarHistorico(\'movimentacao\')"]');
    if (thMov) {
      let letras = ['', 'E', 'S', 'C', 'P'];
      let letra = letras[filtroMovimentacao];
      thMov.innerHTML = 'Mov.<span class="sort-arrow">' + (letra ? ' (' + letra + ')' : '') + '</span>';
    }

    atualizarHistorico();
    return;
  }

  if (ordemHistorico.coluna === coluna) {
    if (ordemHistorico.estado === 'none') {
      ordemHistorico.estado = 'asc';
    } else if (ordemHistorico.estado === 'asc') {
      ordemHistorico.estado = 'desc';
    } else {
      ordemHistorico.estado = 'none';
      ordemHistorico.coluna = null;
    }
  } else {
    ordemHistorico.coluna = coluna;
    ordemHistorico.estado = 'asc';
  }

  document.querySelectorAll('#historico thead th.sortable').forEach(th => {
    if (!th.getAttribute('onclick').includes('movimentacao')) {
      th.classList.remove('asc', 'desc', 'none');
      th.classList.add('none');
    }
  });

  if (ordemHistorico.coluna) {
    const thAtivo = document.querySelector(
      `#historico thead th[onclick="ordenarHistorico('${coluna}')"]`
    );
    if (thAtivo) {
      thAtivo.classList.remove('none');
      thAtivo.classList.add(ordemHistorico.estado);
    }
  }

  atualizarHistorico();
}



function atualizarHistorico(){

  historicoTabela.innerHTML = '';
  let termo = buscaHistorico.value.toLowerCase();

  let dados = historico
    .map(h => {

    let partes = h.item.split(" - V");
if (partes.length < 2) return null;

let item = partes[0];
let versao = partes[1];

    let tipoEncontrado = "";

    Object.keys(banco).forEach(tipo => {
      if(banco[tipo][item]){
        tipoEncontrado = tipo;
      }
    });

    let tamanho = "";

if (
  banco[tipoEncontrado] &&
  banco[tipoEncontrado][item] &&
  banco[tipoEncontrado][item][versao]
) {
  tamanho = banco[tipoEncontrado][item][versao].tamanho;
}

return {
  original: h,
  data: h.data.replace(", ", "<br>"),
  movimentacao: h.tipo,
  tipo: tipoEncontrado,
  item: item,
  versao: versao,
  tamanho: tamanho,
  qtd: h.qtd
};

  }).filter(d => {

   let textoCompleto = `
  ${d.data}
  ${d.movimentacao}
  ${nomeBonitoTipo(d.tipo)}
  ${d.item}
  ${d.versao}
  ${d.tamanho}
  ${d.qtd}
`.toLowerCase();

let matchesBusca = textoCompleto.includes(termo);

  // ✅ Converte data brasileira para ISO (yyyy-mm-dd)
  let dataISO = d.data.split(",")[0].split("/").reverse().join("-");

  let matchesPeriodo = true;

  if(dataInicio.value){
    matchesPeriodo = matchesPeriodo && (dataISO >= dataInicio.value);
  }

  if(dataFim.value){
    matchesPeriodo = matchesPeriodo && (dataISO <= dataFim.value);
  }

  return matchesBusca && matchesPeriodo;

});
  // Ordenação por tipo (B, T, 1ª)
  if (filtroTipoHistorico > 0) {
    let prioridades = [null, 'brf', 'tampas', 'laminacao'];
    let tipoPrioritario = prioridades[filtroTipoHistorico];

    dados.sort((a, b) => {
      let aPri = (a.tipo === tipoPrioritario) ? 0 : 1;
      let bPri = (b.tipo === tipoPrioritario) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      let ordem = { 'brf': 1, 'tampas': 2, 'laminacao': 3 };
      return (ordem[a.tipo] || 4) - (ordem[b.tipo] || 4);
    });
  }
  // Ordenação por movimentação (E, S, C, P)
  if (filtroMovimentacao > 0) {
    let ordemMov = { 'Entrada': 1, 'Saída': 2, 'Consumida': 3, 'Consumo parcial': 4 };
    let prioridades = [null, 'Entrada', 'Saída', 'Consumida', 'Consumo parcial'];
    let tipoPrioritario = prioridades[filtroMovimentacao];

    dados.sort((a, b) => {
      let tipoA = a.original.tipo;
      let tipoB = b.original.tipo;
      if (a.original.consumida && tipoA !== 'Consumo parcial') tipoA = 'Consumida';
      if (b.original.consumida && tipoB !== 'Consumo parcial') tipoB = 'Consumida';

      let aPrioritario = (tipoA === tipoPrioritario) ? 0 : 1;
      let bPrioritario = (tipoB === tipoPrioritario) ? 0 : 1;

      if (aPrioritario !== bPrioritario) return aPrioritario - bPrioritario;
      return (ordemMov[tipoA] || 5) - (ordemMov[tipoB] || 5);
    });
  }

  if (ordemHistorico.coluna && ordemHistorico.estado !== 'none') {

  const asc = ordemHistorico.estado === 'asc';

  dados.sort((a, b) => {

    let v1 = a[ordemHistorico.coluna];
    let v2 = b[ordemHistorico.coluna];

    // Ordenação especial para movimentação
    if (ordemHistorico.coluna === 'movimentacao') {
      const ordem = {
        'Entrada': 1,
        'Saída': 2,
        'Consumida': 3,
        'Consumo parcial': 4
      };
      let o1 = ordem[a.original.consumida ? 'Consumida' : a.original.tipo] || 5;
      let o2 = ordem[b.original.consumida ? 'Consumida' : b.original.tipo] || 5;
      if (a.original.tipo === 'Consumo parcial') o1 = ordem['Consumo parcial'];
      if (b.original.tipo === 'Consumo parcial') o2 = ordem['Consumo parcial'];
      if (o1 !== o2) return asc ? o1 - o2 : o2 - o1;
      return 0;
    }

    if (ordemHistorico.coluna === 'tamanho') {
      let p1 = v1.split(" x ");
      let p2 = v2.split(" x ");
      let largura1 = parseFloat(p1[0]);
      let largura2 = parseFloat(p2[0]);
      let altura1  = parseFloat(p1[1]);
      let altura2  = parseFloat(p2[1]);
      if (largura1 !== largura2) return asc ? largura1 - largura2 : largura2 - largura1;
      return asc ? altura1 - altura2 : altura2 - altura1;
    }

    if (ordemHistorico.coluna === 'qtd') {
      v1 = Number(v1);
      v2 = Number(v2);
    } else {
      v1 = String(v1).toLowerCase();
      v2 = String(v2).toLowerCase();
    }

    if (v1 > v2) return asc ? 1 : -1;
    if (v1 < v2) return asc ? -1 : 1;
    return 0;
  });

}

  dados.forEach(d => {

    let indexReal = historico.indexOf(d.original);

        let corLinha = d.movimentacao === 'Entrada' ? 'linha-entrada' : 'linha-saida';
    if (d.original.consumida) corLinha = 'linha-consumida';
    if (d.movimentacao === 'Consumo parcial') corLinha = 'linha-consumo-parcial';
            let movTexto = d.movimentacao;
    if (d.original.consumida) movTexto = 'Consumida';
    if (d.movimentacao === 'Consumo parcial') movTexto = 'Consumo<br>parcial';

    historicoTabela.innerHTML += `
  <tr class="${corLinha}">
    <td>${d.data}</td>
    <td>${movTexto}</td>
    <td>${nomeBonitoTipo(d.tipo)}</td>

    <td>
      ${d.item}<br>
      <strong>V ${d.versao}</strong><br>
      <span style="font-size:11px;">
        ${d.tamanho}
      </span>
    </td>

        <td>${d.original.qtdOriginal ? Math.round(d.qtd) + '/' + Math.round(d.original.qtdOriginal) : d.qtd}</td>

    <td>
      <button class='btn-remove' onclick="removerHistorico(${indexReal})">🗑</button>
    </td>
  </tr>
`;

  });

}



window.removerHistorico = function(i){

  if(!confirm("Tem certeza que deseja remover este registro do histórico?")){
    return;
  }

  backup = {
    tipo: 'historico',
    index: i,
    valor: historico[i]
  };

  historico.splice(i, 1);

salvarDados();

atualizarHistorico();

mostrarToast(() => {
  historico.splice(backup.index, 0, backup.valor);
  salvarDados();
  atualizarHistorico();
});

};
/* ================= TOAST ================= */

function mostrarToast(callback){

let div = document.createElement('div');
div.className = 'toast';
div.innerHTML = 'Removido <button style="background:#16a34a;color:white;">Desfazer</button>';

div.querySelector('button').onclick = function(){
  callback();
  div.remove();
};

document.body.appendChild(div);

setTimeout(function(){
  div.remove();
}, 5000);

} 
document.addEventListener("DOMContentLoaded", function(){

  const btnLimparFiltro = document.getElementById("btnLimparFiltro");

    if(btnLimparFiltro){
    btnLimparFiltro.addEventListener("click", function(){
      dataInicio.value = "";
      dataFim.value = "";
      document.getElementById("buscaHistorico").value = "";
      atualizarHistorico();
    });
  }

});

function exportarParaExcel(nomeArquivo, dados){
  
  if(dados.length === 0){
    alert("Nenhum dado para exportar!");
    return;
  }
  
  let tabela = "<table border='1'><tr>";
  
  Object.keys(dados[0]).forEach(chave=>{
    tabela += "<th>" + chave + "</th>";
  });
  
  tabela += "</tr>";
  
  dados.forEach(linha=>{
    tabela += "<tr>";
    Object.values(linha).forEach(valor=>{
      tabela += "<td>" + valor + "</td>";
    });
    tabela += "</tr>";
  });
  
  tabela += "</table>";
  
  let blob = new Blob([tabela], { type: "application/vnd.ms-excel" });
  let link = document.createElement("a");
  
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo + ".xls";
  link.click();
}


let tipoExportacaoAtual = '';

window.abrirModalExportar = function(){
  document.getElementById("modalExportar").classList.remove("hidden");
  ajustarOpcaoPeriodo();
};

function ajustarOpcaoPeriodo() {
  const tipoSelecionado = document.querySelector('input[name="tipoDados"]:checked');
  const blocoPeriodo = document.getElementById("blocoPeriodo");
  const areaPeriodo = document.getElementById("areaPeriodo");
  const radioTudo = document.querySelector('input[name="tipoPeriodo"][value="tudo"]');

  if (!tipoSelecionado) return;

  if (tipoSelecionado.value === "backup") {
    if (blocoPeriodo) blocoPeriodo.style.display = "none";
    if (areaPeriodo) areaPeriodo.classList.add("hidden");
    if (radioTudo) radioTudo.checked = true;
  } else {
    if (blocoPeriodo) blocoPeriodo.style.display = "block";
  }
}

window.fecharModalExportar = function(){
  document.getElementById("modalExportar").classList.add("hidden");
};

window.togglePeriodo = function(show){
  const area = document.getElementById("areaPeriodo");
  const tipoSelecionado = document.querySelector('input[name="tipoDados"]:checked');

  if (!area) return;

  if (tipoSelecionado && tipoSelecionado.value === "backup") {
    area.classList.add("hidden");
    return;
  }

  if(show){
    area.classList.remove("hidden");
  }else{
    area.classList.add("hidden");
  }
};

window.executarExportacao = function(){

  const radioDados = document.querySelector('input[name="tipoDados"]:checked');
  const radioPeriodo = document.querySelector('input[name="tipoPeriodo"]:checked');

  if (!radioDados) {
    console.log("Nenhum tipoDados selecionado");
    return;
  }

  if (!radioPeriodo) {
    console.log("Nenhum tipoPeriodo selecionado");
    return;
  }

  const tipoDados = radioDados.value;
  const tipoPeriodo = radioPeriodo.value;

  let dataInicio = null;
  let dataFim = null;

  if (tipoPeriodo === 'periodo') {
    dataInicio = document.getElementById("exportDataInicio").value;
    dataFim = document.getElementById("exportDataFim").value;
  }

  if (tipoDados === 'estoque') exportarEstoque(dataInicio, dataFim);
  if (tipoDados === 'historico') exportarHistorico(dataInicio, dataFim);
  if (tipoDados === 'ambos') {
  exportarAmbos(dataInicio, dataFim);
}

  if (tipoDados === 'backup') {
    exportarBackup();
  }

  fecharModalExportar();
}

function exportarEstoque(dataInicio, dataFim){

  const wb = XLSX.utils.book_new();

  const agora = new Date();
  const dataFormatada =
    agora.getFullYear() + "-" +
    String(agora.getMonth()+1).padStart(2,"0") + "-" +
    String(agora.getDate()).padStart(2,"0") + "_" +
    String(agora.getHours()).padStart(2,"0") + "-" +
    String(agora.getMinutes()).padStart(2,"0");

  let dadosEstoque = [];

  Object.keys(estoque).forEach(chave => {

    let partes = chave.split(" - V");
    if (partes.length < 2) return;

    let item = partes[0];
    let versao = partes[1];

    let tipoInterno = "";
    Object.keys(banco).forEach(tipo=>{
      if(banco[tipo][item]) tipoInterno = tipo;
    });

    let tamanho = banco[tipoInterno][item][versao].tamanho;

    dadosEstoque.push({
      Tipo: nomeBonitoTipo(tipoInterno),
      Item: item,
      Versão: versao,
      Medidas: tamanho,
      Kg: estoque[chave]
    });
  });

  const wsEstoque = XLSX.utils.json_to_sheet(dadosEstoque);

  // ✅ Garantir referência
  const range = XLSX.utils.decode_range(wsEstoque['!ref']);
  wsEstoque['!autofilter'] = { ref: wsEstoque['!ref'] };

  // ✅ Ajustar largura colunas
  wsEstoque['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 }
  ];

  // ✅ Congelar primeira linha
  wsEstoque['!freeze'] = { xSplit: 0, ySplit: 1 };

  // ✅ Deixar cabeçalho em negrito
  const headerRange = XLSX.utils.decode_range(wsEstoque['!ref']);
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!wsEstoque[cellAddress]) continue;
    wsEstoque[cellAddress].s = {
      font: { bold: true }
    };
  }

  XLSX.utils.book_append_sheet(wb, wsEstoque, "Estoque");

  XLSX.writeFile(wb, "Estoque_" + dataFormatada + ".xlsx");
}

function exportarHistorico(dataInicio, dataFim){

  const wb = XLSX.utils.book_new();

  const agora = new Date();
  const dataFormatada =
    agora.getFullYear() + "-" +
    String(agora.getMonth()+1).padStart(2,"0") + "-" +
    String(agora.getDate()).padStart(2,"0") + "_" +
    String(agora.getHours()).padStart(2,"0") + "-" +
    String(agora.getMinutes()).padStart(2,"0");

  let dadosHistorico = historico
    .filter(h => {

      if(!dataInicio && !dataFim) return true;

      let dataISO = h.data.split(",")[0].split("/").reverse().join("-");
      let okInicio = !dataInicio || dataISO >= dataInicio;
      let okFim = !dataFim || dataISO <= dataFim;

      return okInicio && okFim;

    })
    .map(h => {

      let partes = h.item.split(" - V");
      if (partes.length < 2) return null;

      let item = partes[0];
      let versao = partes[1];

      let tipoInterno = "";
      Object.keys(banco).forEach(tipo=>{
        if(banco[tipo][item]) tipoInterno = tipo;
      });

      let tamanho = banco[tipoInterno][item][versao].tamanho;

      return {
        Data: h.data,
        Movimentação: h.tipo,
        Tipo: nomeBonitoTipo(tipoInterno),
        Item: item,
        Versão: versao,
        Medidas: tamanho,
        Kg: h.qtd
      };
    })
    .filter(d => d !== null);

  const wsHistorico = XLSX.utils.json_to_sheet(dadosHistorico);
wsHistorico['!autofilter'] = { ref: wsHistorico['!ref'] };
wsHistorico['!freeze'] = { xSplit: 0, ySplit: 1 };

const headerRangeH = XLSX.utils.decode_range(wsHistorico['!ref']);
for (let C = headerRangeH.s.c; C <= headerRangeH.e.c; ++C) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
  if (!wsHistorico[cellAddress]) continue;
  wsHistorico[cellAddress].s = {
    font: { bold: true }
  };
}

  wsHistorico['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
    { wch: 8 }
  ];

  XLSX.utils.book_append_sheet(wb, wsHistorico, "Histórico");

  XLSX.writeFile(wb, "Historico_" + dataFormatada + ".xlsx");
}

/*
if("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js")
      .then(function(){
        console.log("Service Worker registrado");
      })
      .catch(function(error){
        console.log("Erro no Service Worker:", error);
      });
  });
}
*/
window.onload = function() {
  mostrarTela('movimentar'); // abre já com aba ativa
};

function alternarModoVisualizacao() {

  const telaEstoque = !document.getElementById("estoque").classList.contains("hidden");
  const telaHistorico = !document.getElementById("historico").classList.contains("hidden");

  if (!telaEstoque && !telaHistorico) return;

  const body = document.body;
  const botao = document.getElementById("btnExpandir");

  body.classList.toggle("modo-visualizacao");

  if (body.classList.contains("modo-visualizacao")) {
    botao.textContent = "✕";
  } else {
    botao.textContent = "⛶";
  }

}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('SW registrado:', reg);
      })
      .catch(err => {
        console.error('Erro SW:', err);
      });
  });
}

function exportarAmbos(dataInicio, dataFim){

  const wb = XLSX.utils.book_new();

  // ✅ Criar timestamp
  const agora = new Date();
  const dataFormatada =
    agora.getFullYear() + "-" +
    String(agora.getMonth()+1).padStart(2,"0") + "-" +
    String(agora.getDate()).padStart(2,"0") + "_" +
    String(agora.getHours()).padStart(2,"0") + "-" +
    String(agora.getMinutes()).padStart(2,"0");

  /* ================= ESTOQUE ================= */

  let dadosEstoque = [];

  Object.keys(estoque).forEach(chave => {

    let partes = chave.split(" - V");
    if (partes.length < 2) return;

    let item = partes[0];
    let versao = partes[1];

    let tipoInterno = "";
    Object.keys(banco).forEach(tipo=>{
      if(banco[tipo][item]) tipoInterno = tipo;
    });

    let tamanho = banco[tipoInterno][item][versao].tamanho;

    dadosEstoque.push({
      Tipo: nomeBonitoTipo(tipoInterno),
      Item: item,
      Versão: versao,
      Medidas: tamanho,
      Kg: estoque[chave]
    });
  });

  const wsEstoque = XLSX.utils.json_to_sheet(dadosEstoque);
wsEstoque['!autofilter'] = { ref: wsEstoque['!ref'] };

  // ✅ Ajustar largura das colunas
  wsEstoque['!cols'] = [
    { wch: 10 },  // Tipo
    { wch: 12 },  // Item
    { wch: 8 },   // Versão
    { wch: 14 },  // Medidas
    { wch: 8 }    // Kg
  ];

  XLSX.utils.book_append_sheet(wb, wsEstoque, "Estoque");


  /* ================= HISTÓRICO ================= */

  let dadosHistorico = historico
    .filter(h => {

      if(!dataInicio && !dataFim) return true;

      let dataISO = h.data.split(",")[0].split("/").reverse().join("-");
      let okInicio = !dataInicio || dataISO >= dataInicio;
      let okFim = !dataFim || dataISO <= dataFim;

      return okInicio && okFim;
    })
    .map(h => {

      let partes = h.item.split(" - V");
      if (partes.length < 2) return null;

      let item = partes[0];
      let versao = partes[1];

      let tipoInterno = "";
      Object.keys(banco).forEach(tipo=>{
        if(banco[tipo][item]) tipoInterno = tipo;
      });

      let tamanho = banco[tipoInterno][item][versao].tamanho;

      return {
        Data: h.data,
        Movimentação: h.tipo,
        Tipo: nomeBonitoTipo(tipoInterno),
        Item: item,
        Versão: versao,
        Medidas: tamanho,
        Kg: h.qtd
      };
    })
    .filter(d => d !== null);

  const wsHistorico = XLSX.utils.json_to_sheet(dadosHistorico);

  wsHistorico['!cols'] = [
    { wch: 18 }, // Data
    { wch: 14 }, // Movimentação
    { wch: 10 }, // Tipo
    { wch: 12 }, // Item
    { wch: 8 },  // Versão
    { wch: 14 }, // Medidas
    { wch: 8 }   // Kg
  ];

  XLSX.utils.book_append_sheet(wb, wsHistorico, "Histórico");


  /* ================= SALVAR ================= */

  XLSX.writeFile(wb, "Estoque_" + dataFormatada + ".xlsx");
}

/* ================= DETALHES POR TIPO ================= */

let tipoDetalheAtual = null;
let ordemDetalhes = { coluna: null, asc: true };

function ordenarDetalhes(coluna) {
  if (ordemDetalhes.coluna === coluna) {
    ordemDetalhes.asc = !ordemDetalhes.asc;
  } else {
    ordemDetalhes.coluna = coluna;
    ordemDetalhes.asc = true;
  }

  document.querySelectorAll('#detalhesTipo thead th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc', 'none');
    th.classList.add('none');
  });

  const thAtivo = document.querySelector(
    `#detalhesTipo thead th[onclick="ordenarDetalhes('${coluna}')"]`
  );
  if (thAtivo) {
    thAtivo.classList.remove('none');
    thAtivo.classList.add(ordemDetalhes.asc ? 'asc' : 'desc');
  }

  atualizarDetalhes();
}

function abrirDetalhes(tipo) {
  tipoDetalheAtual = tipo;
  document.getElementById('estoque').classList.add('hidden');
  document.getElementById('detalhesTipo').classList.remove('hidden');
  document.getElementById('detalheTitulo').textContent = nomeCompletoTipo(tipo);
  document.getElementById('buscaDetalhes').value = '';
  ordemDetalhes = { coluna: null, asc: true };
  document.querySelectorAll('#detalhesTipo thead th.sortable').forEach(th => {
    th.classList.remove('asc', 'desc', 'none');
    th.classList.add('none');
  });
  atualizarDetalhes();
}

function fecharDetalhes() {
  tipoDetalheAtual = null;
  document.getElementById('detalhesTipo').classList.add('hidden');
  document.getElementById('estoque').classList.remove('hidden');
  atualizarTabela();
}

function atualizarDetalhes() {
  const tbody = document.getElementById('detalhesTabela');
  tbody.innerHTML = '';
  const termo = document.getElementById('buscaDetalhes').value.toLowerCase();
  let pesoTotalAcumulado = 0;
  let totalBobinas = 0;

     // 1. Filtra entradas do tipo selecionado (ativas ou consumidas)
  let entradas = historico.filter(h => {
    if (h.tipo !== "Entrada") return false;
    let partes = h.item.split(" - V");
    if (partes.length < 2) return false;
    let item = partes[0];
    let tipoEncontrado = "";
    Object.keys(banco).forEach(t => { if (banco[t][item]) tipoEncontrado = t; });
    if (tipoEncontrado !== tipoDetalheAtual) return false;
    // Mostra se tem estoque OU se é consumida
    if (h.consumida) return true;
    if (!estoque[h.item] || estoque[h.item] <= 0) return false;
    return true;
  });

     // 2. Agrupa por item+versão
  let agrupado = {};

  // Primeiro agrupa todas as entradas por chave
  let todasEntradas = {};
  entradas.forEach(h => {
    let chave = h.item;
    if (!todasEntradas[chave]) {
      todasEntradas[chave] = [];
    }
    todasEntradas[chave].push(h);
  });

    // Pega entradas ativas + consumidas
  Object.keys(todasEntradas).forEach(chave => {
    let pesoAtual = estoque[chave] || 0;
    let lista = todasEntradas[chave];

    // Separa consumidas e ativas
    let consumidas = lista.filter(h => h.consumida);
    let ativas = lista.filter(h => !h.consumida);

    // Se não tem estoque e não tem consumidas, pula
    if (pesoAtual <= 0 && consumidas.length === 0) return;

    // Das ativas, pega de trás pra frente até somar o peso atual
    let registrosSelecionados = [];
    let soma = 0;

    for (let i = ativas.length - 1; i >= 0; i--) {
      if (soma >= pesoAtual) break;
      registrosSelecionados.unshift(ativas[i]);
      soma += ativas[i].qtd;
    }

    // Junta consumidas + ativas selecionadas
    agrupado[chave] = {
      registros: [...consumidas, ...registrosSelecionados],
      total: pesoAtual
    };
  });

  // 3. Cria lista de chaves (filtradas pela busca) e ordena
    let chavesOrdenadas = Object.keys(agrupado).filter(chave => {
    let partes = chave.split(" - V");
    let item = partes[0];
    let versao = partes[1];
    let tamanho = "";
    if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][item] && banco[tipoDetalheAtual][item][versao]) {
      tamanho = banco[tipoDetalheAtual][item][versao].tamanho;
    }
    let peso = agrupado[chave].total;
    let qtd = agrupado[chave].registros.length;
    return (`${item} ${versao} ${tamanho} ${peso} ${qtd}`.toLowerCase().includes(termo));
  });

  // Aplica ordenação se houver coluna selecionada
  if (ordemDetalhes.coluna) {
    chavesOrdenadas.sort((a, b) => {
      let pA = a.split(" - V");
      let pB = b.split(" - V");
      let itemA = pA[0], versaoA = pA[1];
      let itemB = pB[0], versaoB = pB[1];

      let v1, v2;

      if (ordemDetalhes.coluna === 'item') {
        v1 = itemA.toLowerCase();
        v2 = itemB.toLowerCase();
      } else if (ordemDetalhes.coluna === 'versao') {
        v1 = parseFloat(versaoA) || 0;
        v2 = parseFloat(versaoB) || 0;
      } else if (ordemDetalhes.coluna === 'tamanho') {
        let tA = "", tB = "";
        if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][itemA] && banco[tipoDetalheAtual][itemA][versaoA]) {
          tA = banco[tipoDetalheAtual][itemA][versaoA].tamanho;
        }
        if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][itemB] && banco[tipoDetalheAtual][itemB][versaoB]) {
          tB = banco[tipoDetalheAtual][itemB][versaoB].tamanho;
        }
        let pA1 = tA.split(" x "), pB1 = tB.split(" x ");
        let lA = parseFloat(pA1[0]) || 0, lB = parseFloat(pB1[0]) || 0;
        let aA = parseFloat(pA1[1]) || 0, aB = parseFloat(pB1[1]) || 0;
        if (lA !== lB) return ordemDetalhes.asc ? lA - lB : lB - lA;
        return ordemDetalhes.asc ? aA - aB : aB - aA;
      } else if (ordemDetalhes.coluna === 'peso') {
        v1 = agrupado[a].total;
        v2 = agrupado[b].total;
      } else if (ordemDetalhes.coluna === 'qtd') {
        v1 = agrupado[a].registros.length;
        v2 = agrupado[b].registros.length;
      }

      if (v1 > v2) return ordemDetalhes.asc ? 1 : -1;
      if (v1 < v2) return ordemDetalhes.asc ? -1 : 1;
      return 0;
    });
  }

  // 4. Renderiza as linhas
  chavesOrdenadas.forEach(chave => {
    let partes = chave.split(" - V");
    let item = partes[0];
    let versao = partes[1];
    let tamanho = "";

    if (banco[tipoDetalheAtual] && banco[tipoDetalheAtual][item] && banco[tipoDetalheAtual][item][versao]) {
      tamanho = banco[tipoDetalheAtual][item][versao].tamanho;
    }

    pesoTotalAcumulado += agrupado[chave].total;
    totalBobinas += agrupado[chave].registros.length;

    let idLimpo = "gp" + item.replace(/[^a-zA-Z0-9]/g, '') + versao.replace(/[^a-zA-Z0-9]/g, '');

        // Linha principal
    let tr = document.createElement('tr');
    tr.id = "principal-" + idLimpo;
    tr.innerHTML = `
      <td>${item}</td>
      <td>${versao}</td>
      <td>${tamanho}</td>
      <td>${formatarPeso(agrupado[chave].total)}</td>
      <td>${agrupado[chave].registros.filter(r => !r.consumida).length}</td>
      <td><button class="btn-expandir-detalhe" onclick="toggleGrupo('${idLimpo}')">+</button></td>
    `;
    longPress(tr, function() {
      abrirModalOpcoes('item', chave, null);
    });
    tbody.appendChild(tr);

    // Mini legenda (escondida)
    let trLegenda = document.createElement('tr');
    trLegenda.className = "detalhe-legenda hidden";
    trLegenda.setAttribute('data-grupo', idLimpo);
        trLegenda.innerHTML = `
      <td style="text-align:center;width:2ch;">#</td>
      <td colspan="2" style="text-align:center;">Data 📅</td>
      <td style="text-align:center;">Kg</td>
      <td colspan="2"></td>
    `;
    tbody.appendChild(trLegenda);

    // Linhas individuais (escondidas)
        agrupado[chave].registros.forEach((reg, idx) => {
      let indexReal = historico.indexOf(reg);
      let trReg = document.createElement('tr');
      trReg.className = "detalhe-registro hidden" + (reg.consumida ? " bobina-consumida" : "");
      trReg.setAttribute('data-grupo', idLimpo);
      trReg.innerHTML = `
        <td style="text-align:center;width:2ch;"><strong>${idx + 1}</strong></td>
        <td colspan="2" style="text-align:center;font-size:11px;">${reg.data}</td>
        <td style="text-align:center;"><strong>${Math.round(reg.qtd)}</strong></td>
        <td colspan="2"></td>
      `;
      longPress(trReg, function() {
        abrirModalOpcoes('bobina', chave, indexReal);
      });
      tbody.appendChild(trReg);
    });
  });

  document.getElementById('detalheTotalPeso').textContent = formatarPeso(pesoTotalAcumulado) + ' kg';
  document.getElementById('detalheTotalBobinas').textContent = totalBobinas + ' bobinas';
}
function toggleGrupo(id) {
  let linhas = document.querySelectorAll(`tr[data-grupo="${id}"]`);
  let principal = document.getElementById("principal-" + id);
  let btn = event.target;
  let abrindo = false;

  linhas.forEach(l => {
    if (l.classList.contains('hidden')) {
      l.classList.remove('hidden');
      abrindo = true;
    } else {
      l.classList.add('hidden');
    }
  });

  if (abrindo) {
    principal.classList.add('grupo-aberto');
    btn.textContent = "−";
  } else {
    principal.classList.remove('grupo-aberto');
    btn.textContent = "+";
  }
}

/* ================= BACKUP ================= */

function exportarBackup() {
  const dados = {
    estoque: estoque,
    historico: historico,
    dataBackup: new Date().toLocaleString()
  };

  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");

  const agora = new Date();
  const dataFormatada =
    agora.getFullYear() + "-" +
    String(agora.getMonth() + 1).padStart(2, "0") + "-" +
    String(agora.getDate()).padStart(2, "0") + "_" +
    String(agora.getHours()).padStart(2, "0") + "-" +
    String(agora.getMinutes()).padStart(2, "0");

  link.href = URL.createObjectURL(blob);
  link.download = "backup_estoque_" + dataFormatada + ".json";
  link.click();
}

function importarBackup() {
  document.getElementById('inputBackup').click();
}

function processarBackup(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);

      if (!dados.estoque || !dados.historico) {
        alert("Arquivo de backup inválido!");
        return;
      }

      if (!confirm("Isso vai substituir TODOS os dados atuais pelo backup.\n\nData do backup: " + (dados.dataBackup || "desconhecida") + "\n\nDeseja continuar?")) {
        return;
      }

      estoque = dados.estoque;
      historico = dados.historico;

      salvarDados();
      atualizarTabela();
      atualizarHistorico();

      alert("Backup restaurado com sucesso!");
      fecharModalExportar();

    } catch (erro) {
      alert("Erro ao ler o arquivo de backup!");
    }
  };

  leitor.readAsText(arquivo);
  event.target.value = "";
}

function removerBobinaDetalhe(indexHistorico, chaveEstoque) {

  if (!confirm("Remover esta bobina?")) return;

  let registro = historico[indexHistorico];
  if (!registro) return;

  // Salva quais grupos estão abertos
  let gruposAbertos = [];
  document.querySelectorAll('tr.grupo-aberto').forEach(tr => {
    let id = tr.id.replace('principal-', '');
    gruposAbertos.push(id);
  });

  // Remove o peso do estoque
  if (estoque[chaveEstoque]) {
    estoque[chaveEstoque] -= registro.qtd;
    if (estoque[chaveEstoque] <= 0) {
      delete estoque[chaveEstoque];
    }
  }

  // Remove do histórico
  historico.splice(indexHistorico, 1);

  // Salva e atualiza tudo
  salvarDados();
  atualizarTabela();
  atualizarHistorico();
  atualizarDetalhes();

  // Reabre os grupos que estavam abertos
  gruposAbertos.forEach(id => {
    let linhas = document.querySelectorAll(`tr[data-grupo="${id}"]`);
    let principal = document.getElementById("principal-" + id);
    if (principal) {
      principal.classList.add('grupo-aberto');
      let btn = principal.querySelector('.btn-expandir-detalhe');
      if (btn) btn.textContent = "−";
    }
    linhas.forEach(l => l.classList.remove('hidden'));
  });
}

/* ================= LONG PRESS + MODAL OPÇÕES ================= */


let longPressTimer = null;
let opcaoAtual = {
  tipo: null,       // 'item' ou 'bobina'
  chave: null,      // ex: "2000047 - V1"
  indexHistorico: null
};

function abrirModalOpcoes(tipo, chave, indexHistorico) {
  opcaoAtual.tipo = tipo;
  opcaoAtual.chave = chave;
  opcaoAtual.indexHistorico = indexHistorico;

let titulo = document.getElementById('modalOpcoesTitulo');
  let btnEditar = document.getElementById('btnOpcaoEditar');

  if (tipo === 'item') {
    titulo.textContent = chave;
    btnEditar.style.display = 'none';
  } else {
    let reg = historico[indexHistorico];
    titulo.textContent = chave + ' — #' + (indexHistorico + 1);
    btnEditar.style.display = 'block';

}

  // Verifica se já está consumida
  let btnConsumir = document.getElementById('btnOpcaoConsumir');
  if (tipo === 'bobina' && historico[indexHistorico] && historico[indexHistorico].consumida) {
    btnConsumir.textContent = '↩Desmarcar consumida';
  } else if (tipo === 'item') {
    // Verifica se todas as bobinas do item estão consumidas
    let todasConsumidas = historico.filter(h =>
      h.item === chave && h.tipo === "Entrada"
    ).every(h => h.consumida);
    btnConsumir.textContent = todasConsumidas ? '↩ Desmarcar consumidas' : '✔️ Marcar como consumida';
  } else {
    btnConsumir.textContent = '✔️ Marcar como consumida';
}
  // Mostra "Excluir consumidas" só na linha do item fechado e se tiver consumidas
  let btnExcluirConsumidas = document.getElementById('btnOpcaoExcluirConsumidas');
  if (tipo === 'item') {
    let temConsumida = historico.some(h =>
      h.item === chave && h.tipo === "Entrada" && h.consumida
    );
    btnExcluirConsumidas.style.display = temConsumida ? 'block' : 'none';
  } else {
    btnExcluirConsumidas.style.display = 'none';
  }

  document.getElementById('modalOpcoes').classList.remove('hidden');
}

function fecharModalOpcoes() {
  document.getElementById('modalOpcoes').classList.add('hidden');
  opcaoAtual = { tipo: null, chave: null, indexHistorico: null };
}

function longPress(elemento, callback) {
  elemento.addEventListener('touchstart', function(e) {
    longPressTimer = setTimeout(function() {
      callback();
    }, 500);
  });

  elemento.addEventListener('touchend', function() {
    clearTimeout(longPressTimer);
  });

  elemento.addEventListener('touchmove', function() {
    clearTimeout(longPressTimer);
  });

  elemento.addEventListener('mousedown', function(e) {
    longPressTimer = setTimeout(function() {
      callback();
    }, 500);
});

  elemento.addEventListener('mouseup', function() {
    clearTimeout(longPressTimer);
  });

  elemento.addEventListener('mouseleave', function() {
    clearTimeout(longPressTimer);
  });
}

/* ================= AÇÕES DO MODAL ================= */

function editarBobina() {
  if (opcaoAtual.tipo !== 'bobina') return;

  let reg = historico[opcaoAtual.indexHistorico];
  if (!reg) return;

  let novoPeso = prompt("Novo peso (kg):", reg.qtd);
  if (novoPeso === null) return;

  novoPeso = parseFloat(novoPeso);
  if (isNaN(novoPeso) || novoPeso <= 0) {
    alert("Peso inválido");
    return;
  }

  let diferenca = novoPeso - reg.qtd;

  reg.qtd = novoPeso;

  if (!reg.consumida && estoque[opcaoAtual.chave]) {
    estoque[opcaoAtual.chave] += diferenca;
    if (estoque[opcaoAtual.chave] <= 0) {
      delete estoque[opcaoAtual.chave];
    }
  }

  salvarDados();
  atualizarTudo();
  fecharModalOpcoes();
}

function consumirBobina() {
  if (opcaoAtual.tipo === 'bobina') {

    let reg = historico[opcaoAtual.indexHistorico];
    if (!reg) return;

    if (reg.consumida) {
      reg.consumida = false;
      if (estoque[opcaoAtual.chave]) {
        estoque[opcaoAtual.chave] += reg.qtd;
      } else {
        estoque[opcaoAtual.chave] = reg.qtd;
      }
    } else {
      reg.consumida = true;
      if (estoque[opcaoAtual.chave]) {
        estoque[opcaoAtual.chave] -= reg.qtd;
        if (estoque[opcaoAtual.chave] <= 0) {
          delete estoque[opcaoAtual.chave];
        }
      }
    }

  } else if (opcaoAtual.tipo === 'item') {

    let entradas = historico.filter(h =>
      h.item === opcaoAtual.chave && h.tipo === "Entrada"
    );

    let todasConsumidas = entradas.every(h => h.consumida);

    entradas.forEach(h => {
      if (todasConsumidas) {
        h.consumida = false;
        if (estoque[opcaoAtual.chave]) {
          estoque[opcaoAtual.chave] += h.qtd;
        } else {
          estoque[opcaoAtual.chave] = h.qtd;
        }
      } else {
        if (!h.consumida) {
          h.consumida = true;
          if (estoque[opcaoAtual.chave]) {
            estoque[opcaoAtual.chave] -= h.qtd;
            if (estoque[opcaoAtual.chave] <= 0) {
              delete estoque[opcaoAtual.chave];
            }
          }
        }
      }
    });
  }

  salvarDados();
  atualizarTudo();
  fecharModalOpcoes();
}

function excluirConsumidas() {
  if (!confirm("Remover todas as bobinas consumidas de " + opcaoAtual.chave + "?")) return;

  for (let i = historico.length - 1; i >= 0; i--) {
    if (historico[i].item === opcaoAtual.chave && historico[i].tipo === "Entrada" && historico[i].consumida) {
      historico.splice(i, 1);
    }
  }

  salvarDados();
  atualizarTudo();
  fecharModalOpcoes();
}

function excluirBobina() {
  if (opcaoAtual.tipo === 'bobina') {

    if (!confirm("Remover esta bobina?")) return;

    let reg = historico[opcaoAtual.indexHistorico];
    if (!reg) return;

    if (!reg.consumida && estoque[opcaoAtual.chave]) {
      estoque[opcaoAtual.chave] -= reg.qtd;
      if (estoque[opcaoAtual.chave] <= 0) {
        delete estoque[opcaoAtual.chave];
      }
    }

    historico.splice(opcaoAtual.indexHistorico, 1);

  } else if (opcaoAtual.tipo === 'item') {

    if (!confirm("Remover TODAS as bobinas de " + opcaoAtual.chave + "?")) return;

    delete estoque[opcaoAtual.chave];

    for (let i = historico.length - 1; i >= 0; i--) {
      if (historico[i].item === opcaoAtual.chave && historico[i].tipo === "Entrada") {
        historico.splice(i, 1);
      }
    }
  }

  salvarDados();
  atualizarTudo();
  fecharModalOpcoes();
}

function atualizarTudo() {
  atualizarTabela();
  atualizarHistorico();
  if (tipoDetalheAtual) {
    let gruposAbertos = [];
    document.querySelectorAll('tr.grupo-aberto').forEach(tr => {
      let id = tr.id.replace('principal-', '');
      gruposAbertos.push(id);
    });

    atualizarDetalhes();

    gruposAbertos.forEach(id => {
      let linhas = document.querySelectorAll(`tr[data-grupo="${id}"]`);
      let principal = document.getElementById("principal-" + id);
      if (principal) {
        principal.classList.add('grupo-aberto');
        let btn = principal.querySelector('.btn-expandir-detalhe');
        if (btn) btn.textContent = "−";
      }
      linhas.forEach(l => l.classList.remove('hidden'));
    });
  }
}

/* ================= SAÍDA COM SELEÇÃO DE BOBINAS ================= */

let saidaAtual = {
  identificador: null,
  pesoTotal: 0,
  pesoRestante: 0,
  bobinas: [],
  descontos: {},
  zeradas: []
};

let bobinaZeradaAtual = null;

function abrirModalSaida(identificador, pesoSaida) {

  saidaAtual.identificador = identificador;
  saidaAtual.pesoTotal = pesoSaida;
  saidaAtual.pesoRestante = pesoSaida;
  saidaAtual.descontos = {};
  saidaAtual.zeradas = [];

  // Busca bobinas ativas desse item
  let entradas = historico.filter(h =>
    h.item === identificador && h.tipo === "Entrada" && !h.consumida
  );

  // Pega as mais recentes que compõem o saldo
  let pesoAtual = estoque[identificador] || 0;
  let bobinas = [];
  let soma = 0;

  for (let i = entradas.length - 1; i >= 0; i--) {
    if (soma >= pesoAtual) break;
    bobinas.unshift(entradas[i]);
    soma += entradas[i].qtd;
  }

  saidaAtual.bobinas = bobinas;

  // Título
  document.getElementById('modalSaidaTitulo').textContent = 'Saída — ' + identificador;
  document.getElementById('modalSaidaRestante').textContent = 'Restante: ' + saidaAtual.pesoRestante + ' kg';

  renderizarBobinasSaida();

  document.getElementById('modalSaida').classList.remove('hidden');
}

function renderizarBobinasSaida() {
  let tbody = document.getElementById('modalSaidaBody');
  tbody.innerHTML = '';

  saidaAtual.bobinas.forEach((bob, idx) => {
    let indexReal = historico.indexOf(bob);
    let desconto = saidaAtual.descontos[indexReal] || 0;
    let pesoAtualBob = bob.qtd - desconto;
    let jaSelecionada = desconto > 0;
    let zerada = saidaAtual.zeradas.includes(indexReal);

    let tr = document.createElement('tr');

    if (zerada) {
      tr.className = 'bobina-descontada';
    } else if (jaSelecionada) {
      tr.className = 'bobina-selecionada';
    }

    // Botão marcável/desmarcável
       let checado = jaSelecionada ? 'checked' : '';
    let desabilitado = '';
    if (saidaAtual.pesoRestante <= 0 && !jaSelecionada) {
      desabilitado = 'disabled';
    }

    tr.innerHTML = `
      <td><input type="radio" ${checado} ${desabilitado} onclick="selecionarBobinaSaida(${indexReal})" style="width:16px;height:16px;margin:0;cursor:pointer;"></td>
      <td><strong>${idx + 1}</strong></td>
      <td style="font-size:11px;">${bob.data}</td>
      <td><strong>${Math.round(pesoAtualBob)}</strong></td>
    `;

    tbody.appendChild(tr);
  });

  document.getElementById('modalSaidaRestante').textContent = 'Restante: ' + Math.round(saidaAtual.pesoRestante) + ' kg';
}

function selecionarBobinaSaida(indexReal) {
  let bob = historico[indexReal];
  if (!bob) return;

  // Se já está selecionada, desmarca
  if (saidaAtual.descontos[indexReal]) {
    let devolvido = saidaAtual.descontos[indexReal];
    saidaAtual.pesoRestante += devolvido;
    delete saidaAtual.descontos[indexReal];

    let posZerada = saidaAtual.zeradas.indexOf(indexReal);
    if (posZerada !== -1) {
      saidaAtual.zeradas.splice(posZerada, 1);
    }

    renderizarBobinasSaida();
    return;
  }

  let pesoAtualBob = bob.qtd - (saidaAtual.descontos[indexReal] || 0);

  if (saidaAtual.pesoRestante <= 0) return;

  if (saidaAtual.pesoRestante >= pesoAtualBob) {
    saidaAtual.descontos[indexReal] = pesoAtualBob;
    saidaAtual.pesoRestante -= pesoAtualBob;
    saidaAtual.zeradas.push(indexReal);
  } else {
    saidaAtual.descontos[indexReal] = saidaAtual.pesoRestante;
    saidaAtual.pesoRestante = 0;
  }

  renderizarBobinasSaida();
}

function confirmarSaida() {
  let totalDescontado = Object.values(saidaAtual.descontos).reduce((a, b) => a + b, 0);

  if (totalDescontado <= 0) {
    alert("Selecione pelo menos uma bobina");
    return;
  }

  if (saidaAtual.pesoRestante > 0) {
    alert("Ainda restam " + Math.round(saidaAtual.pesoRestante) + " kg para descontar");
    return;
  }

  if (saidaAtual.zeradas.length > 0) {
    processarZeradas(0);
  } else {
    finalizarSaida();
  }
}

function processarZeradas(indice) {
  if (indice >= saidaAtual.zeradas.length) {
    finalizarSaida();
    return;
  }

  bobinaZeradaAtual = {
    indexReal: saidaAtual.zeradas[indice],
    indiceZerada: indice
  };

  let bob = historico[bobinaZeradaAtual.indexReal];
  document.getElementById('modalZerouTexto').textContent =
    'Bobina #' + (saidaAtual.bobinas.indexOf(bob) + 1) + ' — ' + Math.round(bob.qtd) + ' kg';

  document.getElementById('modalZerou').classList.remove('hidden');
}

function zerouConsumir() {
  let idx = bobinaZeradaAtual.indexReal;
  let bob = historico[idx];
  bob.consumida = true;

  document.getElementById('modalZerou').classList.add('hidden');
  processarZeradas(bobinaZeradaAtual.indiceZerada + 1);
}

function zerouExcluir() {
  let idx = bobinaZeradaAtual.indexReal;
  historico[idx]._excluir = true;

  document.getElementById('modalZerou').classList.add('hidden');
  processarZeradas(bobinaZeradaAtual.indiceZerada + 1);
}

function finalizarSaida() {
  // Calcula tudo primeiro
  let totalDescontado = Object.values(saidaAtual.descontos).reduce((a, b) => a + b, 0);

  let bobsConsumidas = saidaAtual.zeradas.filter(idx => historico[idx] && historico[idx].consumida);
  let bobsExcluidas = saidaAtual.zeradas.filter(idx => historico[idx] && historico[idx]._excluir);

  let pesoDescontadoParcial = 0;
  Object.keys(saidaAtual.descontos).forEach(idx => {
    let indexReal = parseInt(idx);
    if (!saidaAtual.zeradas.includes(indexReal)) {
      pesoDescontadoParcial += saidaAtual.descontos[indexReal];
    }
  });

  let partesMsg = saidaAtual.identificador.split(" - V");
  let itemNome = partesMsg[0];
  let versaoNome = partesMsg[1];

  // Monta mensagem antes de alterar dados
  let mensagemFinal = "";

  if (bobsConsumidas.length > 0) {
    bobsConsumidas.forEach(idx => {
      let bob = historico[idx];
      if (bob) {
        mensagemFinal += "Bobina consumida (" + itemNome + ", V" + versaoNome + ", " + Math.round(bob.qtd) + "kg)\n";
      }
    });
  }

  if (bobsExcluidas.length > 0) {
    bobsExcluidas.forEach(idx => {
      let bob = historico[idx];
      if (bob) {
        mensagemFinal += "Bobina excluída (" + itemNome + ", V" + versaoNome + ", " + Math.round(bob.qtd) + "kg)\n";
      }
    });
  }

  if (pesoDescontadoParcial > 0) {
    mensagemFinal += "Removido " + Math.round(pesoDescontadoParcial) + "kg (" + itemNome + ", V" + versaoNome + ")";
  }

  // Aplica os descontos no estoque
  if (estoque[saidaAtual.identificador]) {
    estoque[saidaAtual.identificador] -= totalDescontado;
    if (estoque[saidaAtual.identificador] <= 0) {
      delete estoque[saidaAtual.identificador];
    }
  }

  // Atualiza peso das bobinas que não zeraram
  Object.keys(saidaAtual.descontos).forEach(idx => {
    let indexReal = parseInt(idx);
    if (!saidaAtual.zeradas.includes(indexReal)) {
      historico[indexReal].qtd -= saidaAtual.descontos[indexReal];
    }
  });

  // Registra consumidas no histórico
  bobsConsumidas.forEach(idx => {
    let bob = historico[idx];
    if (bob) {
      historico.push({
        data: new Date().toLocaleString(),
        tipo: 'Saída',
        item: saidaAtual.identificador,
        qtd: bob.qtd,
        consumida: true
      });
    }
  });

  // Registra saída parcial no histórico
  if (pesoDescontadoParcial > 0) {
    // Pega o peso original da bobina parcial
    let pesoOriginalParcial = 0;
    Object.keys(saidaAtual.descontos).forEach(idx => {
      let indexReal = parseInt(idx);
      if (!saidaAtual.zeradas.includes(indexReal)) {
        pesoOriginalParcial = historico[indexReal].qtd + saidaAtual.descontos[indexReal];
      }
    });

    historico.push({
      data: new Date().toLocaleString(),
      tipo: 'Consumo parcial',
      item: saidaAtual.identificador,
      qtd: pesoDescontadoParcial,
      qtdOriginal: pesoOriginalParcial
    });
  }

  // Registra excluídas no histórico
  bobsExcluidas.forEach(idx => {
    let bob = historico[idx];
    if (bob) {
      historico.push({
        data: new Date().toLocaleString(),
        tipo: 'Saída',
        item: saidaAtual.identificador,
        qtd: bob.qtd
      });
    }
  });

  // Remove bobinas marcadas pra excluir
  for (let i = historico.length - 1; i >= 0; i--) {
    if (historico[i]._excluir) {
      historico.splice(i, 1);
    }
  }

  // Salva e atualiza
  salvarDados();
  atualizarTabela();
  atualizarHistorico();

  // Fecha modal
  document.getElementById('modalSaida').classList.add('hidden');

  // Limpa campos
  tipoSelect.value = '';
  itemSelect.innerHTML = '<option value="">Selecionar item</option>';
  versaoSelect.innerHTML = '<option value="">Selecionar versão</option>';
  quantidade.value = '';
  document.getElementById('buscaItem').value = '';

  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }

  setTimeout(function() {
    alert(mensagemFinal);
  }, 150);
}

function cancelarSaida() {
  // Limpa tudo e fecha
  saidaAtual = {
    identificador: null,
    pesoTotal: 0,
    pesoRestante: 0,
    bobinas: [],
    descontos: {},
    zeradas: []
  };

  document.getElementById('modalSaida').classList.add('hidden');
}

/* ================= LONG PRESS LIMPAR TUDO ================= */

document.addEventListener("DOMContentLoaded", function() {

  let timerLimpar = null;

  // Estoque
  let btnEstoque = document.getElementById('btnLimparEstoque');
  if (btnEstoque) {
    btnEstoque.addEventListener('touchstart', function(e) {
      timerLimpar = setTimeout(function() {
        if (confirm("⚠️ ATENÇÃO!\n\nDeseja excluir TODO o estoque?\n\nEssa ação não pode ser desfeita.")) {
          estoque = {};
          salvarDados();
          atualizarTabela();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          alert("Estoque excluído!");
        }
      }, 3000);
    });
    btnEstoque.addEventListener('touchend', function() { clearTimeout(timerLimpar); });
    btnEstoque.addEventListener('touchmove', function() { clearTimeout(timerLimpar); });
    btnEstoque.addEventListener('mousedown', function() {
      timerLimpar = setTimeout(function() {
        if (confirm("⚠️ ATENÇÃO!\n\nDeseja excluir TODO o estoque?\n\nEssa ação não pode ser desfeita.")) {
          estoque = {};
          salvarDados();
          atualizarTabela();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          alert("Estoque excluído!");
        }
      }, 3000);
    });
    btnEstoque.addEventListener('mouseup', function() { clearTimeout(timerLimpar); });
    btnEstoque.addEventListener('mouseleave', function() { clearTimeout(timerLimpar); });
  }

  // Histórico
  let btnHistorico = document.getElementById('btnLimparHistorico');
  if (btnHistorico) {
    btnHistorico.addEventListener('touchstart', function(e) {
      timerLimpar = setTimeout(function() {
        if (confirm("⚠️ ATENÇÃO!\n\nDeseja excluir TODO o histórico?\n\nEssa ação não pode ser desfeita.")) {
          historico = [];
          salvarDados();
          atualizarHistorico();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          alert("Histórico excluído!");
        }
      }, 3000);
    });
    btnHistorico.addEventListener('touchend', function() { clearTimeout(timerLimpar); });
    btnHistorico.addEventListener('touchmove', function() { clearTimeout(timerLimpar); });
    btnHistorico.addEventListener('mousedown', function() {
      timerLimpar = setTimeout(function() {
        if (confirm("⚠️ ATENÇÃO!\n\nDeseja excluir TODO o histórico?\n\nEssa ação não pode ser desfeita.")) {
          historico = [];
          salvarDados();
          atualizarHistorico();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          alert("Histórico excluído!");
        }
      }, 3000);
    });
    btnHistorico.addEventListener('mouseup', function() { clearTimeout(timerLimpar); });
    btnHistorico.addEventListener('mouseleave', function() { clearTimeout(timerLimpar); });
  }

});