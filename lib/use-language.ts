"use client"

import { useState, useEffect } from 'react'

export type Locale = 'en' | 'es' | 'zh' | 'ja' | 'pt'

const translations = {
  en: {
    newChat: 'New chat',
    search: 'Search conversations...',
    messagePlaceholder: 'Message Pelican...',
    welcomeTitle: 'Welcome to PelicanAI',
    welcomeSubtitle: 'How can I help you trade today?',
    marketsOpen: 'Markets Open',
    marketsClosed: 'Markets Closed',
    marketOverview: 'Market Overview',
  },
  es: {
    newChat: 'Nuevo chat',
    search: 'Buscar conversaciones...',
    messagePlaceholder: 'Mensaje a Pelican...',
    welcomeTitle: 'Bienvenido a PelicanAI',
    welcomeSubtitle: '¿Cómo puedo ayudarte a operar hoy?',
    marketsOpen: 'Mercados Abiertos',
    marketsClosed: 'Mercados Cerrados',
    marketOverview: 'Resumen del Mercado',
  },
  zh: {
    newChat: '新对话',
    search: '搜索对话...',
    messagePlaceholder: '给 Pelican 发消息...',
    welcomeTitle: '欢迎使用 PelicanAI',
    welcomeSubtitle: '今天我能如何帮助您交易？',
    marketsOpen: '市场开盘',
    marketsClosed: '市场休市',
    marketOverview: '市场概览',
  },
  ja: {
    newChat: '新しいチャット',
    search: '会話を検索...',
    messagePlaceholder: 'Pelicanにメッセージを送る...',
    welcomeTitle: 'PelicanAIへようこそ',
    welcomeSubtitle: '今日の取引をどのようにお手伝いできますか？',
    marketsOpen: '市場オープン',
    marketsClosed: '市場クローズ',
    marketOverview: 'マーケット概要',
  },
  pt: {
    newChat: 'Novo chat',
    search: 'Pesquisar conversas...',
    messagePlaceholder: 'Mensagem para Pelican...',
    welcomeTitle: 'Bem-vindo ao PelicanAI',
    welcomeSubtitle: 'Como posso ajudá-lo a negociar hoje?',
    marketsOpen: 'Mercados Abertos',
    marketsClosed: 'Mercados Fechados',
    marketOverview: 'Visão Geral do Mercado',
  },
}

export function useLanguage() {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('pelican_language') as Locale
    if (stored && translations[stored]) {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('pelican_language', newLocale)
  }

  const t = translations[locale]

  return { locale, setLocale, t }
}

