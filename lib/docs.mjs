/**
 * 商务文档模板：开发信 / 跟进邮件 / 报价单 / 形式发票 / 销售合同
 *
 * 设计原则
 * - 只做"结构化草稿"：把系统里的事实填进去，把未知项用 [[ ]] 显式标出，绝不编造。
 * - 模板是英文（实际业务用），界面提供中文提示。
 * - 不做"一键发送"：生成后可编辑、复制、下载，发送前人工检查。
 */

export const DOC_KINDS = [
  {
    key: 'dev_letter',
    label: '开发信',
    en: 'Development Letter',
    desc: '首次联系潜在客户：说明你是谁、为什么找他、能给什么具体价值。',
    needs: ['client'],
  },
  {
    key: 'followup',
    label: '跟进邮件',
    en: 'Follow-up Email',
    desc: '基于上一次沟通和下一步动作，写一封短而有推进力的跟进。',
    needs: ['client'],
  },
  {
    key: 'quotation',
    label: '报价单',
    en: 'Quotation',
    desc: '把报价计算器里的数字变成可直接发出的报价单，含价格口径与假设。',
    needs: ['client', 'quote'],
  },
  {
    key: 'pi',
    label: '形式发票 PI',
    en: 'Proforma Invoice',
    desc: '客户确认订单后的付款依据。金额、条款、收款信息必须与合同一致。',
    needs: ['client', 'quote'],
  },
  {
    key: 'contract',
    label: '销售合同',
    en: 'Sales Contract',
    desc: '把价格、交付、付款、质量、争议条款固定下来，不依赖口头承诺。',
    needs: ['client', 'quote'],
  },
];

function money(currency, value) {
  const n = Number(value) || 0;
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function clean(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function senderBlock(profile = {}) {
  return [
    clean(profile.company_en, clean(profile.company, '[[Your Company Name]]')),
    clean(profile.address, '[[Company Address]]'),
    clean(profile.email, '[[your.email@example.com]]'),
    clean(profile.phone, '[[+86 ...]]'),
    clean(profile.website, ''),
  ].filter(Boolean).join('\n');
}

function signature(profile = {}, params = {}) {
  return [
    'Best regards,',
    clean(params.signature_name, clean(profile.name, '[[Your Name]]')),
    clean(params.signature_title, '[[Your Title]]'),
    clean(profile.company_en, clean(profile.company, '[[Your Company]]')),
    clean(profile.email, '[[your.email@example.com]]'),
  ].filter(Boolean).join('\n');
}

function contactName(client = {}, contact = {}) {
  return clean(contact.name, '[[Contact Name]]');
}

function productName(line = {}, params = {}) {
  return clean(line.name, clean(params.product, '[[Product Name]]'));
}

function quoteTable(calc, currency, lines) {
  const head = ['No.', 'Description', 'Qty', 'Unit', 'Unit Price', 'Amount'];
  const rows = lines.map((line, index) => {
    const unit = Number(line.unitPrice ?? 0);
    const qty = Number(line.qty ?? 0);
    return [
      String(index + 1),
      `${line.name || '[Product]'}${line.spec ? ` (${line.spec})` : ''}`,
      String(qty),
      line.unit || 'pc',
      money(currency, unit),
      money(currency, unit * qty),
    ];
  });
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const pad = (text, width) => String(text).padEnd(width);
  const line = head.map((h, i) => pad(h, widths[i])).join('  ');
  const sep = widths.map((w) => '-'.repeat(w)).join('  ');
  return [line, sep, ...rows.map((r) => r.map((v, i) => pad(v, widths[i])).join('  '))].join('\n');
}

function assumptionsBlock(quote = {}, calc = {}) {
  const notes = [];
  if (quote.assumptions) notes.push(...String(quote.assumptions).split('\n').filter(Boolean));
  if (quote.unconfirmed) notes.push(`待确认：${quote.unconfirmed}`);
  if (quote.incoterm && quote.incoterm_place) notes.push(`Price basis: ${quote.incoterm} ${quote.incoterm_place} (Incoterms 2020).`);
  if (quote.payment_terms) notes.push(`Payment terms: ${quote.payment_terms}`);
  if (quote.delivery_time) notes.push(`Lead time: ${quote.delivery_time}`);
  if (!notes.length) notes.push('[[请补充：报价有效期、付款方式、交货期、包装与验货标准]]');
  if (calc?.warnings?.length) {
    notes.push(...calc.warnings.map((w) => `[Internal check] ${w}`));
  }
  return notes.map((n) => `- ${n}`).join('\n');
}

/* ------------------------------------------------------------------ */

export function generateDoc({ kind, client = {}, contact = {}, quote = {}, lines = [], calc = {}, profile = {}, params = {} }) {
  const missing = [];
  if (!client.company) missing.push('客户公司');
  if (['quotation', 'pi', 'contract'].includes(kind) && !lines.length) missing.push('报价行');
  if (['quotation', 'pi', 'contract'].includes(kind) && !calc?.price?.total) missing.push('报价金额（汇率或成本未填）');

  const buyer = [
    clean(client.company, '[[Buyer Company]]'),
    client.region || client.country ? clean([client.region, client.country].filter(Boolean).join(', ')) : '[[Country]]',
    `Attn: ${contactName(client, contact)}`,
  ].join('\n');

  if (kind === 'dev_letter') {
    const product = clean(params.product, clean(client.products_interest, '[[Product]]'));
    const value = clean(params.value, '[[一个具体价值：价格、交期、认证、定制能力]]');
    const title = `开发信 · ${client.company || product}`;
    const body = `Subject: ${product} supplier for ${clean(client.company, '[[Buyer Company]]')}

Dear ${contactName(client, contact)},

I am ${clean(profile.name, '[[Your Name]]')} from ${clean(profile.company_en, clean(profile.company, '[[Your Company]]'))}, a manufacturer/exporter of ${product} in China.

I am writing because ${clean(params.reason, '[[为什么找这家客户：他们经营的产品、市场、渠道]]')}.

What we can offer specifically:
- ${value}
- ${clean(params.offer_2, '[[Second concrete advantage: MOQ, lead time, certification]]')}
- ${clean(params.offer_3, '[[Third concrete advantage]]')}

If this is relevant, I can send a quotation with ${clean(params.next_step, 'FOB/CIF price, MOQ and lead time')} within one working day.

Would you like me to send it to this email, or to another colleague?

${signature(profile, params)}

---
[[发送前检查]]
1. 删掉所有 [[ ]] 占位内容，不要发出带占位符的邮件。
2. 确认收件人姓名与公司拼写正确。
3. 不要写"我们是最大的/最好的"这类无法证明的话。
4. 附件的文件名用英文，≤ 5MB。`;
    return { title, body, missing };
  }

  if (kind === 'followup') {
    const last = clean(params.last_summary, clean(quote.notes, '[[上次沟通的事实：客户问了什么、你答了什么]]'));
    const next = clean(params.next_action, '[[一个明确的下一步：寄样、视频验厂、确认数量、给最终价]]');
    const title = `跟进邮件 · ${client.company || '客户'}`;
    const body = `Subject: Re: ${clean(params.subject, `[[与上次一致的邮件主题]]`)} / ${clean(client.company, '[[Buyer Company]]')}

Dear ${contactName(client, contact)},

Following up on our previous exchange${last ? `: ${last}` : ''}.

${clean(params.body_note, '[[补充一条新信息：新价格有效期、生产排期、样品照片、认证进度]]')}

As the next step, I suggest ${next}. ${clean(params.timeline, '[[给一个时间点，例如 "I can send it before Friday this week."]]')}

Would that work for you?

${signature(profile, params)}

---
[[发送前检查]]
1. 跟进不是复述"just following up"，必须带一条新信息或明确动作。
2. 同一客户 5 个工作日内不超过 2 封。
3. 明确写出你希望对方做的下一步。`;
    return { title, body, missing };
  }

  if (kind === 'quotation') {
    const total = money(quote.currency || 'USD', calc?.price?.total || 0);
    const title = `报价单 · ${client.company || '客户'} · ${quote.quote_no || ''}`.trim();
    const body = `QUOTATION

${senderBlock(profile)}

Quote No.: ${clean(quote.quote_no, '[[Quote No.]]')}
Date: ${today()}
Valid until: ${clean(quote.valid_until, '[[Validity, e.g. 30 days from the date above]]')}

To:
${buyer}

Subject: Quotation for ${clean(params.product, lines.map((l) => l.name).filter(Boolean).join(', ')) || '[[Product]]'}

Dear ${contactName(client, contact)},

Thank you for your inquiry. We are pleased to quote as follows:

${quoteTable(calc, quote.currency || 'USD', lines)}

Total: ${total}

Price basis: ${clean(quote.incoterm, 'FOB')}${quote.incoterm_place ? ` ${quote.incoterm_place}` : ''} (Incoterms 2020)
Terms & assumptions:
${assumptionsBlock(quote, calc)}

Remarks:
${clean(quote.notes, '[[包装、唛头、验货、原产地证等说明]]')}

This quotation is based on the assumptions above. Any change in quantity, specification, destination or freight rate may affect the price.

${signature(profile, params)}`;
    return { title, body, missing };
  }

  if (kind === 'pi') {
    const total = money(quote.currency || 'USD', calc?.price?.total || 0);
    const title = `形式发票 PI · ${client.company || '客户'} · ${quote.quote_no || ''}`.trim();
    const body = `PROFORMA INVOICE

Seller:
${senderBlock(profile)}

Buyer:
${buyer}

PI No.: PI-${clean(quote.quote_no, '[[Quote No.]]')}
Date: ${today()}
Related quotation: ${clean(quote.quote_no, '[[Quote No.]]')}
Valid until: ${clean(quote.valid_until, '[[Validity]]')}

${quoteTable(calc, quote.currency || 'USD', lines)}

Total amount: ${total}
Price basis: ${clean(quote.incoterm, 'FOB')}${quote.incoterm_place ? ` ${quote.incoterm_place}` : ''} (Incoterms 2020)

Payment terms: ${clean(quote.payment_terms, '[[e.g. 30% T/T deposit, 70% before shipment]]')}
Lead time: ${clean(quote.delivery_time, '[[e.g. 25-30 days after deposit]]')}
Shipping: ${clean(params.shipping, '[[Port of loading / destination / partial shipment allowed?]]')}
Packing: ${clean(params.packing, '[[Standard export carton / pallet]]')}

Bank details:
Beneficiary: ${clean(profile.company_en, clean(profile.company, '[[Company name]]'))}
Bank name: [[Bank Name]]
Account number: [[Account Number]]
SWIFT/BIC: [[SWIFT]]
Bank address: [[Bank Address]]

Notes:
${clean(quote.unconfirmed, '[[待确认事项]]')}

This proforma invoice is for payment arrangement only and is not a tax invoice. Please confirm the details before payment.

${signature(profile, params)}`;
    return { title, body, missing };
  }

  if (kind === 'contract') {
    const total = money(quote.currency || 'USD', calc?.price?.total || 0);
    const title = `销售合同 · ${client.company || '客户'} · ${quote.quote_no || ''}`.trim();
    const body = `SALES CONTRACT

Contract No.: SC-${clean(quote.quote_no, '[[Quote No.]]')}
Date: ${today()}
Place: [[City, China]]

SELLER:
${senderBlock(profile)}

BUYER:
${buyer}

The Seller and the Buyer have agreed to conclude this contract on the following terms:

1. COMMODITY AND PRICE
${quoteTable(calc, quote.currency || 'USD', lines)}

Total contract value: ${total}
Price basis: ${clean(quote.incoterm, 'FOB')}${quote.incoterm_place ? ` ${quote.incoterm_place}` : ''} (Incoterms 2020)

2. QUALITY AND SPECIFICATION
${clean(params.quality, '[[Quality standard, technical parameters, or approved sample reference]]')}

3. PACKING AND MARKING
${clean(params.packing, '[[Export standard packing; shipping marks confirmed by both parties]]')}

4. SHIPMENT
Time of shipment: ${clean(quote.delivery_time, '[[Within __ days after receipt of deposit]]')}
Port of loading: [[Port]]
Port of destination: [[Port]]
Partial shipment / transshipment: [[allowed / not allowed]]

5. PAYMENT
${clean(quote.payment_terms, '[[e.g. 30% T/T deposit, balance against copy of B/L]]')}
Bank charges outside China are for the Buyer's account.

6. DOCUMENTS
Commercial invoice, packing list, bill of lading, certificate of origin and other documents required by the destination country.

7. INSPECTION
${clean(params.inspection, '[[Inspection standard, timing, and who bears the cost]]')}

8. FORCE MAJEURE
Neither party shall be liable for delay or failure caused by events beyond its reasonable control, provided the affected party notifies the other promptly and provides evidence.

9. CLAIMS
Any quality claim must be raised in writing within [[__]] days after arrival of the goods at the destination, together with photos, inspection report and a sample where necessary.

10. GOVERNING LAW AND DISPUTE RESOLUTION
This contract shall be governed by the laws of [[China / agreed jurisdiction]]. Disputes shall first be settled by friendly negotiation; failing that, they shall be submitted to [[CIETAC / agreed arbitration body]].

11. SIGNATURES

For and on behalf of the Seller:            For and on behalf of the Buyer:

Signature: ______________________           Signature: ______________________
Name: ${clean(profile.name, '[[Name]]')}                            Name: ${contactName(client, contact)}
Title: ${clean(params.signature_title, '[[Title]]')}                            Title: [[Title]]
Date: ${today()}                          Date: ${today()}

---
[[重要]]
1. 合同条款需按照真实交易修改，特别是付款、检验、索赔期限与争议解决。
2. 首次合作建议做信保或前 T/T；不要仅凭邮件承诺放账。
3. 签署前让双方公司名称、地址、盖章主体保持一致。`;
    return { title, body, missing };
  }

  throw new Error(`未知文档类型：${kind}`);
}

export function findKind(kind) {
  return DOC_KINDS.find((item) => item.key === kind) || null;
}