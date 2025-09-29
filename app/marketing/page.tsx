"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageSquare,
  TrendingUp,
  Brain,
  Menu,
  X,
  Twitter,
  Instagram,
  Youtube,
  ChevronDown,
  Check,
  Zap,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export default function MarketingPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [includeCommunity, setIncludeCommunity] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #090B12 0%, #171C2B 60%, #1B2240 100%)",
      }}
    >
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Social */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/pelican-logo.png"
                  alt="Pelican AI"
                  width={40}
                  height={40}
                  className="h-8 w-auto brightness-110 saturate-125 contrast-105 drop-shadow-md pelican-pulse"
                  style={{
                    filter: "hue-rotate(5deg) saturate(1.4) brightness(1.2) contrast(1.1)",
                  }}
                />
                <span className="text-xl font-bold text-white">PelicanAI</span>
              </div>

              {/* Social Media - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => window.open("https://twitter.com/pelicantrading", "_blank")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => window.open("https://instagram.com/pelicantrading", "_blank")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button
                  onClick={() => window.open("https://youtube.com/@pelicantrading", "_blank")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                FAQ
              </button>
            </nav>

            {/* User Area */}
            <div className="hidden md:flex items-center gap-3">
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with PelicanAI
                </Link>
              </Button>
              {!isLoading && !user && (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800 bg-transparent hover:text-white signin-button-custom"
                  >
                    <Link href="/auth/login" className="signin-button-custom">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                    <Link href="/auth/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
              <nav className="flex flex-col gap-4 mt-4">
                <button
                  onClick={() => {
                    scrollToSection("features")
                    setMobileMenuOpen(false)
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection("about")
                    setMobileMenuOpen(false)
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  About
                </button>
                <button
                  onClick={() => {
                    scrollToSection("pricing")
                    setMobileMenuOpen(false)
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  FAQ
                </button>
                <div className="flex flex-col gap-2 mt-4">
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat with PelicanAI
                    </Link>
                  </Button>
                  {!isLoading && !user && (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800 bg-transparent hover:text-white signin-button-custom"
                      >
                        <Link href="/auth/login" className="signin-button-custom">
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                        <Link href="/auth/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Logo Side */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <Image
                src="/pelican-logo.png"
                alt="Pelican AI"
                width={400}
                height={400}
                className="w-80 h-80 lg:w-96 lg:h-96 brightness-110 saturate-125 contrast-105 drop-shadow-2xl pelican-pulse"
                style={{
                  filter: "hue-rotate(5deg) saturate(1.4) brightness(1.2) contrast(1.1)",
                }}
              />
              {/* Radial gradient overlay */}
              <div
                className="absolute inset-0 -z-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at 60% 50%, rgba(128, 45, 247, 0.15) 0%, rgba(128, 45, 247, 0.05) 30%, transparent 55%)",
                }}
              />
            </div>
          </div>

          {/* Content Side */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
              AI-Powered Trading{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <h2 className="text-2xl lg:text-3xl font-semibold mb-8" style={{ color: "#DCE4F0" }}>
              Step Into the Cockpit. PelicanAI is Here
            </h2>
            <p className="text-lg lg:text-xl mb-8 leading-relaxed" style={{ color: "#B4BED0" }}>
              Meet Pelican Trading, your intelligent trading companion. This is trading's next evolution — not another
              alert service, but a tool built by traders, for traders. Ask it anything. Break down your strategy. Get
              feedback that actually makes you better. Pelican combines market context, trading psychology, and
              performance analysis into one powerful voice — yours. It's not hype. It's your edge, sharpened daily.
              Whether you're navigating macro chaos or chasing your next setup — Pelican is the co-pilot you've always
              needed.
            </p>
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full"
              onClick={() => scrollToSection("features")}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-16">
          <button
            onClick={() => scrollToSection("features")}
            className="text-gray-400 hover:text-white transition-colors animate-bounce"
          >
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      {/* Build with Pelican Section */}
      <section
        id="features"
        className="py-16 lg:py-24"
        style={{
          background: "linear-gradient(180deg, #0D1022 0%, #12182A 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
              Powerful Trading{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Features
              </span>
            </h2>
            <p className="text-xl lg:text-2xl" style={{ color: "#B4BED0" }}>
              Discover the comprehensive suite of tools designed to elevate your trading performance with intelligence,
              autonomy, and community.
            </p>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold mb-8 text-center" style={{ color: "#DCE4F0" }}>
              Core Features
            </h3>

            {/* AI Trading Assistant - Featured Card */}
            <div className="max-w-4xl mx-auto mb-12">
              <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300">
                <CardHeader className="p-8 lg:p-12">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl lg:text-3xl mb-4" style={{ color: "#DCE4F0" }}>
                        AI Trading Assistant
                      </CardTitle>
                      <CardDescription className="text-lg mb-6 leading-relaxed" style={{ color: "#B4BED0" }}>
                        Intelligent market analysis, personalized trading advice, and instant answers to your trading
                        questions 24/7 — powered by PelicanAI. Get market context, personalized coaching, and strategic
                        insights whenever you need them.
                      </CardDescription>
                      <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Link href="/">Launch Assistant</Link>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="font-semibold mb-2 text-purple-400">Market Context</h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          Real-time market analysis and insights
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="font-semibold mb-2 text-blue-400">Personalized Coaching</h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          Tailored advice for your trading style
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="font-semibold mb-2 text-green-400">24/7 Availability</h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          Always available when markets are moving
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold mb-8 text-center" style={{ color: "#DCE4F0" }}>
              Build with Pelican
            </h3>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Custom Strategies */}
              <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    Custom Strategies
                  </CardTitle>
                  <CardDescription className="text-base mb-6 leading-relaxed" style={{ color: "#B4BED0" }}>
                    Develop and test personalized trading strategies using historical market data and backtesting tools.
                  </CardDescription>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        Statistical Edge
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        Historical Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        Data-Driven Insights
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                  >
                    Build Strategy
                  </Button>
                </CardHeader>
              </Card>

              {/* Statistical Edge */}
              <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                <CardHeader className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    Statistical Edge
                  </CardTitle>
                  <CardDescription className="text-base mb-6 leading-relaxed" style={{ color: "#B4BED0" }}>
                    Analyze historical data to find trading opportunities and develop data-driven trading approaches.
                  </CardDescription>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        Historical Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        Edge Detection
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        Data-Driven Insights
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                  >
                    Analyze Data
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-8 text-center" style={{ color: "#DCE4F0" }}>
              Complete Trading Ecosystem
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* AI Trading Assistant */}
              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors col-span-1">
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    AI Trading Assistant
                  </CardTitle>
                  <CardDescription className="text-base mb-6" style={{ color: "#B4BED0" }}>
                    Your intelligent trading companion for market analysis, strategy development, and real-time
                    insights.
                  </CardDescription>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                    <Link href="/">Launch Assistant</Link>
                  </Button>
                </CardHeader>
              </Card>

              {/* 1-on-1 Coaching */}
              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors col-span-1">
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    1-on-1 Coaching
                  </CardTitle>
                  <CardDescription className="text-base mb-6" style={{ color: "#B4BED0" }}>
                    Personalized trading mentorship and guidance from experienced professionals.
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                  >
                    Start Coaching
                  </Button>
                </CardHeader>
              </Card>

              {/* Trading Community */}
              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    Trading Community
                  </CardTitle>
                  <CardDescription className="text-base mb-2" style={{ color: "#B4BED0" }}>
                    Join our exclusive trading community powered by TradingAnalytix partnership.
                  </CardDescription>
                  <CardDescription className="text-sm mb-6 text-purple-400">
                    TradingAnalytix Partnership
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                    onClick={() => window.open("https://discord.gg/Sv6gjaymb2", "_blank")}
                  >
                    Join Community
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-16 lg:py-24"
        style={{
          background: "linear-gradient(180deg, #12182A 0%, #1B2240 50%, #0D1022 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
                About{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Pelican Trading
                </span>
              </h2>
              <p className="text-xl lg:text-2xl font-semibold" style={{ color: "#B4BED0" }}>
                From Obsession to Institution-Grade AI
              </p>
            </div>

            {/* Story Content */}
            <div className="space-y-12">
              {/* Origin Story */}
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 rounded-2xl p-8 border border-gray-700/50">
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  Pelican Trading wasn't built in a lab or spun up by a venture fund. It was built by traders — people
                  who live this game every day, who know the grind of wins, losses, and the constant battle with
                  psychology.
                </p>
                <p className="text-lg leading-relaxed" style={{ color: "#B4BED0" }}>
                  Eight years ago, the founder of Pelican,{" "}
                  <span className="text-purple-400 font-semibold">Nick Groves</span>, walked away from the traditional
                  path to go all-in on the markets. No degree, no safety net, no inside edge — just curiosity,
                  obsession, and a Wi-Fi connection. What began as reverse-engineering strategies and journaling every
                  mistake has now evolved into an AI platform unlike anything else in the market.
                </p>
              </div>

              {/* Built Brick by Brick */}
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
                    Built Brick by Brick
                  </h3>
                  <p className="text-lg leading-relaxed mb-4" style={{ color: "#B4BED0" }}>
                    Pelican didn't come from a corporate playbook. It was coded, broken, and rebuilt from scratch by
                    traders turned devs who knew exactly what was missing.
                  </p>
                  <p className="text-lg leading-relaxed mb-4" style={{ color: "#B4BED0" }}>
                    Every feature — from the AI brain to live market modules, from journaling to psychology triggers —
                    was handcrafted with one purpose: to make traders sharper in real time.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <Image
                      src="/pelican-logo.png"
                      alt="Pelican AI"
                      width={200}
                      height={200}
                      className="w-48 h-48 brightness-110 saturate-125 contrast-105 drop-shadow-xl"
                      style={{
                        filter: "hue-rotate(5deg) saturate(1.4) brightness(1.2) contrast(1.1)",
                      }}
                    />
                    <div
                      className="absolute inset-0 -z-10 rounded-full"
                      style={{
                        background:
                          "radial-gradient(ellipse at 50% 50%, rgba(128, 45, 247, 0.2) 0%, rgba(128, 45, 247, 0.1) 40%, transparent 70%)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Ray Campbell Section */}
              <div className="bg-gradient-to-l from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/20">
                <h3 className="text-2xl lg:text-3xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
                  Forged by the Architect of Modern Markets
                </h3>
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  Pelican isn't just trader-made anymore. Today, the team includes{" "}
                  <span className="text-purple-400 font-semibold">Ray Campbell</span> — one of the original architects
                  behind the New York Stock Exchange's electronic platform.
                </p>
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  Ray helped build the ultra-low latency, high-throughput systems that power billions of dollars in
                  trades daily — the very backbone of modern markets. Now, he's bringing that same institutional-grade
                  engineering to Pelican.
                </p>
                <blockquote className="border-l-4 border-purple-500 pl-6 italic text-lg" style={{ color: "#DCE4F0" }}>
                  "For years, I built tools that gave an edge to Wall Street. Pelican is about giving that power back to
                  the people — tools with the same precision, speed, and reliability, but accessible to every trader."
                  <footer className="text-purple-400 font-semibold mt-2">— Ray Campbell</footer>
                </blockquote>
              </div>

              {/* Mission */}
              <div className="text-center">
                <h3 className="text-2xl lg:text-3xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
                  Our Mission
                </h3>
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  Most trading services drown you in noise and false realities. Pelican's mission is to cut through it.
                  We're building the first AI assistant that trades the way traders actually trade — combining data,
                  discipline, and psychology in one place, while adapting to each trader's journey.
                </p>
                <p className="text-lg leading-relaxed mb-8" style={{ color: "#B4BED0" }}>
                  By fusing Wall Street-grade engineering with real trading experience, Pelican bridges the gap between
                  retail and institutional markets once and for all. Every trader deserves access to the same
                  intelligence, speed, and resilience that power the world's largest exchanges.
                </p>
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
                  <p className="text-xl font-semibold mb-4" style={{ color: "#DCE4F0" }}>
                    Pelican isn't just another tool — it's the future of how humans and AI trade together.
                  </p>
                  <Button
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full"
                    asChild
                  >
                    <Link href="/auth/signup">Create an Account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-16 lg:py-24"
        style={{
          background: "linear-gradient(180deg, #0D1022 0%, #12182A 50%, #1B2240 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
              Choose Your Trading{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Edge</span>
            </h2>
            <p className="text-xl lg:text-2xl" style={{ color: "#B4BED0" }}>
              Unlock advanced AI-powered trading insights and join thousands of successful traders using PelicanAI
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Free Plan */}
              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 relative">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: "#DCE4F0" }}>
                      Free
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold" style={{ color: "#DCE4F0" }}>
                        $0
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#B4BED0" }}>
                      Get started with basic PelicanAI features
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>10 AI conversations per day</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Basic market analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Email support</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                    disabled
                  >
                    Current Plan
                  </Button>
                </CardHeader>
              </Card>

              {/* Pro Plan */}
              <Card className="bg-gray-900/50 border-purple-500/50 hover:border-purple-400 transition-all duration-300 relative">
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>

                <CardHeader className="p-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: "#DCE4F0" }}>
                      PelicanAI Pro
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold" style={{ color: "#DCE4F0" }}>
                        $49.99
                      </span>
                      <span className="text-lg" style={{ color: "#B4BED0" }}>
                        /month
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#B4BED0" }}>
                      Unlock the full power of PelicanAI
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Unlimited AI conversations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Advanced technical analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Real-time market alerts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Priority support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Trading strategy backtesting</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>Portfolio optimization tools</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>1-on-1 coaching session credits</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span style={{ color: "#B4BED0" }}>🏆 Optional access to the TradingAnalytix community </span>
                        <span className="text-yellow-400 font-medium">($10/month)</span>
                      </div>
                    </div>
                  </div>

                  {/* Community Add-on Toggle */}
                  <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold" style={{ color: "#DCE4F0" }}>
                          Add TradingAnalytix Community Access
                        </h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          {includeCommunity ? "Yes, include for $10/month" : "Optional add-on"}
                        </p>
                      </div>
                      <button
                        onClick={() => setIncludeCommunity(!includeCommunity)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          includeCommunity ? "bg-purple-600" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            includeCommunity ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: "#B4BED0" }}>
                      Optional add-on includes chatroom, live shows, and more
                    </p>
                  </div>

                  <Button className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                    Start Premium
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-16 lg:py-24"
        style={{
          background: "linear-gradient(180deg, #1B2240 0%, #12182A 50%, #0D1022 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-xl lg:text-2xl" style={{ color: "#B4BED0" }}>
              Get answers to common questions about PelicanAI and our trading platform.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* What is PelicanAI? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    What is PelicanAI?
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    PelicanAI is an AI-powered trading assistant that provides real-time market analysis, trading
                    strategies, and personalized coaching. Built by professional traders for traders of all levels.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* How much does it cost? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    How much does it cost?
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    We offer a free plan with up to 10 messages per day, and PelicanAI Pro at $49.99/month for unlimited
                    access, premium features, and priority support.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* What markets does PelicanAI cover? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    What markets does PelicanAI cover?
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    PelicanAI provides analysis for stocks, ETFs, futures, forex, and cryptocurrencies.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Is my data secure? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    Is my data secure?
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    Yes, we use enterprise-grade security with encrypted data transmission and storage. We never store
                    your trading account credentials or execute trades without your permission.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Can I get personal coaching? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    Can I get personal coaching?
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    Yes! We offer 1-on-1 coaching sessions with Nick Groves and access to the TradingAnalytix community
                    for personalized guidance and strategy development.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* How do I get started? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    How do I get started?
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    Simply click "Chat with PelicanAI" to start using our AI assistant for free. You can upgrade to Pro
                    anytime for full access to all features and tools.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-black/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/pelican-logo.png"
                alt="Pelican AI"
                width={32}
                height={32}
                className="rounded-lg object-contain brightness-110 saturate-125"
              />
              <span className="text-gray-400">© 2024 Pelican AI. All rights reserved.</span>
            </div>
            <p className="text-sm text-gray-500">Built by Nick Groves</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pelican-pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.05); 
          }
        }
        .pelican-pulse {
          animation: pelican-pulse 2s infinite ease-in-out;
        }
        .pelican-pulse:hover {
          animation-duration: 1s;
          transform: scale(1.1);
          filter: brightness(1.2) saturate(1.3) hue-rotate(5deg) saturate(1.4) brightness(1.2) contrast(1.1) !important;
        }
        .signin-button-custom {
          /* Custom styles for Sign In button */
        }
      `}</style>
    </div>
  )
}
