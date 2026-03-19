import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'disclaimer.metadata' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: true,
      follow: true,
    },
  };
}

const sectionIcons = [
  // Info
  <svg key="info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  // AlertTriangle
  <svg key="alert" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  // Cloud
  <svg key="cloud" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  // ShieldAlert
  <svg key="shield" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
];

export default async function DisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('disclaimer');

  const sections = [0, 1, 2, 3].map((index) => ({
    index,
    data: t.raw(`sections.${index}`) as {
      title: string;
      content: string;
      items?: string[];
    },
  }));

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('metadata.title').replace(' - SoloBoard', '')}
        </h1>
        <p className="text-muted-foreground">{t('last_updated')}</p>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {sections.map(({ index, data }) => (
          <section key={index} className="border-l-4 border-primary pl-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              {sectionIcons[index]}
              {data.title}
            </h2>

            <p className="text-lg leading-relaxed mb-4">{data.content}</p>

            {data.items && (
              <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                {data.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Contact Note */}
      <div className="mt-16 p-6 bg-muted/50 rounded-lg text-center">
        <p className="text-lg">
          {t('transparency_note.content')}{' '}
          <a
            href="mailto:support@soloboard.app"
            className="text-primary font-medium hover:underline"
          >
            {t('transparency_note.link_text')}
          </a>
        </p>
      </div>
    </div>
  );
}
