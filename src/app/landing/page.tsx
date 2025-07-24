'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TypingEffect } from '@/components/ui/typing-effect';
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

const gtdCatchphrases = [
  "2-Minute Rule",
  "Stress-Free Productivity", 
  "Mind Like Water",
  "Capture Everything",
  "Weekly Reviews",
  "Next Action Thinking",
  "Trusted System",
  "Clear Your Mind"
];

const features = [
  {
    icon: Inbox,
    title: 'Smart Inbox',
    description: 'Capture everything that has your attention in one trusted place. Never lose a thought or task again.',
    color: 'text-blue-500'
  },
  {
    icon: CheckSquare,
    title: 'Next Actions',
    description: 'Transform ideas into actionable tasks. Schedule, prioritize, and track your progress effortlessly.',
    color: 'text-green-500'
  },
  {
    icon: FolderOpen,
    title: 'Project Management',
    description: 'Break down complex goals into manageable steps. Track multi-step initiatives with ease.',
    color: 'text-purple-500'
  },
  {
    icon: Cloud,
    title: 'Maybe/Someday',
    description: 'Park future ideas safely. Review and activate them when the time is right.',
    color: 'text-yellow-500'
  },
  {
    icon: Calendar,
    title: 'Calendar Integration',
    description: 'Schedule actions and automatically send calendar invites. Your tasks, perfectly timed.',
    color: 'text-red-500'
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Access your tasks anywhere, anytime. Changes sync instantly across all your devices.',
    color: 'text-indigo-500'
  }
];

const benefits = [
  {
    icon: Brain,
    title: 'Clear Your Mind',
    description: 'Stop trying to remember everything. Let MyGTD be your external brain.'
  },
  {
    icon: Target,
    title: 'Focus on What Matters',
    description: 'See exactly what needs your attention right now. No more overwhelm.'
  },
  {
    icon: Workflow,
    title: 'Trusted System',
    description: 'Built on proven productivity principles. Stress-free productivity guaranteed.'
  }
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with GTD',
    features: [
      'Unlimited tasks in Inbox',
      'Basic Next Actions',
      'Simple project tracking',
      'Maybe/Someday lists',
      'Mobile access',
      'Email support'
    ],
    cta: 'Get Started Free',
    highlighted: false
  },
  {
    name: 'Premium',
    price: '$5.99',
    period: 'per month',
    yearlyPrice: '$49.99',
    yearlyPeriod: 'per year',
    description: 'For serious productivity enthusiasts',
    features: [
      'Everything in Free',
      'Calendar integration',
      'Automatic email invites',
      'Advanced scheduling',
      'Priority support',
      'Export & backup',
      'Custom contexts',
      'Analytics & insights'
    ],
    cta: 'Start Premium Trial',
    highlighted: true
  }
];

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MyGTD</h1>
              <span className="ml-2 text-sm text-gray-500">Getting Things Done</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/auth/register">
                <Button>Get Started Free</Button>
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
              Master the 
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
              Transform chaos into clarity with MyGTD. Built on proven productivity principles, 
              our app helps you capture, organize, and execute everything that has your attention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ✨ No credit card required • 🚀 Set up in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Stress-Free Productivity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              MyGTD implements every aspect of the proven productivity methodology, 
              giving you a complete system for managing your life and work stress-free.
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
              Why Choose MyGTD?
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who&apos;ve transformed their productivity with our proven system.
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
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start free, upgrade when you&apos;re ready for advanced features.
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
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Save 33%
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
                      Most Popular
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
                          ${(49.99 / 12).toFixed(2)} per month when billed annually
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
            Ready to Get Things Done?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of productive people who trust MyGTD to manage their life and work.
            Start your stress-free productivity journey today.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-3">
              Start Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MyGTD</h3>
              <p className="text-gray-400">
                The complete Getting Things Done system for stress-free productivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Features</Link></li>
                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                <li><Link href="#" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MyGTD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 