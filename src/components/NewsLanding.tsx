import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, TrendingUp, Cpu, Globe, Moon, Sun } from 'lucide-react';

const NEWS_ITEMS = [
  {
    id: 1,
    title: "Breakthrough in Natural Language Processing Sets New Standard",
    category: "AI Research",
    date: "2h ago",
    excerpt: "Researchers have announced a new architecture that outperforms current transformer models while using 40% less compute.",
    icon: <Cpu className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Global Education Initiative Brings AI Tutors to 10M Students",
    category: "Education",
    date: "5h ago",
    excerpt: "A new coalition of tech giants and NGOs are rolling out personalized AI-driven learning assistants to schools worldwide.",
    icon: <BookOpen className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Quantum Computing Hardware Milestone Achieved",
    category: "Hardware",
    date: "8h ago",
    excerpt: "Stable qubits at room temperature could become a reality sooner than expected, according to a recent pre-print paper.",
    icon: <Globe className="w-5 h-5" />
  },
  {
    id: 4,
    title: "The Rise of Specialized Micro-Models in EdTech",
    category: "EdTech Trends",
    date: "12h ago",
    excerpt: "Why smaller, focus-driven models are defeating general LLMs in standardized testing and personalized tutoring.",
    icon: <TrendingUp className="w-5 h-5" />
  }
];

interface NewsLandingProps {
  onSecretTrigger: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function NewsLanding({ onSecretTrigger, isDarkMode, onToggleTheme }: NewsLandingProps) {
  const [clickCount, setClickCount] = useState(0);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [featuredItem, setFeaturedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/category/artificial-intelligence/feed/");
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          setFeaturedItem(data.items[0]);
          setNewsItems(data.items.slice(1, 7));
        } else {
          setFeaturedItem(NEWS_ITEMS[0]);
          setNewsItems(NEWS_ITEMS.slice(1));
        }
      } catch (e) {
        console.error("Failed to fetch news", e);
        // Fallback to static if it fails
        setFeaturedItem(NEWS_ITEMS[0]);
        setNewsItems(NEWS_ITEMS.slice(1));
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      onSecretTrigger();
      setClickCount(0); // reset
    }

    // Resetting click count if not clicked continuously
    setTimeout(() => {
      setClickCount((prev) => Math.max(0, prev - 1));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={handleTitleClick}
            className="flex items-center gap-2 group select-none active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              StudySync<span className="text-blue-600">Daily</span>
            </span>
          </button>

          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Latest</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">AI & Tech</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">EdTech</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Research</a>
          </nav>

          <button 
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            The Frontier of <span className="text-blue-600">Learning & Tech</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Curated daily updates on artificial intelligence breakthroughs, educational technology, and cognitive science research.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Article - spans 2 columns on lg */}
          {loading ? (
            <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ) : featuredItem && (
            <motion.a 
              href={featuredItem.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="block lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="h-64 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                {featuredItem.enclosure?.link && (
                  <img src={featuredItem.enclosure.link} alt={featuredItem.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className={`absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 ${featuredItem.enclosure?.link ? 'opacity-80' : 'opacity-90'} group-hover:scale-105 transition-transform duration-500`}></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-semibold uppercase tracking-wider mb-3 w-max">
                    Featured Report
                  </span>
                  <h2 className="text-3xl font-bold text-white leading-tight mb-2 line-clamp-2">
                    {featuredItem.title}
                  </h2>
                  <p className="text-blue-100 font-medium">Read the full analysis →</p>
                </div>
              </div>
            </motion.a>
          )}

          {/* Regular Articles */}
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-48 animate-pulse"></div>
            ))
          ) : newsItems.map((item: any, index) => (
            <motion.a 
              key={item.guid || item.id || index}
              href={item.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
              className="block bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm mb-4">
                <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                  {item.icon ? item.icon : <BookOpen className="w-5 h-5" />}
                  {item.category || item.categories?.[0] || 'Tech & AI'}
                </span>
                <span>{item.pubDate ? new Date(item.pubDate).toLocaleDateString() : item.date}</span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                {item.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 text-sm flex-grow line-clamp-3">
                {item.excerpt || item.description?.replace(/<[^>]*>?/gm, '')?.slice(0, 150) + '...'}
              </p>
            </motion.a>
          ))}
        </div>
        
        {/* Newsletter Signup (Fake) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-8 md:p-12 text-center border border-blue-100 dark:border-blue-800/50"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Stay in the loop
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Get our daily digest of the most important developments in educational technology and artificial intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto justify-center">
            <input 
              type="email" 
              placeholder="Email address" 
              className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
            />
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
              Subscribe
            </button>
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        <p>Â© {new Date().getFullYear()} StudySync Daily. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-60">Educational purposes only. Not affiliated with any university.</p>
      </footer>
    </div>
  );
}
