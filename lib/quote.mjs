/**
 * 报价计算引擎：EXW / FOB / CIF / DAP / DDP
 *
 * 设计原则
 * - 每个数字都能追溯：返回逐步骤的公式与结果，界面直接展示，不藏黑箱。
 * - 所有成本先按人民币计算，最后按汇率换算成报价币种；汇率、运费、关税、增值税都是"假设"，
 *   单独返回 warnings，提示用户去核实，而不是假装精确。
 * - 不自动联网取汇率/运价/税率。
 *
 * 口径（写进界面与文档，避免误解）
 * - 产品成本 = 出厂价 + 包装 + 其他单件成本。
 * - 毛利按成本加成（markup）计算：EXW = 成本 × (1 + 毛利率)。
 * - FOB = EXW + 装运港前费用（内陆运输、报关、港杂、单证、银行费）÷ 数量。
 * - CIF = (FOB + 海运费/数量) ÷ (1 − 1.1 × 保险费率) + CIF 段其他费用/数量。
 *   这是保险金额按 CIF 价 ×110% 计的标准算法。
 * - DAP = FOB + 海运费/数量 + 目的地送货费/数量。
 * - DDP 关税以 CIF 货值为基数估算：关税 = CIF × 关税率；增值税 = (CIF + 关税) × 增值税率。
 */

export const INCOTERMS = ['EXW', 'FOB', 'CIF', 'DAP', 'DDP'];
export const CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP', 'JPY'];
export const STAGES = {
  fob: 'FOB 装运港前',
  cif: 'CIF 海运与保险',
  dap: 'DAP 目的地送货',
  ddp: 'DDP 关税与增值税',
};

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function round(value, digits = 2) {
  const m = 10 ** digits;
  return Math.round((num(value) + Number.EPSILON) * m) / m;
}

function fmt(n, digits = 2) {
  return round(n, digits).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * @param {object} input { quote, lines, costs }
 * @returns 计算结果（含步骤、警告、人民币与报价币种两套数字）
 */
export function calcQuote({ quote = {}, lines = [], costs = [] } = {}) {
  const currency = String(quote.currency || 'USD').toUpperCase();
  const incoterm = String(quote.incoterm || 'FOB').toUpperCase();
  const fxRate = num(quote.fx_rate, 0);
  const defaultMargin = num(quote.margin_rate, 0);

  const normalizedLines = lines
    .map((line, index) => ({
      ...line,
      qty: Math.max(0, num(line.qty, 0)),
      unit_cost: Math.max(0, num(line.unit_cost, 0)),
      packaging_cost: Math.max(0, num(line.packaging_cost, 0)),
      other_cost: Math.max(0, num(line.other_cost, 0)),
      margin_rate: line.margin_rate === null || line.margin_rate === undefined || line.margin_rate === ''
        ? defaultMargin
        : num(line.margin_rate, defaultMargin),
      sort: num(line.sort, index),
    }))
    .filter((line) => line.name || line.unit_cost || line.qty);

  const totalQty = normalizedLines.reduce((sum, line) => sum + line.qty, 0);
  const baseCostTotal = normalizedLines.reduce(
    (sum, line) => sum + line.qty * (line.unit_cost + line.packaging_cost + line.other_cost),
    0
  );
  const exwTotal = normalizedLines.reduce(
    (sum, line) => sum + line.qty * (line.unit_cost + line.packaging_cost + line.other_cost) * (1 + line.margin_rate / 100),
    0
  );

  const baseUnit = totalQty ? baseCostTotal / totalQty : 0;
  const exwUnit = totalQty ? exwTotal / totalQty : 0;

  const byStage = { fob: [], cif: [], dap: [], ddp: [] };
  for (const cost of costs) {
    const stage = String(cost.stage || 'fob').toLowerCase();
    const amount = num(cost.amount, 0);
    if (!amount) continue;
    (byStage[stage] || byStage.fob).push({ ...cost, amount });
  }
  const sumStage = (stage, category) => (byStage[stage] || [])
    .filter((c) => (category ? c.category === category : true))
    .reduce((sum, c) => sum + c.amount, 0);

  const fobFixed = sumStage('fob');
  const freight = sumStage('cif', 'freight');
  const cifOther = sumStage('cif') - freight;
  const dapFixed = sumStage('dap');
  const ddpOther = sumStage('ddp');

  const fobUnit = exwUnit + (totalQty ? fobFixed / totalQty : 0);
  const freightUnit = totalQty ? freight / totalQty : 0;
  const cifOtherUnit = totalQty ? cifOther / totalQty : 0;
  const dapFixedUnit = totalQty ? dapFixed / totalQty : 0;
  const ddpOtherUnit = totalQty ? ddpOther / totalQty : 0;

  const insuranceRate = Math.max(0, num(quote.insurance_rate, 0)) / 100;
  const insuranceFactor = 1 - 1.1 * insuranceRate;
  // 保险费率过高时公式无解，回退到 0 并在警告里说明
  const safeFactor = insuranceFactor > 0.01 ? insuranceFactor : 1;
  const cifBase = fobUnit + freightUnit;
  const insuranceUnit = safeFactor ? cifBase / safeFactor - cifBase : 0;
  const cifUnit = cifBase / safeFactor + cifOtherUnit;

  const dapUnit = fobUnit + freightUnit + dapFixedUnit;

  const dutyRate = Math.max(0, num(quote.duty_rate, 0)) / 100;
  const vatRate = Math.max(0, num(quote.vat_rate, 0)) / 100;
  // 关税与增值税按 CIF 货值估算（DDP 报价里最常见的口径），不按 DDP 价循环计算
  const dutyUnit = cifUnit * dutyRate;
  const vatUnit = (cifUnit + dutyUnit) * vatRate;
  const ddpUnit = dapUnit + dutyUnit + vatUnit + ddpOtherUnit;

  const cnyPrice = {
    EXW: exwUnit,
    FOB: fobUnit,
    CIF: cifUnit,
    DAP: dapUnit,
    DDP: ddpUnit,
  }[incoterm] ?? fobUnit;

  const canConvert = fxRate > 0;
  const unitPrice = canConvert ? cnyPrice / fxRate : 0;
  const totalAmount = unitPrice * totalQty;
  const marginOnPrice = cnyPrice > 0 ? ((cnyPrice - baseUnit) / cnyPrice) * 100 : 0;

  const warnings = [];
  if (!normalizedLines.length) warnings.push('还没有报价行：至少填一个产品、数量和成本。');
  if (!totalQty) warnings.push('总数量为 0，无法计算单价。');
  if (!canConvert) warnings.push(`汇率未填写（1 ${currency} = ? CNY），报价金额暂时为 0。汇率每天变，必须自己核实当天数值。`);
  if (incoterm !== 'EXW' && fobFixed === 0) warnings.push('FOB 段费用为 0：内陆运输、报关、港杂、单证费不要漏，否则报价会偏低。');
  if (['CIF', 'DAP', 'DDP'].includes(incoterm) && freight === 0) warnings.push('海运费为 0：CIF/DAP/DDP 必须填入真实运费（货代报价，带有效期）。');
  if (incoterm === 'CIF' && insuranceRate === 0) warnings.push('保险费率为 0：CIF 报价通常按货值 110% 投保，请核实费率。');
  if (insuranceFactor <= 0.01) warnings.push('保险费率设置过高（≥ 90.9%），CIF 公式无解，已按 0 费率处理。');
  if (incoterm === 'DDP' && dutyRate === 0) warnings.push('DDP 关税率为 0：目的国关税必须查 HS 编码对应的税率，不能默认免税。');
  if (incoterm === 'DDP' && vatRate === 0) warnings.push('DDP 增值税率为 0：欧盟/英国等目的地通常有 VAT，请核实。');
  if (defaultMargin <= 0) warnings.push('毛利率 ≤ 0：如果不是故意亏本报，请检查。');
  if (quote.assumptions) warnings.push('本报价包含你在「报价假设」里写下的未确认条件，发出去前逐条核实。');

  const steps = [
    {
      label: '成本合计（人民币）',
      formula: 'Σ 数量 ×（产品成本 + 包装 + 其他单件成本）',
      cny: baseCostTotal,
      unitCny: baseUnit,
    },
    {
      label: `EXW 出厂单价（含 ${fmt(defaultMargin, 1)}% 默认毛利）`,
      formula: 'Σ 数量 × 单件成本 × (1 + 行毛利率) ÷ 总数量',
      cny: exwTotal,
      unitCny: exwUnit,
      unit: exwUnit / (canConvert ? fxRate : 1),
    },
    {
      label: 'FOB 装运港交货单价',
      formula: 'EXW + FOB 段固定费用 ÷ 总数量',
      cny: (fobUnit) * totalQty,
      unitCny: fobUnit,
      unit: fobUnit / (canConvert ? fxRate : 1),
    },
    {
      label: 'CIF 到岸单价',
      formula: '(FOB + 海运费 ÷ 数量) ÷ (1 − 1.1 × 保险费率) + CIF 其他费用 ÷ 数量',
      cny: cifUnit * totalQty,
      unitCny: cifUnit,
      unit: cifUnit / (canConvert ? fxRate : 1),
    },
    {
      label: 'DAP 目的地交货单价',
      formula: 'FOB + 海运费 ÷ 数量 + 目的地送货费 ÷ 数量',
      cny: dapUnit * totalQty,
      unitCny: dapUnit,
      unit: dapUnit / (canConvert ? fxRate : 1),
    },
    {
      label: 'DDP 完税后交货单价',
      formula: 'DAP + 关税（CIF × 关税率）+ 增值税（(CIF + 关税) × 增值税率）+ DDP 其他费用 ÷ 数量',
      cny: ddpUnit * totalQty,
      unitCny: ddpUnit,
      unit: ddpUnit / (canConvert ? fxRate : 1),
    },
  ];

  return {
    ok: true,
    incoterm,
    currency,
    fxRate,
    totalQty: round(totalQty, 4),
    marginRate: round(defaultMargin, 2),
    marginOnPrice: round(marginOnPrice, 1),
    price: {
      unit: round(unitPrice, 2),
      total: round(totalAmount, 2),
      unitCny: round(cnyPrice, 2),
      totalCny: round(cnyPrice * totalQty, 2),
    },
    cny: {
      baseUnit: round(baseUnit, 2),
      baseTotal: round(baseCostTotal, 2),
      exwUnit: round(exwUnit, 2),
      fobUnit: round(fobUnit, 2),
      cifUnit: round(cifUnit, 2),
      dapUnit: round(dapUnit, 2),
      ddpUnit: round(ddpUnit, 2),
      freightUnit: round(freightUnit, 2),
      insuranceUnit: round(insuranceUnit, 2),
      dutyUnit: round(dutyUnit, 2),
      vatUnit: round(vatUnit, 2),
      fobFixed: round(fobFixed, 2),
      freight: round(freight, 2),
      dapFixed: round(dapFixed, 2),
      ddpOther: round(ddpOther, 2),
    },
    steps,
    warnings,
    lines: normalizedLines.map((line) => {
      const base = line.unit_cost + line.packaging_cost + line.other_cost;
      const exw = base * (1 + line.margin_rate / 100);
      return {
        ...line,
        baseUnit: round(base, 2),
        exwUnit: round(exw, 2),
        lineTotalCny: round(exw * line.qty, 2),
        unitPrice: round(canConvert ? exw / fxRate : 0, 2),
      };
    }),
  };
}

export const QUOTE_STATUS = {
  draft: '草稿',
  sent: '已发出',
  negotiating: '议价中',
  won: '已成交',
  lost: '已丢单',
  expired: '已过期',
};

export const CLIENT_STAGES = {
  lead: '线索',
  contacted: '已联系',
  replied: '已回复',
  quoted: '已报价',
  negotiating: '议价中',
  sample: '样品阶段',
  won: '已成交',
  lost: '已丢单',
};