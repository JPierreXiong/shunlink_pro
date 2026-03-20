import { Metadata } from 'next';
import Script from 'next/script';
import { PageBreadcrumb } from '@/shared/components/seo/page-breadcrumb';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  const title = isZh
    ? 'LinkFlow AI 常见问题解答 — AI 外链部署平台 FAQ'
    : isFr
      ? 'FAQ — Questions fréquentes sur LinkFlow AI'
      : 'FAQ — LinkFlow AI Frequently Asked Questions | AI Backlink Deployment';

  const description = isZh
    ? '关于 LinkFlow AI 的常见问题：AI 如何保护网站安全、48小时保证、免费试用、锚文本控制、数据安全及退款政策。'
    : isFr
      ? "Réponses aux questions fréquentes sur LinkFlow AI : sécurité, garantie 48h, essai gratuit, texte d'ancrage et politique de remboursement."
      : 'Get answers about LinkFlow AI: how our AI protects your site, the 48-hour guarantee, free trial credits, anchor text control, and refund policy.';

  const url = locale === 'en'
    ? 'https://www.linkflow.ai/faq'
    : `https://www.linkflow.ai/${locale}/faq`;

  return {
    title,
    description,
    keywords: isZh
      ? 'LinkFlow AI常见问题, AI外链FAQ, 外链部署问题, 48小时保证'
      : isFr
        ? 'FAQ LinkFlow AI, questions backlink AI, aide déploiement liens'
        : 'LinkFlow AI FAQ, AI backlink questions, 48-hour guarantee, anchor text control',
    alternates: {
      canonical: url,
      languages: {
        en: 'https://www.linkflow.ai/faq',
        zh: 'https://www.linkflow.ai/zh/faq',
        fr: 'https://www.linkflow.ai/fr/faq',
      },
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'LinkFlow AI',
    },
  };
}

type FaqItem = { question: string; answer: string };

const faqsEn: FaqItem[] = [
  {
    question: "How does LinkFlow AI ensure my website's safety?",
    answer:
      "We use Agentic Workflows via CrewAI. Instead of high-speed bot blasting, our AI agents simulate human browsing patterns — moving mice, scrolling, and typing at natural speeds. This makes our backlink footprints virtually indistinguishable from manual organic outreach.",
  },
  {
    question: 'What is the 48-Hour Guarantee?',
    answer:
      'We value your time. From the moment you submit a task, our AI starts the deployment process. We guarantee a successful submission with a live screenshot proof within 48 hours. If the task fails due to platform downtime, your credit is instantly refunded.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'Absolutely. Every new account gets 1 Free Credit upon signup — no credit card required — to test our AI\'s precision and speed on a real backlink task.',
  },
  {
    question: 'Can I choose the anchor text?',
    answer:
      'Yes. You have full control over the target URL and the anchor text. Our AI will even help optimize the surrounding content to ensure the link looks contextual and natural.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We collect only your email via OAuth — no passwords stored. Your task data and screenshots are encrypted and retained only while your account is active. You can request full data deletion at any time.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Credits are only consumed on successful submissions with live proof. If a task fails due to platform downtime or a technical error on our end, your credit is automatically refunded immediately.',
  },
];

const faqsZh: FaqItem[] = [
  {
    question: 'LinkFlow AI 如何保护我网站的安全？',
    answer:
      '我们使用 CrewAI 驱动的智能工作流（Agentic Workflows）。AI 代理模拟真人浏览行为——移动鼠标、滚动页面、以自然速度输入内容，而非高速机器人轰炸。这使我们的外链足迹与人工有机推广几乎无法区分。',
  },
  {
    question: '什么是 48 小时保证？',
    answer:
      '我们珍视您的时间。从您提交任务的那一刻起，AI 立即开始部署。我们保证在 48 小时内完成提交，并提供实时截图证明。如果任务因平台宕机而失败，积分将立即退还。',
  },
  {
    question: '有免费试用吗？',
    answer:
      '当然有。每个新账户注册时即获赠 1 个免费积分，无需信用卡，可用于测试 AI 在真实外链任务上的精准度和速度。',
  },
  {
    question: '我可以选择锚文本吗？',
    answer:
      '可以。您对目标 URL 和锚文本拥有完全控制权。我们的 AI 甚至会帮助优化周边内容，确保链接看起来自然且具有上下文关联性。',
  },
  {
    question: '我的数据安全吗？',
    answer:
      '绝对安全。我们仅通过 OAuth 收集您的电子邮件，不存储密码。您的任务数据和截图经过加密，仅在账户活跃期间保留。您可以随时申请完整数据删除。',
  },
  {
    question: '提供退款吗？',
    answer:
      '积分仅在提交成功并有实时证明后才会被消耗。如果任务因平台宕机或我方技术错误失败，积分将立即自动退还。',
  },
];

const faqsFr: FaqItem[] = [
  {
    question: "Comment LinkFlow AI assure-t-il la sécurité de mon site ?",
    answer:
      "Nous utilisons des Workflows Agentiques via CrewAI. Au lieu d'attaques de bots à haute vitesse, nos agents IA simulent les comportements de navigation humaine — déplacer la souris, faire défiler et taper à des vitesses naturelles. Cela rend nos empreintes de backlinks pratiquement indiscernables d'une prospection organique manuelle.",
  },
  {
    question: 'Qu\'est-ce que la Garantie 48 heures ?',
    answer:
      'Nous respectons votre temps. Dès que vous soumettez une tâche, notre IA démarre le processus de déploiement. Nous garantissons une soumission réussie avec une preuve de capture d\'écran en direct dans les 48 heures. Si la tâche échoue en raison d\'une panne de plateforme, votre crédit est instantanément remboursé.',
  },
  {
    question: 'Proposez-vous un essai gratuit ?',
    answer:
      'Absolument. Chaque nouveau compte reçoit 1 Crédit Gratuit à l\'inscription — sans carte de crédit — pour tester la précision et la rapidité de notre IA sur une vraie tâche de backlink.',
  },
  {
    question: 'Puis-je choisir le texte d\'ancrage ?',
    answer:
      'Oui. Vous avez un contrôle total sur l\'URL cible et le texte d\'ancrage. Notre IA optimise même le contenu environnant pour que le lien paraisse contextuel et naturel.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Absolument. Nous ne collectons que votre e-mail via OAuth — aucun mot de passe stocké. Vos données de tâches et captures d\'écran sont chiffrées et conservées uniquement pendant que votre compte est actif. Vous pouvez demander la suppression complète de vos données à tout moment.',
  },
  {
    question: 'Proposez-vous des remboursements ?',
    answer:
      'Les crédits ne sont consommés que lors de soumissions réussies avec preuve en direct. Si une tâche échoue en raison d\'une panne de plateforme ou d\'une erreur technique de notre côté, votre crédit est automatiquement remboursé immédiatement.',
  },
];

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const faqs = locale === 'zh' ? faqsZh : locale === 'fr' ? faqsFr : faqsEn;

  const heading =
    locale === 'zh'
      ? '常见问题解答'
      : locale === 'fr'
        ? 'Questions Fréquentes'
        : 'Frequently Asked Questions';

  const subheading =
    locale === 'zh'
      ? '关于 LinkFlow AI 的一切你需要了解的内容'
      : locale === 'fr'
        ? 'Tout ce que vous devez savoir sur LinkFlow AI'
        : 'Everything you need to know about LinkFlow AI';

  const contactLabel =
    locale === 'zh'
      ? '还有疑问？'
      : locale === 'fr'
        ? 'Vous avez encore des questions ?'
        : 'Still have questions?';

  const contactSub =
    locale === 'zh'
      ? '找不到您需要的答案？我们的支持团队随时为您服务。'
      : locale === 'fr'
        ? "Vous ne trouvez pas ce que vous cherchez ? Notre équipe de support est là pour vous aider."
        : "Can't find what you're looking for? Our support team is here to help.";

  const contactBtn =
    locale === 'zh'
      ? '联系支持'
      : locale === 'fr'
        ? 'Contacter le Support'
        : 'Contact Support';

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const breadcrumbLabel =
    locale === 'zh' ? '常见问题' : locale === 'fr' ? 'FAQ' : 'FAQ';

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageBreadcrumb
        locale={locale}
        items={[{ name: breadcrumbLabel, href: '/faq' }]}
      />

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{heading}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{subheading}</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-lg">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-16 text-center p-8 bg-muted/50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">{contactLabel}</h2>
          <p className="text-muted-foreground mb-6">{contactSub}</p>
          <a
            href="mailto:support@linkflowai.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {contactBtn}
          </a>
        </div>
      </div>
    </>
  );
}
 