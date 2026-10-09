import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
export type ReportOrder = {
  id: string;
  total: number;
  status: string;
  channel: string;
  delivery: string;
  payment: string;
  created: string;
  nativa_customers: { name: string; phone: string } | null;
};
export function createOrderReport(
  data: { orders: ReportOrder[]; start: string; end: string; status: string },
  now = new Date(),
) {
  const doc = new jsPDF();
  const money = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
      .format(n / 100)
      .replace(/\u00a0/g, " ");
  const date = (s: string) => s.split("-").reverse().join("/");
  const active = data.orders.filter((o) => o.status !== "Cancelado");
  doc.setFillColor(35, 67, 48);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255);
  doc.setFontSize(23);
  doc.text("nativa", 14, 17);
  doc.setFontSize(9);
  doc.text("BEM VIVER  |  RELATÓRIO DE PEDIDOS", 14, 26);
  doc.setTextColor(35, 67, 48);
  doc.setFontSize(12);
  doc.text(`${date(data.start)} a ${date(data.end)}`, 14, 47);
  doc.setFontSize(9);
  doc.text(
    `Situação: ${data.status}   |   Emitido em ${now.toLocaleString("pt-BR", { timeZone: "America/Bahia" })}`,
    14,
    55,
  );
  doc.text(
    `${data.orders.length} pedidos   |   Valor sem cancelados: ${money(active.reduce((s, o) => s + o.total, 0))}`,
    14,
    64,
  );
  doc.setTextColor(90);
  doc.setFontSize(8);
  doc.text(
    "Os valores representam pedidos registrados, não pagamentos recebidos.",
    14,
    71,
  );
  autoTable(doc, {
    startY: 79,
    margin: { top: 18, right: 14, bottom: 22, left: 14 },
    head: [
      ["Pedido / data", "Cliente", "Situação", "Canal / entrega", "Valor"],
    ],
    body: data.orders.length
      ? data.orders.map((o) => [
          `#${o.id.slice(0, 8).toUpperCase()}\n${new Date(o.created).toLocaleDateString("pt-BR", { timeZone: "America/Bahia" })}`,
          `${o.nativa_customers?.name || "Cliente"}\n${o.nativa_customers?.phone || ""}`,
          o.status,
          `${o.channel}\n${o.delivery}`,
          money(o.total),
        ])
      : [[{ content: "Nenhum pedido encontrado neste período.", colSpan: 5 }]],
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [35, 67, 48] },
    alternateRowStyles: { fillColor: [244, 247, 240] },
    columnStyles: {
      0: { cellWidth: 31 },
      1: { cellWidth: 56 },
      2: { cellWidth: 29 },
      3: { cellWidth: 37 },
      4: { cellWidth: 29, halign: "right" },
    },
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Villa Natura Bem Viver | Uso interno - dados de clientes", 14, 286);
    doc.text(`${page} / ${pages}`, 196, 286, { align: "right" });
  }
  doc.setProperties({
    title: "Villa Natura - Relatório de pedidos",
    author: "Villa Natura Bem Viver",
  });
  return doc;
}
