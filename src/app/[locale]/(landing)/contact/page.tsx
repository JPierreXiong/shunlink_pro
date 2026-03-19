import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Mail, Clock, Handshake, MapPin } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact.metadata' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  const channels = [
    {
      title: t('channels.items.0.title'),
      description: t('channels.items.0.description'),
      email: t('channels.items.0.email'),
      icon: Mail,
    },
    {
      title: t('channels.items.1.title'),
      description: t('channels.items.1.description'),
      url: t('channels.items.1.url'),
      handle: t('channels.items.1.handle'),
      icon: Clock,
    },
    {
      title: t('channels.items.2.title'),
      description: t('channels.items.2.description'),
      email: t('channels.items.2.email'),
      icon: Handshake,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('hero.description')}
        </p>
      </div>

      {/* Contact Channels */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {channels.map((channel, index) => {
          const Icon = channel.icon;
          return (
            <div
              key={index}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{channel.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {channel.description}
              </p>
              {channel.email && (
                <a
                  href={`mailto:${channel.email}`}
                  className="text-primary hover:underline font-medium"
                >
                  {channel.email}
                </a>
              )}
              {channel.url && channel.handle && (
                <a
                  href={channel.url}
                  className="text-primary hover:underline font-medium"
                >
                  {channel.handle}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Location */}
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-primary" />
          <p className="text-lg font-medium">{t('location.text')}</p>
        </div>
      </div>

      {/* Response Times */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('response_times.title')}</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-4 border rounded-lg">
            <p className="font-semibold mb-2">{t('response_times.items.0.title')}</p>
            <p className="text-muted-foreground">{t('response_times.items.0.time')}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="font-semibold mb-2">{t('response_times.items.1.title')}</p>
            <p className="text-muted-foreground">{t('response_times.items.1.time')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
