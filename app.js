const $ = (id) => document.getElementById(id);

// Cabeçalho
$("nome").textContent = DADOS.nome;
$("cargo").textContent = DADOS.cargo;
$("empresa").textContent = DADOS.empresa;
$("bio").textContent = DADOS.bio;
$("avatar").innerHTML = DADOS.foto
  ? `<img src="${DADOS.foto}" alt="">`
  : DADOS.nome.charAt(0);

// Botões de contato, em pares: WhatsApp e Pix, LinkedIn e E-mail, GitHub e Instagram
$("redes").innerHTML = [
  { nome: "WhatsApp",  icone: "bi-whatsapp",      url: DADOS.whatsapp && (DADOS.whatsapp.startsWith("http") ? DADOS.whatsapp : `https://wa.me/${DADOS.whatsapp}`) },
  { nome: "Pix",       pix: DADOS.pix },
  { nome: "LinkedIn",  icone: "bi-linkedin",      url: DADOS.linkedin },
  { nome: "E-mail",    icone: "bi-envelope-fill", url: DADOS.email && `mailto:${DADOS.email}` },
  { nome: "GitHub",    icone: "bi-github",        url: DADOS.github },
  { nome: "Instagram", icone: "bi-instagram",     url: DADOS.instagram },
]
  .filter((r) => r.url || r.pix)
  .map((r) => r.pix
    ? `<button type="button" class="rede" id="abrir-pix" aria-label="Pix"><b class="pix-texto">PIX</b></button>`
    : `<a class="rede" href="${r.url}" target="_blank" rel="noopener" aria-label="${r.nome}"><i class="bi ${r.icone}"></i></a>`)
  .join("");

// ---------- Pix ----------
// Monta o "Pix Copia e Cola" (padrão BR Code do Banco Central) e o QR code dele.

// Cada campo é: código (2 dígitos) + tamanho (2 dígitos) + valor
const campo = (id, valor) => id + String(valor.length).padStart(2, "0") + valor;

// Tira acentos e deixa em maiúsculas, como os bancos esperam
const limpar = (texto, max) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().slice(0, max);

// Dígito verificador exigido no fim do código (CRC16-CCITT)
function crc16(texto) {
  let crc = 0xffff;
  for (const c of texto) {
    crc ^= c.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function codigoPix(chave, nome, cidade) {
  const semCrc =
    campo("00", "01") +
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave)) +
    campo("52", "0000") +
    campo("53", "986") +                 // real
    campo("58", "BR") +
    campo("59", limpar(nome, 25)) +
    campo("60", limpar(cidade, 15)) +
    campo("62", campo("05", "***")) +
    "6304";
  return semCrc + crc16(semCrc);
}

if (DADOS.pix) {
  const codigo = codigoPix(DADOS.pix, DADOS.pixNome || DADOS.nome, DADOS.pixCidade || "Brasil");

  const qr = qrcode(0, "M");
  qr.addData(codigo);
  qr.make();
  $("pix-qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  $("pix-chave").textContent = DADOS.pix;

  const janela = $("pix");
  $("abrir-pix").addEventListener("click", () => janela.showModal());
  $("fechar-pix").addEventListener("click", () => janela.close());
  janela.addEventListener("click", (e) => { if (e.target === janela) janela.close(); });

  $("copiar-pix").addEventListener("click", async (e) => {
    const botao = e.currentTarget;
    try {
      await navigator.clipboard.writeText(codigo);
      botao.textContent = "Copiado! Cole no app do banco";
    } catch {
      prompt("Copie o código Pix:", codigo);
    }
    setTimeout(() => (botao.textContent = "Copiar código Pix"), 2500);
  });
}

// ---------- Cara de app ----------
// O Safari do iPhone ignora o "user-scalable=no", então bloqueia a pinça aqui
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
