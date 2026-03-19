/**
 * SEO Data Configuration
 * Multi-language structured data for LinkFlow AI
 */

export const getFaqSchema = (locale: string) => {
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isZh
          ? '这些外链会导致我的网站被惩罚吗？'
          : isFr
            ? 'Ces liens vont-ils pénaliser mon site ?'
            : 'Will these links get my site penalized?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '不会。LinkFlow AI 使用模拟自然人类交互的 Agentic 工作流，专注于高质量平台和上下文相关性放置，确保搜索引擎安全。'
            : isFr
              ? "Non. LinkFlow AI utilise des Workflows Agentiques qui imitent les interactions humaines naturelles pour garantir la sécurité SEO."
              : 'No. LinkFlow AI uses Agentic Workflows that mimic natural human interactions — mouse movements, scrolling, and delays — to ensure search engine safety.',
        },
      },
      {
        '@type': 'Question',
        name: isZh
          ? '我如何确认外链已上线？'
          : isFr
            ? 'Comment savoir si le lien est en ligne ?'
            : 'How do I know the link is live?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '每个成功任务均生成一份《证明报告》，包含实时 URL 和存储在安全云端的高清截图。您可独立验证，随时可查。'
            : isFr
              ? 'Chaque tâche réussie génère un Rapport de Preuve contenant l\'URL en direct et une capture d\'écran haute résolution stockée sur notre cloud sécurisé.'
              : 'Every successful task generates a Proof Report containing the Live URL and a high-resolution screenshot stored on our secure cloud. Evidence you can verify independently at any time.',
        },
      },
      {
        '@type': 'Question',
        name: isZh
          ? '什么是 48 小时承诺？'
          : isFr
            ? "Qu'est-ce que la Garantie 48 heures ?"
            : 'What is the 48-Hour Guarantee?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '从您提交任务那一刻起，AI 立即开始部署。我们保证在 48 小时内完成提交并提供实时截图证明。如果任务因平台问题失败，积分将立即退还。'
            : isFr
              ? "Dès que vous soumettez une tâche, notre IA démarre immédiatement. Nous garantissons une soumission réussie avec preuve en 48 heures. En cas d'échec, votre crédit est instantanément remboursé."
              : 'From the moment you submit a task, our AI starts deployment immediately. We guarantee a successful submission with a live screenshot proof within 48 hours. If the task fails, your credit is instantly refunded.',
        },
      },
      {
        '@type': 'Question',
        name: isZh
          ? '有免费试用吗？'
          : isFr
            ? 'Proposez-vous un essai gratuit ?'
            : 'Do you offer a free trial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isZh
            ? '有。每个新账户注册即送 1 个免费积分——无需信用卡——可用于在真实外链任务上体验我们 AI 的精准度。'
            : isFr
              ? "Oui. Chaque nouveau compte reçoit 1 Crédit Gratuit à l'inscription — sans carte de crédit — pour tester la précision de notre IA sur une vraie tâche de backlink."
              : 'Yes. Every new account gets 1 Free Credit on signup — no credit card required — to experience our AI precision on a real backlink task.',
        },
      },
    ],
  };
};

export const getOrgSchema = (locale: string) => {
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LinkFlow AI',
    description: isZh
      ? 'AI 驱动的高权重外链自动部署平台'
      : isFr
        ? 'Plateforme de déploiement automatisé de backlinks haute autorité par IA'
        : 'AI-Powered High-Authority Backlink Deployment Platform',
    url: 'https://www.linkflowai.app',
    logo: 'https://www.linkflowai.app/logo.png',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@linkflowai.app',
      contactType: 'customer service',
    },
  };
};

export const getSoftwareSchema = (locale: string) => {
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: isZh ? 'LinkFlow AI 外链部署平台' : isFr ? 'LinkFlow AI Plateforme de Backlinks' : 'LinkFlow AI Backlink Platform',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };
};
