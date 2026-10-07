import { test } from "node:test";
import assert from "node:assert/strict";
import { createOrderReport } from "../lib/order-report.ts";
test("PDF report handles an empty period and paginates long lists with correct non-cancelled total", () => {
  const period = { start: "2026-10-01", end: "2026-10-07", status: "Todos" };
  const empty = createOrderReport({ ...period, orders: [] });
  assert.equal(empty.getNumberOfPages(), 1);
  assert.match(empty.output(), /Nenhum pedido encontrado/);
  const orders = Array.from({ length: 80 }, (_, i) => ({
    id: "pedido-" + i,
    total: 1000,
    status: i % 2 ? "Novo" : "Cancelado",
    channel: "Site",
    delivery: "Retirada",
    payment: "Pix",
    created: "2026-10-07T12:00:00Z",
    nativa_customers: { name: "Cliente fictício " + i, phone: "11999990000" },
  }));
  const report = createOrderReport({ ...period, orders });
  assert.ok(report.getNumberOfPages() > 1);
  assert.match(report.output(), /R\$ 400,00/);
  assert.match(report.output(), /80 pedidos/);
});
