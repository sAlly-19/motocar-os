import type { Budget, Customer, Vehicle, OrderItem } from '../db/schema';

/**
 * Gerador de HTML do PDF de Orçamento.
 *
 * Layout PRÓPRIO do orçamento — não reutiliza o layout da OS.
 * Contém APENAS informações pertinentes a um orçamento:
 *   - identificação (número curto derivado do id)
 *   - cliente
 *   - veículo (marca/modelo do catálogo)
 *   - validade do orçamento
 *   - itens (peças e serviços) com quantidade, valor unitário e subtotal
 *   - total
 *   - observação/rodapé destacando que se trata de um orçamento (não OS)
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
 * @param budget    Objeto Budget completo (com items e validUntil).
 * @param customer  Cliente vinculado (opcional).
 * @param vehicle   Modelo do catálogo (opcional).
 */
export function generateBudgetHtml(budget: Budget, customer?: Customer | null, vehicle?: Vehicle | null): string {
  const items: OrderItem[] = budget?.items ?? [];
  const parts = items.filter((i) => i && i.type === 'part');
  const services = items.filter((i) => i && i.type === 'service');

  const partsSubtotal = parts.reduce(
    (sum, i) => sum + Number(i.total ?? (i.quantity ?? 0) * (i.unitPrice ?? 0)),
    0,
  );
  const servicesSubtotal = services.reduce(
    (sum, i) => sum + Number(i.total ?? (i.quantity ?? 0) * (i.unitPrice ?? 0)),
    0,
  );

  const renderRow = (item: OrderItem) => `
    <tr>
      <td>${escapeHtml(item.description || '—')}</td>
      <td class="num">${item.quantity ?? 0}</td>
      <td class="num">${money(item.unitPrice)}</td>
      <td class="num strong">${money((item.quantity ?? 0) * (item.unitPrice ?? 0))}</td>
    </tr>`;

  const emptyRow = `
    <tr><td colspan="4" class="empty">Nenhum item nesta categoria.</td></tr>`;

  const numberShort = String(budget?.id ?? '').slice(0, 8).toUpperCase();
  const createdAt = formatBRDate(budget?.createdAt ?? new Date().toISOString());
  const validUntil = budget?.validUntil ? formatBRDate(budget.validUntil) : '—';

  const isExpired =
    budget?.validUntil && new Date(budget.validUntil).getTime() < Date.now();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Orçamento ${numberShort}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 40px; background: #ffffff; }

    /* Header — visual diferente da OS: barra lateral azul em vez de vermelha. */
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 18px; margin-bottom: 24px; border-bottom: 3px solid #031636; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { font-size: 26px; font-weight: 800; color: #031636; letter-spacing: -1px; }
    .logo span { color: #b6171e; }
    .doc-tag { background: #031636; color: #fff; padding: 4px 10px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; font-weight: 700; }
    .doc-title { text-align: right; }
    .doc-title h1 { font-size: 22px; color: #031636; letter-spacing: -0.5px; margin-bottom: 4px; }
    .doc-meta { font-size: 11px; color: #666; }

    /* Cartão de validade destacado */
    .validity { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: ${isExpired ? '#fee2e2' : '#eef4ff'}; border-left: 4px solid ${isExpired ? '#b6171e' : '#031636'}; border-radius: 6px; margin-bottom: 20px; }
    .validity .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${isExpired ? '#b6171e' : '#031636'}; font-weight: 700; }
    .validity .val { font-size: 18px; font-weight: 800; color: ${isExpired ? '#b6171e' : '#031636'}; margin-top: 2px; }
    .validity .status { font-size: 11px; color: ${isExpired ? '#b6171e' : '#166534'}; font-weight: 700; }

    /* Grid de identificação (só cliente + veículo — sem prazo/mecânico) */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .info-box { background: #f8f9fa; padding: 12px 16px; border-radius: 6px; }
    .info-box h3 { font-size: 10px; text-transform: uppercase; color: #031636; letter-spacing: 1px; margin-bottom: 6px; font-weight: 700; }
    .info-box p { font-size: 13px; color: #333; line-height: 1.4; }
    .info-box p.strong { font-size: 15px; font-weight: 700; color: #031636; }

    /* Seções de itens */
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #031636; letter-spacing: 1px; margin: 18px 0 6px 0; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #031636; color: white; padding: 9px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    th.num { text-align: right; }
    td { padding: 9px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    td.num { text-align: right; }
    td.strong { font-weight: 700; color: #031636; }
    td.empty { text-align: center; color: #999; font-style: italic; padding: 12px; }

    /* Totalização */
    .totals { margin-left: auto; width: 320px; margin-top: 12px; }
    .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #666; }
    .totals .row.total { border-top: 2px solid #031636; margin-top: 8px; padding-top: 10px; font-size: 16px; color: #031636; font-weight: 800; }
    .totals .row.total .val { color: #031636; font-size: 20px; }

    .disclaimer { margin-top: 24px; padding: 14px 16px; background: #fffbe6; border-left: 3px solid #d4a017; border-radius: 4px; font-size: 12px; color: #555; line-height: 1.5; }
    .disclaimer strong { color: #7a5c00; }

    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 10px; color: #999; }

    @media print { body { padding: 20px; } .info-box, table { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo">Moto<span>Car</span></div>
      <div class="doc-tag">Orçamento</div>
    </div>
    <div class="doc-title">
      <h1>Nº ${escapeHtml(numberShort)}</h1>
      <div class="doc-meta">Emitido em ${escapeHtml(createdAt)}</div>
    </div>
  </div>

  <div class="validity">
    <div>
      <div class="lbl">Validade do orçamento</div>
      <div class="val">${escapeHtml(validUntil)}</div>
    </div>
    <div class="status">${isExpired ? 'EXPIRADO' : 'VÁLIDO'}</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Cliente</h3>
      <p class="strong">${escapeHtml(customer?.fullName ?? '—')}</p>
      <p>${escapeHtml(customer?.phone ?? '')}</p>
    </div>
    <div class="info-box">
      <h3>Veículo de referência</h3>
      <p class="strong">${escapeHtml(vehicle?.brand ?? '')} ${escapeHtml(vehicle?.model ?? '')}</p>
      <p>${vehicle?.year ? escapeHtml(String(vehicle.year)) : ''}${vehicle?.tipo ? ` · ${escapeHtml(vehicle.tipo)}` : ''}</p>
    </div>
  </div>

  <div class="section-title">Peças estimadas</div>
  <table>
    <tr>
      <th>Descrição</th>
      <th class="num">Qtd</th>
      <th class="num">Valor unit.</th>
      <th class="num">Subtotal</th>
    </tr>
    ${parts.length > 0 ? parts.map(renderRow).join('') : emptyRow}
  </table>

  <div class="section-title">Serviços previstos</div>
  <table>
    <tr>
      <th>Descrição</th>
      <th class="num">Qtd</th>
      <th class="num">Valor unit.</th>
      <th class="num">Subtotal</th>
    </tr>
    ${services.length > 0 ? services.map(renderRow).join('') : emptyRow}
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal peças</span><span class="val">${money(partsSubtotal)}</span></div>
    <div class="row"><span>Subtotal serviços</span><span class="val">${money(servicesSubtotal)}</span></div>
    <div class="row total"><span>TOTAL ESTIMADO</span><span class="val">${money(budget?.total)}</span></div>
  </div>

  <div class="disclaimer">
    <strong>Este documento é um ORÇAMENTO.</strong>
    Os valores acima são estimativas e podem sofrer alterações após diagnóstico técnico completo.
    A execução do serviço só é iniciada mediante aprovação do cliente e conversão em Ordem de Serviço.
    Este orçamento é válido até ${escapeHtml(validUntil)}.
  </div>

  <div class="footer">
    MotoCar Premium Workshop Manager • Documento gerado em ${escapeHtml(formatBRDate(new Date().toISOString()))}
  </div>
</body>
</html>`;
}
