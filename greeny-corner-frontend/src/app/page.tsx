'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Header from '@/components/Header';
import { useTranslation } from 'react-i18next';
import Script from 'next/script';
import { Fredoka } from 'next/font/google';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-fredoka' });

const IOS_APP_URL = 'https://apps.apple.com/ae/app/greeny-corner/id6756967530';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.greenycorner.app';

const heading = `${fredoka.className} font-semibold`;

export default function Home() {
  const { user, loading, loginAsGuest } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollReveal(pageRef);

  const handleGuestAccess = () => {
    loginAsGuest();
    router.push('/my-plants');
  };

  useEffect(() => {
    if (!loading && user) {
      router.push('/my-plants');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('home.loading')}</div>
      </div>
    );
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Greeny Corner',
    description: 'AI-powered plant identification and care management app for plant lovers',
    url: 'https://www.greenycorner.ae',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AED',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
    author: {
      '@type': 'Organization',
      name: 'Greeny Corner',
      url: 'https://www.greenycorner.ae',
    },
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div ref={pageRef} dir={isRTL ? 'rtl' : 'ltr'} className="overflow-x-hidden">
        <Header showUserInfo={false} />

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #12301A 0%, #1C4A28 48%, #1F6B2E 78%, #228B22 100%)' }}>
          <div
            className="animate-glow-pulse pointer-events-none absolute -top-56 -right-40 h-[640px] w-[640px] rounded-full"
            style={{ background: 'radial-gradient(circle at 40% 40%, rgba(84,212,96,0.35), rgba(84,212,96,0) 70%)' }}
          />
          <div className="animate-blob absolute top-[15%] left-[6%] hidden h-16 w-12 rounded-[46%_54%_60%_40%/55%_45%_55%_45%] opacity-55 sm:block" style={{ background: 'linear-gradient(160deg, #7EE08A, #228B22)' }} />
          <div className="animate-blob-slow absolute top-[55%] left-[16%] hidden h-10 w-7 rounded-[46%_54%_60%_40%/55%_45%_55%_45%] bg-greeny-lime-400/40 sm:block" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-12 lg:py-20 xl:px-[120px]">
            <div className="w-full max-w-xl text-center lg:w-[560px] lg:flex-none lg:text-start">
              <div data-reveal style={{ transitionDelay: '.05s' }} className="inline-flex items-center gap-2 rounded-full border border-greeny-lime-500/35 bg-greeny-lime-500/15 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-greeny-lime-500" />
                <span className="text-xs font-semibold tracking-wide text-greeny-lime-400 uppercase">{t('home.eyebrow')}</span>
              </div>
              <h1 data-reveal style={{ transitionDelay: '.15s' }} className={`${heading} mt-6 text-4xl leading-[1.05] tracking-tight text-greeny-on-dark sm:text-5xl lg:text-[60px]`}>
                {t('home.heroTitle')}
              </h1>
              <p data-reveal style={{ transitionDelay: '.25s' }} className="mx-auto mt-6 max-w-[480px] text-lg leading-relaxed text-greeny-on-dark-soft lg:mx-0">
                {t('home.heroDescription')}
              </p>
              <div data-reveal style={{ transitionDelay: '.35s' }} className="mt-8 flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center lg:justify-start">
                <span className="relative inline-flex">
                  <span className="animate-cta-ping absolute inset-0 rounded-full bg-greeny-lime-500" />
                  <Link
                    href="/register"
                    className="relative rounded-full bg-greeny-lime-500 px-8 py-4 text-base font-bold text-greeny-forest-900 transition-colors hover:bg-greeny-lime-400"
                  >
                    {t('home.getStartedFree')}
                  </Link>
                </span>
                <button
                  onClick={handleGuestAccess}
                  className="rounded-full border-2 border-white/45 px-6 py-4 text-[15px] font-semibold text-greeny-on-dark transition-colors hover:border-white/90 hover:bg-white/10"
                >
                  {t('auth.browseAsGuest')}
                </button>
              </div>
              <p data-reveal style={{ transitionDelay: '.45s', '--final-opacity': 0.8 } as React.CSSProperties} className="mt-5 text-[13px] text-greeny-on-dark-soft">
                {t('home.heroNote')}
              </p>
              <Link href="/login" className="mt-3 inline-block text-[13px] font-medium text-greeny-on-dark-soft hover:text-greeny-on-dark">
                {t('auth.alreadyHaveAccount')} <span className="underline">{t('home.signIn')}</span>
              </Link>
            </div>

            {/* phone mockup */}
            <div data-reveal-scale style={{ transitionDelay: '.25s' }} className="relative flex w-full max-w-[300px] flex-none justify-center lg:w-[420px] lg:max-w-none">
              <div className="animate-blob absolute -top-8 right-2 h-24 w-[70px] rounded-[46%_54%_60%_40%/55%_45%_55%_45%] opacity-85" style={{ background: 'linear-gradient(160deg, #7EE08A, #228B22)' }} />
              <div className="animate-blob-slow absolute bottom-2 left-0 h-[54px] w-10 rounded-[46%_54%_60%_40%/55%_45%_55%_45%] bg-greeny-lime-400/60" />

              <div className="animate-phone-float relative z-10 w-[280px] rounded-[44px] bg-[#0E1B12] p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)] sm:w-[300px]">
                <div className="flex h-[570px] flex-col overflow-hidden rounded-[36px] bg-[#F7F8F3] sm:h-[610px]">
                  <div className="flex-none rounded-b-[40px] px-5 pt-6 pb-8" style={{ background: 'linear-gradient(150deg, #3CB44E 0%, #1E8A34 100%)' }}>
                    <div className="text-[11.5px] text-white/85">Welcome back</div>
                    <div className={`${heading} mt-1 text-xl text-white`}>My Plants</div>
                    <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4-3-7-6.5-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5C19 14.5 16 18 12 21Z" fill="#1E8A34"/></svg>
                      <span className="text-[11px] font-bold text-[#1E8A34]">2 Plants</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-5 pt-4.5">
                    <div className="relative h-[190px] flex-none overflow-hidden rounded-[22px]">
                      <img src="/home/peace-lily.jpg" alt="Peace lily" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-[#2E9E46] py-1.5 pr-2.5 pl-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 21s-7-4.35-9.5-9C.7 8.1 2.4 4 6.5 4 9 4 11 5.5 12 7c1-1.5 3-3 5.5-3 4.1 0 5.8 4.1 4 8-2.5 4.65-9.5 9-9.5 9Z"/></svg>
                        <span className="text-[10px] font-bold text-white">Healthy</span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-[#2E9E8E] py-1.5 pr-2.5 pl-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z"/></svg>
                        <span className="text-[10px] font-bold text-white">In 4 days</span>
                      </div>
                    </div>
                    <div className={`${heading} mt-3 text-[16.5px] text-greeny-ink`}>Peace Lily</div>
                    <div className="mt-0.5 text-[11.5px] text-greeny-ink-faint">Spathiphyllum</div>

                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-greeny-line bg-white p-2.5">
                      <img src="/home/snake-plant.jpg" alt="Snake plant" className="h-11 w-11 flex-none rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className={`${heading} text-[13.5px] text-greeny-ink`}>Snake Plant</div>
                        <div className="mt-0.5 text-[10.5px] text-greeny-ink-faint">Sansevieria</div>
                      </div>
                      <div className="flex flex-none items-center gap-1 rounded-full bg-[#FBEFE0] px-2.5 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D98A2E]" />
                        <span className="text-[9.5px] font-bold text-[#B8712A]">Needs water</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-none items-center justify-around border-t border-[#ECEFE3] bg-white px-2 py-3.5">
                    <div className="flex flex-col items-center gap-1">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#9AA492" strokeWidth="1.8"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="#9AA492" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      <span className="text-[9px] font-medium text-[#9AA492]">Account</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" stroke="#9AA492" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 20a2 2 0 0 0 4 0" stroke="#9AA492" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      <span className="text-[9px] font-medium text-[#9AA492]">Alerts</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#9AA492" strokeWidth="1.8"/><path d="M12 8v8M8 12h8" stroke="#9AA492" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      <span className="text-[9px] font-medium text-[#9AA492]">Add Plant</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full" style={{ background: 'linear-gradient(150deg, #AEE6D8, #7EE08A)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4-3-7-6.5-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5C19 14.5 16 18 12 21Z" fill="#1E8A34"/></svg>
                      </div>
                      <span className="text-[9px] font-bold text-greeny-forest-700">My Plants</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS (floating strip) ================= */}
        <section className="relative bg-greeny-paper px-6 pb-14 sm:px-8 lg:px-12 xl:px-[120px]">
          <div className="relative -mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:-mt-16 lg:grid-cols-3">
            <div data-reveal style={{ transitionDelay: '.08s' }} className="flex flex-col gap-2.5 rounded-[22px] bg-white p-5 shadow-[0_24px_48px_-28px_rgba(18,48,26,0.28)] sm:p-6.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 6c-2-1.3-5-1.3-8-.3v13c3-1 6-1 8 .3 2-1.3 5-1.3 8-.3v-13c-3-1-6-1-8 .3Z" stroke="#228B22" strokeWidth="2" strokeLinejoin="round"/><path d="M12 6v13" stroke="#228B22" strokeWidth="2"/></svg>
              <div className={`${heading} text-2xl text-greeny-ink`}>{t('home.statSpecies')}</div>
              <div className="text-[13px] leading-snug text-greeny-ink-soft">{t('home.statSpeciesCaption')}</div>
            </div>

            <div data-reveal style={{ transitionDelay: '.16s' }} className="flex flex-col gap-2.5 rounded-[22px] bg-white p-5 shadow-[0_24px_48px_-28px_rgba(18,48,26,0.28)] sm:p-6.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#228B22" strokeWidth="2"/><path d="M3 12h18M12 3c2.6 2.7 4 6 4 9s-1.4 6.3-4 9c-2.6-2.7-4-6-4-9s1.4-6.3 4-9Z" stroke="#228B22" strokeWidth="1.7"/></svg>
              <div className={`${heading} text-2xl text-greeny-ink`}>EN / AR</div>
              <div className="text-[13px] leading-snug text-greeny-ink-soft">{t('home.statLangCaption')}</div>
            </div>

            <div data-reveal style={{ transitionDelay: '.24s' }} className="flex flex-col gap-2.5 rounded-[22px] bg-white p-5 shadow-[0_24px_48px_-28px_rgba(18,48,26,0.28)] sm:p-6.5">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16.5 3.5c-.9 1-2.3 1.7-3.6 1.6-.2-1.3.4-2.7 1.2-3.6.9-1 2.4-1.7 3.6-1.6.1 1.4-.4 2.7-1.2 3.6Z" fill="#16241A"/><path d="M20.8 17.4c-.6 1.4-1 2-1.8 3.2-1.1 1.6-2.6 3.6-4.5 3.6-1.7 0-2.1-1.1-4.4-1.1-2.3 0-2.8 1.1-4.4 1.1-1.9 0-3.3-1.8-4.4-3.4C-1 16.6-1.5 11 .5 8c1.3-2 3.4-3.3 5.3-3.3 1.9 0 3.1 1.2 4.7 1.2 1.5 0 2.5-1.2 4.7-1.2 1.7 0 3.5.9 4.8 2.5-4.2 2.3-3.5 8.3.8 10.2Z" fill="#16241A"/></svg>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3.18 23.76c.3.17.64.2.96.08l.1-.06 10.72-6.2-2.3-2.31-9.48 8.49zM.75 1.5C.44 1.83.25 2.3.25 2.9v18.2c0 .6.19 1.07.5 1.4l.08.07 10.2-10.2v-.24L.83 1.43l-.08.07zM20.6 10.4l-2.16-1.25-2.57 2.57 2.57 2.57 2.18-1.26c.62-.36.62-.95 0-1.31l-.02-.32zM4.14.24l10.72 6.2-2.3 2.3L3.08.26 4.14.24z" fill="#16241A"/></svg>
              </div>
              <div className={`${heading} text-2xl text-greeny-ink`}>{t('home.statStoresTitle')}</div>
              <div className="text-[13px] leading-snug text-greeny-ink-soft">{t('home.statStoresCaption')}</div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="relative bg-greeny-paper px-6 pt-1 pb-20 sm:px-8 lg:px-12 xl:px-[120px]">
          <div data-reveal className="mx-auto mb-12 max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-greeny-lime-tint px-4 py-1.5">
              <span className="text-xs font-bold tracking-wide text-greeny-forest-700 uppercase">{t('home.featuresEyebrow')}</span>
            </div>
            <h2 className={`${heading} mt-4.5 text-3xl text-greeny-ink sm:text-4xl`}>{t('home.featuresTitle')}</h2>
            <p className="mt-3.5 text-[16.5px] leading-relaxed text-greeny-ink-soft">{t('home.featuresSubtitle')}</p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-7">
            <div data-reveal-scale style={{ transitionDelay: '0s' }} className="group rounded-[26px] border border-greeny-line bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(18,48,26,0.28)]">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-t-full rounded-b-2xl bg-greeny-lime-tint transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" stroke="#228B22" strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="13.5" r="3.4" stroke="#228B22" strokeWidth="2"/></svg>
              </div>
              <h3 className={`${heading} mt-5 text-[19px] text-greeny-ink`}>{t('home.featureIdTitle')}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-greeny-ink-soft">{t('home.featureIdDesc')}</p>
            </div>

            <div data-reveal-scale style={{ transitionDelay: '.08s' }} className="group rounded-[26px] border border-greeny-line bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(18,48,26,0.28)]">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-t-full rounded-b-2xl bg-greeny-lime-tint transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4-3-7-6.5-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5C19 14.5 16 18 12 21Z" stroke="#228B22" strokeWidth="2"/><path d="M12 21v-8" stroke="#228B22" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h3 className={`${heading} mt-5 text-[19px] text-greeny-ink`}>{t('home.featureTrackerTitle')}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-greeny-ink-soft">{t('home.featureTrackerDesc')}</p>
            </div>

            <div data-reveal-scale style={{ transitionDelay: '0s' }} className="group rounded-[26px] border border-greeny-line bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(18,48,26,0.28)]">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-t-full rounded-b-2xl bg-greeny-lime-tint transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" stroke="#228B22" strokeWidth="2" strokeLinejoin="round"/><path d="M5 17a3 3 0 0 1 3-3h11" stroke="#228B22" strokeWidth="2"/></svg>
              </div>
              <h3 className={`${heading} mt-5 text-[19px] text-greeny-ink`}>{t('home.featureEncyclopediaTitle')}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-greeny-ink-soft">{t('home.featureEncyclopediaDesc')}</p>
              <Link href="/plants" className="mt-3 inline-block text-[14px] font-semibold text-greeny-forest-700 hover:text-greeny-forest-800">
                {t('home.navEncyclopedia')} →
              </Link>
            </div>

            <div data-reveal-scale style={{ transitionDelay: '.08s' }} className="group rounded-[26px] border border-greeny-line bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(18,48,26,0.28)]">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-t-full rounded-b-2xl bg-greeny-lime-tint transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2v6M12 22c-4-3-7-6.8-7-11.2A7 7 0 0 1 12 4a7 7 0 0 1 7 6.8C19 15.2 16 19 12 22Z" stroke="#228B22" strokeWidth="2" strokeLinejoin="round"/><path d="M9.5 12.5l2 2 3.5-4" stroke="#228B22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className={`${heading} mt-5 text-[19px] text-greeny-ink`}>{t('home.featureHealthTitle')}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-greeny-ink-soft">{t('home.featureHealthDesc')}</p>
            </div>
          </div>
        </section>

        {/* ================= BILINGUAL ================= */}
        <section className="relative overflow-hidden px-6 py-20 sm:px-8 lg:px-12 xl:px-[120px]" style={{ background: 'linear-gradient(120deg, #1C4A28 0%, #12301A 100%)' }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
            <div data-reveal className="max-w-lg text-center lg:w-[480px] lg:flex-none lg:text-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-greeny-lime-500/35 bg-greeny-lime-500/15 px-4 py-1.5">
                <span className="text-xs font-semibold tracking-wide text-greeny-lime-400 uppercase">{t('home.bilingualEyebrow')}</span>
              </div>
              <h2 className={`${heading} mt-5 text-3xl text-greeny-on-dark sm:text-4xl`}>{t('home.bilingualTitle')}</h2>
              <p className="mt-4 text-[16.5px] leading-relaxed text-greeny-on-dark-soft">{t('home.bilingualDesc')}</p>
              <div className="mt-6 flex justify-center gap-3 lg:justify-start">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium text-greeny-on-dark-soft">{t('home.ltrChip')}</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium text-greeny-on-dark-soft">{t('home.rtlChip')}</span>
              </div>
            </div>

            <div className="flex flex-none gap-6">
              {/* EN phone (always LTR, regardless of site language) */}
              <div dir="ltr" data-reveal-scale style={{ transitionDelay: '.1s' }} className="dir-ltr-fixed flex w-[150px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] sm:w-[210px]">
                <div className="flex-none px-4 pt-4.5 pb-5" style={{ background: 'linear-gradient(150deg, #3CB44E 0%, #1E8A34 100%)' }}>
                  <div className={`${heading} text-[15px] text-white`}>My Plants</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4-3-7-6.5-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5C19 14.5 16 18 12 21Z" fill="#1E8A34"/></svg>
                    <span className="text-[9.5px] font-bold text-[#1E8A34]">2 Plants</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-greeny-paper p-2">
                    <img src="/home/peace-lily.jpg" alt="Peace lily" className="h-[34px] w-[34px] flex-none rounded-lg object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-greeny-ink">Peace Lily</div>
                      <div className="text-[10.5px] text-greeny-ink-soft">Water in 2 days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-greeny-paper p-2">
                    <img src="/home/snake-plant.jpg" alt="Snake plant" className="h-[34px] w-[34px] flex-none rounded-lg object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-greeny-ink">Snake Plant</div>
                      <div className="text-[10.5px] text-[#B8712A]">Needs water</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AR phone (always RTL, regardless of site language) */}
              <div dir="rtl" data-reveal-scale style={{ transitionDelay: '.2s' }} className="flex w-[150px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] sm:w-[210px]">
                <div className="flex-none px-4 pt-4.5 pb-5" style={{ background: 'linear-gradient(150deg, #3CB44E 0%, #1E8A34 100%)' }}>
                  <div className="text-[15px] font-bold text-white">نباتاتي</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M12 21c-4-3-7-6.5-7-10.5A7 7 0 0 1 12 3a7 7 0 0 1 7 7.5C19 14.5 16 18 12 21Z" fill="#1E8A34"/></svg>
                    <span className="text-[9.5px] font-bold text-[#1E8A34]">نباتان</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-greeny-paper p-2">
                    <img src="/home/peace-lily.jpg" alt="زنبق السلام" className="h-[34px] w-[34px] flex-none rounded-lg object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-greeny-ink">زنبق السلام</div>
                      <div className="text-[10.5px] text-greeny-ink-soft">الري خلال يومين</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl bg-greeny-paper p-2">
                    <img src="/home/snake-plant.jpg" alt="نبات الثعبان" className="h-[34px] w-[34px] flex-none rounded-lg object-cover" />
                    <div>
                      <div className="text-xs font-semibold text-greeny-ink">نبات الثعبان</div>
                      <div className="text-[10.5px] text-[#B8712A]">يحتاج للري</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= APP DOWNLOAD ================= */}
        <section className="relative overflow-hidden px-6 py-20 sm:px-8 lg:px-12 xl:px-[120px]" style={{ background: 'linear-gradient(180deg, #E7F6E4 0%, #F1FBEC 100%)' }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
            <div data-reveal className="max-w-lg text-center lg:w-[520px] lg:flex-none lg:text-start">
              <div className="inline-flex items-center gap-2 rounded-full bg-greeny-forest-700/10 px-4 py-1.5">
                <span className="text-xs font-bold tracking-wide text-greeny-forest-700 uppercase">{t('home.downloadEyebrow')}</span>
              </div>
              <h2 className={`${heading} mt-4.5 text-3xl text-greeny-ink sm:text-4xl`}>{t('home.downloadTitle')}</h2>
              <p className="mt-4 max-w-[460px] text-[16.5px] leading-relaxed text-greeny-ink-soft">{t('home.downloadDesc')}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a href={IOS_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0E1B12] px-5 py-2.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16.5 3.5c-.9 1-2.3 1.7-3.6 1.6-.2-1.3.4-2.7 1.2-3.6.9-1 2.4-1.7 3.6-1.6.1 1.4-.4 2.7-1.2 3.6Z" fill="#fff"/><path d="M20.8 17.4c-.6 1.4-1 2-1.8 3.2-1.1 1.6-2.6 3.6-4.5 3.6-1.7 0-2.1-1.1-4.4-1.1-2.3 0-2.8 1.1-4.4 1.1-1.9 0-3.3-1.8-4.4-3.4C-1 16.6-1.5 11 .5 8c1.3-2 3.4-3.3 5.3-3.3 1.9 0 3.1 1.2 4.7 1.2 1.5 0 2.5-1.2 4.7-1.2 1.7 0 3.5.9 4.8 2.5-4.2 2.3-3.5 8.3.8 10.2Z" fill="#fff"/></svg>
                  <div>
                    <div className="text-[9.5px] leading-none text-white/70">{t('footer.downloadOn')}</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{t('footer.appStore')}</div>
                  </div>
                </a>
                <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 rounded-2xl bg-[#0E1B12] px-5 py-2.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3.18 23.76c.3.17.64.2.96.08l.1-.06 10.72-6.2-2.3-2.31-9.48 8.49zM.75 1.5C.44 1.83.25 2.3.25 2.9v18.2c0 .6.19 1.07.5 1.4l.08.07 10.2-10.2v-.24L.83 1.43l-.08.07zM20.6 10.4l-2.16-1.25-2.57 2.57 2.57 2.57 2.18-1.26c.62-.36.62-.95 0-1.31l-.02-.32zM4.14.24l10.72 6.2-2.3 2.3L3.08.26 4.14.24z" fill="#fff"/></svg>
                  <div>
                    <div className="text-[9.5px] leading-none text-white/70">{t('footer.getItOn')}</div>
                    <div className="mt-0.5 text-sm font-semibold text-white">{t('footer.googlePlay')}</div>
                  </div>
                </a>
              </div>
            </div>

            <div data-reveal-scale style={{ transitionDelay: '.12s' }} className="relative flex w-full max-w-[230px] flex-none justify-center">
              <div className="animate-blob absolute -top-4 right-2.5 h-[60px] w-11 rounded-[46%_54%_60%_40%/55%_45%_55%_45%] bg-greeny-forest-700/55" />
              <div className="w-[230px] rounded-[36px] bg-[#0E1B12] p-2 shadow-[0_30px_60px_-20px_rgba(18,48,26,0.35)]">
                <div className="flex h-[470px] flex-col overflow-hidden rounded-[28px] bg-white">
                  <div className="relative h-[150px] flex-none">
                    <img src="/home/peace-lily.jpg" alt="Snake plant photo" className="block h-full w-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="#E4574C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0-12 4 4m-4-4-4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="#1E8A34" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 px-4.5 py-4">
                    <div className={`${heading} text-base text-greeny-ink`}>Snake Plant</div>
                    <div className="mt-1.5 inline-flex w-fit rounded-full bg-[#1E8A34] px-2.5 py-1">
                      <span className="text-[9px] font-semibold text-white">Dracaena Trifasciata</span>
                    </div>
                    <div className="mt-3 rounded-2xl border-[1.5px] border-greeny-lime-500 bg-greeny-lime-tint p-3">
                      <div className="text-[9.5px] text-greeny-ink-soft">Watering status</div>
                      <div className={`${heading} mt-0.5 text-[15px] text-[#1E8A34]`}>In 11 days</div>
                      <div className="my-2.5 h-px bg-[#1E8A34]/20" />
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1E8A34]">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z"/></svg>
                        </div>
                        <div className="text-[9.5px] leading-relaxed text-greeny-ink-soft">Plant has enough water for now</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="relative overflow-hidden px-6 py-20 text-center sm:px-8 lg:py-28" style={{ background: 'linear-gradient(135deg, #12301A 0%, #1C4A28 55%, #228B22 100%)' }}>
          <div className="animate-blob absolute top-10 left-[8%] hidden h-[50px] w-9 rounded-[46%_54%_60%_40%/55%_45%_55%_45%] bg-greeny-lime-400/40 sm:block" />
          <div className="animate-blob-slow absolute right-[10%] bottom-8 hidden h-16 w-[46px] rounded-[46%_54%_60%_40%/55%_45%_55%_45%] bg-greeny-lime-400/40 sm:block" />

          <div data-reveal className="relative mx-auto max-w-2xl">
            <h2 className={`${heading} text-3xl text-greeny-on-dark sm:text-4xl`}>{t('home.finalTitle')}</h2>
            <p className="mt-4 text-lg text-greeny-on-dark-soft">{t('home.finalSubtitle')}</p>
            <div className="mt-8">
              <Link href="/register" className="inline-block rounded-full bg-greeny-lime-500 px-9 py-4 text-base font-bold text-greeny-forest-900 transition-colors hover:bg-greeny-lime-400">
                {t('home.getStartedFree')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
