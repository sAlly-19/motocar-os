/**
 * Formata número como moeda BRL sem depender de Intl (para funcionar
 * dentro do PDF gerado — o motor de HTML dentro do expo-print é limitado).
 */
function money(v: number | undefined | null): string {
  const n = Number(v ?? 0);
  return `R$ ${n
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function formatBRDate(iso: string): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Gera o HTML do ticket da OS.
 *
 * @param order       Ordem (com `plate`, `dueDate`, `technicianId`, `items`).
 * @param customer    Cliente (opcional).
 * @param vehicle     Modelo de referência do catálogo (opcional).
 * @param items       Itens da OS (default: `order.items ?? []`).
 * @param mechanicName Nome do mecânico responsável (opcional).
 */
import type { Order, Customer, Vehicle, OrderItem } from '../db/schema';

export function generateTicketHtml(
  order: Order,
  customer?: Customer | null,
  vehicle?: Vehicle | null,
  items: OrderItem[] = [],
  mechanicName?: string
): string {
  const list: OrderItem[] = items && items.length > 0 ? items : order?.items ?? [];
  const parts = list.filter((i) => i && i.type === 'part');
  const services = list.filter((i) => i && i.type === 'service');

  const partsRows = parts
    .map(
      (item: OrderItem) => `
    <tr>
      <td>
        ${escapeHtml(item.description || '—')}
        ${item.warrantyDays ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">Garantia: ${item.warrantyDays} dias</div>` : ''}
      </td>
      <td class="num">${item.quantity ?? 0}</td>
      <td class="num">${money(item.unitPrice)}</td>
      <td class="num strong">${money((item.quantity ?? 0) * (item.unitPrice ?? 0))}</td>
    </tr>`,
    )
    .join('');

  const servicesRows = services
    .map(
      (item: OrderItem) => `
    <tr>
      <td>
        ${escapeHtml(item.description || '—')}
        ${item.warrantyDays ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">Garantia: ${item.warrantyDays} dias</div>` : ''}
      </td>
      <td class="num">${item.quantity ?? 0}</td>
      <td class="num">${money(item.unitPrice)}</td>
      <td class="num strong">${money((item.quantity ?? 0) * (item.unitPrice ?? 0))}</td>
    </tr>`,
    )
    .join('');

  const emptyRow = `
    <tr>
      <td colspan="4" class="empty">Nenhum item registrado.</td>
    </tr>`;

  const plateLabel = escapeHtml((order?.plate ?? '').trim() || '—');
  const brand = escapeHtml(vehicle?.brand ?? '');
  const model = escapeHtml(vehicle?.model ?? '');
  const year = vehicle?.year ? String(vehicle.year) : '';
  const tipo = escapeHtml(vehicle?.tipo ?? '');
  const dueDate = order?.dueDate ? formatBRDate(order.dueDate) : '';
  const createdAt = order?.createdAt ? formatBRDate(order.createdAt) : formatBRDate(new Date().toISOString());
  const notes = escapeHtml(order?.notes ?? '').trim();

  const STATUS_LABEL: Record<string, string> = {
    draft: 'Rascunho',
    open: 'Aberta',
    'in-progress': 'Em execução',
    'waiting-approval': 'Aguardando aprovação',
    ready: 'Pronta para retirada',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
  };
  const statusLabel = STATUS_LABEL[order?.status] ?? String(order?.status ?? '');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ordem de Serviço #${escapeHtml(order?.number ?? '')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #b6171e; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { font-size: 28px; font-weight: 800; color: #031636; letter-spacing: -1px; }
    .logo span { color: #b6171e; }
    .doc-tag { background: #b6171e; color: #fff; padding: 4px 10px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; font-weight: 700; }
    .order-number { font-size: 14px; color: #666; text-align: right; }
    .order-number strong { font-size: 20px; color: #031636; display: block; margin-top: 4px; }
    .order-meta { font-size: 11px; color: #999; margin-top: 4px; }
    .status-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: #eef4ff; color: #031636; margin-top: 6px; }
    .info-grid { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .info-box { flex: 1; min-width: 200px; background: #f8f9fa; padding: 14px 16px; border-radius: 8px; border: 1px solid #eee; }
    .info-box h3 { font-size: 10px; text-transform: uppercase; color: #b6171e; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700; }
    .info-box p { font-size: 13px; color: #333; line-height: 1.4; }
    .info-box p.strong { font-size: 15px; font-weight: 700; color: #031636; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #b6171e; letter-spacing: 1px; margin: 20px 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #031636; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    th.num { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    td.num { text-align: right; }
    td.strong { font-weight: 700; color: #031636; }
    td.empty { text-align: center; color: #999; font-style: italic; padding: 16px; }
    .totals { margin-left: auto; width: 320px; margin-top: 16px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #666; }
    .totals .row.total { border-top: 2px solid #031636; margin-top: 8px; padding-top: 12px; font-size: 18px; color: #031636; font-weight: 800; }
    .totals .row .val { font-weight: 700; color: #1a1a1a; }
    .totals .row.total .val { color: #b6171e; font-size: 22px; }
    .notes { background: #fffbe6; border-left: 3px solid #d4a017; padding: 12px 16px; border-radius: 4px; margin-top: 16px; font-size: 13px; color: #555; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 11px; color: #999; }
    @media print { body { padding: 20px; } .info-box { break-inside: avoid; } table { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo">Moto<span>Car</span></div>
      <div class="doc-tag">Ordem de Serviço</div>
    </div>
    <div class="order-number">
      <strong>OS #${escapeHtml(order?.number ?? '')}</strong>
      <div class="order-meta">Criada em ${escapeHtml(createdAt)}${dueDate ? ` · Prazo ${escapeHtml(dueDate)}` : ''}</div>
      <div class="status-pill">${escapeHtml(statusLabel)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Cliente</h3>
      <p class="strong">${escapeHtml(customer?.fullName ?? '—')}</p>
      <p>${escapeHtml(customer?.phone ?? '')}</p>
    </div>
    <div class="info-box">
      <h3>Veículo</h3>
      <p class="strong">${plateLabel}</p>
      <p>${brand} ${model}${year ? ` · ${year}` : ''}${tipo ? ` · ${tipo}` : ''}</p>
    </div>
    <div class="info-box">
      <h3>Mecânico Responsável</h3>
      <p class="strong">${escapeHtml(mechanicName ?? 'Não atribuído')}</p>
    </div>
  </div>

  <div class="section-title">Peças utilizadas</div>
  <table>
    <tr>
      <th>Descrição</th>
      <th class="num">Qtd</th>
      <th class="num">Valor unit.</th>
      <th class="num">Subtotal</th>
    </tr>
    ${parts.length > 0 ? partsRows : emptyRow}
  </table>

  <div class="section-title">Serviços executados</div>
  <table>
    <tr>
      <th>Descrição</th>
      <th class="num">Qtd</th>
      <th class="num">Valor unit.</th>
      <th class="num">Subtotal</th>
    </tr>
    ${services.length > 0 ? servicesRows : emptyRow}
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal Peças</span><span class="val">${money(order?.partsSubtotal)}</span></div>
    <div class="row"><span>Subtotal Mão de obra</span><span class="val">${money(order?.laborSubtotal)}</span></div>
    ${
      Number(order?.discount ?? 0) > 0
        ? `<div class="row"><span>Desconto</span><span class="val">- ${money(order.discount)}</span></div>`
        : ''
    }
    <div class="row total"><span>VALOR TOTAL</span><span class="val">${money(order?.total)}</span></div>
  </div>

  ${notes ? `<div class="notes"><strong>Observações:</strong><br/>${notes.replace(/\n/g, '<br/>')}</div>` : ''}

  <div class="footer">
    MotoCar - Sistema de Gestão Ordens de Serviço  • ${escapeHtml(formatBRDate(new Date().toISOString()))}
  </div>
</body>
</html>`;
}
