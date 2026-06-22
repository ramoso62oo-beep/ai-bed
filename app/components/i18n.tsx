"use client";
import { createContext, useContext, useEffect, useState } from "react";

export const LANGS: [string,string][] = [
  ["fr","🇫🇷 Français"],["en","🇬🇧 English"],["es","🇪🇸 Español"],["de","🇩🇪 Deutsch"],
  ["it","🇮🇹 Italiano"],["pt","🇵🇹 Português"],["ar","🇸🇦 العربية"],["zh","🇨🇳 中文"],
  ["ru","🇷🇺 Русский"],["ja","🇯🇵 日本語"],["nl","🇳🇱 Nederlands"],["hi","🇮🇳 हिन्दी"],
];

type Dict = Record<string,string>;
const DICT: Record<string, Dict> = {
  fr: { dashboard:"Dashboard", mybots:"Mes bots", market:"Marché", connections:"Connexions", positions:"Positions", whales:"Whale Tracker", signals:"Signaux IA", account:"Compte", wallet:"Portefeuille", news:"Actualités", contact:"Contact", settings:"Paramètres", logout:"Déconnexion", language:"Langue", active:"ACTIF", pause:"PAUSE" },
  en: { dashboard:"Dashboard", mybots:"My bots", market:"Market", connections:"Connections", positions:"Positions", whales:"Whale Tracker", signals:"AI Signals", account:"Account", wallet:"Wallet", news:"News", contact:"Contact", settings:"Settings", logout:"Log out", language:"Language", active:"ACTIVE", pause:"PAUSED" },
  es: { dashboard:"Panel", mybots:"Mis bots", market:"Mercado", connections:"Conexiones", positions:"Posiciones", whales:"Rastreador Whale", signals:"Señales IA", account:"Cuenta", wallet:"Cartera", news:"Noticias", contact:"Contacto", settings:"Ajustes", logout:"Salir", language:"Idioma", active:"ACTIVO", pause:"PAUSA" },
  de: { dashboard:"Dashboard", mybots:"Meine Bots", market:"Markt", connections:"Verbindungen", positions:"Positionen", whales:"Whale-Tracker", signals:"KI-Signale", account:"Konto", wallet:"Wallet", news:"Nachrichten", contact:"Kontakt", settings:"Einstellungen", logout:"Abmelden", language:"Sprache", active:"AKTIV", pause:"PAUSE" },
  it: { dashboard:"Dashboard", mybots:"I miei bot", market:"Mercato", connections:"Connessioni", positions:"Posizioni", whales:"Whale Tracker", signals:"Segnali IA", account:"Account", wallet:"Portafoglio", news:"Notizie", contact:"Contatto", settings:"Impostazioni", logout:"Esci", language:"Lingua", active:"ATTIVO", pause:"PAUSA" },
  pt: { dashboard:"Painel", mybots:"Meus bots", market:"Mercado", connections:"Conexões", positions:"Posições", whales:"Whale Tracker", signals:"Sinais IA", account:"Conta", wallet:"Carteira", news:"Notícias", contact:"Contato", settings:"Definições", logout:"Sair", language:"Idioma", active:"ATIVO", pause:"PAUSA" },
  ar: { dashboard:"لوحة التحكم", mybots:"روبوتاتي", market:"السوق", connections:"الاتصالات", positions:"المراكز", whales:"متعقب الحيتان", signals:"إشارات الذكاء", account:"الحساب", wallet:"المحفظة", news:"الأخبار", contact:"اتصل", settings:"الإعدادات", logout:"خروج", language:"اللغة", active:"نشط", pause:"إيقاف" },
  zh: { dashboard:"仪表板", mybots:"我的机器人", market:"市场", connections:"连接", positions:"持仓", whales:"鲸鱼追踪", signals:"AI信号", account:"账户", wallet:"钱包", news:"新闻", contact:"联系", settings:"设置", logout:"登出", language:"语言", active:"运行中", pause:"暂停" },
  ru: { dashboard:"Панель", mybots:"Мои боты", market:"Рынок", connections:"Подключения", positions:"Позиции", whales:"Трекер китов", signals:"ИИ-сигналы", account:"Аккаунт", wallet:"Кошелёк", news:"Новости", contact:"Контакт", settings:"Настройки", logout:"Выйти", language:"Язык", active:"АКТИВЕН", pause:"ПАУЗА" },
  ja: { dashboard:"ダッシュボード", mybots:"マイボット", market:"マーケット", connections:"接続", positions:"ポジション", whales:"クジラ追跡", signals:"AIシグナル", account:"アカウント", wallet:"ウォレット", news:"ニュース", contact:"お問い合わせ", settings:"設定", logout:"ログアウト", language:"言語", active:"稼働中", pause:"停止" },
  nl: { dashboard:"Dashboard", mybots:"Mijn bots", market:"Markt", connections:"Verbindingen", positions:"Posities", whales:"Whale Tracker", signals:"AI-signalen", account:"Account", wallet:"Portemonnee", news:"Nieuws", contact:"Contact", settings:"Instellingen", logout:"Uitloggen", language:"Taal", active:"ACTIEF", pause:"PAUZE" },
  hi: { dashboard:"डैशबोर्ड", mybots:"मेरे बॉट", market:"बाज़ार", connections:"कनेक्शन", positions:"पोज़िशन", whales:"व्हेल ट्रैकर", signals:"AI संकेत", account:"खाता", wallet:"वॉलेट", news:"समाचार", contact:"संपर्क", settings:"सेटिंग्स", logout:"लॉग आउट", language:"भाषा", active:"सक्रिय", pause:"रुका" },
};

type Ctx = { lang:string; setLang:(l:string)=>void; t:(k:string)=>string };
const LangContext = createContext<Ctx>({ lang:"fr", setLang:()=>{}, t:(k)=>k });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState("fr");
  useEffect(()=>{ const l=localStorage.getItem("aibed_lang"); if(l && DICT[l]) setLangState(l); },[]);
  function setLang(l:string){ setLangState(l); localStorage.setItem("aibed_lang", l); document.documentElement.dir = l==="ar" ? "rtl" : "ltr"; }
  const t = (k:string) => (DICT[lang]?.[k]) ?? DICT.fr[k] ?? k;
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useT(){ return useContext(LangContext); }

export function LanguageSwitcher({ compact=false }: { compact?:boolean }) {
  const { lang, setLang } = useT();
  return (
    <select value={lang} onChange={e=>setLang(e.target.value)}
      style={{ background:"rgba(4,7,26,0.85)", border:"1px solid rgba(74,111,165,0.3)", color:"white", fontSize:compact?".6rem":".72rem", padding:compact?"3px 6px":"7px 10px", borderRadius:6, outline:"none", cursor:"pointer" }}>
      {LANGS.map(([code,label])=><option key={code} value={code}>{label}</option>)}
    </select>
  );
}
