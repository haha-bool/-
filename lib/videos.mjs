/**
 * 每日视频库（B 站，2026-10-20 通过公开接口核对 BV 号、标题、UP 主、时长与播放量）
 *
 * 选择标准
 * - 不做"鸡汤合集"：每条都要能落到一个动作（写下、练一次、改一封邮件）。
 * - 优先选"讲清一个决策"的短视频，再配 1 条长内容建立整体框架。
 * - 与性格匹配：行动型 → 短、可立刻练；关系型 → 倾听/信任；流程弱 → 检查清单。
 * - 抖音没有稳定的公开检索接口，只用「关键词搜索卡」补充，不编造具体视频号。
 *
 * why = 为什么推荐给这个用户；task = 看完必须做的动作。
 */

export const VIDEOS = [
  {
    id: 'BV1Uj1vBtEj6',
    bvid: 'BV1Uj1vBtEj6',
    title: '一口气讲完外贸全流程｜新手入门教程',
    author: '统一的奸商之路',
    duration: '9:48',
    play: '26.5 万',
    pic: 'https://i2.hdslb.com/bfs/archive/94bbc57f26e59530829b5d492216e356a7051294.jpg',
    skills: ['流程', '外贸全链路'],
    traits: ['structure', 'action'],
    level: '入门',
    why: '用 10 分钟把询盘→报价→合同→生产→验货→出货→收汇串成一条线。你做过交易，但缺的是这条"标准链路"的全局图。',
    task: '画出自己的流程清单，在每个节点写出"谁负责、产出什么单证、最容易出什么错"。',
  },
  {
    id: 'BV1sN4y177zs',
    bvid: 'BV1sN4y177zs',
    title: '外贸小白入门基础知识：外贸业务员的工作流程',
    author: '简说贸易',
    duration: '2:51',
    play: '3.2 万',
    pic: 'https://i1.hdslb.com/bfs/archive/0ad2cfa82504193923d4e3a7a5edd6b743cb334b.jpg',
    skills: ['流程', '岗位认知'],
    traits: ['structure'],
    level: '入门',
    why: '比长视频更聚焦"业务员每天在做什么"，适合你判断自己是否真的愿意做这份工作，而不是只想"做外贸"。',
    task: '列出你愿意做/不愿意做的 3 件事，写清原因。不愿意的部分，就是入职后最容易崩的地方。',
  },
  {
    id: 'BV1tT411E7tx',
    bvid: 'BV1tT411E7tx',
    title: '外贸小白如何入门？1. 外贸和内贸的区别',
    author: '简说贸易',
    duration: '2:26',
    play: '7,214',
    pic: 'https://i2.hdslb.com/bfs/archive/8b9ff238ccf76f6925a822c6f7f22b25c75ce255.jpg',
    skills: ['销售本质', '风险'],
    traits: ['trust', 'relationship'],
    level: '入门',
    why: '你熟悉校园内贸式的"当面成交"，但外贸的信任建立、付款风险、交付周期完全不同。这条帮你把差别说清楚。',
    task: '写出 3 个"内贸经验不能直接迁移到外贸"的点，各配一个反例。',
  },
  {
    id: 'BV1KFLHzoEyD',
    bvid: 'BV1KFLHzoEyD',
    title: '想做外贸业务员的伙伴看过来',
    author: '180斤的小郑',
    duration: '13:15',
    play: '2.2 万',
    pic: 'https://i2.hdslb.com/bfs/archive/9c2daf53e9aa9cdd18e8f4cd00d0333251d079a8.jpg',
    skills: ['职业认知', '求职'],
    traits: ['action', 'feedback'],
    level: '入门',
    why: '从业者视角讲真实工作状态、收入结构和常见误解，能校正你对"外贸=英语好+会聊天"的想象。',
    task: '记下 3 个和你预期不同的地方，下次模拟面试时主动问 HR。',
  },
  {
    id: 'BV16XA3z4EtA',
    bvid: 'BV16XA3z4EtA',
    title: '跨专业，0 经验面试外贸业务员',
    author: '我是一闪一闪亮欣欣',
    duration: '18:07',
    play: '3 万',
    pic: 'https://i0.hdslb.com/bfs/archive/e3b7d76e41f27c8bd0701bf34fabe857188e49f9.jpg',
    skills: ['求职', '面试'],
    traits: ['action', 'feedback'],
    level: '进阶',
    why: '你的情况（有商业经历、无外贸履历）和这位 UP 主接近。看她怎么把非对口经历讲成岗位价值。',
    task: '用 STAR 写一个自己的校园项目案例，删掉所有无法验证的数字。',
  },
  {
    id: 'BV1zg2LB9E5L',
    bvid: 'BV1zg2LB9E5L',
    title: '外贸业务员、外贸助理、外贸跟单，选哪个？',
    author: 'biabia瑜',
    duration: '6:27',
    play: '5,134',
    pic: 'https://i1.hdslb.com/bfs/archive/1fde090f9fdb4190cc5dfa0d07f7c8deff4b6e55.jpg',
    skills: ['职业认知', '岗位选择'],
    traits: ['structure'],
    level: '入门',
    why: '业务员、助理、跟单的能力要求与风险不同。先分清路径，再定目标，避免"先入行再说"浪费两年。',
    task: '做一张三岗位对比表：日常动作、KPI、能力门槛、三年后的出口。',
  },
  {
    id: 'BV1kh411b71B',
    bvid: 'BV1kh411b71B',
    title: '13 年外贸从业：想做外贸，这些证书不要再考了',
    author: '文文姐职场干货WendySum',
    duration: '2:37',
    play: '1.2 万',
    pic: 'https://i2.hdslb.com/bfs/archive/4de17b8e3ad4a5044162d54d849f1d97441e7257.jpg',
    skills: ['求职', '能力证明'],
    traits: ['action', 'structure'],
    level: '入门',
    why: '你容易用"再考一个证"替代"真正去谈一个客户"。这条帮你把时间从证书转向可验证的作品。',
    task: '把"今年要考的证"砍到最多 1 个，省下的时间排给报价/邮件/客户开发。',
  },
  {
    id: 'BV1dtb969Eoz',
    bvid: 'BV1dtb969Eoz',
    title: '今日职业副本：外贸业务员',
    author: '观星者1号-_',
    duration: '9:47',
    play: '6,686',
    pic: 'https://i1.hdslb.com/bfs/archive/fad63e929deab92daee803ec1c8c26b40a2372a9.jpg',
    skills: ['职业认知'],
    traits: ['relationship'],
    level: '入门',
    why: '用"职业副本"的方式讲日常工作与心理落差，适合你在投入前做一次真实预期管理。',
    task: '写下你最害怕的 1 个场景（被拒/压价/催单），为它准备一个应对脚本。',
  },
  {
    id: 'BV1BS42197ns',
    bvid: 'BV1BS42197ns',
    title: '销冠的超级听力有多强！',
    author: '销售之家',
    duration: '1:20',
    play: '37.5 万',
    pic: 'https://i2.hdslb.com/bfs/archive/fb4d60af279b2258b0cd98b861923455ffab3ff2.jpg',
    skills: ['销售本质', '倾听', '需求诊断'],
    traits: ['relationship', 'action'],
    level: '入门',
    why: '销售的本质不是"说赢"，是听懂客户没说出口的顾虑。你擅长建立关系，这条能把"会聊"升级为"会诊断"。',
    task: '下一次沟通只问 5 个问题、不介绍产品；结束后写下对方重复出现的 3 个词。',
  },
  {
    id: 'BV1WG4y137Xp',
    bvid: 'BV1WG4y137Xp',
    title: '客户威胁你降价才买怎么办？',
    author: '销售教练孟华林',
    duration: '1:11',
    play: '49.8 万',
    pic: 'https://i0.hdslb.com/bfs/archive/d0f33634d0b774140682451f7fcbc5cc3ebb8144.jpg',
    skills: ['谈判', '价格', '销售本质'],
    traits: ['action', 'trust'],
    level: '进阶',
    why: '外贸最常见的死局：客户拿别家价格压你。关键不是降不降，而是先确认"降价换什么"。',
    task: '写 3 句不降价的替代方案（改付款、改包装、改数量、改交期），每句都要换到一个条件。',
  },
  {
    id: 'BV1eJ4m1e7Ym',
    bvid: 'BV1eJ4m1e7Ym',
    title: '永远不要答应对方的第一次要求',
    author: '销售学习知识库',
    duration: '3:18',
    play: '38.8 万',
    pic: 'https://i2.hdslb.com/bfs/archive/7ce4af74a196c97c89d89bae9ddc9f6a509a46e2.jpg',
    skills: ['谈判', '销售本质'],
    traits: ['trust', 'action'],
    level: '进阶',
    why: '你容易因为"想快点成交"而一次让到底。这条讲清让步节奏：第一次要求不是底价，是测试。',
    task: '为报价单加一栏"可交换条件"，列出你能让的和不能让的，谈判时只从这一栏里选。',
  },
  {
    id: 'BV1mfLn67Eow',
    bvid: 'BV1mfLn67Eow',
    title: '为什么你用微信，聊不好客户？',
    author: '销售之家',
    duration: '0:45',
    play: '167.2 万',
    pic: 'https://i1.hdslb.com/bfs/archive/40ce606da2f361d8abb3a23b45fa089d3532470f.jpg',
    skills: ['沟通', '信任'],
    traits: ['relationship', 'feedback'],
    level: '入门',
    why: '你习惯用即时消息推进关系，但 B2B 客户更看重"可留档、可转发、可核对"的沟通。',
    task: '把一次重要沟通从微信改成邮件，并在邮件里复述确认对方的 3 个要求。',
  },
  {
    id: 'BV1Ci3iz9EUS',
    bvid: 'BV1Ci3iz9EUS',
    title: '报错价格后，怎么抢救？',
    author: '销售之家',
    duration: '1:30',
    play: '141.4 万',
    pic: 'https://i2.hdslb.com/bfs/archive/3d39684e709df39657bc257d6b4739473354f9b9.jpg',
    skills: ['报价', '危机处理'],
    traits: ['trust', 'structure'],
    level: '进阶',
    why: '你做事快，报价也容易快。这条讲的是"错了以后怎么不丢信任"，比不出错更现实。',
    task: '在系统里给报价加"版本号 + 有效期 + 假设"，以后改价必须说明改了什么。',
  },
  {
    id: 'BV1fB5Tz6EvY',
    bvid: 'BV1fB5Tz6EvY',
    title: '客户要你直接报价，报还是不报？',
    author: '销售之家',
    duration: '1:07',
    play: '118.9 万',
    pic: 'https://i0.hdslb.com/bfs/archive/42d8ccf0c52e6fbc0dc466fdfd79a0dd17b8ef81.jpg',
    skills: ['报价', '需求诊断'],
    traits: ['action', 'structure'],
    level: '进阶',
    why: '报价太早，你会变成"比价单里的一行"。先问清数量、规格、目的地、付款方式，再报。',
    task: '做一张"报价前必问 6 问"卡片，贴到报价页旁边，缺一个就不报价。',
  },
  {
    id: 'BV1KToyB1EeT',
    bvid: 'BV1KToyB1EeT',
    title: '客户说：我没有听过你们的品牌？',
    author: '销售之家',
    duration: '0:45',
    play: '34 万',
    pic: 'https://i2.hdslb.com/bfs/archive/9aa5834ccd6920f92a6fefc1c5bad19e542abf97.jpg',
    skills: ['信任', '异议处理'],
    traits: ['trust', 'relationship'],
    level: '进阶',
    why: '小公司/新供应商最难的一关。外贸里客户不是不信你，是不信"换供应商的风险可控"。',
    task: '准备 3 个降低风险的证据：样品、验厂视频、第三方检测、试单条款。',
  },
  {
    id: 'BV17cdGBiEGT',
    bvid: 'BV17cdGBiEGT',
    title: '大学生就业指导之大客户成交法——需求放大',
    author: '嘴比饺子馅儿碎',
    duration: '1:43',
    play: '56.1 万',
    pic: 'https://i1.hdslb.com/bfs/archive/059bf766a764550c06e1ab1874acf1d8ae22d7d6.jpg',
    skills: ['需求诊断', '销售本质'],
    traits: ['relationship', 'action'],
    level: '入门',
    why: '用很接地气的例子讲"别急着介绍产品，先聊对方真正在意的事"。和你的校园摆摊/代理经历能直接接上。',
    task: '把最近一个客户的需求写成"表面需求 / 真实顾虑 / 不解决的代价"三行。',
  },
  {
    id: 'BV1tAHCejEH1',
    bvid: 'BV1tAHCejEH1',
    title: '为什么多收 1 块钱比送 100 块更具吸引力',
    author: '阿泽思维',
    duration: '1:36',
    play: '92.8 万',
    pic: 'https://i0.hdslb.com/bfs/archive/7733c45e96f3c9c472428dc8eb4b18255276fa8e.jpg',
    skills: ['价值呈现', '定价心理'],
    traits: ['feedback', 'relationship'],
    level: '进阶',
    why: '报价不是算术，是"参照系"管理。你要学会把客户的比较对象从"别家单价"换成"总成本/风险/交期"。',
    task: '给你的报价写 3 句"总成本"对比：便宜供应商可能多出的返工、滞港、断货成本。',
  },
  {
    id: 'BV16o6ABGEWu',
    bvid: 'BV16o6ABGEWu',
    title: '顶级定价心理学：为什么买车多花两千无感，买菜多收五毛暴怒',
    author: '认知刺客',
    duration: '10:08',
    play: '502.2 万',
    pic: 'https://i2.hdslb.com/bfs/archive/8a58220cc718e1d7b1fb7b0ed5e0b22f7ad3cf49.jpg',
    skills: ['价值呈现', '定价心理', '销售本质'],
    traits: ['feedback', 'structure'],
    level: '进阶',
    why: '长视频，但能把"价格感知是相对的"讲透。适合你在周末整块时间看，然后重做一份报价的价值结构。',
    task: '把你的一份报价拆成"基础价 / 可选价值 / 风险兜底"三档，而不是一个裸价。',
  },
];

export const DOUYIN_SEARCHES = [
  {
    id: 'dy_prospecting',
    title: '抖音搜索：外贸客户开发',
    keyword: '外贸 客户开发',
    url: 'https://www.douyin.com/search/%E5%A4%96%E8%B4%B8%20%E5%AE%A2%E6%88%B7%E5%BC%80%E5%8F%91',
    why: '抖音的优势是"最新实操"。搜完后按最新排序，挑 3 条有具体邮件/话术截图的，别看看法类口播。',
    task: '记录 1 个你明天就能用的动作（找邮箱/写主题/发样品图）。',
  },
  {
    id: 'dy_negotiation',
    title: '抖音搜索：销售谈判 真实案例',
    keyword: '销售谈判 真实案例',
    url: 'https://www.douyin.com/search/%E9%94%80%E5%94%AE%E8%B0%88%E5%88%A4%20%E7%9C%9F%E5%AE%9E%E6%A1%88%E4%BE%8B',
    why: '谈判靠案例喂。优先看有完整对话、能看到双方来回的，不看"三句话拿下客户"的爽文。',
    task: '把一条真实对话改写成你自己的行业版本，练一遍。',
  },
];

export function videoById(id) {
  return VIDEOS.find((v) => v.id === id) || null;
}

/** 简单的按天轮换：同一天固定；三槽位 = 销售本质 / 外贸硬技能 / 性格补短板 */
export function dailyPicks(dateStr, personality = {}) {
  const day = Math.floor(Date.parse(`${dateStr}T00:00:00+08:00`) / 86400000);
  const essence = VIDEOS.filter((v) => v.skills.includes('销售本质'));
  const trade = VIDEOS.filter((v) => v.skills.includes('流程') || v.skills.includes('报价') || v.skills.includes('岗位认知'));
  const trustPool = VIDEOS.filter((v) => v.skills.includes('信任') || v.skills.includes('异议处理'));
  const others = VIDEOS.filter((v) => !essence.includes(v) && !trade.includes(v));

  const weakStructure = Number(personality.structure ?? 3) <= 3;
  const highTrust = Number(personality.trust ?? 3) >= 3;
  let flexPool = [...others];
  if (weakStructure) flexPool = [...flexPool, ...trade];
  if (highTrust) flexPool = [...flexPool, ...trustPool];
  flexPool = flexPool.filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);

  const overlap = (a, b) => (a?.skills || []).some((s) => s !== '销售本质' && (b?.skills || []).includes(s));
  const at = (pool, offset) => pool[((day + offset) % pool.length + pool.length) % pool.length];

  const first = at(essence, 0);
  let second = at(trade, 1);
  for (let i = 0; i < trade.length && (second.id === first.id || overlap(first, second)); i += 1) {
    second = at(trade, 2 + i);
  }

  let third = at(flexPool, 2);
  const used = new Set([first.id, second.id]);
  for (let i = 0; i < flexPool.length; i += 1) {
    const candidate = at(flexPool, 2 + i);
    if (!used.has(candidate.id) && !overlap(first, candidate) && !overlap(second, candidate)) {
      third = candidate;
      break;
    }
  }
  const picks = [first, second, third];
  if (new Set(picks.map((p) => p.id)).size < 3) {
    const extra = VIDEOS.find((v) => !picks.some((p) => p.id === v.id));
    if (extra) picks[2] = extra;
  }
  return picks;
}

export const SALES_PRINCIPLES = [
  {
    title: '销售不是说服，是降低对方的决策风险',
    body: '客户不买，通常不是"被你说服得不够"，而是"换了供应商之后出问题，我承担不起"。所以你要做的不是把话说漂亮，而是把风险一项项拿掉：样品、验厂、试单、付款条件、交期承诺、违约条款。',
    drill: '今天选一个客户，列出他换供应商最怕的 3 件事，各写一条你能提供的证据。',
  },
  {
    title: '信任 = 专业 × 一致 × 可验证',
    body: '专业是你能把成本、交期、单证讲清楚；一致是你每次说的和做的一样；可验证是客户能自己查到、看到、试到。三者缺一，关系再好也只是"聊得来"。',
    drill: '检查你最近一封邮件：有几句话是"可验证的事实"，有几句话只是"我们很专业"。',
  },
  {
    title: '先诊断，再开方；先问清，再报价',
    body: '报价太早，你就只是比价表里的一行。数量、规格、目的地、付款方式、包装、验货标准没问清，报出去的每个数字都在给自己埋雷。',
    drill: '把"报价前必问 6 问"写进客户记录，缺一项就标注"暂不报价"。',
  },
  {
    title: '成交不是终点，是下一次复购的起点',
    body: '外贸的收入来自复购和转介绍，不是第一单。第一单的交付质量、异常处理速度、复盘透明度，决定客户敢不敢把第二单给你。',
    drill: '为每个已成交客户设一个交付后 7 天的回访提醒，问使用情况和下一个采购计划。',
  },
];