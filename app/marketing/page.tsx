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
import type { User } from "@supabase/supabase-js"
import { LanguageSelector } from "@/components/language-selector"
import { useT } from "@/lib/providers/translation-provider"

export default function MarketingPage() {
  const t = useT()
  const [user, setUser] = useState<User | null>(null)
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
                  alt={t.common.appName}
                  width={40}
                  height={40}
                  className="h-8 w-auto brightness-110 saturate-125 contrast-105 drop-shadow-md pelican-pulse"
                  style={{
                    filter: "hue-rotate(5deg) saturate(1.4) brightness(1.2) contrast(1.1)",
                  }}
                />
                <span className="text-xl font-bold text-white">{t.common.appName}</span>
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
                {t.marketing.features}
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {t.marketing.about}
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {t.marketing.pricing}
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {t.marketing.faq}
              </button>
            </nav>

            {/* User Area */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSelector />
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t.marketing.chatWithPelicanAI}
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
                      {t.marketing.signIn}
                    </Link>
                  </Button>
                  <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                    <Link href="/auth/signup">{t.marketing.getStarted}</Link>
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
                  {t.marketing.features}
                </button>
                <button
                  onClick={() => {
                    scrollToSection("about")
                    setMobileMenuOpen(false)
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  {t.marketing.about}
                </button>
                <button
                  onClick={() => {
                    scrollToSection("pricing")
                    setMobileMenuOpen(false)
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  {t.marketing.pricing}
                </button>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="text-gray-300 hover:text-white transition-colors text-left"
                >
                  {t.marketing.faq}
                </button>
                <div className="flex items-center gap-2 mt-4 pb-2 border-b border-gray-800">
                  <LanguageSelector />
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t.marketing.chatWithPelicanAI}
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
                          {t.marketing.signIn}
                        </Link>
                      </Button>
                      <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                        <Link href="/auth/signup">{t.marketing.getStarted}</Link>
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
                alt={t.common.appName}
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
              {t.marketing.heroTitle}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                {t.marketing.heroTitleHighlight}
              </span>
            </h1>
            <h2 className="text-2xl lg:text-3xl font-semibold mb-8" style={{ color: "#DCE4F0" }}>
              {t.marketing.heroSubtitle}
            </h2>
            <p className="text-lg lg:text-xl mb-8 leading-relaxed" style={{ color: "#B4BED0" }}>
              {t.marketing.heroDescription}
            </p>
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full"
              onClick={() => scrollToSection("features")}
            >
              {t.marketing.learnMore}
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
              {t.marketing.powerfulTradingFeatures}{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                {t.marketing.featuresHighlight}
              </span>
            </h2>
            <p className="text-xl lg:text-2xl" style={{ color: "#B4BED0" }}>
              {t.marketing.discoverSuite}
            </p>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl lg:text-3xl font-bold mb-8 text-center" style={{ color: "#DCE4F0" }}>
              {t.marketing.coreFeatures}
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
                        {t.marketing.aiTradingAssistant}
                      </CardTitle>
                      <CardDescription className="text-lg mb-6 leading-relaxed" style={{ color: "#B4BED0" }}>
                        {t.marketing.aiTradingAssistantDesc}
                      </CardDescription>
                      <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Link href="/">{t.marketing.launchAssistant}</Link>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="font-semibold mb-2 text-purple-400">{t.marketing.marketContext}</h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          {t.marketing.marketContextDesc}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="font-semibold mb-2 text-blue-400">{t.marketing.personalizedCoaching}</h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          {t.marketing.personalizedCoachingDesc}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h4 className="font-semibold mb-2 text-green-400">{t.marketing.availability24}</h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          {t.marketing.availability24Desc}
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
              {t.marketing.buildWithPelican}
            </h3>

            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Custom Strategies */}
              <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <CardHeader className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.customStrategies}
                  </CardTitle>
                  <CardDescription className="text-base mb-6 leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.customStrategiesDesc}
                  </CardDescription>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        {t.marketing.statisticalEdge}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        {t.marketing.historicalAnalysis}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        {t.marketing.dataDrivenInsights}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                  >
                    {t.marketing.buildStrategy}
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
                    {t.marketing.statisticalEdge}
                  </CardTitle>
                  <CardDescription className="text-base mb-6 leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.statisticalEdgeDesc}
                  </CardDescription>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        {t.marketing.historicalAnalysis}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        {t.marketing.edgeDetection}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span className="text-sm" style={{ color: "#B4BED0" }}>
                        {t.marketing.dataDrivenInsights}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                  >
                    {t.marketing.analyzeData}
                  </Button>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-8 text-center" style={{ color: "#DCE4F0" }}>
              {t.marketing.completeEcosystem}
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* AI Trading Assistant */}
              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors col-span-1">
                <CardHeader className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.aiTradingAssistant}
                  </CardTitle>
                  <CardDescription className="text-base mb-6" style={{ color: "#B4BED0" }}>
                    {t.marketing.aiTradingAssistantCardDesc}
                  </CardDescription>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                    <Link href="/">{t.marketing.launchAssistant}</Link>
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
                    {t.marketing.oneOnOneCoaching}
                  </CardTitle>
                  <CardDescription className="text-base mb-6" style={{ color: "#B4BED0" }}>
                    {t.marketing.oneOnOneCoachingDesc}
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                  >
                    {t.marketing.startCoaching}
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
                    {t.marketing.tradingCommunity}
                  </CardTitle>
                  <CardDescription className="text-base mb-2" style={{ color: "#B4BED0" }}>
                    {t.marketing.tradingCommunityDesc}
                  </CardDescription>
                  <CardDescription className="text-sm mb-6 text-purple-400">
                    {t.marketing.tradingAnalytixPartnership}
                  </CardDescription>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full bg-transparent"
                    onClick={() => window.open("https://discord.gg/Sv6gjaymb2", "_blank")}
                  >
                    {t.marketing.joinCommunity}
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
                {t.marketing.aboutPelicanTrading.split(" ")[0]}{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {t.marketing.aboutPelicanTrading.split(" ").slice(1).join(" ")}
                </span>
              </h2>
              <p className="text-xl lg:text-2xl font-semibold" style={{ color: "#B4BED0" }}>
                {t.marketing.fromObsessionToInstitution}
              </p>
            </div>

            {/* Story Content */}
            <div className="space-y-12">
              {/* Origin Story */}
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 rounded-2xl p-8 border border-gray-700/50">
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  {t.marketing.aboutStory1}
                </p>
                <p className="text-lg leading-relaxed" style={{ color: "#B4BED0" }}>
                  {t.marketing.aboutStory2}
                </p>
              </div>

              {/* Built Brick by Brick */}
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
                    {t.marketing.builtBrickByBrick}
                  </h3>
                  <p className="text-lg leading-relaxed mb-4" style={{ color: "#B4BED0" }}>
                    {t.marketing.builtBrickByBrickDesc1}
                  </p>
                  <p className="text-lg leading-relaxed mb-4" style={{ color: "#B4BED0" }}>
                    {t.marketing.builtBrickByBrickDesc2}
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
                  {t.marketing.forgedByArchitect}
                </h3>
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  {t.marketing.forgedByArchitectDesc1}
                </p>
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  {t.marketing.forgedByArchitectDesc2}
                </p>
                <blockquote className="border-l-4 border-purple-500 pl-6 italic text-lg" style={{ color: "#DCE4F0" }}>
                  &quot;{t.marketing.rayCampbellQuote}&quot;
                  <footer className="text-purple-400 font-semibold mt-2">— Ray Campbell</footer>
                </blockquote>
              </div>

              {/* Mission */}
              <div className="text-center">
                <h3 className="text-2xl lg:text-3xl font-bold mb-6" style={{ color: "#DCE4F0" }}>
                  {t.marketing.ourMission}
                </h3>
                <p className="text-lg leading-relaxed mb-6" style={{ color: "#B4BED0" }}>
                  {t.marketing.ourMissionDesc1}
                </p>
                <p className="text-lg leading-relaxed mb-8" style={{ color: "#B4BED0" }}>
                  {t.marketing.ourMissionDesc2}
                </p>
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
                  <p className="text-xl font-semibold mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.ourMissionTagline}
                  </p>
                  <Button
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full"
                    asChild
                  >
                    <Link href="/auth/signup">{t.marketing.createAccount}</Link>
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
              {t.marketing.chooseYourTradingEdge}
            </h2>
            <p className="text-xl lg:text-2xl" style={{ color: "#B4BED0" }}>
              {t.marketing.unlockAdvanced}
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
                      {t.marketing.freePlan}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold" style={{ color: "#DCE4F0" }}>
                        $0
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#B4BED0" }}>
                      {t.marketing.freePlanDesc}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.freePlanFeature1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.freePlanFeature2}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.freePlanFeature3}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                    disabled
                  >
                    {t.marketing.currentPlan}
                  </Button>
                </CardHeader>
              </Card>

              {/* Pro Plan */}
              <Card className="bg-gray-900/50 border-purple-500/50 hover:border-purple-400 transition-all duration-300 relative">
                {/* Most Popular Badge */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    {t.marketing.mostPopular}
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
                      {t.marketing.pelicanAIPro}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold" style={{ color: "#DCE4F0" }}>
                        {t.marketing.pelicanAIProPrice.split("/")[0]}
                      </span>
                      <span className="text-lg" style={{ color: "#B4BED0" }}>
                        {t.marketing.pelicanAIProPrice.includes("/") ? "/" + t.marketing.pelicanAIProPrice.split("/")[1] : ""}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "#B4BED0" }}>
                      {t.marketing.pelicanAIProDesc}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature2}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature3}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature4}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature5}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature6}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature7}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span style={{ color: "#B4BED0" }}>{t.marketing.proFeature8}</span>
                      </div>
                    </div>
                  </div>

                  {/* Community Add-on Toggle */}
                  <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold" style={{ color: "#DCE4F0" }}>
                          {t.marketing.addTradingAnalytix}
                        </h4>
                        <p className="text-sm" style={{ color: "#B4BED0" }}>
                          {includeCommunity ? "Yes, include for $10/month" : t.marketing.optionalAddOn}
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
                      {t.marketing.optionalAddOnDesc}
                    </p>
                  </div>

                  <Button className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                    {t.marketing.startPremium}
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
              {t.marketing.frequentlyAskedQuestions}
            </h2>
            <p className="text-xl lg:text-2xl" style={{ color: "#B4BED0" }}>
              {t.marketing.faqSubtitle}
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* What is PelicanAI? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.faqQ1}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.faqA1}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* How much does it cost? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.faqQ2}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.faqA2}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* What markets does PelicanAI cover? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.faqQ3}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.faqA3}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Is my data secure? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.faqQ4}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.faqA4}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Can I get personal coaching? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.faqQ5}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.faqA5}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* How do I get started? */}
              <Card className="bg-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl mb-4" style={{ color: "#DCE4F0" }}>
                    {t.marketing.faqQ6}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed" style={{ color: "#B4BED0" }}>
                    {t.marketing.faqA6}
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
