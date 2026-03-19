const fs = require('fs');
const path = require('path');

const basePath = 'src/config/locale/messages';

const zh = {
  header: {
    id: 'header',
    brand: { title: 'LinkFlow AI', url: '/' },
    nav: {
      items: [
        { title: '\u5de5\u4f5c\u539f\u7406', url: '/#how-it-works', icon: 'Zap' },
        { title: '\u652f\u6301\u5e73\u53f0', url: '/platforms', icon: 'Globe' },
        { title: '\u5b9a\u4ef7', url: '/pricing', icon: 'DollarSign' },
        { title: '\u5e38\u89c1\u95ee\u9898', url: '/#faq', icon: 'HelpCircle' }
      ]
    },
    buttons: [{ title: '\u7acb\u5373\u90e8\u7f72', url: '/dashboard/tasks', target: '_self', variant: 'default', className: '' }],
    user_nav: {
      show_name: true, show_credits: true, show_sign_out: true,
      items: [
        { title: '\u4efb\u52a1\u4e2d\u5fc3', url: '/dashboard/tasks', icon: 'LayoutDashboard' },
        { title: '\u8d26\u5355', url: '/settings/billing', icon: 'CreditCard' },
        { title: '\u6d3b\u52a8\u8bb0\u5f55', url: '/activity', icon: 'Activity' }
      ]
    },
    show_sign: true, show_theme: true, show_locale: true
  },
  hero: {
    id: 'hero',
    title: '\u5916\u94fe\u53d1\u5e03\u5168\u81ea\u52a8\uff0c\u6bcf\u4e00\u6761\u90fd\u6709\u636e\u53ef\u67e5',
    highlight_text: '\u5168\u81ea\u52a8',
    description: '48 \u5c0f\u65f6\u5185\u5728\u9ad8\u6743\u91cd\u7f51\u7ad9\u90e8\u7f72\u5916\u94fe\u3002\u65e0\u9700\u7e41\u7410\u6c9f\u901a\uff0c\u65e0\u9700\u624b\u52a8\u64cd\u4f5c\u2014\u2014AI \u667a\u80fd\u4f53\u4e3a\u60a8\u6253\u9020\u900f\u660e\u3001\u5b89\u5168\u7684 SEO \u589e\u957f\uff0c\u5e76\u9644\u5e26\u5b9e\u65f6\u622a\u56fe\u8bc1\u660e\u3002',
    announcement: { badge: '\u65b0\u7528\u6237', title: '\u26a1 \u6ce8\u518c\u5373\u9001 1 \u4e2a\u514d\u8d39\u79ef\u5206\uff0c\u65e0\u9700\u4fe1\u7528\u5361', url: '/sign-up' },
    tip: '<span style="font-size: 0.75rem; font-weight: 300;">\u65e0\u9700\u4fe1\u7528\u5361</span>',
    buttons: [{ title: '\u514d\u8d39\u9886\u53d6 1 \u4e2a\u79ef\u5206\uff0c\u7acb\u5373\u5f00\u59cb', icon: 'Zap', url: '/sign-up', target: '_self', variant: 'default', className: '' }],
    show_avatars: false, avatars_tip: '',
    show_award: false,
    image: { src: '/imgs/features/admin.png', alt: 'LinkFlow AI \u4efb\u52a1\u4e2d\u5fc3' },
    image_invert: { src: '/imgs/features/admin-dark.png', alt: 'LinkFlow AI \u4efb\u52a1\u4e2d\u5fc3' }
  },
  'how-it-works': {
    id: 'how-it-works',
    title: '\u5de5\u4f5c\u539f\u7406',
    description: '\u4e09\u6b65\u5b9e\u73b0\u4e00\u6761\u5b9e\u65f6\u5916\u94fe',
    items: [
      { title: '\u63d0\u4ea4\u76ee\u6807\u4fe1\u606f', description: '\u8f93\u5165\u76ee\u6807 URL \u548c\u9514\u6587\u672c\u3002\u9009\u62e9\u5e73\u53f0\u6216\u8ba9 AI \u81ea\u52a8\u7b5b\u9009\u6700\u4f18\u8d28\u7684\u9ad8\u6743\u91cd\u7f51\u7ad9\u3002', icon: 'Link' },
      { title: 'AI \u667a\u80fd\u4f53\u81ea\u52a8\u90e8\u7f72', description: '\u7531 CrewAI \u9a71\u52a8\u7684\u667a\u80fd\u4f53\u6a21\u62df\u771f\u5b9e\u4eba\u7c7b\u884c\u4e3a\u2014\u2014\u6eda\u52a8\u3001\u70b9\u51fb\u3001\u81ea\u7136\u901f\u5ea6\u8f93\u5165\u2014\u2014\u5728 48 \u5c0f\u65f6\u5185\u5b89\u5168\u53d1\u5e03\u5916\u94fe\u3002', icon: 'Cpu' },
      { title: '\u63a5\u6536\u8bc1\u660e\u62a5\u544a', description: '\u83b7\u53d6\u5305\u542b\u5b9e\u65f6 URL \u548c\u9ad8\u6e05\u622a\u56fe\u7684\u300a\u8bc1\u660e\u62a5\u544a\u300b\uff0c\u5b89\u5168\u5b58\u50a8\u4e8e\u4e91\u7aef\u3002\u60a8\u7684\u8bc1\u636e\uff0c\u968f\u65f6\u53ef\u67e5\u3002', icon: 'FileCheck' }
    ]
  },
  features: {
    id: 'features',
    title: '\u4e3a\u4ec0\u4e48\u9009\u62e9 LinkFlow AI',
    description: '\u5efa\u7acb\u5728\u900f\u660e\u3001\u7cbe\u51c6\u548c\u8bc1\u636e\u57fa\u7840\u4e4b\u4e0a\u7684\u5916\u94fe\u5e73\u53f0',
    items: [
      { title: '100% \u900f\u660e\u4ea4\u4ed8', description: '\u6253\u7834\u5916\u94fe\u884c\u4e1a\u201c\u9ed1\u76d2\u201d\u73b0\u72b6\u3002\u6bcf\u4e00\u6761\u5916\u94fe\u5747\u9644\u5e26\u5b9e\u65f6\u622a\u56fe\uff0c\u770b\u5f97\u89c1\u7684\u6210\u679c\uff0c\u624d\u503c\u5f97\u4fe1\u8d56\u3002', icon: 'Eye' },
      { title: 'AI \u667a\u80fd\u4f53\u6a21\u62df\u4eba\u5de5', description: '\u62d2\u7edd\u4f4e\u8d28\u91cf\u7fa4\u53d1\u3002CrewAI \u9a71\u52a8\u7684\u667a\u80fd\u4f53\u6a21\u62df\u771f\u5b9e\u4eba\u7c7b\u70b9\u51fb\u3001\u6eda\u52a8\u548c\u8f93\u5165\u884c\u4e3a\uff0c\u5b8c\u7f8e\u89c4\u907f\u641c\u7d22\u5f15\u64ce\u7b97\u6cd5\u60e9\u7f5a\u3002', icon: 'Bot' },
      { title: '48 \u5c0f\u65f6\u5fc5\u8fbe\u627f\u8bfa', description: '\u4ece\u4e0b\u5355\u5230\u4ea4\u4ed8\u4ec5\u9700 48 \u5c0f\u65f6\u3002\u82e5\u56e0\u6280\u672f\u539f\u56e0\u672a\u6210\u529f\uff0c\u7cfb\u7edf\u81ea\u52a8\u9000\u8fd8\u79ef\u5206\uff0c\u96f6\u98ce\u9669\u3002', icon: 'Clock' },
      { title: '\u7cbe\u9009\u9ad8\u6743\u91cd\u5e73\u53f0', description: '\u7ef4\u62a4\u7ecf\u8fc7\u5ba1\u6838\u7684 DA 50+ \u7f51\u7ad9\u5e93\uff0c\u5305\u62ec Blogger\u3001Reddit\u3001Medium \u7b49\u3002\u53ef\u5728\u5e73\u53f0\u9875\u9762\u67e5\u770b\u5b9e\u65f6\u6210\u529f\u7387\u3002', icon: 'Star' },
      { title: '\u9514\u6587\u672c\u5b8c\u5168\u63a7\u5236', description: '\u60a8\u8bbe\u5b9a\u76ee\u6807 URL \u548c\u9514\u6587\u672c\u3002\u6211\u4eec\u7684 AI \u751f\u6210\u81ea\u7136\u7684\u5468\u8fb9\u5185\u5bb9\uff0c\u8ba9\u6bcf\u6761\u94fe\u63a5\u770b\u8d77\u6765 100% \u771f\u5b9e\u3002', icon: 'PenTool' },
      { title: '\u9690\u79c1\u4f18\u5148\u5b89\u5168', description: '\u4ec5 OAuth \u6ce8\u518c\uff0c\u4e0d\u5b58\u5bc6\u7801\u3002\u4efb\u52a1\u6570\u636e\u52a0\u5bc6\u5b58\u50a8\u3002\u53ef\u968f\u65f6\u4ece\u4eea\u8868\u677f\u7533\u8bf7\u5168\u91cf\u6570\u636e\u5220\u9664\u3002', icon: 'Shield' }
    ]
  },
  faq: {
    id: 'faq',
    title: '\u5e38\u89c1\u95ee\u9898',
    description: '\u90e8\u7f72\u524d\u60a8\u9700\u8981\u4e86\u89e3\u7684\u4e00\u5207',
    tip: '\u8fd8\u6709\u5176\u4ed6\u95ee\u9898\uff1f\u6211\u4eec\u7684\u5de5\u7a0b\u5e08\u5728 12 \u5c0f\u65f6\u5185\u56de\u590d\uff1a<a href="mailto:support@linkflowai.app" class="text-primary font-medium hover:underline">support@linkflowai.app</a>',
    items: [
      { question: '\u8fd9\u4e9b\u5916\u94fe\u4f1a\u5bfc\u81f4\u6211\u7684\u7f51\u7ad9\u88ab\u60e9\u7f5a\u5417\uff1f', answer: '\u4e0d\u4f1a\u3002\u4e0e\u6279\u91cf\u673a\u5668\u4eba\u5de5\u5177\u4e0d\u540c\uff0cLinkFlow AI \u4f7f\u7528\u6a21\u62df\u81ea\u7136\u4eba\u7c7b\u4ea4\u4e92\u7684 Agentic \u5de5\u4f5c\u6d41\u2014\u2014\u9f20\u6807\u79fb\u52a8\u3001\u6eda\u52a8\u548c\u5ef6\u8fdf\u3002\u6211\u4eec\u4e13\u6ce8\u4e8e\u9ad8\u8d28\u91cf\u5e73\u53f0\u548c\u4e0a\u4e0b\u6587\u76f8\u5173\u6027\u653e\u7f6e\uff0c\u786e\u4fdd\u641c\u7d22\u5f15\u64ce\u5b89\u5168\u3002' },
      { question: '\u652f\u6301\u54ea\u4e9b\u5e73\u53f0\uff1f', answer: '\u6211\u4eec\u7ef4\u62a4\u4e00\u4e2a\u7cbe\u9009\u7684\u9ad8\u6743\u91cd\u7f51\u7ad9\u5e93\uff0c\u5305\u62ec Blogger\u3001Reddit\u3001Medium \u7b49\u3002\u60a8\u53ef\u5728\u5e73\u53f0\u9875\u9762\u67e5\u770b\u5b9e\u65f6\u6210\u529f\u7387\u3002' },
      { question: '\u6211\u5982\u4f55\u786e\u8ba4\u5916\u94fe\u5df2\u4e0a\u7ebf\uff1f', answer: '\u6bcf\u4e2a\u6210\u529f\u4efb\u52a1\u5747\u751f\u6210\u4e00\u4efd\u300a\u8bc1\u660e\u62a5\u544a\u300b\uff0c\u5305\u542b\u5b9e\u65f6 URL \u548c\u5b58\u50a8\u5728\u5b89\u5168\u4e91\u7aef\u7684\u9ad8\u6e05\u622a\u56fe\u3002\u60a8\u53ef\u72ec\u7acb\u9a8c\u8bc1\uff0c\u968f\u65f6\u53ef\u67e5\u3002' },
      { question: '\u53ef\u4ee5\u81ea\u5b9a\u4e49\u9514\u6587\u672c\u5417\uff1f', answer: '\u5f53\u7136\u53ef\u4ee5\u3002\u60a8\u5bf9\u76ee\u6807 URL \u548c\u9514\u6587\u672c\u62e5\u6709\u5b8c\u5168\u63a7\u5236\u6743\u3002\u6211\u4eec\u7684 AI \u751f\u6210\u5468\u8fb9\u5185\u5bb9\uff0c\u8ba9\u94fe\u63a5\u770b\u8d77\u6765 100% \u81ea\u7136\u3002' },
      { question: '\u4ec0\u4e48\u662f 48 \u5c0f\u65f6\u627f\u8bfa\uff1f', answer: '\u4ece\u60a8\u63d0\u4ea4\u4efb\u52a1\u90a3\u4e00\u523b\u8d77\uff0cAI \u7acb\u5373\u5f00\u59cb\u90e8\u7f72\u3002\u6211\u4eec\u4fdd\u8bc1\u5728 48 \u5c0f\u65f6\u5185\u5b8c\u6210\u63d0\u4ea4\u5e76\u63d0\u4f9b\u5b9e\u65f6\u622a\u56fe\u8bc1\u660e\u3002\u5982\u679c\u4efb\u52a1\u56e0\u5e73\u53f0\u95ee\u9898\u5931\u8d25\uff0c\u79ef\u5206\u5c06\u7acb\u5373\u9000\u8fd8\u3002' },
      { question: '\u6709\u514d\u8d39\u8bd5\u7528\u5417\uff1f', answer: '\u6709\u3002\u6bcf\u4e2a\u65b0\u8d26\u6237\u6ce8\u518c\u5373\u9001 1 \u4e2a\u514d\u8d39\u79ef\u5206\u2014\u2014\u65e0\u9700\u4fe1\u7528\u5361\u2014\u2014\u53ef\u7528\u4e8e\u5728\u771f\u5b9e\u5916\u94fe\u4efb\u52a1\u4e0a\u4f53\u9a8c\u6211\u4eec AI \u7684\u7cbe\u51c6\u5ea6\u3002' }
    ]
  },
  cta: {
    id: 'cta',
    title: '\u7acb\u5373\u90e8\u7f72\u60a8\u7684\u7b2c\u4e00\u6761\u5916\u94fe',
    description: '\u52a0\u5165\u4fe1\u8d56 LinkFlow AI \u8fdb\u884c\u900f\u660e\u3001\u81ea\u52a8\u5316\u5916\u94fe\u90e8\u7f72\u7684 SEO \u4e13\u4e1a\u4eba\u58eb\u884c\u5217\u3002',
    tip: '<span style="font-size: 0.75rem; font-weight: 300;">\u65e0\u9700\u4fe1\u7528\u5361 \u2022 \u6ce8\u518c\u5373\u9001 1 \u4e2a\u514d\u8d39\u79ef\u5206</span>',
    buttons: [{ title: '\u514d\u8d39\u5f00\u59cb', url: '/sign-up', target: '_self', icon: 'Zap', variant: 'default', className: '' }]
  },
  subscribe: {
    id: 'subscribe',
    title: '\u8ba2\u9605\u6211\u4eec\u7684\u901a\u8baf',
    description: '\u83b7\u53d6 SEO \u6d1e\u5bdf\u3001\u5e73\u53f0\u66f4\u65b0\u548c LinkFlow AI \u4f7f\u7528\u6280\u5de7\u3002',
    submit: { input: { placeholder: '\u8f93\u5165\u60a8\u7684\u90ae\u7b71' }, button: { title: '\u8ba2\u9605' }, action: '/api/subscribe' }
  },
  footer: {
    id: 'footer',
    brand: { title: 'LinkFlow AI', description: 'LinkFlow AI \u4f7f\u7528 AI \u667a\u80fd\u4f53\u81ea\u52a8\u5316\u9ad8\u6743\u91cd\u5916\u94fe\u90e8\u7f72\u3002\u6bcf\u6761\u63d0\u4ea4\u5747\u9644\u5e26\u5b9e\u65f6 URL \u548c\u622a\u56fe\u8bc1\u636e\u3002\u7531 SEO \u8001\u5175\u548c AI \u5de5\u7a0b\u5e08\u6253\u9020\u3002', url: '/' },
    copyright: 'LinkFlow AI \u2014 \u5916\u94fe\u53d1\u5e03\u5168\u81ea\u52a8\uff0c\u6bcf\u4e00\u6761\u90fd\u6709\u636e\u53ef\u67e5',
    nav: {
      items: [
        { title: '\u4ea7\u54c1', children: [
          { title: '\u90e8\u7f72\u4ee3\u7406', url: '/dashboard/tasks', target: '_self' },
          { title: '\u652f\u6301\u5e73\u53f0', url: '/platforms', target: '_self' },
          { title: '\u5b9a\u4ef7', url: '/pricing', target: '_self' },
          { title: '\u5e38\u89c1\u95ee\u9898', url: '/#faq', target: '_self' }
        ]},
        { title: '\u516c\u53f8', children: [
          { title: '\u5173\u4e8e\u6211\u4eec', url: '/about', target: '_self' },
          { title: '\u8054\u7cfb\u6211\u4eec', url: '/contact', target: '_self' },
          { title: '\u535a\u5ba2', url: '/blog', target: '_self' }
        ]},
        { title: '\u6cd5\u5f8b', children: [
          { title: '\u9690\u79c1\u653f\u7b56', url: '/privacy-policy', target: '_self' },
          { title: '\u670d\u52a1\u6761\u6b3e', url: '/terms-of-service', target: '_self' },
          { title: '\u514d\u8d23\u58f0\u660e', url: '/disclaimer', target: '_self' }
        ]},
        { title: '\u6280\u672f\u652f\u6301', children: [
          { title: 'Creem', url: 'https://www.creem.io', target: '_blank' },
          { title: 'Vercel', url: 'https://vercel.com', target: '_blank' },
          { title: 'Neon', url: 'https://neon.tech', target: '_blank' }
        ]}
      ]
    },
    social: { items: [{ title: '\u90ae\u7b71', icon: 'Mail', url: 'mailto:support@linkflowai.app', target: '_self' }] },
    agreement: { items: [
      { title: '\u9690\u79c1\u653f\u7b56', url: '/privacy-policy' },
      { title: '\u670d\u52a1\u6761\u6b3e', url: '/terms-of-service' },
      { title: '\u514d\u8d23\u58f0\u660e', url: '/disclaimer' }
    ]},
    show_theme: true, show_locale: true
  }
};

const fr = {
  header: {
    id: 'header',
    brand: { title: 'LinkFlow AI', url: '/' },
    nav: {
      items: [
        { title: 'Comment \u00e7a marche', url: '/#how-it-works', icon: 'Zap' },
        { title: 'Plateformes', url: '/platforms', icon: 'Globe' },
        { title: 'Tarification', url: '/pricing', icon: 'DollarSign' },
        { title: 'FAQ', url: '/#faq', icon: 'HelpCircle' }
      ]
    },
    buttons: [{ title: 'D\u00e9ployer maintenant', url: '/dashboard/tasks', target: '_self', variant: 'default', className: '' }],
    user_nav: {
      show_name: true, show_credits: true, show_sign_out: true,
      items: [
        { title: 'Tableau de bord', url: '/dashboard/tasks', icon: 'LayoutDashboard' },
        { title: 'Facturation', url: '/settings/billing', icon: 'CreditCard' },
        { title: 'Activit\u00e9', url: '/activity', icon: 'Activity' }
      ]
    },
    show_sign: true, show_theme: true, show_locale: true
  },
  hero: {
    id: 'hero',
    title: 'Vos Backlinks en Pilote Automatique. La Preuve \u00e0 Chaque Clic.',
    highlight_text: 'Pilote Automatique',
    description: 'D\u00e9ployez des backlinks sur des sites \u00e0 haute autorit\u00e9 en moins de 48 heures. Pas de bo\u00eete noire, pas d\'envoi manuel \u2014 des r\u00e9sultats transparents certifi\u00e9s par IA avec captures d\'\u00e9cran en temps r\u00e9el.',
    announcement: { badge: 'Nouveau', title: '\u26a1 1 Cr\u00e9dit gratuit \u00e0 l\'inscription \u2014 Sans carte', url: '/sign-up' },
    tip: '<span style="font-size: 0.75rem; font-weight: 300;">Aucune carte de cr\u00e9dit requise</span>',
    buttons: [{ title: 'Commencer avec 1 cr\u00e9dit gratuit', icon: 'Zap', url: '/sign-up', target: '_self', variant: 'default', className: '' }],
    show_avatars: false, avatars_tip: '', show_award: false,
    image: { src: '/imgs/features/admin.png', alt: 'LinkFlow AI Dashboard' },
    image_invert: { src: '/imgs/features/admin-dark.png', alt: 'LinkFlow AI Dashboard' }
  },
  'how-it-works': {
    id: 'how-it-works',
    title: 'Comment \u00e7a fonctionne',
    description: 'Trois \u00e9tapes vers un backlink en direct',
    items: [
      { title: 'Soumettez votre cible', description: 'Entrez votre URL cible et texte d\'ancrage. Choisissez une plateforme ou laissez notre IA s\u00e9lectionner le site le plus autoris\u00e9 pour votre ni\u00e8che.', icon: 'Link' },
      { title: 'L\'agent IA se d\u00e9ploie', description: 'Pilot\u00e9 par CrewAI, notre agent imite un vrai comportement humain \u2014 d\u00e9filement, clics et frappe \u00e0 vitesse naturelle \u2014 pour publier votre backlink en toute s\u00e9curit\u00e9 en moins de 48 heures.', icon: 'Cpu' },
      { title: 'Recevez votre rapport de preuve', description: 'Obtenez un Rapport de Preuve avec l\'URL en direct et une capture d\'\u00e9cran haute r\u00e9solution stock\u00e9e sur le cloud s\u00e9curis\u00e9. Vos preuves, accessibles \u00e0 tout moment.', icon: 'FileCheck' }
    ]
  },
  features: {
    id: 'features',
    title: 'Pourquoi LinkFlow AI',
    description: 'La plateforme de backlinks construite sur la transparence, la pr\u00e9cision et la preuve',
    items: [
      { title: 'Livraison 100% Transparente', description: 'Dites adieu \u00e0 l\'opacit\u00e9 du SEO. Chaque backlink est livr\u00e9 avec une URL en direct et une capture d\'\u00e9cran h\u00e9berg\u00e9e sur le cloud. Une preuve tangible pour chaque euro investi.', icon: 'Eye' },
      { title: 'Agents IA \u00e0 Comportement Humain', description: '\u00c9vitez les p\u00e9nalit\u00e9s Google. Nos agents IA simulent une navigation humaine r\u00e9elle \u2014 scroll, clics, frappe \u2014 garantissant un profil de liens naturel et durable.', icon: 'Bot' },
      { title: 'Garantie de Livraison sous 48h', description: 'Le SEO n\'est plus une attente interminable. Nous garantissons le d\u00e9ploiement en 48h. En cas d\'\u00e9chec, le cr\u00e9dit est automatiquement rembours\u00e9. Simple et sans risque.', icon: 'Clock' },
      { title: 'Plateformes Haute Autorit\u00e9 S\u00e9lectionn\u00e9es', description: 'Nous maintenons une biblioth\u00e8que v\u00e9rifi\u00e9e de sites DA 50+ incluant Blogger, Reddit, Medium et plus. Consultez les taux de succ\u00e8s en direct sur notre page Plateformes.', icon: 'Star' },
      { title: 'Contr\u00f4le Total du Texte d\'Ancrage', description: 'Vous d\u00e9finissez l\'URL cible et le texte d\'ancrage. Notre IA g\u00e9n\u00e8re un contenu environnant contextuel pour que chaque lien paraisse 100% organique.', icon: 'PenTool' },
      { title: 'S\u00e9curit\u00e9 Prioritaire', description: 'Inscription OAuth uniquement \u2014 aucun mot de passe stock\u00e9. Donn\u00e9es de t\u00e2ches chiffr\u00e9es. Demandez la suppression compl\u00e8te de vos donn\u00e9es \u00e0 tout moment.', icon: 'Shield' }
    ]
  },
  faq: {
    id: 'faq',
    title: 'Questions Fr\u00e9quentes',
    description: 'Tout ce que vous devez savoir avant votre premier d\u00e9ploiement.',
    tip: 'Vous avez encore des questions\u00a0? Nos ing\u00e9nieurs r\u00e9pondent en 12 heures : <a href="mailto:support@linkflowai.app" class="text-primary font-medium hover:underline">support@linkflowai.app</a>',
    items: [
      { question: 'Ces liens vont-ils p\u00e9naliser mon site\u00a0?', answer: 'Non. Contrairement aux outils de spam massif, LinkFlow AI utilise des Workflows Agentiques qui imitent les interactions humaines naturelles \u2014 mouvements de souris, d\u00e9filement et d\u00e9lais. Nous nous concentrons sur des plateformes de qualit\u00e9 pour garantir la s\u00e9curit\u00e9 SEO.' },
      { question: 'Quelles plateformes sont support\u00e9es\u00a0?', answer: 'Nous maintenons une biblioth\u00e8que de sites haute autorit\u00e9 incluant Blogger, Reddit, Medium et plus. Consultez les taux de succ\u00e8s en direct sur la page Plateformes.' },
      { question: 'Comment savoir si le lien est en ligne\u00a0?', answer: 'Chaque t\u00e2che r\u00e9ussie g\u00e9n\u00e8re un Rapport de Preuve contenant l\'URL en direct et une capture d\'\u00e9cran haute r\u00e9solution stock\u00e9e sur notre cloud s\u00e9curis\u00e9. Preuve v\u00e9rifiable ind\u00e9pendamment.' },
      { question: 'Puis-je utiliser mes propres textes d\'ancrage\u00a0?', answer: 'Absolument. Vous avez un contr\u00f4le total sur les URL cibles et les textes d\'ancrage. Notre IA g\u00e9n\u00e8re m\u00eame du contenu environnant pour rendre le lien 100% naturel.' },
      { question: 'Qu\'est-ce que la Garantie 48 heures\u00a0?', answer: 'D\u00e8s que vous soumettez une t\u00e2che, notre IA d\u00e9marre imm\u00e9diatement. Nous garantissons une soumission r\u00e9ussie avec preuve en 48 heures. En cas d\'\u00e9chec, votre cr\u00e9dit est instantan\u00e9ment rembours\u00e9.' },
      { question: 'Proposez-vous un essai gratuit\u00a0?', answer: 'Oui. Chaque nouveau compte re\u00e7oit 1 Cr\u00e9dit Gratuit \u00e0 l\'inscription \u2014 sans carte de cr\u00e9dit \u2014 pour tester la pr\u00e9cision de notre IA sur une vraie t\u00e2che de backlink.' }
    ]
  },
  cta: {
    id: 'cta',
    title: 'D\u00e9ployez votre premier backlink aujourd\'hui',
    description: 'Rejoignez les professionnels SEO qui font confiance \u00e0 LinkFlow AI pour un d\u00e9ploiement transparent et automatis\u00e9 avec preuve.',
    tip: '<span style="font-size: 0.75rem; font-weight: 300;">Aucune carte de cr\u00e9dit requise \u2022 1 cr\u00e9dit gratuit \u00e0 l\'inscription</span>',
    buttons: [{ title: 'Commencer gratuitement', url: '/sign-up', target: '_self', icon: 'Zap', variant: 'default', className: '' }]
  },
  subscribe: {
    id: 'subscribe',
    title: 'Gardez une longueur d\'avance',
    description: 'Recevez des insights SEO, des mises \u00e0 jour de plateformes et des conseils LinkFlow AI dans votre bo\u00eete mail.',
    submit: { input: { placeholder: 'Entrez votre e-mail' }, button: { title: 'S\'abonner' }, action: '/api/subscribe' }
  },
  footer: {
    id: 'footer',
    brand: { title: 'LinkFlow AI', description: 'LinkFlow AI automatise le d\u00e9ploiement de backlinks haute autorit\u00e9 via des agents IA. Chaque soumission est accompagn\u00e9e d\'une URL en direct et d\'une preuve par capture d\'\u00e9cran. Con\u00e7u par des v\u00e9t\u00e9rans SEO et des ing\u00e9nieurs IA.', url: '/' },
    copyright: 'LinkFlow AI \u2014 Vos Backlinks en Pilote Automatique. La Preuve \u00e0 Chaque Clic.',
    nav: {
      items: [
        { title: 'Produit', children: [
          { title: 'D\u00e9ployer un Agent', url: '/dashboard/tasks', target: '_self' },
          { title: 'Plateformes', url: '/platforms', target: '_self' },
          { title: 'Tarification', url: '/pricing', target: '_self' },
          { title: 'FAQ', url: '/#faq', target: '_self' }
        ]},
        { title: 'Entreprise', children: [
          { title: '\u00c0 propos', url: '/about', target: '_self' },
          { title: 'Contact', url: '/contact', target: '_self' },
          { title: 'Blog', url: '/blog', target: '_self' }
        ]},
        { title: 'L\u00e9gal', children: [
          { title: 'Politique de confidentialit\u00e9', url: '/privacy-policy', target: '_self' },
          { title: 'Conditions d\'utilisation', url: '/terms-of-service', target: '_self' },
          { title: 'Avertissement', url: '/disclaimer', target: '_self' }
        ]},
        { title: 'Partenaires', children: [
          { title: 'Creem', url: 'https://www.creem.io', target: '_blank' },
          { title: 'Vercel', url: 'https://vercel.com', target: '_blank' },
          { title: 'Neon', url: 'https://neon.tech', target: '_blank' }
        ]}
      ]
    },
    social: { items: [{ title: 'E-mail', icon: 'Mail', url: 'mailto:support@linkflowai.app', target: '_self' }] },
    agreement: { items: [
      { title: 'Politique de confidentialit\u00e9', url: '/privacy-policy' },
      { title: 'Conditions d\'utilisation', url: '/terms-of-service' },
      { title: 'Avertissement', url: '/disclaimer' }
    ]},
    show_theme: true, show_locale: true
  }
};

const utf8NoBom = { encoding: 'utf8' };
fs.writeFileSync(path.join(basePath, 'zh/landing.json'), JSON.stringify(zh, null, 2), utf8NoBom);
fs.writeFileSync(path.join(basePath, 'fr/landing.json'), JSON.stringify(fr, null, 2), utf8NoBom);
console.log('\u2705 zh/landing.json updated');
console.log('\u2705 fr/landing.json updated');

