'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TypingEffect } from '@/components/ui/typing-effect';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Logo } from '@/components/ui/logo';
import { useLanguage } from '@/contexts/language-context';
import { 
  Inbox, 
  CheckSquare, 
  Calendar, 
  FolderOpen, 
  Cloud, 
  Zap,
  Check,
  ArrowRight,
  Target,
  Brain,
  Workflow
} from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { t } = useLanguage();

  const gtdCatchphrases = [
    t('landing.catchphrase.twoMinute'),
    t('landing.catchphrase.stressFree'), 
    t('landing.catchphrase.mindLikeWater'),
    t('landing.catchphrase.captureEverything'),
    t('landing.catchphrase.weeklyReviews'),
    t('landing.catchphrase.nextAction'),
    t('landing.catchphrase.trustedSystem'),
    t('landing.catchphrase.clearMind')
  ];

  const features = [
    {
      icon: Inbox,
      title: t('landing.features.inbox.title'),
      description: t('landing.features.inbox.description'),
      color: 'text-blue-500'
    },
    {
      icon: CheckSquare,
      title: t('landing.features.nextActions.title'),
      description: t('landing.features.nextActions.description'),
      color: 'text-green-500'
    },
    {
      icon: FolderOpen,
      title: t('landing.features.projects.title'),
      description: t('landing.features.projects.description'),
      color: 'text-purple-500'
    },
    {
      icon: Cloud,
      title: t('landing.features.maybeSomeday.title'),
      description: t('landing.features.maybeSomeday.description'),
      color: 'text-yellow-500'
    },
    {
      icon: Calendar,
      title: t('landing.features.calendar.title'),
      description: t('landing.features.calendar.description'),
      color: 'text-red-500'
    },
    {
      icon: Zap,
      title: t('landing.features.sync.title'),
      description: t('landing.features.sync.description'),
      color: 'text-indigo-500'
    }
  ];

  const benefits = [
    {
      icon: Brain,
      title: t('landing.benefits.clearMind.title'),
      description: t('landing.benefits.clearMind.description')
    },
    {
      icon: Target,
      title: t('landing.benefits.focus.title'),
      description: t('landing.benefits.focus.description')
    },
    {
      icon: Workflow,
      title: t('landing.benefits.trusted.title'),
      description: t('landing.benefits.trusted.description')
    }
  ];

  const pricingPlans = [
    {
      name: t('landing.pricing.free.name'),
      price: t('landing.pricing.free.price'),
      period: t('landing.pricing.free.period'),
      description: t('landing.pricing.free.description'),
      features: [
        t('landing.pricing.feature.unlimitedTasks'),
        t('landing.pricing.feature.basicActions'),
        t('landing.pricing.feature.projectTracking'),
        t('landing.pricing.feature.maybeLists'),
        t('landing.pricing.feature.mobileAccess'),
        t('landing.pricing.feature.emailSupport')
      ],
      cta: t('landing.pricing.free.cta'),
      highlighted: false
    },
    {
      name: t('landing.pricing.premium.name'),
      price: t('landing.pricing.premium.price'),
      period: t('landing.pricing.premium.period'),
      yearlyPrice: t('landing.pricing.premium.yearlyPrice'),
      yearlyPeriod: t('landing.pricing.premium.yearlyPeriod'),
      description: t('landing.pricing.premium.description'),
      features: [
        t('landing.pricing.feature.everythingFree'),
        t('landing.pricing.feature.calendarIntegration'),
        t('landing.pricing.feature.emailInvites'),
        t('landing.pricing.feature.advancedScheduling'),
        t('landing.pricing.feature.prioritySupport'),
        t('landing.pricing.feature.exportBackup'),
        t('landing.pricing.feature.customContexts'),
        t('landing.pricing.feature.analytics')
      ],
      cta: t('landing.pricing.premium.cta'),
      highlighted: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" showSubtitle={true} />
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                {t('landing.nav.signIn')}
              </Link>
              <Link href="/auth/register">
                <Button>{t('landing.nav.getStarted')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('landing.hero.title')} 
              <span className="block min-h-[1.2em]">
                <TypingEffect 
                  phrases={gtdCatchphrases}
                  interval={2500}
                  typingSpeed={80}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500"
                  cursorColor="text-pink-500"
                />
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-3">
                  {t('landing.hero.startFree')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                {t('landing.hero.watchDemo')}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {t('landing.hero.noCreditCard')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={`inline-flex p-3 rounded-lg bg-gray-50 ${feature.color} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.benefits.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.benefits.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex p-4 rounded-full bg-blue-100 text-blue-600 mb-6">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-lg text-gray-600">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('landing.pricing.subtitle')}
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('landing.pricing.yearly')}
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  {t('landing.pricing.savePercent')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-sm border-2 p-8 relative ${
                  plan.highlighted ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('landing.pricing.mostPopular')}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    {plan.name === 'Premium' && billingCycle === 'yearly' ? (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{plan.yearlyPrice}</span>
                        <span className="text-gray-600 ml-1">{plan.yearlyPeriod}</span>
                        <div className="text-sm text-gray-500 mt-1">
                          ${(49.99 / 12).toFixed(2)} {t('landing.pricing.premium.monthlyWhenBilled')}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600 ml-1">{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/auth/register" className="block">
                  <Button 
                    className={`w-full ${
                      plan.highlighted ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            {t('landing.cta.subtitle')}
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-3">
              {t('landing.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-blue-200 text-sm mt-4">
            {t('landing.cta.guarantee')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo size="sm" showSubtitle={false} />
              <p className="text-gray-400">
                {t('landing.footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">{t('landing.footer.features')}</Link></li>
                <li><Link href="#" className="hover:text-white">{t('landing.footer.pricing')}</Link></li>
                <li><Link href="#" className="hover:text-white">{t('landing.footer.security')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">{t('landing.footer.about')}</Link></li>
                <li><Link href="#" className="hover:text-white">{t('landing.footer.blog')}</Link></li>
                <li><Link href="#" className="hover:text-white">{t('landing.footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer.support')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">{t('landing.footer.helpCenter')}</Link></li>
                <li><Link href="#" className="hover:text-white">{t('landing.footer.privacy')}</Link></li>
                <li><Link href="#" className="hover:text-white">{t('landing.footer.terms')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{t('landing.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 