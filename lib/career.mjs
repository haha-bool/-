/**
 * 岗位能力画像（按 BOSS 直聘外贸业务员/海外客户开发岗位的公开要求结构归纳）
 *
 * 说明：BOSS 直聘对自动化访问有反爬限制，这里不是"抓取了多少条 JD"的统计结果，
 * 而是按该类岗位在 BOSS 上最常见的职责/要求结构整理的作战地图。每条都给出：
 * - boss：招聘方通常会怎么写
 * - interview：面试会怎么追问
 * - evidence：你要拿什么证明（没有证据就不算会）
 * - goal：对应到系统里的哪个目标
 *
 * 性格部分是从用户已提供的经历推断的"工作假设"，不是心理测评结论；可在页面里改。
 */

export const JOB_PROFILE = {
  title: '外贸业务员 / 海外客户开发',
  city: '广州（备选深圳）',
  target: '2028 年入职',
  sourceNote: '按 BOSS 直聘上外贸业务员岗位的常见职责与任职要求归纳；薪资与具体公司要求以你实际投递的 JD 为准。',
  summary: '初级岗位真正筛人的不是"英语好不好"，而是四件事：能不能把产品讲清楚、能不能独立报价、能不能持续跟进客户、出问题时不乱。',
  groups: [
    {
      id: 'sales',
      name: '销售内核',
      tagline: '决定你能走多远',
      summary: '招聘 JD 里常写成"沟通能力、谈判能力、抗压能力、客户意识"。本质是：你能不能让客户在风险可控的前提下做决定。',
      items: [
        {
          id: 'sales_essence',
          name: '理解销售本质',
          boss: '"具备较强的客户沟通能力与销售意识"',
          interview: '"你觉得销售最重要的是什么？"',
          evidence: '能用自己的一段真实交易解释"信任=专业×一致×可验证"，并说出一次失败的原因。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'trust',
          name: '信任建立',
          boss: '"有较强的客户服务意识，能维护长期客户关系"',
          interview: '"客户不信任你们小公司，你怎么处理？"',
          evidence: '3 个降低客户风险的动作：样品、验厂视频、试单条款、第三方检测。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'listening',
          name: '提问与倾听',
          boss: '"善于沟通，能准确把握客户需求"',
          interview: '"你怎么判断客户的真需求？"',
          evidence: '10 次诊断记录：每次只问不推销，能复述客户重复出现的 3 个关键词。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'diagnosis',
          name: '需求诊断',
          boss: '"负责客户询盘处理、需求分析、方案报价"',
          interview: '"给你一个询盘，你第一步做什么？"',
          evidence: '把需求拆成"表面需求/真实顾虑/不解决的代价"三行。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'value',
          name: '价值呈现',
          boss: '"能独立向客户介绍产品与公司优势"',
          interview: '"你们价格比别人高，凭什么？"',
          evidence: '一份"总成本对比"：便宜供应商可能多出的返工、滞港、断货成本。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'objection',
          name: '异议处理',
          boss: '"具备良好的应变能力，能处理客户异议"',
          interview: '"客户说价格太高/质量没保障，你怎么回？"',
          evidence: '50 条异议库，每条含"背后顾虑 + 回应 + 验证证据"。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'negotiation',
          name: '谈判与成交',
          boss: '"有较强的谈判能力，能促成订单"',
          interview: '"客户拿别家低价压你，你降不降？"',
          evidence: '10 次谈判模拟记录：每次守住 1 条底线、换到 1 个条件。',
          level: 'must',
          goal: 'goal_sales_core',
        },
        {
          id: 'retention',
          name: '复购与转介绍',
          boss: '"负责老客户维护与二次开发"',
          interview: '"第一单交付后你做什么？"',
          evidence: '交付后 7 天回访记录 + 下一采购周期提醒。',
          level: 'high',
          goal: 'goal_sales_core',
        },
      ],
    },
    {
      id: 'trade',
      name: '外贸硬技能',
      tagline: '决定你能不能独立跟单',
      summary: '面试最容易露馅的地方。术语会背没用，要能在一张订单里算清成本、单证、付款和风险。',
      items: [
        {
          id: 'flow',
          name: '全流程',
          boss: '"熟悉外贸业务流程，能独立操作从询盘到收汇"',
          interview: '"说一遍从询盘到收汇的完整流程。"',
          evidence: '一张流程图：8 个节点、每节点产出什么、谁负责、常见错误。',
          level: 'must',
          goal: 'goal_trade_ops',
        },
        {
          id: 'quote',
          name: '报价与成本',
          boss: '"熟悉 FOB/CIF 等贸易术语，能独立核算成本"',
          interview: '"报一个 FOB 价，成本怎么拆？"',
          evidence: '3 套不同术语报价，能逐项解释公式和未确认费用。',
          level: 'must',
          goal: 'goal_trade_ops',
        },
        {
          id: 'docs',
          name: '单证',
          boss: '"熟悉外贸单证（PI、CI、PL、B/L、CO 等）"',
          interview: '"提单和装箱单分别有什么用？"',
          evidence: '8 类单证样本库，每类能说出用途、易错点、由谁出具。',
          level: 'must',
          goal: 'goal_trade_ops',
        },
        {
          id: 'payment',
          name: '付款与收汇',
          boss: '"了解 T/T、L/C 等付款方式"',
          interview: '"第一次合作，客户要 O/A 60 天，你怎么办？"',
          evidence: 'T/T、L/C、D/P、O/A 的风险与资金占用决策表。',
          level: 'must',
          goal: 'goal_trade_ops',
        },
        {
          id: 'logistics',
          name: '物流与关务',
          boss: '"了解订舱、报关、拖车等出货流程"',
          interview: '"客户要 DDP，你要确认哪些费用？"',
          evidence: '一票货的费用清单：内陆、报关、港杂、海运、保险、目的港。',
          level: 'must',
          goal: 'goal_trade_ops',
        },
        {
          id: 'product',
          name: '产品知识',
          boss: '"熟悉公司产品，能解答客户技术问题"',
          interview: '"用英文介绍一下你们产品。"',
          evidence: '10 分钟英文产品介绍 + 20 个客户常问问题。',
          level: 'must',
          goal: 'goal_en',
        },
        {
          id: 'compliance',
          name: '合规与认证',
          boss: '"了解出口认证、原产地证等要求"',
          interview: '"客户要 CE 认证，你怎么确认能不能做？"',
          evidence: '目标市场认证清单（CE/FDA/REACH/FSC 等）+ 供应商确认记录。',
          level: 'high',
          goal: 'goal_trade_ops',
        },
        {
          id: 'risk',
          name: '风险与异常',
          boss: '"具备风险意识，能处理突发问题"',
          interview: '"货期延误了，客户要索赔，你怎么处理？"',
          evidence: '20 项风险登记簿：概率、影响、触发信号、应对人。',
          level: 'high',
          goal: 'goal_trade_ops',
        },
      ],
    },
    {
      id: 'prospecting',
      name: '客户开发',
      tagline: '决定你有没有客户',
      summary: '初级外贸最值钱的能力：不靠平台分询盘，自己找到对的人，并且让他愿意回你。',
      items: [
        {
          id: 'platform',
          name: '平台运营',
          boss: '"有阿里国际站/中国制造网操作经验优先"',
          interview: '"你怎么优化一个产品详情页？"',
          evidence: '1 个模拟店铺：10 个产品标题、关键词、主图逻辑。',
          level: 'high',
          goal: 'goal_prospecting',
        },
        {
          id: 'search',
          name: '主动搜索',
          boss: '"能通过 Google/LinkedIn/海关数据开发客户"',
          interview: '"给你一个产品，怎么找到 20 个潜在客户？"',
          evidence: '100 家客户画像 + 50 个真实决策人邮箱。',
          level: 'must',
          goal: 'goal_prospecting',
        },
        {
          id: 'linkedin',
          name: '领英/社媒',
          boss: '"熟悉 LinkedIn、Facebook 等社媒开发"',
          interview: '"领英上加人后第一句话说什么？"',
          evidence: '1 个领英主页 + 20 次有效连接 + 5 次对话。',
          level: 'high',
          goal: 'goal_prospecting',
        },
        {
          id: 'email',
          name: '开发信',
          boss: '"能独立撰写外贸开发信"',
          interview: '"你的开发信为什么值得客户回？"',
          evidence: '10 封不同角度开发信 + 回复率对比。',
          level: 'must',
          goal: 'goal_prospecting',
        },
        {
          id: 'research',
          name: '客户背调',
          boss: '"具备市场调研与客户分析能力"',
          interview: '"你怎么判断一个客户是不是真有采购需求？"',
          evidence: '20 份背调：官网/社媒/海关/招聘/新闻，标注"事实/推测/待确认"。',
          level: 'must',
          goal: 'goal_prospecting',
        },
        {
          id: 'expo',
          name: '展会/线上对接',
          boss: '"能参加展会并接待客户"',
          interview: '"展会现场你怎么留住客户？"',
          evidence: '1 次展会/线上对接 + 10 张名片 + 48 小时跟进记录。',
          level: 'plus',
          goal: 'goal_prospecting',
        },
      ],
    },
    {
      id: 'english',
      name: '商务英语',
      tagline: '门槛，不是卖点',
      summary: '岗位一般要求 CET-4 起步，但真正筛人的是"能不能写清楚一封邮件、听懂客户在担心什么"。',
      items: [
        {
          id: 'email_en',
          name: '商务邮件',
          boss: '"英语听说读写良好，能独立与客户邮件沟通"',
          interview: '"现场写一封回复客户投诉的邮件。"',
          evidence: '3 类邮件各 10 篇：开发、报价、跟进/投诉。',
          level: 'must',
          goal: 'goal_en',
        },
        {
          id: 'oral_en',
          name: '口语/会议',
          boss: '"能进行日常英文口语沟通"',
          interview: '"用英文自我介绍 + 介绍产品。"',
          evidence: '8–10 分钟英文产品介绍录像 + 自评。',
          level: 'must',
          goal: 'goal_en',
        },
        {
          id: 'listening_en',
          name: '听力',
          boss: '"能听懂客户电话/会议内容"',
          interview: '"客户带口音，你听不懂怎么办？"',
          evidence: '10 段真实商务对话听写，能复述关键数字与条件。',
          level: 'high',
          goal: 'goal_en',
        },
        {
          id: 'negotiation_en',
          name: '英文谈判',
          boss: '"能用英语进行商务谈判"',
          interview: '"用英文跟客户谈一次降价。"',
          evidence: '5 次英文谈判模拟：价格、交期、付款、索赔。',
          level: 'high',
          goal: 'goal_en',
        },
      ],
    },
    {
      id: 'tools',
      name: '工具与数据',
      tagline: '决定你的效率上限',
      summary: '同级新人里，会用 Excel/CRM/AI 的人，能把时间花在客户身上，而不是复制粘贴。',
      items: [
        {
          id: 'excel',
          name: 'Excel 成本模型',
          boss: '"熟练使用 Office 办公软件"',
          interview: '"用 Excel 算一下这个报价的毛利。"',
          evidence: '一张含汇率、运费、关税敏感度的报价模型。',
          level: 'must',
          goal: 'goal_tools',
        },
        {
          id: 'crm',
          name: 'CRM/客户管理',
          boss: '"能做好客户信息管理与跟进记录"',
          interview: '"你怎么管理 100 个客户不跟丢？"',
          evidence: '20 个客户，每个有阶段、下一步、日期、复盘。',
          level: 'high',
          goal: 'goal_tools',
        },
        {
          id: 'ai',
          name: 'AI 工具',
          boss: '"会使用 AI 工具提升效率者优先"',
          interview: '"你用 AI 做过什么具体工作？"',
          evidence: '3 个可复用提示词：背调、邮件初稿、单证检查。',
          level: 'plus',
          goal: 'goal_tools',
        },
        {
          id: 'data',
          name: '数据复盘',
          boss: '"具备数据分析能力，能总结销售数据"',
          interview: '"你的开发信回复率是多少？为什么？"',
          evidence: '每周一张漏斗表：触达/回复/报价/成交/客单价。',
          level: 'high',
          goal: 'goal_tools',
        },
      ],
    },
    {
      id: 'professional',
      name: '职业素养',
      tagline: '决定别人敢不敢把客户交给你',
      summary: '外贸周期长、变量多。靠谱比聪明稀缺：说到做到、出事不躲、复盘不甩锅。',
      items: [
        {
          id: 'resilience',
          name: '抗压与耐心',
          boss: '"抗压能力强，能适应外贸周期"',
          interview: '"三个月没开单，你会怎么办？"',
          evidence: '连续 12 周的过程指标记录（触达/回复/报价），不只盯成交。',
          level: 'must',
          goal: 'goal_job',
        },
        {
          id: 'execution',
          name: '执行与跟进',
          boss: '"执行力强，能主动推进工作"',
          interview: '"客户不回你，你跟进几次？怎么跟？"',
          evidence: '20 个客户的下一步从未断线；5 次"带新信息"的跟进。',
          level: 'must',
          goal: 'goal_prospecting',
        },
        {
          id: 'review',
          name: '复盘',
          boss: '"善于总结，能持续改进"',
          interview: '"讲一次你失败的经历和学到的东西。"',
          evidence: '10 篇复盘，区分"我的决策责任/外部因素"，每篇至少 1 条规则。',
          level: 'must',
          goal: 'goal_method',
        },
        {
          id: 'integrity',
          name: '诚信与合规',
          boss: '"诚实守信，具备良好的职业操守"',
          interview: '"客户要你虚报原产地，你做不做？"',
          evidence: '一条底线清单：不虚构业绩、不伪造单证、不隐瞒风险。',
          level: 'must',
          goal: 'goal_method',
        },
        {
          id: 'crosscultural',
          name: '跨文化沟通',
          boss: '"了解不同国家客户的沟通习惯"',
          interview: '"中东客户和德国客户有什么区别？"',
          evidence: '5 个目标市场的商务习惯卡片（时间、称呼、谈判、节日）。',
          level: 'high',
          goal: 'goal_sales_core',
        },
      ],
    },
  ],
};

export const DEFAULT_PERSONALITY = {
  note: '以下是根据你提供的经历推断的"工作假设"，不是心理测评。可随时修改，推荐会跟着变。',
  traits: [
    {
      key: 'action',
      label: '行动优先',
      score: 5,
      strength: '你敢先做再说：摆摊、代理、直播都真刀真枪干过，启动速度比同龄人快。',
      risk: '信息不足时容易先承诺，后面被交期/成本反咬。',
      counter: '对外承诺前强制过一遍"价格/交期/责任"三问，重要承诺隔 10 分钟再发。',
      content: '短案例、当天下场练，少看纯理论。',
    },
    {
      key: 'relationship',
      label: '关系型',
      score: 5,
      strength: '你能迅速和陌生人建立信任，这是销售最稀缺的起点。',
      risk: '容易把"聊得来"当成"会成交"，不好意思推进到报价和承诺。',
      counter: '每次沟通结束前必须落到一个可验证的下一步（日期+动作）。',
      content: '倾听、提问、信任建立、异议处理。',
    },
    {
      key: 'risk_taking',
      label: '敢试错',
      score: 4,
      strength: '不怕被拒，愿意试新渠道，适合客户开发。',
      risk: '止损慢，容易因为已经投入而继续加码。',
      counter: '每个项目开始前写止损线（时间/金额/次数），到线就复盘而不是硬撑。',
      content: '谈判、风险案例、失败复盘。',
    },
    {
      key: 'trust',
      label: '先信任后核实',
      score: 4,
      strength: '合作姿态真诚，客户容易感到被尊重。',
      risk: '你已被中间人/信息差坑过；外贸里一次付款或单证失误代价更大。',
      counter: '合作前核实：公司主体、付款账户、授权人、书面条款；不凭语音和截图做决定。',
      content: '客户背调、合同、付款风险、单证。',
    },
    {
      key: 'structure',
      label: '流程细节耐心',
      score: 2,
      strength: '不被流程束缚，抓机会快。',
      risk: '报价漏项、单证出错、跟进断线——这三件事足以毁掉一单。',
      counter: '把检查清单做进系统字段：报价必填假设、跟进必有下次日期、单证必有核对人。',
      content: '流程、单证、报价拆解、检查清单。',
    },
    {
      key: 'feedback',
      label: '即时反馈需求',
      score: 4,
      strength: '学习速度快，能从反馈里迅速调整。',
      risk: '外贸周期长，2–3 个月没结果时容易怀疑自己、换方向。',
      counter: '把长单拆成周里程碑，只看过程指标（触达/回复/报价），不每天盯成交。',
      content: '短平快案例 + 每周数据复盘。',
    },
    {
      key: 'expression',
      label: '口头表达强 / 书面结构弱',
      score: 3,
      strength: '现场有感染力，适合展会、电话、视频会议。',
      risk: '英文邮件结构松散、术语不准，客户会觉得"不专业"。',
      counter: '重要邮件先写骨架（目的-事实-请求-下一步），再逐句改；用系统模板起步。',
      content: '商务邮件、英文表达、结构化写作。',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 新增目标与里程碑（固定 ID，幂等写入）                                */
/* ------------------------------------------------------------------ */

export const CAREER_GOALS = [
  {
    id: 'goal_sales_core',
    title: '销售内核：从"敢开口"到"能让客户做决定"',
    category: 'sales',
    horizon: 'mid',
    target_date: '2027-06-30',
    progress: 0,
    why: 'BOSS 上这类岗位几乎都会写"沟通/谈判/抗压/客户意识"。但销售的本质不是说服，而是降低客户的决策风险；这条决定你能从初级业务员走多远。',
    metric: '10 次诊断练习 + 50 条异议库 + 10 次谈判模拟 + 1 套个人销售 SOP + 3 次失败复盘',
    sort: 6,
  },
  {
    id: 'goal_prospecting',
    title: '客户开发：从 0 到 20 个有效线索、30 封可追踪开发信',
    category: 'sales',
    horizon: 'mid',
    target_date: '2027-09-30',
    progress: 0,
    why: '初级外贸最值钱的能力不是"会跟单"，而是能自己找到对的人并让他回复。平台分询盘的公司，业务员很容易被替代。',
    metric: '100 家客户画像 + 50 个决策人邮箱 + 10 封开发信 A/B + 100→20→5→1 漏斗',
    sort: 7,
  },
  {
    id: 'goal_trade_ops',
    title: '履约闭环：报价 → 合同 → 单证 → 物流 → 收汇',
    category: 'trade',
    horizon: 'long',
    target_date: '2027-12-31',
    progress: 0,
    why: '面试最容易露馅的是"术语会背，订单一问就乱"。能独立算清一票货的成本、单证、付款与风险，才是可雇佣的证明。',
    metric: '3 套术语报价 + 8 类单证样本 + 1 个模拟订单 + 1 次真实询价 + 1 票退税核算',
    sort: 8,
  },
  {
    id: 'goal_tools',
    title: '工具与数据：把重复劳动交给系统和 AI',
    category: 'tools',
    horizon: 'mid',
    target_date: '2027-12-31',
    progress: 0,
    why: '同批新人里，能把报价、客户、复盘数据化的人，时间会花在客户身上，而不是复制粘贴。你的流程耐心偏弱，更要用工具兜底。',
    metric: '1 张报价模型 + 20 个 CRM 客户 + 3 个 AI 工作流 + 每周数据复盘 + 1 个个人仪表盘',
    sort: 9,
  },
];

export const CAREER_MILESTONES = [
  // 销售内核
  ['mil_sales_1', 'goal_sales_core', '写一份《销售本质》3000 字笔记：用 3 个亲身经历解释"信任=专业×一致×可验证"', '2026-11-15'],
  ['mil_sales_2', 'goal_sales_core', '完成 10 次"提问式诊断"练习（同学/模拟客户），每次录音并自评，形成提问清单', '2026-12-31'],
  ['mil_sales_3', 'goal_sales_core', '建立 50 条异议库（价格/品牌/交期/质量/付款），每条含"背后顾虑+回应+验证证据"', '2027-01-31'],
  ['mil_sales_4', 'goal_sales_core', '完成 10 次价格谈判模拟：每次守住 1 条底线，并换到 1 个条件', '2027-02-28'],
  ['mil_sales_5', 'goal_sales_core', '对 5 个客户完成"诊断→方案→风险消除→承诺"全流程记录', '2027-04-30'],
  ['mil_sales_6', 'goal_sales_core', '输出个人销售 SOP（线索→诊断→方案→异议→承诺→交付→复购）', '2027-05-31'],
  ['mil_sales_7', 'goal_sales_core', '复盘 3 次丢单/失败，区分"我的决策责任/外部因素"，提炼 3 条可执行规则', '2027-06-30'],

  // 客户开发
  ['mil_pro_1', 'goal_prospecting', '完成 100 家海外客户画像（行业/规模/采购角色/痛点/采购信号）', '2026-12-31'],
  ['mil_pro_2', 'goal_prospecting', '用 Google + LinkedIn + 官网找到 50 个真实决策人邮箱，并完成可送达验证', '2027-02-28'],
  ['mil_pro_3', 'goal_prospecting', '写 10 封不同角度开发信，A/B 记录主题/开头/CTA 对回复率的影响', '2027-03-31'],
  ['mil_pro_4', 'goal_prospecting', '跑通一次模拟开发漏斗：100 触达 → 20 回复 → 5 报价 → 1 样品单', '2027-05-31'],
  ['mil_pro_5', 'goal_prospecting', '完成 20 次客户背调（海关数据/官网/社媒/招聘/新闻），标注事实/推测/待确认', '2027-07-31'],
  ['mil_pro_6', 'goal_prospecting', '整理 30 个"为什么回复/不回复"的复盘，形成 5 条开发信规则', '2027-09-30'],
  ['mil_pro_7', 'goal_prospecting', '参加 1 次展会/线上采购对接会，拿到 10 张有效名片并在 48 小时内跟进', '2027-09-30'],

  // 履约闭环
  ['mil_ops_1', 'goal_trade_ops', '用系统完成 3 套 EXW/FOB/CIF/DAP/DDP 报价，交叉核对公式与费用项', '2027-01-31'],
  ['mil_ops_2', 'goal_trade_ops', '建立 8 类单证样本库（PI/CI/PL/B/L/CO/保险单/报关单/质检证），标注用途与易错点', '2027-03-31'],
  ['mil_ops_3', 'goal_trade_ops', '做 T/T、L/C、D/P、O/A 的风险与资金占用对比表，写出你的选择规则', '2027-04-30'],
  ['mil_ops_4', 'goal_trade_ops', '完成 1 个模拟订单全流程（8 节点 + 时间表 + 责任人 + 单证清单）', '2027-06-30'],
  ['mil_ops_5', 'goal_trade_ops', '完成 1 次真实供应商询价 + 打样跟进 + 成本核算对比', '2027-09-30'],
  ['mil_ops_6', 'goal_trade_ops', '算清 1 票出口退税：退税率、进项、单证、到账金额', '2027-10-31'],
  ['mil_ops_7', 'goal_trade_ops', '建立 20 项订单风险登记簿（概率/影响/触发信号/应对人）', '2027-12-31'],

  // 工具与数据
  ['mil_tools_1', 'goal_tools', '建 1 张产品报价 Excel 模型，含汇率、运费、关税敏感度', '2026-12-31'],
  ['mil_tools_2', 'goal_tools', 'CRM 里维护 20 个客户，每个都有阶段、下一步和日期', '2027-03-31'],
  ['mil_tools_3', 'goal_tools', '建 3 个 AI 工作流提示词（客户背调/邮件初稿/单证检查），各实际使用 3 次', '2027-06-30'],
  ['mil_tools_4', 'goal_tools', '每周做一次数据复盘：回复率、报价转化率、客单价、交付准时率', '2027-09-30'],
  ['mil_tools_5', 'goal_tools', '做 1 份个人经营仪表盘：线索/报价/成交/学习时长', '2027-12-31'],

  // 求职（挂在既有 goal_job 下）
  ['mil_job_boss', 'goal_job', '拆 30 条 BOSS 外贸岗位 JD，做能力词频表（硬技能/软技能/工具）', '2026-11-30'],
  ['mil_job_star', 'goal_job', '用 STAR 写 10 个校园商业案例，不编数字，每个标注可验证证据', '2027-06-30'],
  ['mil_job_interview', 'goal_job', '完成 5 次模拟面试（英文自我介绍 + 追问 + 反问）', '2027-12-31'],
  ['mil_job_portfolio', 'goal_job', '作品集 v1：3 份报价 + 3 封邮件 + 1 个模拟订单 + 复盘', '2027-12-31'],
];

export function seedCareer(store) {
  store.tx(() => {
    for (const goal of CAREER_GOALS) {
      if (!store.find('goals', goal.id)) store.create('goals', goal);
    }
    for (const [id, goalId, title, due] of CAREER_MILESTONES) {
      if (!store.find('milestones', id)) {
        store.create('milestones', { id, goal_id: goalId, title, due_date: due, status: 'open', note: '' });
      }
    }
    if (!store.meta.get('career_personality')) {
      store.meta.set('career_personality', JSON.stringify({
        note: DEFAULT_PERSONALITY.note,
        traits: Object.fromEntries(DEFAULT_PERSONALITY.traits.map((t) => [t.key, t.score])),
      }));
    }
    if (!store.meta.get('career_self')) store.meta.set('career_self', JSON.stringify({}));
    if (!store.meta.get('career_seeded_at')) store.meta.set('career_seeded_at', new Date().toISOString());
  });
}

export function getPersonality(store) {
  try {
    const saved = JSON.parse(store.meta.get('career_personality') || '{}');
    const traits = DEFAULT_PERSONALITY.traits.map((t) => ({
      ...t,
      score: Number(saved.traits?.[t.key] ?? t.score),
    }));
    return { note: saved.note || DEFAULT_PERSONALITY.note, traits };
  } catch {
    return { ...DEFAULT_PERSONALITY };
  }
}

/* ------------------------------------------------------------------ */
/* BOSS JD 关键词分析                                                   */
/* ------------------------------------------------------------------ */

const JD_KEYWORDS = {
  sales_essence: ['销售', '客户意识', '客户服务', '服务意识', '成交', '业绩'],
  trust: ['客户关系', '维护客户', '信任', '长期合作'],
  listening: ['沟通', '倾听', '表达', '需求'],
  diagnosis: ['需求分析', '询盘', '分析客户', '方案'],
  value: ['产品介绍', '优势', '演示', '方案讲解'],
  objection: ['异议', '应变', '投诉', '处理问题'],
  negotiation: ['谈判', '议价', '价格', '条款'],
  retention: ['复购', '二次开发', '老客户', '转介绍'],
  flow: ['外贸流程', '询盘', '订单', '跟单', '收汇'],
  quote: ['报价', '成本核算', '核算', 'FOB', 'CIF', 'EXW'],
  docs: ['单证', 'PI', 'CI', '提单', '装箱单', '原产地证'],
  payment: ['T/T', '信用证', 'L/C', '付款', '收汇', 'O/A'],
  logistics: ['报关', '物流', '订舱', '货代', '拖车', '清关'],
  product: ['产品知识', '工艺', '规格', '技术'],
  compliance: ['认证', 'CE', 'FDA', 'REACH', '合规'],
  risk: ['风险', '异常', '索赔', '纠纷'],
  platform: ['阿里国际站', '中国制造网', '环球资源', '平台操作', '店铺'],
  search: ['Google', '谷歌', '海关数据', '开发客户', '主动开发'],
  linkedin: ['LinkedIn', '领英', '社媒', 'Facebook', 'Instagram'],
  email: ['开发信', '邮件', 'EDM'],
  research: ['背调', '市场调研', '客户分析', '客户背景'],
  expo: ['展会', '广交会', '交易会'],
  email_en: ['英语邮件', '邮件沟通', '读写', '书面'],
  oral_en: ['口语', '英语沟通', '听说', '英语流利'],
  listening_en: ['听力', '电话会议'],
  negotiation_en: ['英文谈判', '英语谈判', '英文沟通'],
  excel: ['Excel', '办公软件', '表格', '数据统计'],
  crm: ['CRM', '客户管理', '客户系统'],
  ai: ['AI', '人工智能', '数字化'],
  data: ['数据分析', '复盘', '统计', '报表'],
  resilience: ['抗压', '吃苦', '适应', '耐心'],
  execution: ['执行', '主动', '推进', '落地'],
  review: ['总结', '复盘', '改进'],
  integrity: ['诚信', '职业操守', '保密'],
  crosscultural: ['跨文化', '海外市场', '国际市场', '多语言'],
};

/** 关键词命中分析：给的是线索，不是判决 */
export function analyzeJd(text, profile = JOB_PROFILE) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const matches = [];
  for (const group of profile.groups) {
    for (const item of group.items) {
      const terms = JD_KEYWORDS[item.id] || [];
      let count = 0;
      const hits = [];
      for (const term of terms) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const left = /^[a-z0-9]/i.test(term) ? '(?<![a-z0-9])' : '';
        const right = /[a-z0-9]$/i.test(term) ? '(?![a-z0-9])' : '';
        const re = new RegExp(`${left}${escaped}${right}`, 'gi');
        const n = (lower.match(re) || []).length;
        if (n) {
          count += n;
          hits.push(term);
        }
      }
      if (count) matches.push({ id: item.id, name: item.name, group: group.name, level: item.level, count, hits });
    }
  }
  matches.sort((a, b) => b.count - a.count);
  const hitIds = new Set(matches.map((m) => m.id));
  const mustItems = profile.groups.flatMap((g) => g.items).filter((i) => i.level === 'must');
  return {
    chars: raw.length,
    matches,
    top: matches.slice(0, 12),
    hitCount: hitIds.size,
    mustHit: mustItems.filter((i) => hitIds.has(i.id)).length,
    mustTotal: mustItems.length,
    missingMust: mustItems.filter((i) => !hitIds.has(i.id)).map((i) => i.name),
  };
}