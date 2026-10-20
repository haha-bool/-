/**
 * 初始种子数据
 * - 目标 / 里程碑：对齐 2026 六级 → 2027 能力建设 → 2028 广州求职
 * - 知识库：26 条起步条目（原则型内容标注 trust=principle，动态费率标注 trust=dynamic）
 * - 任务模板：每日/每周节奏，用于"生成今日计划"
 *
 * 重要：动态信息（费率、关税、平台政策）一律标注"需核实"，不写入未经确认的数字。
 */
import { newId } from './db.mjs';

const GOALS = [
  {
    id: 'goal_en',
    title: '英语能力：从四级到能用的商务英语',
    category: 'english',
    horizon: 'mid',
    target_date: '2027-06-30',
    progress: 0,
    why: '外贸的核心工具。目标不是证书，而是能写开发信、回询盘、谈条款、处理投诉。',
    metric: '六级 500+；三类商务邮件各 10 篇；10 分钟英文产品介绍',
    sort: 1,
  },
  {
    id: 'goal_trade',
    title: '外贸业务能力：从记术语到能独立跑一单',
    category: 'trade',
    horizon: 'long',
    target_date: '2027-12-31',
    progress: 0,
    why: '2028 年去广州时，要能证明自己理解一笔出口业务从找客户到交付的全过程，而不只是背概念。',
    metric: '知识库 40 条 + 100% 报价链 + 1 个模拟订单 + 3 次真实询价',
    sort: 2,
  },
  {
    id: 'goal_job',
    title: '求职与落地：2028 进入广州外贸岗位',
    category: 'career',
    horizon: 'long',
    target_date: '2028-07-01',
    progress: 0,
    why: '先就业实现经济独立，再谈自主经营。求职材料必须由真实经历支撑，不虚构成交数据。',
    metric: '简历 v2 + 30 家目标公司 + 作品集 + offer',
    sort: 3,
  },
  {
    id: 'goal_shopee',
    title: 'Shopee 实验：跑通一次真实跨境交易',
    category: 'shopee',
    horizon: 'mid',
    target_date: '2027-12-31',
    progress: 0,
    why: '用低成本方式建立平台运营和履约的体感，同时理解平台零售与 B2B 的区别。',
    metric: '选品 1 个 + 上架 10 SKU + 首单 + 毛利复盘',
    sort: 4,
  },
  {
    id: 'goal_method',
    title: '商业方法：把踩过的坑变成可复用规则',
    category: 'method',
    horizon: 'evergreen',
    target_date: '',
    progress: 0,
    why: '劳务项目的教训不能只停在"以后要小心"，必须变成清单、条款和流程。',
    metric: '合作前核实清单 + 止损规则 + 每月 1 次项目复盘',
    sort: 5,
  },
];

const MILESTONES = [
  // 英语
  ['mil_en_1', 'goal_en', '完成 6 套六级真题，听力单科 ≥150', '2026-11-20'],
  ['mil_en_2', 'goal_en', '参加 2026 年 12 月六级考试（目标 500+）', '2026-12-19'],
  ['mil_en_3', 'goal_en', '开发信 / 报价 / 跟进三类邮件各完成 10 篇并留存修改记录', '2027-03-31'],
  ['mil_en_4', 'goal_en', '录一段 8-10 分钟英文产品介绍，自评 + 外部反馈', '2027-06-30'],
  // 外贸
  ['mil_tr_1', 'goal_trade', '知识库 40 条，覆盖流程 / 术语 / 单证 / 物流 / 付款', '2026-12-31'],
  ['mil_tr_2', 'goal_trade', '能独立完成 FOB、CIF、DDP 三种报价的成本拆解', '2027-03-31'],
  ['mil_tr_3', 'goal_trade', '完成 1 个模拟 B2B 出口订单全流程（含 8 类单证）', '2027-06-30'],
  ['mil_tr_4', 'goal_trade', '完成 20 个模拟客户开发（研究 → 开发信 → 跟进）', '2027-09-30'],
  ['mil_tr_5', 'goal_trade', '完成 3 次真实供应商询价与成本核算对比', '2027-12-31'],
  // 求职
  ['mil_job_1', 'goal_job', '简历 v1：含 2 个可验证案例（含数据来源说明）', '2027-09-30'],
  ['mil_job_2', 'goal_job', '目标公司清单 30 家 + 岗位画像对照表', '2027-12-31'],
  ['mil_job_3', 'goal_job', '作品集：知识库 + 报价样例 + 邮件样例 + 复盘报告', '2028-03-31'],
  ['mil_job_4', 'goal_job', '拿到广州 / 深圳外贸岗位 offer', '2028-06-30'],
  // Shopee
  ['mil_sp_1', 'goal_shopee', '完成 1 个品类选品与完整利润测算（含平台费用）', '2026-12-31'],
  ['mil_sp_2', 'goal_shopee', '上架 10 个 SKU 并跑通首单履约', '2027-06-30'],
  ['mil_sp_3', 'goal_shopee', '复盘：单量、毛利、退货率、流量来源', '2027-12-31'],
  // 方法
  ['mil_me_1', 'goal_method', '劳务项目完整复盘（事实 / 责任划分 / 止损规则）', '2026-11-15'],
  ['mil_me_2', 'goal_method', '沉淀《合作前核实清单》与《报价前确认清单》', '2026-12-31'],
  ['mil_me_3', 'goal_method', '每月 1 次项目复盘，2027 年累计 8 次', '2027-12-31'],
];

const PROJECTS = [
  {
    id: 'prj_cet6',
    name: 'CET-6 冲刺（2026-12）',
    kind: 'study',
    goal_id: 'goal_en',
    goal: '一次性通过六级，听力与阅读成为拉分项，同时开始积累商务词块。',
    background: '已过四级（425+），口语一般。每天可投入 2 小时以上。',
    status: 'active',
    start_date: '2026-10-20',
    due_date: '2026-12-19',
    progress: 20,
    risks: '只刷题不精听 → 听力天花板低；只背单词不写句子 → 写作仍写不出商务邮件。',
  },
  {
    id: 'prj_kb',
    name: '外贸知识库建设（26 → 40 条）',
    kind: 'study',
    goal_id: 'goal_trade',
    goal: '把术语变成"能在一张真实订单里用出来"的条目，每条都有来源和核实日期。',
    background: '目前接触过 EXW，需要系统补齐 FOB/CIF/DAP/DDP 与单证、物流、付款。',
    status: 'active',
    start_date: '2026-10-20',
    due_date: '2026-12-31',
    progress: 15,
  },
  {
    id: 'prj_order',
    name: '模拟出口订单 #1（B2B 全流程）',
    kind: 'sim',
    goal_id: 'goal_trade',
    goal: '用一个虚构产品（如 LED 面板灯）跑完询盘 → 报价 → 合同 → 生产 → 报关 → 提单 → 收汇。',
    background: '模拟项目，所有客户与数据均为虚构，产出物必须标注"模拟"。',
    status: 'planned',
    start_date: '2027-01-01',
    due_date: '2027-06-30',
    progress: 0,
  },
  {
    id: 'prj_labor',
    name: '劳务项目复盘（真实经历）',
    kind: 'real',
    goal_id: 'goal_method',
    goal: '把"没提前核实现场"的教训转成可执行的前置核实清单与止损规则。',
    background: '组织同学进厂，住宿条件与宣传不符，自行赔付被子并承担亏损。',
    status: 'active',
    start_date: '2026-10-20',
    due_date: '2026-11-15',
    progress: 10,
    risks: '复盘容易变成自责。必须区分"我的决策责任"与"合作方未披露信息"。',
  },
  {
    id: 'prj_shopee',
    name: 'Shopee 选品实验',
    kind: 'practice',
    goal_id: 'goal_shopee',
    goal: '选 1 个低竞争品类，做完竞品与费用测算，决定是否上架。',
    background: '作为跨境零售入口，重点是学会算清平台费用与履约成本。',
    status: 'planned',
    start_date: '2026-11-01',
    due_date: '2026-12-31',
    progress: 0,
  },
];

/* 每日/每周任务模板：[id, title, category, priority, minutes, cadence, weekday_mask, goal_id, detail, criteria] */
const TEMPLATES = [
  ['tpl_listen', '精听 30 分钟（六级听力 / 商务对话）', 'english', 'P0', 30, 'daily', '1,2,3,4,5,6,7', 'goal_en',
    '一段音频听 3 遍：① 盲听抓大意 ② 逐句听写关键词 ③ 对照原文标出听不出的连读/弱读。',
    '产出 1 条听写笔记，记录 3 个听不出的音变现象'],
  ['tpl_words', '词块 25 分钟（外贸高频 + 六级）', 'english', 'P1', 25, 'daily', '1,2,3,4,5,6,7', 'goal_en',
    '只记"词块"不记孤立单词：如 place an order / lead time / minimum order quantity。',
    '新增或复习 15 个词块，其中 5 个来自今天的外贸知识条目'],
  ['tpl_speak', '跟读 / 影子练习 20 分钟', 'english', 'P2', 20, 'daily', '1,2,3,4,5,6,7', 'goal_en',
    '用产品介绍或报价话术做影子跟读，录音回放对比语调与停顿。',
    '录 1 段 2 分钟音频，标出 1 个需要改进的发音或节奏问题'],
  ['tpl_write', '商务邮件写作 1 篇（训练室）', 'english', 'P1', 40, 'daily', '1,2,3,4,5', 'goal_en',
    '先自己写完再要反馈。写不出时允许只写提纲，但必须写。',
    '在训练室保存 1 篇作答，并完成 5 项自检'],
  ['tpl_trade', '外贸知识 1 条：精读 + 应用练习', 'trade', 'P0', 45, 'daily', '1,2,3,4,5,6', 'goal_trade',
    '读 1 条知识库条目，然后回答：这条知识在哪个具体订单环节会改变我的决策？',
    '更新该条目掌握程度，并写下 1 个"我还不确定、需要核实"的点'],
  ['tpl_review', '今日复盘 10 分钟', 'review', 'P1', 10, 'daily', '1,2,3,4,5,6,7', 'goal_method',
    '三问：今天推进了什么？哪里卡住？明天最重要的一件事是什么？',
    '写下 1 条结论，并安排明天 3 件优先任务'],
  ['tpl_week_plan', '本周计划与任务排布', 'review', 'P1', 20, 'weekly', '1', 'goal_method',
    '把本周目标拆到天，确认周末是否有整块时间做模拟项目。', '本周 3 个关键结果写清楚'],
  ['tpl_quiz', '知识抽查自测（闭卷）', 'trade', 'P1', 30, 'weekly', '3', 'goal_trade',
    '随机抽 3 条已学条目，闭卷用自己的话解释并举例，再对照原文补漏。', '3 条自测记录，标注掌握程度变化'],
  ['tpl_mock', '整块实战：报价 / 订单 / 邮件项目', 'project', 'P0', 90, 'weekly', '6', 'goal_trade',
    '用 90 分钟做一件"完整的事"：算一次 FOB→CIF 报价，或写一套询盘+报价+跟进。', '产出 1 份可归档的成果物'],
  ['tpl_week_review', '周复盘 + 错误本回顾', 'review', 'P0', 45, 'weekly', '7', 'goal_method',
    '回答复盘十问，回看本周错误记录，找出重复出现的问题。', '1 篇周复盘 + 1 条下周改进规则'],
  ['tpl_cet_mock', '六级真题 1 套（限时）', 'english', 'P0', 130, 'weekly', '6', 'goal_en',
    '严格计时，先做完整套再对答案；错题标注错因类型（词汇/定位/推理/时间）。', '1 套真题成绩记录 + 错因分类'],
];

/* ---------------- 知识库条目 ---------------- */
const K = (o) => ({
  trust: 'principle',
  source_name: 'Incoterms 2020（ICC 国际商会）',
  source_url: '',
  verified_on: '2026-10-20',
  mastery: 0,
  ...o,
});

const KNOWLEDGE = [
  K({
    id: 'kn_flow', title: '出口业务全流程（8 个阶段）', category: '流程', stage: '全流程', sort: 1,
    tags: '流程,出口,订单管理',
    plain: '一笔出口单可以拆成 8 段：找客户 → 报价 → 订单/合同 → 收款与生产 → 验货 → 订舱报关 → 运输与单证 → 收尾与复购。每一段都有"必须确认的信息"，漏一段就会在后面赔钱或拖期。',
    pro: '标准链条：询盘（Inquiry）→ 报价（Quotation，含贸易术语、有效期、付款方式）→ 订单确认（PO/SC，含规格、数量、单价、交期、包装、唛头）→ 预付款（定金）→ 生产排产与过程跟单 → 出厂前验货（QC）→ 订舱（Booking）→ 报关（出口申报，需合同/发票/装箱单/报关单）→ 装船/装机 → 取得提单（B/L）→ 尾款与寄单 → 目的港清关提货 → 售后与复购。',
    scenario: '客户发来 "Please quote 500pcs FOB Shenzhen"，你需要判断现在处在第 2 段，并确认报价中至少 6 项未定信息（规格、包装、交期、付款、有效期、是否含税/含佣金）。',
    example: '报价前把"未确认清单"写在邮件末尾： "To make this quotation final, please confirm: (1) color, (2) packaging, (3) required delivery date, (4) payment terms." 这样既显得专业，又避免后续扯皮。',
    pitfalls: '1) 先报价后问规格，导致价格反复；2) 只报单价不报有效期与付款方式；3) 把"工厂交货"当成"客户到手价"；4) 没有书面确认就安排生产。',
    checklist: '① 产品规格/型号是否书面确认\n② 数量与阶梯价是否明确\n③ 贸易术语 + 指定地点是否写全\n④ 报价有效期与汇率基准\n⑤ 付款方式与定金比例\n⑥ 交期从哪天起算（收到定金/确认样品）\n⑦ 包装与唛头\n⑧ 谁负责订舱、谁付目的港费用',
  }),
  K({
    id: 'kn_exw', title: 'EXW 工厂交货：最"省事"也最容易出事', category: '贸易术语', stage: '报价/交付', sort: 2,
    tags: 'Incoterms,EXW,交货',
    plain: 'EXW 就是"货在工厂，你自己来拉"。卖方几乎不管运输、不管出口报关、不管装车（除非另有约定）。买方承担从工厂门口开始的全部费用和风险。',
    pro: 'Incoterms 2020 中 EXW（Ex Works）卖方义务最小：在约定地点（通常是卖方场所）把货物置于买方处置之下即完成交货，不负责装货、不负责出口清关。风险在货物置于买方处置时转移。',
    scenario: '一个中国工厂对欧洲小客户报 EXW，客户说自己会找货代。此时工厂要注意：出口报关由谁做？如果由买方货代报关，工厂拿不到以自己名义的出口报关单，可能影响出口退税与收汇核销。',
    example: '实操折中：名义报 EXW，但约定"卖方协助出口报关，费用由买方承担"（FCA 更贴近这种安排）。写清 "EXW our factory, export clearance assisted by seller at buyer\'s cost"。',
    pitfalls: '1) 以为 EXW 卖方什么都不用管，结果货代要求提供报关资料时互相推；2) 中国出口退税需要以出口企业名义报关并取得报关单，EXW 下容易缺这一环；3) 装车费用争议（谁付吊装费）；4) 买方指定货代在工厂放货后失联。',
    checklist: '① 交货地点精确到地址\n② 装货义务与费用谁承担\n③ 出口报关由谁办理、以谁的名义\n④ 是否需要卖方提供出口报关单用于退税\n⑤ 提货车辆/货代联系人确认',
  }),
  K({
    id: 'kn_fob', title: 'FOB 装运港船上交货：最常用的出口术语', category: '贸易术语', stage: '报价/交付', sort: 3,
    tags: 'Incoterms,FOB,海运',
    plain: 'FOB = 卖方负责把货送到装运港并装上船，之后的运费、保险、目的港费用都由买方承担。风险在货物装上船时转移给买方。',
    pro: 'Incoterms 2020 FOB（Free On Board）仅适用于海运或内河运输。卖方负责出口清关、把货物运至装运港、装上买方指定船舶；风险自货物装上船时转移。买方负责主运费、保险、进口清关。注意：Incoterms 2020 在 FOB 下把"装船前"的运输与风险明确划给卖方，实务中"装船费用"（THC、装货费）常需在合同中另行约定。',
    scenario: '报 FOB Shenzhen 时，你的成本应包含：出厂价 + 国内运输到港 + 出口报关及文件 + 港口操作费（THC/文件费，按约定）+ 可能的商检。不包含海运费和保险。',
    example: '报价单写法："USD 12.80/pc FOB Shenzhen, Incoterms 2020, valid 30 days, MOQ 500pcs, lead time 25 days after deposit."',
    pitfalls: '1) 把 FOB 当成"送到客户手上"；2) 忘记把国内拖车、报关、港口费算进成本；3) FOB 却由卖方订舱（应改 CFR/CIF）；4) 买方指定货代乱收费，事先没约定。',
    checklist: '① 指定装运港写全（FOB Shenzhen / FOB Ningbo）\n② 是否含 THC、文件费、报关费\n③ 装船前内陆运输与风险由卖方承担\n④ 订舱由买方负责，但需与买方货代对接时间\n⑤ 报价有效期与汇率基准',
  }),
  K({
    id: 'kn_cif', title: 'CIF 成本加保险费加运费：报价里要含运保', category: '贸易术语', stage: '报价/交付', sort: 4,
    tags: 'Incoterms,CIF,海运,保险',
    plain: 'CIF = FOB + 海运费 + 保险。卖方负责订舱、付运费、买保险，但风险仍在装运港装船时转移给买方——"运费我付，风险你担"。',
    pro: 'Incoterms 2020 CIF 仅适用于海运/内河。卖方须订立运输合同至指定目的港，并办理货物运输保险，最低保险金额为合同价款的 110%，险别至少为协会货物条款（C）或类似条款。风险在装运港装船时转移。CIF 属"象征性交货"：卖方交单即完成交货义务，买方凭单付款。',
    scenario: '客户要 CIF Hamburg。你需要向货代询 20GP 到汉堡的 all-in 海运费，再加保险（货值 ×110% × 费率），并注意运费有效期通常只有 7-14 天，报价有效期要与运费有效期匹配。',
    example: '成本结构：FOB 价 + 海运费/数量 + 保险费（CIF 价 ×110% × 费率）+ 可能的附加费（BAF/THC 目的港是否预付）。',
    pitfalls: '1) 用 FOB 价加"大概运费"报 CIF，运费一涨就亏；2) 保险只按货值 100% 投保，不符合 110% 惯例；3) 忘记目的港费用可能在 CIF 下仍由买方承担（Incoterms 2020 明确目的港卸货费除运费中已含外由买方承担）；4) 报价有效期长于运费有效期。',
    checklist: '① 目的港写全\n② 海运费询价日期与有效期\n③ 保险金额 110%、险别\n④ 目的港 THC/卸货费归属\n⑤ 是否含附加费（BAF、旺季附加费）',
  }),
  K({
    id: 'kn_dap', title: 'DAP 目的地交货：卖方送到门口，但不管清关', category: '贸易术语', stage: '报价/交付', sort: 5,
    tags: 'Incoterms,DAP,交付',
    plain: 'DAP = 卖方把货送到买方指定地点（通常是买方仓库），运输途中的风险由卖方承担；但进口清关和进口关税由买方负责。',
    pro: 'Incoterms 2020 DAP（Delivered at Place）适用于任何运输方式。卖方承担货物运至指定目的地的一切风险（除进口清关与进口税费外），货物在运输工具上准备好卸货时交付。买方负责进口清关并支付关税、税费。注意 DAP 下卸货费由买方承担（除非合同另有约定）。',
    scenario: '客户是欧洲电商卖家，要求送到其波兰仓库。DAP 报价必须包含：全程运费（可能含中欧班列/卡航）+ 出口报关 + 保险（建议）+ 目的地可能的等待费/偏远附加费，但不含波兰进口 VAT 与关税。',
    example: '"USD 3.20/pc DAP Warsaw warehouse, import clearance and duties by buyer."',
    pitfalls: '1) 把 DAP 当 DDP 报，没算进口税；2) 忽略目的地卸货费/等待费；3) 买方清关能力不足导致货卡在海关，产生仓储费；4) 运输方式变化（海运→铁路）后没重新核价。',
    checklist: '① 目的地精确到仓库地址\n② 谁负责卸货、是否含尾板车\n③ 进口清关与税费由买方承担（书面写明）\n④ 运输保险\n⑤ 偏远地区/等待费',
  }),
  K({
    id: 'kn_ddp', title: 'DDP 完税后交货：卖方承担最多，风险也最大', category: '贸易术语', stage: '报价/交付', sort: 6,
    tags: 'Incoterms,DDP,关税',
    plain: 'DDP = 卖方负责把货送到目的地，并且办好进口清关、交完进口关税和税费。买方几乎只负责收货。',
    pro: 'Incoterms 2020 DDP（Delivered Duty Paid）卖方义务最大：承担出口清关、主运输、进口清关、进口关税与税费，货物在目的地准备好卸货时交付。卖方在买方国家通常需要有进口资质或可靠的清关代理（如 VAT 递延、进口商记录 IOR 安排）。',
    scenario: '跨境电商卖家要求 DDP 到美国亚马逊仓库。你要算：海运/空运 + 美国进口关税（按 HS 编码）+ 清关代理费 + 可能的反倾销税 + 内陆卡车费。任何一项没算都可能吃掉全部利润。',
    example: 'DDP 报价前必须确认：HS 编码、目的国关税税率、是否需要 FDA/FCC 等认证、IOR 由谁担任、是否可做 VAT 递延。',
    pitfalls: '1) 不知道 HS 编码就报 DDP；2) 忽略反倾销/反补贴税；3) 没有当地进口资质却承诺 DDP；4) 把 DDP 用在买方无法提供清关资料的场景；5) 目的国查验产生的滞港费没约定。',
    checklist: '① HS 编码与目的国税率已核实\n② 是否需要产品认证/准入\n③ 谁担任进口商（IOR）\n④ 关税、VAT/GST 由谁申报缴纳\n⑤ 查验、滞港、退运费用归属\n⑥ 报价有效期与汇率',
  }),
  K({
    id: 'kn_cost', title: '报价成本拆解：一笔 FOB 报价到底含什么', category: '报价核算', stage: '报价', sort: 7,
    tags: '报价,成本,核算',
    plain: '报价不是"成本加个百分比"。要先把成本分成：产品、包装、内陆运输、报关与文件、港口操作、以及"没算进去就会亏"的隐性成本（损耗、汇率、账期资金成本、佣金）。',
    pro: '常见成本项：① 采购价（含税/不含税，是否含 13% 增值税及退税影响）② 包装（内盒、外箱、唛头、托盘）③ 国内运输（工厂→港口）④ 出口报关、商检、产地证 ⑤ 港口操作费（THC、文件费、订舱费）⑥ 若 CIF/DAP：海运费/空运、保险 ⑦ 银行费用（电汇手续费、信用证议付）⑧ 佣金 ⑨ 损耗与不良品 ⑩ 资金成本（账期）。',
    scenario: '工厂报 8.5 元/pc 含税，退税率 13%，汇率 7.1。不含税成本 = 8.5 / 1.13 ≈ 7.52 元。若报价 USD 1.30 FOB，则人民币收入 = 1.30 × 7.1 = 9.23 元，减去不含税成本 7.52 与其他费用后才是真实毛利。',
    example: '退税不是"额外利润"，而是把采购时支付的进项税退回；如果不考虑退税，会高估成本、报价偏高；如果按含税价算成本又拿退税，会重复计算。',
    pitfalls: '1) 用含税采购价直接换算美元，忽略退税；2) 忘记包装、内陆运费；3) 用当天汇率报 60 天账期的单；4) 佣金与银行费用漏算；5) 数量少时未摊薄固定费用（报关、订舱）。',
    checklist: '① 采购价含税/不含税 + 退税率\n② 包装与唛头费用\n③ 内陆运输与报关费\n④ 港口费与文件费\n⑤ 海运费/保险费（如适用）\n⑥ 银行费、佣金、损耗\n⑦ 汇率与报价有效期\n⑧ 最小起订量下的固定费用摊销',
  }),
  K({
    id: 'kn_margin', title: '毛利率 vs 成本加成率：别把 20% 算成 20%', category: '报价核算', stage: '报价', sort: 8,
    tags: '报价,毛利,公式',
    plain: '成本加成 20%（成本 ×1.2）和毛利率 20%（售价中 20% 是毛利）不是一回事。成本 100，加成 20% → 卖 120，毛利率只有 16.7%。',
    pro: '毛利率 =（售价 − 成本）/ 售价；成本加成率 =（售价 − 成本）/ 成本。换算：加成率 = 毛利率 /（1 − 毛利率）；毛利率 = 加成率 /（1 + 加成率）。目标毛利率 25% 时，售价 = 成本 /（1 − 0.25）= 成本 × 1.333。',
    scenario: '老板说"这单要有 25% 毛利"，你的成本是 100，售价应报 133.33，而不是 125。若报 125，毛利率只有 20%，差 5 个点。',
    example: '成本 100：\n• 加成 25% → 125，毛利率 20%\n• 毛利率 25% → 133.33，加成 33.3%',
    pitfalls: '1) 把加成率当毛利率向老板汇报；2) 用毛利率倒推价格时除以成本而不是（1−毛利率）；3) 忽略运费等变动成本导致"毛利率"虚高。',
    checklist: '① 明确口径：毛利率还是加成率\n② 成本是否含全部变动成本\n③ 固定费用是否摊销\n④ 与老板/客户沟通时写明口径',
  }),
  K({
    id: 'kn_fx', title: '汇率与报价有效期：报价单上的隐形风险', category: '报价核算', stage: '报价', sort: 9,
    tags: '汇率,报价,风险',
    plain: '从报价到收款可能隔 1-3 个月。汇率波动 2% 就可能吃掉一半利润。所以报价单必须写有效期，并在合同里约定汇率大幅波动时的调价机制。',
    pro: '做法：① 报价有效期 15-30 天（运费有效期更短）；② 用"报价基准汇率 + 波动超过 ±3% 可重新协商"条款；③ 长账期订单可考虑远期结汇或自然对冲（外币采购）；④ 报价时预留 1-3% 汇率缓冲，但要写清是缓冲而非虚高。',
    scenario: '你按 7.10 报美元价，客户 60 天后付尾款，届时汇率 6.95，收入减少约 2.1%。若毛利只有 8%，利润直接缩水四分之一。',
    example: '"Quotation valid for 30 days. Exchange rate basis: USD/CNY 7.10. If the rate moves beyond ±3% before shipment, prices may be renegotiated."',
    pitfalls: '1) 报价不写有效期；2) 用即期汇率报长期订单；3) 只盯美元，忽略客户本币结算；4) 把汇率缓冲藏进单价，客户比价时解释不清。',
    checklist: '① 报价有效期\n② 汇率基准与日期\n③ 波动条款\n④ 收款币种与银行费用承担\n⑤ 长账期是否需要对冲',
  }),
  K({
    id: 'kn_devmail', title: '开发信结构：3 段话让陌生客户愿意回', category: '客户开发', stage: '开发', sort: 10,
    tags: '开发信,邮件,客户开发',
    plain: '开发信不是公司简介。客户只关心三件事：你是做什么的、跟他有什么关系、下一步做什么。三段话足够：一句相关性 + 一句能力证明 + 一个低门槛请求。',
    pro: '结构：① 主题行（具体、无夸张）："LED panel lights for {company}\'s EU projects — 2 models, 5-year warranty"；② 第一段：说明为什么找他（看到他做某类产品/某市场）；③ 第二段：1-2 个具体能力点（认证、MOQ、交期、已供货市场），不堆形容词；④ 第三段：低门槛 CTA（要一份 catalogue / 报一个参考价 / 15 分钟通话）；⑤ 签名含公司、职位、WhatsApp、网站。',
    scenario: '给德国一家做店铺装修的进口商写开发信。不要写 "We are a leading manufacturer with 20 years experience"，而要写 "We supply 600x600 backlit panels to two German shopfitting distributors; CE/RoHS, MOQ 200pcs, 25-day lead time."',
    example: 'Subject: 600x600 backlit panels — stock models for shopfitting projects\n\nHi Thomas,\nI saw {company} supplies shopfitting for retail chains in Bavaria.\nWe make 600x600 backlit panels; two German distributors buy 3 containers/year, CE & RoHS, MOQ 200 pcs, 25 days.\nWould a 2-page spec sheet with FOB prices be useful?\n\nBest regards,',
    pitfalls: '1) 群发模板不提对方业务；2) 第一封就附 10MB 附件；3) 只介绍自己不问对方需求；4) 夸张承诺（lowest price / best quality）；5) 没有明确下一步；6) 不跟踪，只发一次。',
    checklist: '① 主题行是否具体\n② 是否提到对方的具体业务\n③ 是否有 1-2 个可验证的能力点\n④ CTA 是否低门槛\n⑤ 签名信息是否完整\n⑥ 是否设置 3-5 天后的跟进',
  }),
  K({
    id: 'kn_inquiry', title: '询盘分析：先判断"是不是真单"', category: '客户开发', stage: '询盘', sort: 11,
    tags: '询盘,客户分析,回复',
    plain: '不是每个询盘都值得报最低价。先看四件事：产品规格是否具体、数量是否合理、公司是否真实、有没有明确时间要求。信息越具体，越可能是真买家。',
    pro: '判断维度：① 规格（型号/参数/认证）② 数量与频率 ③ 目标价与付款方式 ④ 公司背景（官网、注册信息、进口记录）⑤ 收件域名是否企业邮箱 ⑥ 是否同时发给多家（比价型）。回复框架：确认收到 → 复述需求（显示听懂）→ 给出关键信息（价格区间/MOQ/交期）→ 提出 1-3 个必须澄清的问题 → 明确下一步时间。',
    scenario: '收到一封 "Please send your best price for LED panel" 的邮件，没有数量、没有规格、用的是 gmail。不要直接报最低价：先回一封结构化邮件，问数量和目标市场，同时给一个"参考价区间"。',
    example: '"Thanks for your inquiry. To quote accurately, could you confirm: (1) size and wattage, (2) quantity for the first order, (3) destination port? For reference, 600x600 40W is USD 9.8-11.5/pc FOB Ningbo at 500-2000 pcs."',
    pitfalls: '1) 不问需求直接报最低价；2) 回复太长没有重点；3) 把询盘当订单排产；4) 不核实客户就寄样品；5) 只回一次不跟进。',
    checklist: '① 规格/数量/目的港是否明确\n② 客户公司是否核实\n③ 是否给出价格区间而非死价\n④ 提出澄清问题\n⑤ 约定下次联系时间',
  }),
  K({
    id: 'kn_payment', title: '付款方式与风险：T/T、L/C、D/P、O/A 怎么选', category: '付款与风险', stage: '合同/收款', sort: 12,
    tags: '付款,T/T,信用证,风险',
    plain: '付款方式本质是"谁先承担风险"。前 T/T 最安全（客户先付），O/A 最危险（你先发货后收款）。新客户优先 30% 定金 + 70% 见提单副本，老客户再逐步放宽。',
    pro: '常见方式：① T/T 前付（100% 预付）：卖方零风险，买方不放心；② T/T 定金 + 尾款见提单副本（30/70）：最常用；③ L/C 信用证：银行信用，单证必须严格一致（UCP600），有单据不符点风险与费用；④ D/P 付款交单：买方付款才能拿单，但可能拒付；⑤ D/A 承兑交单：买方承兑即可拿单，风险高；⑥ O/A 赊销（30/60/90 天）：需信用调查 + 出口信用保险。',
    scenario: '新客户要求 100% O/A 60 天，订单 5 万美元。合理回应：首单 30% 定金 + 70% 见提单副本；若坚持赊销，要求中信保投保或提供银行资信证明，并加价覆盖资金成本与风险。',
    example: '"For the first order we work on 30% T/T deposit, 70% against copy of B/L. From the third order we can discuss 30-day credit terms subject to credit check."',
    pitfalls: '1) 新客户就给赊销；2) 信用证不审单就发货；3) 接受可撤销信用证或软条款；4) 尾款未到就放单/电放；5) 不核收汇与退税的匹配。',
    checklist: '① 客户信用是否调查\n② 定金比例与尾款节点\n③ 是否要求信用证、条款是否可接受\n④ 单据能否满足（UCP600 严格一致）\n⑤ 收汇路径与退税匹配\n⑥ 是否需要出口信用保险',
  }),
  K({
    id: 'kn_docs', title: '出口单证清单：缺一张就清不了关', category: '单证', stage: '交付', sort: 13,
    tags: '单证,提单,发票,装箱单',
    plain: '出口一套基础单证：商业发票、装箱单、提单（或空运单）、报关单；按目的国要求还可能要原产地证、商检证书、认证文件。所有单据的品名、数量、金额必须一致。',
    pro: '① 商业发票（Commercial Invoice）：买卖双方、品名、数量、单价、总价、贸易术语、原产地；② 装箱单（Packing List）：件数、毛重、净重、体积、唛头；③ 提单 B/L：承运人签发，海运物权凭证，分正本/电放/海运单；④ 空运单 AWB：非物权凭证；⑤ 报关单：出口申报；⑥ 原产地证（CO/RCEP/中国-东盟等）；⑦ 商检/认证（按产品与目的国）。',
    scenario: '客户信用证要求 "Full set of clean on board ocean B/L, 3/3 originals"，而你做的是电放，就会构成不符点。发货前必须逐条对照信用证审单。',
    example: '单据一致性检查：发票金额 = 报关金额 = 信用证金额（允许 ±5% 时也要看条款）；品名与 HS 编码一致；提单收货人 = 信用证申请人或 to order。',
    pitfalls: '1) 发票与提单品名不一致；2) 提单"运费预付/到付"与术语不符；3) 原产地证类型选错；4) 电放后客户不付尾款；5) 报关金额与收汇金额差异过大。',
    checklist: '① 商业发票信息完整\n② 装箱单毛净重体积\n③ 提单类型与份数\n④ 报关单与发票一致\n⑤ 原产地证类型（按目的国）\n⑥ 认证/商检文件\n⑦ 信用证条款逐条核对',
  }),
  K({
    id: 'kn_bl', title: '提单 B/L：物权凭证与三种放货方式', category: '单证', stage: '交付', sort: 14,
    tags: '提单,电放,物权',
    plain: '海运提单是"货的钥匙"：谁持有正本提单，谁就能提货。所以尾款没收到前不要轻易电放。',
    pro: '类型：① 正本提单（Original B/L）：通常 3 正 3 副，凭正本提货；② 电放（Telex Release）：承运人收到发货人指示后通知目的港代理放货，无需正本，速度快但有放货风险；③ 海运单（Sea Waybill）：不可转让，指定收货人提货，适合信任客户；④ 记名提单（Straight B/L）：收货人固定，部分国家可无单放货。',
    scenario: '客户催"能否先电放，我马上付款"。正确做法：收到尾款水单并确认到账后再指示电放；或改用"凭提单副本付款"并用银行交单控制。',
    example: '电放指示邮件应写明：提单号、船名航次、收货人、放货原因，并抄送客户确认。',
    pitfalls: '1) 尾款未到就电放；2) 记名提单在部分国家可无单放货；3) 提单收货人写错导致无法转让；4) 不核对提单草稿（品名、件数、目的港）。',
    checklist: '① 提单类型与份数\n② 收货人/通知方\n③ 运费预付或到付\n④ 品名、件数、毛重与装箱单一致\n⑤ 放货方式与收款节点绑定\n⑥ 提单草稿确认',
  }),
  K({
    id: 'kn_ocean', title: '海运基础：整柜、拼箱与常见箱型', category: '物流', stage: '运输', sort: 15,
    tags: '海运,整柜,拼箱,箱型',
    plain: '整柜（FCL）按箱计费，拼箱（LCL）按体积/重量计费。常见 20GP 约装 28 立方，40HQ 约装 68 立方（实际可装量受货物与限重影响，必须问货代确认）。',
    pro: '常见箱型：20GP（容积约 33m³，实用约 28m³）、40GP（约 67m³，实用约 58m³）、40HQ（约 76m³，实用约 68m³）。限重各国不同（如美国内陆、欧洲部分国家有轴重限制），装柜前须确认目的国限重与船公司限重。计费：FCL 按箱 + 附加费（BAF、THC、文件费、旺季附加费）；LCL 按计费吨（1m³ 或 1000kg 取大）。',
    scenario: '客户要 1 个 40HQ，你的产品外箱 0.06m³/箱、每箱 10pcs。理论可装约 1100 箱，但还要考虑托盘、堆码高度与限重，实际要按装箱图核算。',
    example: '询价时给出：起运港、目的港、箱型、货重、品名、是否危险品、预计出运日期，货代才能给准确 all-in 价。',
    pitfalls: '1) 用理论容积满打满算导致装不下；2) 忽略目的港限重；3) 拼箱只看体积忽略重量；4) 忘记附加费；5) 危险品未申报。',
    checklist: '① 箱型与数量\n② 货物体积/重量/是否可堆码\n③ 起运港与目的港\n④ 附加费明细\n⑤ 目的港限重\n⑥ 船期与截关时间',
  }),
  K({
    id: 'kn_air', title: '空运与快递计费重：体积重怎么算', category: '物流', stage: '运输', sort: 16,
    tags: '空运,快递,体积重',
    plain: '空运按"实重与体积重取大"计费。空运普遍按 1m³ = 167kg 折算；国际快递常用 长×宽×高(cm)/5000 或 /6000。轻泡货走空运很不划算。',
    pro: '空运计费重 = max(实重, 体积重)，体积重 = 体积(m³) × 167。快递体积重 = 长×宽×高(cm) ÷ 5000（部分公司 6000）。最低计费重、燃油附加费、偏远附加费另计。',
    scenario: '一批货实重 120kg、体积 1.2m³。体积重 = 200kg，按 200kg 计费。此时应比较：拆包装/压缩体积、改海运、或提高货值密度。',
    example: '报价前问货代：计费重口径（167 还是 6000）、燃油附加费、是否含报关、目的港杂费。',
    pitfalls: '1) 只报实重；2) 忽略燃油与偏远附加费；3) 轻泡货硬走空运；4) 电池/液体等特殊货物未申报。',
    checklist: '① 实重与体积\n② 计费重口径\n③ 燃油/偏远附加费\n④ 是否含报关与派送\n⑤ 特殊货物申报',
  }),
  K({
    id: 'kn_hs', title: 'HS 编码与商品归类：报错就是关税风险', category: '关务', stage: '报关', sort: 17,
    tags: 'HS编码,归类,关税',
    plain: 'HS 编码是国际统一的商品分类，前 6 位全球一致，后面各国自己加。报错编码可能导致税率错误、查验、甚至处罚。',
    pro: 'WCO 的 HS 六位编码全球统一；中国海关商品编号为 10 位（前 6 位 + 本国细分），不同国家的后几位不同。归类依据：商品材质、功能、用途、加工工艺，按《商品名称及编码协调制度》归类总规则（GRI）1-6 条。归类争议可申请预裁定。',
    scenario: '同是"LED 灯"，吊灯、面板灯、灯串的 HS 编码和监管条件不同，退税率也可能不同。报价 DDP 前必须先确定编码。',
    example: '报关前用"商品编号 + 申报要素"核对：品名、材质、用途、品牌、型号，缺一项都可能被退单。',
    pitfalls: '1) 凭感觉填编码；2) 不同批次用不同编码；3) 忽略监管条件（如 3C、商检）；4) 目的国编码与出口编码混用。',
    checklist: '① 编码前 6 位是否准确\n② 申报要素是否齐全\n③ 监管条件/商检要求\n④ 出口退税率\n⑤ 目的国对应编码与税率',
  }),
  K({
    id: 'kn_duty', title: '关税、增值税与市场准入：DDP 前必须查清', category: '关务', stage: '报价/清关', sort: 18,
    tags: '关税,VAT,准入,认证',
    plain: '进口国要收关税和增值税（VAT/GST），还可能要求认证（CE、FCC、FDA 等）。这些费用和门槛必须在报 DDP 前查清，且税率会变，必须记录查询日期。',
    pro: '① 关税：按目的国 HS 编码税率，可能叠加反倾销/反补贴税、301 关税等；② 进口增值税：欧盟 VAT、英国 VAT、澳洲 GST 等，通常可抵扣但先要缴；③ 准入：CE（欧盟）、UKCA（英国）、FCC（美国电子）、FDA（美国食品接触/医疗器械）、REACH/RoHS（化学品/电子）；④ 原产地规则影响税率（如 RCEP、中国-东盟自贸协定）。',
    scenario: '报 DDP 到德国：需要德国 HS 编码对应的关税税率 + 19% 进口 VAT + CE 合规 + 包装法（VerpackG）注册。任何一项缺失都可能被扣货。',
    example: '把查询结果写进报价备注："Duty rate checked on 2026-10-20 at EU TARIC for HS 9405.11; VAT 19%; CE + VerpackG required."',
    pitfalls: '1) 用出口国税率算进口税；2) 忘记 VAT；3) 忽略认证与注册；4) 税率过期未更新；5) 反倾销产品按普通税率报。',
    checklist: '① 目的国 HS 编码\n② 关税税率与查询日期\n③ 进口 VAT/GST\n④ 反倾销/附加税\n⑤ 认证与注册要求\n⑥ 原产地证是否可用',
    trust: 'dynamic',
    source_name: '需按目的国海关官网核实（如 EU TARIC、USITC HTS）',
    source_url: 'https://taric.ec.europa.eu/',
  }),
  K({
    id: 'kn_supplier', title: '供应商评估：别只看报价单', category: '供应链', stage: '采购', sort: 19,
    tags: '供应商,验厂,采购',
    plain: '便宜的供应商可能让你在后面赔得更多。评估要看：能不能做（产能/工艺）、稳不稳（质量一致性）、敢不敢承诺（交期）、有没有资质（认证/出口经验）。',
    pro: '评估维度：① 资质（营业执照、生产许可、认证）② 产能与设备 ③ 质量体系与不良率 ④ 交期与旺季排产 ⑤ 出口经验与单证能力 ⑥ 付款条件 ⑦ 配合度（打样、改模）⑧ 风险（环保、用工、单一客户依赖）。方法：实地/视频验厂、样品测试、小批量试单、要 2-3 家备选。',
    scenario: '两家工厂报价差 8%。便宜那家没有出口经验、不提供质检报告。对欧美客户，这 8% 可能换来索赔和退货，不如选贵但稳定的。',
    example: '询价时同时要：报价单（含 MOQ、交期、付款）、认证扫描件、质检流程说明、2 个老客户参考（可脱敏）。',
    pitfalls: '1) 只比价格；2) 不验样品直接下单；3) 单一供应商无备选；4) 轻信"什么都能做"；5) 不签质量条款。',
    checklist: '① 资质与认证\n② 产能与旺季排期\n③ 样品测试结果\n④ 质量条款与验收标准\n⑤ 备选供应商\n⑥ 付款与违约条款',
  }),
  K({
    id: 'kn_sample', title: '样品流程：样品费、运费与确认书', category: '供应链', stage: '样品', sort: 20,
    tags: '样品,打样,确认',
    plain: '样品不是"免费送个货"。样品费、运费、打样周期、确认标准、批量订单是否返还样品费，都要提前说清，否则容易白送样品还没单。',
    pro: '标准流程：客户提样品需求 → 确认规格/数量/是否定制 → 报样品费与运费（通常客户承担，或到付）→ 打样 → 拍照/视频确认 → 寄出并提供单号 → 客户确认签样（golden sample）→ 批量按签样生产。定制样品可收打样费，量产时按约定返还。',
    scenario: '客户要 3 个定制样品，运费到付账号没给。先确认运费承担方式再寄，避免样品费 200 元、运费 800 元全自己承担。',
    example: '"Sample charge USD 30/pc, freight collect. The sample cost will be deducted from the first bulk order of 500pcs."',
    pitfalls: '1) 免费寄样无门槛；2) 样品与量产不一致；3) 没签样就量产；4) 运费争议；5) 定制样品费不返还规则不清。',
    checklist: '① 样品规格与数量\n② 样品费与运费承担\n③ 打样周期\n④ 签样确认（照片/实物）\n⑤ 样品费返还条件\n⑥ 样品与量产一致性',
  }),
  K({
    id: 'kn_contract', title: '合同关键条款：质量、交期、罚则与争议', category: '合同', stage: '合同', sort: 21,
    tags: '合同,条款,违约',
    plain: '外贸合同不需要写得很长，但几件事必须写死：什么货、什么标准、什么时候交、怎么付、出了问题怎么办、在哪里解决争议。',
    pro: '核心条款：① 商品描述（规格、材质、型号、质量标准与验收方法）② 数量与溢短装 ③ 价格与贸易术语（含 Incoterms 版本与地点）④ 付款方式与节点 ⑤ 交期与延迟罚则（如每延迟一周扣 0.5%，上限 5%）⑥ 包装与唛头 ⑦ 检验（第三方验货、验货标准）⑧ 不可抗力 ⑨ 索赔与责任上限 ⑩ 争议解决（适用法律、仲裁机构，如 CIETAC/HKIAC）⑪ 知识产权与保密。',
    scenario: '客户要求"质量必须符合欧盟标准"，但没写具体标准号。这种模糊条款在索赔时无法执行，应改为 "EN 60598-1 / EN 60598-2-2" 等具体标准。',
    example: '交期条款写清起算点："Shipment within 30 days after receipt of deposit and approval of pre-production sample, whichever is later."',
    pitfalls: '1) 质量条款模糊；2) 交期起算点不清；3) 没有责任上限；4) 争议解决地对自己不利；5) 用对方模板不审条款。',
    checklist: '① 规格与验收标准（可引用标准号）\n② 贸易术语版本与地点\n③ 付款节点\n④ 交期起算与罚则\n⑤ 验货方式\n⑥ 不可抗力\n⑦ 争议解决与适用法律\n⑧ 责任上限',
  }),
  K({
    id: 'kn_credit', title: '客户信用与赊销风险：先查再放账', category: '付款与风险', stage: '收款', sort: 22,
    tags: '信用,赊销,风险,中信保',
    plain: '赊销（O/A）本质是你给客户一笔无抵押贷款。放账前要查公司是否存在、经营多久、有没有付款记录，并设定信用额度。',
    pro: '做法：① 查注册信息（当地工商/商会/邓白氏编码）② 查官网与社媒是否长期运营 ③ 要银行资信证明或财务报表 ④ 小额试单 ⑤ 设信用额度与账期 ⑥ 出口信用保险（中国信保）⑦ 合同中约定所有权保留（在允许的国家）。',
    scenario: '客户自称是当地大型连锁采购，要求 90 天账期。核实发现其官网只有 3 个月、域名新注册、无进口记录 → 先做 30% 定金 + 70% 见提单副本。',
    example: '内部信用档案字段：公司名、注册号、成立年份、员工数、年采购额、付款记录、信用额度、账期、保险覆盖。',
    pitfalls: '1) 只看客户名片；2) 第一单就放账；3) 额度不设上限；4) 不做收汇跟踪；5) 忽略国家风险（外汇管制、制裁）。',
    checklist: '① 公司注册信息核实\n② 经营年限与规模\n③ 付款记录/参考客户\n④ 信用额度与账期\n⑤ 是否投保\n⑥ 制裁/外汇管制筛查',
  }),
  K({
    id: 'kn_b2b_vs_ecom', title: 'B2B 外贸 vs 平台零售：两套逻辑，别混用', category: '跨境电商', stage: '认知', sort: 23,
    tags: 'B2B,Shopee,平台,区别',
    plain: 'B2B 外贸是"找对采购决策人 + 谈判 + 批量交付"，靠客户开发和关系；平台零售是"流量 + 转化 + 履约 + 平台规则"，靠选品和运营。两者都要会算成本，但打法完全不同。',
    pro: 'B2B：客户少、单值大、周期长（1-6 个月）、决策链多人、重合同与单证、重供应链与定制能力。平台零售：客户多、单值小、即时成交、重 listing/评价/广告/物流时效、受平台规则约束、现金流快但毛利被佣金与物流吃掉。',
    scenario: '在 Shopee 学到的"标题关键词、主图、评价"能力，不能直接用于 B2B 开发信；但"成本核算、竞品分析、客户服务"是可迁移的。',
    example: '同样一批货：B2B 一柜 5000pcs 毛利 8%；平台零售单价高 3 倍但佣金 5-8% + 物流 + 退货，净利可能只有 10-15%，且需要广告费。',
    pitfalls: '1) 用平台思维做 B2B（等客户上门）；2) 用 B2B 思维做平台（不投广告不优化 listing）；3) 把平台流水当利润；4) 忽略平台规则导致的封店风险。',
    checklist: '① 目标客户类型\n② 单值与订单周期\n③ 成本结构与平台费用\n④ 所需能力（开发 vs 运营）\n⑤ 现金流周期',
  }),
  K({
    id: 'kn_shopee_fee', title: 'Shopee 定价：佣金、交易费与物流费要吃透', category: '跨境电商', stage: '定价', sort: 24,
    tags: 'Shopee,定价,费用',
    plain: '平台定价不是"进货价 ×2"。要扣：平台佣金、交易手续费、活动/广告费、跨境物流费、退货与丢件损失，再算净利。费率各站点不同且会调整，必须查卖家中心并记录日期。',
    pro: '成本项：① 采购成本 ② 头程/跨境物流 ③ 平台佣金（按类目/站点，通常几个百分点）④ 交易手续费 ⑤ 广告费（ACOS）⑥ 优惠券/活动折扣 ⑦ 退货退款与丢件 ⑧ 仓储/操作费 ⑨ 汇率与提现费。定价公式：售价 = 总成本 /（1 − 目标净利率 − 费率合计）。',
    scenario: '一款产品采购 20 元，跨境物流 8 元，佣金与手续费合计约 8%，广告 ACOS 10%，退货率 5%。若售价 60 元，净利 ≈ 60 − 28 − 4.8 − 6 − 3 = 18.2 元，净利率约 30%？要按实际费率逐项算，别估。',
    example: '建一张表：SKU / 采购 / 头程 / 平台费 / 广告 / 退货 / 售价 / 净利 / 净利率，每周更新。',
    pitfalls: '1) 只算采购+物流；2) 忽略退货与丢件；3) 用旧费率；4) 把 GMV 当利润；5) 不区分站点。',
    checklist: '① 当前站点费率与生效日期\n② 头程与尾程物流\n③ 广告预算与 ACOS\n④ 退货率假设\n⑤ 汇率与提现费\n⑥ 净利率是否达标',
    trust: 'dynamic',
    source_name: 'Shopee 卖家中心 / 卖家学习中心（费率随站点与时间变化）',
    source_url: 'https://seller.shopee.cn/',
  }),
  K({
    id: 'kn_negotiation', title: '报价谈判：让步要有阶梯，底线要写下来', category: '谈判', stage: '谈判', sort: 25,
    tags: '谈判,议价,让步',
    plain: '客户砍价是常态，但每次让步都要换东西：换数量、换付款方式、换交期、换包装简化。没有交换的降价只会让对方继续压。',
    pro: '准备：① 底价（含最低毛利）与目标价 ② 让步阶梯（如 −2% 换 2 倍数量，−3% 换 50% 预付）③ 非价格筹码（免费样品、延长质保、优先排产、免费唛头）④ 退出条件（低于底价则放弃）。话术：先确认对方预算与目标价，再给"条件式报价"而不是无条件降价。',
    scenario: '客户说 "Your price is 8% higher than another supplier"。回应：先问对方对比的规格与数量是否一致；再给条件式方案："If you can take 2000pcs, we can do 3% off; for 8% we would need to simplify packaging and 50% deposit."',
    example: '让步记录表：日期 / 客户要求 / 我方让步 / 交换条件 / 当前价格 / 距底价还有多少。',
    pitfalls: '1) 一次让到底；2) 不换条件就降价；3) 不知道底价就开口；4) 被"别家更便宜"牵着走；5) 承诺后无法交付。',
    checklist: '① 底价与目标价\n② 让步阶梯\n③ 非价格筹码\n④ 对方真实需求（价格/交期/质量）\n⑤ 每次让步的交换条件',
  }),
  K({
    id: 'kn_retro', title: '复盘方法：事实 → 责任 → 规则', category: '方法', stage: '复盘', sort: 26,
    tags: '复盘,责任,规则',
    plain: '好的复盘不评价"我好不好"，而是还原事实、分清责任、产出规则。最后一定要落到"下次怎么做"，否则只是情绪回顾。',
    pro: '四步：① 事实（时间线、决策点、当时掌握的信息）② 结果（数字：收入、成本、损失、影响人数）③ 归因（我的决策 / 合作方行为 / 外部条件，分别占比）④ 规则（可执行的检查项、条款、止损线）。区分"决策责任"（我该核实却没核实）与"结果责任"（不该由我全额承担）。',
    scenario: '劳务项目：事实是"未实地核实住宿条件"；归因是我的决策责任（未核实）+ 合作方未披露；规则是"涉及他人利益的关键条件必须实地或视频核实，并写入书面确认"。',
    example: '复盘输出模板：\n1. 目标 / 2. 实际结果 / 3. 有效动作 / 4. 问题与信息缺口 / 5. 我的责任 / 6. 外部因素 / 7. 下次改变 / 8. 沉淀规则',
    pitfalls: '1) 复盘变成自责；2) 只讲感受不讲事实；3) 不区分责任边界；4) 没有产出规则；5) 复盘后不跟踪。',
    checklist: '① 时间线与关键决策\n② 可量化结果\n③ 信息缺口\n④ 责任划分\n⑤ 1-3 条可执行规则\n⑥ 下次检查时间',
  }),
];

const LINKS = [
  ['kn_fob', 'kn_cif'], ['kn_cif', 'kn_dap'], ['kn_dap', 'kn_ddp'],
  ['kn_cost', 'kn_margin'], ['kn_cost', 'kn_fx'], ['kn_cost', 'kn_exw'],
  ['kn_docs', 'kn_bl'], ['kn_docs', 'kn_hs'], ['kn_hs', 'kn_duty'],
  ['kn_payment', 'kn_credit'], ['kn_devmail', 'kn_inquiry'],
  ['kn_ocean', 'kn_air'], ['kn_b2b_vs_ecom', 'kn_shopee_fee'],
  ['kn_flow', 'kn_cost'], ['kn_negotiation', 'kn_cost'], ['kn_retro', 'kn_contract'],
  ['kn_supplier', 'kn_sample'], ['kn_contract', 'kn_payment'],
];

export function seedIfEmpty(store) {
  if (store.meta.get('seeded_at')) return false;
  store.tx(() => {
    for (const g of GOALS) {
      store.run(
        `INSERT INTO goals (id,title,category,horizon,target_date,status,progress,why,metric,sort,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [g.id, g.title, g.category, g.horizon, g.target_date, 'active', g.progress, g.why, g.metric, g.sort,
          new Date().toISOString(), new Date().toISOString()]
      );
    }
    MILESTONES.forEach(([id, goalId, title, due], i) => {
      store.run(
        `INSERT INTO milestones (id,goal_id,title,due_date,status,note,sort,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id, goalId, title, due, 'open', '', i, new Date().toISOString(), new Date().toISOString()]
      );
    });
    for (const p of PROJECTS) {
      store.run(
        `INSERT INTO projects (id,name,kind,goal_id,goal,background,status,start_date,due_date,progress,decisions,risks,result,retro,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p.id, p.name, p.kind, p.goal_id, p.goal ?? '', p.background ?? '', p.status ?? 'active',
          p.start_date ?? '', p.due_date ?? '', p.progress ?? 0, p.decisions ?? '', p.risks ?? '',
          p.result ?? '', p.retro ?? '', new Date().toISOString(), new Date().toISOString()]
      );
    }
    TEMPLATES.forEach(([id, title, category, priority, minutes, cadence, mask, goalId, detail, criteria], i) => {
      store.run(
        `INSERT INTO task_templates (id,title,detail,category,priority,estimate_min,cadence,weekday_mask,goal_id,done_criteria,active,sort,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, title, detail, category, priority, minutes, cadence, mask, goalId, criteria, 1, i,
          new Date().toISOString(), new Date().toISOString()]
      );
    });
    for (const k of KNOWLEDGE) {
      store.run(
        `INSERT INTO knowledge (id,title,category,stage,plain,pro,scenario,example,pitfalls,checklist,tags,
          source_name,source_url,verified_on,trust,mastery,my_notes,sort,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [k.id, k.title, k.category, k.stage, k.plain, k.pro, k.scenario, k.example, k.pitfalls,
          k.checklist, k.tags, k.source_name, k.source_url, k.verified_on, k.trust, k.mastery, '',
          k.sort, new Date().toISOString(), new Date().toISOString()]
      );
    }
    for (const [from, to] of LINKS) {
      store.run(
        `INSERT OR IGNORE INTO knowledge_links (id,from_id,to_id,rel) VALUES (?,?,?,?)`,
        [newId('lnk'), from, to, 'related']
      );
    }
    store.meta.set('seeded_at', new Date().toISOString());
    store.meta.set('schema_version', '1');
    store.meta.set('profile', JSON.stringify({
      name: '',
      stage: '2026 能力建设期 · 英语与外贸基础',
      target_city: '广州（备选深圳）',
      target_date: '2028-07',
      cet4: '425+',
      cet6_plan: '2026-12',
    }));
  });
  return true;
}