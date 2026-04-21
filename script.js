function nomeBonitoTipo(tipo){

  if(tipo === "brf") return "BRF";
  if(tipo === "tampas") return "Tampas";
  if(tipo === "laminacao") return "1ª Lam.";

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
let ordemHistorico = { coluna: null, asc: true };

document.addEventListener("DOMContentLoaded", function () {
  carregarDados();
});

/* ================= NAVEGAÇÃO ================= */

window.mostrarTela = function(t){

  document.querySelectorAll('.card')
    .forEach(c => c.classList.add('hidden'));

  document.getElementById(t)
    .classList.remove('hidden');

  document.querySelectorAll('.nav-top button')
    .forEach(btn => btn.classList.remove('ativo'));

  document.querySelector(`.nav-top button[onclick="mostrarTela('${t}')"]`)
    .classList.add('ativo');

  const btn = document.getElementById("btnExpandir");

  if (t === "movimentar") {
    btn.style.display = "none";
  } else {
    btn.style.display = "block";
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

    quantidade.focus();

  }else{
    saldoAtual.innerHTML = "";
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
  if(estoque[identificador] < qtd){
    alert("Sem saldo");
    return;
  }
  estoque[identificador] -= qtd;
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

let mensagem = identificador + (tipoMov === 'add' ? " Adicionado" : " Removido");
alert(mensagem);

}

/* ================= ESTOQUE ================= */

function ordenarEstoque(coluna){
if(ordemEstoque.coluna===coluna){
ordemEstoque.asc=!ordemEstoque.asc;
}else{
ordemEstoque.coluna=coluna;
ordemEstoque.asc=true;
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
    peso: peso
  };

})
.filter(d => d !== null)
.filter(d => {
  let textoCompleto = `
    ${d.tipo}
    ${d.item}
    ${d.versao}
    ${d.tamanho}
    ${d.peso}
  `.toLowerCase();

  return textoCompleto.includes(termo);
});

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

    // ✅ Tratamento especial para peso
    if(ordemEstoque.coluna === "peso"){
      v1 = Number(v1);
      v2 = Number(v2);
    }else{
      if(typeof v1==="string") v1=v1.toLowerCase();
      if(typeof v2==="string") v2=v2.toLowerCase();
    }

    if(v1>v2) return ordemEstoque.asc?1:-1;
    if(v1<v2) return ordemEstoque.asc?-1:1;
    return 0;

  });

}

// ✅ ATUALIZA TOTAL GERAL
if(totalGeralLabel){
  totalGeralLabel.innerHTML = pesoTotal.toFixed(2) + " kg";
}

if(totalBrfLabel){
  totalBrfLabel.innerHTML = totalBrf.toFixed(2) + " kg";
}

if(totalTampasLabel){
  totalTampasLabel.innerHTML = totalTampas.toFixed(2) + " kg";
}

if(totalLaminacaoLabel){
  totalLaminacaoLabel.innerHTML = totalLaminacao.toFixed(2) + " kg";
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

function ordenarHistorico(coluna){

  if(ordemHistorico.coluna === coluna){
    ordemHistorico.asc = !ordemHistorico.asc;
  }else{
    ordemHistorico.coluna = coluna;
    ordemHistorico.asc = true;
  }

  atualizarHistorico();
}



function atualizarHistorico(){

  historicoTabela.innerHTML = '';
  let termo = buscaHistorico.value.toLowerCase();

  let dados = historico.map(h => {

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

    let tamanho = banco[tipoEncontrado][item][versao].tamanho;

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
  ${d.tipo}
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

  if(ordemHistorico.coluna){

  dados.sort((a,b)=>{

    let v1 = a[ordemHistorico.coluna];
    let v2 = b[ordemHistorico.coluna];

    // ✅ Tratamento especial para tamanho
    if(ordemHistorico.coluna === "tamanho"){

      let p1 = v1.split(" x ");
      let p2 = v2.split(" x ");

      let largura1 = parseFloat(p1[0]);
      let largura2 = parseFloat(p2[0]);

      let altura1 = parseFloat(p1[1]);
      let altura2 = parseFloat(p2[1]);

      if(largura1 !== largura2){
        return ordemHistorico.asc ? largura1 - largura2 : largura2 - largura1;
      }

      return ordemHistorico.asc ? altura1 - altura2 : altura2 - altura1;
    }

    // ✅ Peso numérico
    if(ordemHistorico.coluna === "qtd"){
      v1 = Number(v1);
      v2 = Number(v2);
    }else{
      v1 = String(v1).toLowerCase();
      v2 = String(v2).toLowerCase();
    }

    if(v1 > v2) return ordemHistorico.asc ? 1 : -1;
    if(v1 < v2) return ordemHistorico.asc ? -1 : 1;
    return 0;

  });

}

  dados.forEach(d => {

    let indexReal = historico.indexOf(d.original);

    historicoTabela.innerHTML += `
  <tr>
    <td>${d.data}</td>
    <td>${d.movimentacao}</td>
    <td>${nomeBonitoTipo(d.tipo)}</td>

    <td>
      ${d.item}<br>
      <strong>V ${d.versao}</strong><br>
      <span style="font-size:11px;">
        ${d.tamanho}
      </span>
    </td>

    <td>${d.qtd}</td>

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

};/* ================= TOAST ================= */

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

window.abrirModalExportar = function(tipo){
  tipoExportacaoAtual = tipo;
  document.getElementById("modalExportar").classList.remove("hidden");
};

window.fecharModalExportar = function(){
  document.getElementById("modalExportar").classList.add("hidden");
};

window.togglePeriodo = function(show){
  const area = document.getElementById("areaPeriodo");
  if(show){
    area.classList.remove("hidden");
  }else{
    area.classList.add("hidden");
  }
};

window.executarExportacao = function(){
  
  const tipoRadio = document.querySelector('input[name="tipoExportacao"]:checked').value;
  const periodo = tipoRadio === 'periodo';
  
  let dataInicio = null;
  let dataFim = null;
  
  if(periodo){
    dataInicio = document.getElementById("exportDataInicio").value;
    dataFim = document.getElementById("exportDataFim").value;
  }

  if(tipoExportacaoAtual === 'estoque'){
    exportarEstoque(dataInicio, dataFim);
  }else{
    exportarHistorico(dataInicio, dataFim);
  }

  fecharModalExportar();
};

window.togglePeriodo = function(show){
  const area = document.getElementById("areaPeriodo");
  if(show){
    area.classList.remove("hidden");
  }else{
    area.classList.add("hidden");
  }
};

window.executarExportacao = function(){
  
  const tipoRadio = document.querySelector('input[name="tipoExportacao"]:checked').value;
  const periodo = tipoRadio === 'periodo';
  
  let dataInicio = null;
  let dataFim = null;
  
  if(periodo){
    dataInicio = document.getElementById("exportDataInicio").value;
    dataFim = document.getElementById("exportDataFim").value;
  }

  if(tipoExportacaoAtual === 'estoque'){
    exportarEstoque(dataInicio, dataFim);
  }else{
    exportarHistorico(dataInicio, dataFim);
  }

  fecharModalExportar();
};

function exportarEstoque(){

  let dadosExportar = [];

  Object.keys(estoque).forEach(chave=>{

    let partes = chave.split(" - V");
    let item = partes[0];
    let versao = partes[1];

    let tipoInterno = "";

    Object.keys(banco).forEach(tipo=>{
      if(banco[tipo][item]){
        tipoInterno = tipo;
      }
    });

    let tipoBonito = nomeBonitoTipo(tipoInterno);
    let tamanho = banco[tipoInterno][item][versao].tamanho;

    dadosExportar.push({
      Tipo: tipoBonito,
      Item: item,
      Versão: versao,
      Tamanho: tamanho,
      Peso: estoque[chave]
    });
  });

  exportarParaExcel("Estoque", dadosExportar);
}

function exportarHistorico(dataInicio, dataFim){

  let dadosExportar = historico.filter(h => {

    let dataISO = h.data.split(",")[0].split("/").reverse().join("-");

    if(!dataInicio && !dataFim) return true;

    let okInicio = !dataInicio || dataISO >= dataInicio;
    let okFim = !dataFim || dataISO <= dataFim;

    return okInicio && okFim;

  }).map(h=>{

    let partes = h.item.split(" - V");
    let item = partes[0];
    let versao = partes[1];

    let tipoInterno = "";

    Object.keys(banco).forEach(tipo=>{
      if(banco[tipo][item]){
        tipoInterno = tipo;
      }
    });

    let tipoBonito = nomeBonitoTipo(tipoInterno);
    let tamanho = banco[tipoInterno][item][versao].tamanho;

    return {
      data: h.data.replace(", ", "<br>"),
      Movimentação: h.tipo,
      Tipo: tipoBonito,
      Item: item,
      Versão: versao,
      Tamanho: tamanho,
      Peso: h.qtd
    };
  });

  exportarParaExcel("Historico", dadosExportar);
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