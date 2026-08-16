import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Moon, Book, Check, X, Calendar as CalendarIcon, Info } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, collection } from 'firebase/firestore';

// --- Firebase Initialization ---
// The configuration is provided by the canvas environment
const firebaseConfig = {
  apiKey: "AIzaSyDWYO7WRrjFD5IoDUGm91Fih3KE3bHRWa8",
  authDomain: "our-calendar-d7b34.firebaseapp.com",
  databaseURL: "https://our-calendar-d7b34-default-rtdb.firebaseio.com",
  projectId: "our-calendar-d7b34",
  storageBucket: "our-calendar-d7b34.firebasestorage.app",
  messagingSenderId: "76090950691",
  appId: "1:76090950691:web:ac2099a052e4408a43dd96"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- صورتک‌های اختصاصی طراحی شده ---
const FaceGood = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const FaceBad = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M16 15s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const FaceSad = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M7 8a2 2 0 0 0 4 0"/><path d="M13 8a2 2 0 0 0 4 0"/>
  </svg>
);
const FaceAngry = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><path d="M7 8l3 2"/><path d="M17 8l-3 2"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/>
  </svg>
);
const FaceBored = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const FaceHopeless = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="15" rx="1.5" ry="2"/><line x1="7" y1="9" x2="11" y2="9"/><line x1="13" y1="9" x2="17" y2="9"/>
  </svg>
);

// --- Jalali Calendar Utilities ---
// Standard algorithms for converting between Gregorian and Jalali dates
function g2j(gy, gm, gd) {
  let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) + parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * parseInt(days / 12053);
  days %= 12053;
  jy += 4 * parseInt(days / 1461);
  days %= 1461;
  if (days > 365) { jy += parseInt((days - 1) / 365); days = (days - 1) % 365; }
  let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

function j2g(jy, jm, jd) {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + parseInt(jy / 33) * 8 + parseInt((jy % 33 + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30 + 186));
  gy += 400 * parseInt(days / 146097);
  days %= 146097;
  if (days > 36524) { gy += 100 * parseInt(--days / 36524); days %= 36524; if (days >= 365) days++; }
  gy += 4 * parseInt(days / 1461);
  days %= 1461;
  if (days > 365) { gy += parseInt((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  let leap = ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 1 : 0;
  let g_d_m = [0, 31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && gd > g_d_m[gm]) { gd -= g_d_m[gm]; gm++; }
  return [gy, gm, gd];
}

const persianMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// مناسبت‌های ثابت تقویم شمسی
const solarEvents = {
  "1-1": [{ title: "عید نوروز", isHoliday: true }],
  "1-2": [{ title: "عید نوروز", isHoliday: true }],
  "1-3": [{ title: "عید نوروز", isHoliday: true }],
  "1-4": [{ title: "عید نوروز", isHoliday: true }],
  "1-12": [{ title: "روز جمهوری اسلامی", isHoliday: true }],
  "1-13": [{ title: "روز طبیعت (سیزده به در)", isHoliday: true }],
  "3-14": [{ title: "رحلت امام خمینی", isHoliday: true }],
  "3-15": [{ title: "قیام ۱۵ خرداد", isHoliday: true }],
  "9-30": [{ title: "شب یلدا", isHoliday: false }],
  "11-22": [{ title: "پیروزی انقلاب اسلامی", isHoliday: true }],
  "12-15": [{ title: "روز درختکاری", isHoliday: false }],
  "12-29": [{ title: "روز ملی شدن صنعت نفت", isHoliday: true }],
};

// استیکرهای اختصاصی (طراحی فلت و یکپارچه به جای ایموجی گوشی)
const MOOD_ICONS = {
  'good': { icon: FaceGood, color: 'text-green-500', label: 'حال خوب' },
  'bad': { icon: FaceBad, color: 'text-orange-500', label: 'حال بد' },
  'sad': { icon: FaceSad, color: 'text-slate-500', label: 'غمگین' },
  'angry': { icon: FaceAngry, color: 'text-red-600', label: 'عصبی' },
  'bored': { icon: FaceBored, color: 'text-amber-500', label: 'بی‌حوصله' },
  'hopeless': { icon: FaceHopeless, color: 'text-zinc-600', label: 'ناامید' },
};

// Helper to get number of days in a Jalali month
const getDaysInJalaliMonth = (year, month) => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
  return isLeap ? 30 : 29;
};

// Helper to get the day of the week for the 1st of the month (0 = Shanbeh, 6 = Jomeh)
const getFirstDayOfWeek = (year, month) => {
  const [gy, gm, gd] = j2g(year, month, 1);
  const date = new Date(gy, gm - 1, gd);
  return (date.getDay() + 1) % 7; 
};

export default function App() {
  const [todayDate, setTodayDate] = useState([]);
  const [viewYear, setViewYear] = useState(1403);
  const [viewMonth, setViewMonth] = useState(1);
  
  const [entries, setEntries] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentNote, setCurrentNote] = useState('');
  const [currentMood, setCurrentMood] = useState(null);
  
  const [showNightReminder, setShowNightReminder] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // Authentication Setup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsSyncing(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize today's date and check for night reminder
  useEffect(() => {
    const today = new Date();
    const [jy, jm, jd] = g2j(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    setTodayDate([jy, jm, jd]);
    setViewYear(jy);
    setViewMonth(jm);
    
    const currentHour = today.getHours();
    if (currentHour >= 20 || currentHour < 4) {
      setShowNightReminder(true);
    }
  }, []);

  // Fetch and sync entries from Firestore
  useEffect(() => {
    if (!user) return;
    setIsSyncing(true);
    
    // We use a shared 'public' collection but with a specific document name for you and your partner
    // For a real app, you'd use a unique shared ID, here we use 'shared-calendar' for simplicity in this demo.
    // NOTE: In the Canvas environment we MUST use this specific path structure.
    const calendarRef = doc(db, 'artifacts', appId, 'public', 'data', 'calendars', 'shared-calendar-1');
    
    const unsubscribe = onSnapshot(calendarRef, (snapshot) => {
      if (snapshot.exists()) {
        setEntries(snapshot.data().entries || {});
      }
      setIsSyncing(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const openEditor = (year, month, day) => {
    setSelectedDate({ year, month, day });
    const dateKey = `${year}-${month}-${day}`;
    const entry = entries[dateKey] || {};
    setCurrentNote(entry.text || '');
    setCurrentMood(entry.mood || null);
    setIsEditorOpen(true);
  };

  const saveNote = async () => {
    if (selectedDate) {
      const dateKey = `${selectedDate.year}-${selectedDate.month}-${selectedDate.day}`;
      const updatedEntries = {
        ...entries,
        [dateKey]: { text: currentNote, mood: currentMood, updatedAt: new Date().toISOString() }
      };
      
      // Update local state immediately for snappy UI
      setEntries(updatedEntries);
      setIsEditorOpen(false);
      
      // Save to Firestore for sharing
      if (user) {
        try {
          const calendarRef = doc(db, 'artifacts', appId, 'public', 'data', 'calendars', 'shared-calendar-1');
          await setDoc(calendarRef, { entries: updatedEntries }, { merge: true });
        } catch (error) {
          console.error("Error saving note:", error);
          // Revert or show error in a real app
        }
      }
    }
  };

  const acceptNightReminder = () => {
    setShowNightReminder(false);
    if (todayDate.length > 0) {
      openEditor(todayDate[0], todayDate[1], todayDate[2]);
    }
  };

  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayOfWeek(viewYear, viewMonth);

  // Generate blank cells for days before the 1st of the month
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-md relative">
        
        {isSyncing && (
           <div className="absolute top-0 right-0 left-0 text-center text-xs text-indigo-500 font-medium">در حال همگام‌سازی...</div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
              تقویم مشترک ما
            </h1>
            <p className="text-sm text-slate-500 mt-1">دفترچه خاطرات دو نفره</p>
          </div>
          <button 
            onClick={() => todayDate.length && (setViewYear(todayDate[0]), setViewMonth(todayDate[1]))}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition"
          >
            امروز
          </button>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 mb-6">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-bold">
              {persianMonths[viewMonth - 1]} {viewYear}
            </h2>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, idx) => (
              <div key={idx} className="text-center text-xs font-semibold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {blankDays.map(blank => (
              <div key={`blank-${blank}`} className="aspect-square"></div>
            ))}
            
            {monthDays.map(day => {
          const isToday = todayDate[0] === viewYear && todayDate[1] === viewMonth && todayDate[2] === day;
          const dateKey = `${viewYear}-${viewMonth}-${day}`;
          const entry = entries[dateKey];
          const hasEntryText = !!(entry && entry.text);
          const entryMood = entry?.mood;
          const isSelected = selectedDate?.year === viewYear && selectedDate?.month === viewMonth && selectedDate?.day === day;

          // محاسبه روزهای جمعه و مناسبت‌ها
          const dayOfWeek = (firstDayIndex + day - 1) % 7;
          const isFriday = dayOfWeek === 6;
          const dayEvents = solarEvents[`${viewMonth}-${day}`] || [];
          const isEventHoliday = dayEvents.some(e => e.isHoliday);
          const isHoliday = isFriday || isEventHoliday;
          const hasOccasion = dayEvents.length > 0;

          let btnClasses = "relative flex flex-col items-center justify-center aspect-square rounded-2xl text-sm font-medium transition-all ";
          if (isSelected) {
            btnClasses += isHoliday ? "bg-red-500 text-white shadow-md shadow-red-200 " : "bg-indigo-600 text-white shadow-md shadow-indigo-200 ";
          } else {
            btnClasses += isHoliday ? "text-red-500 " : "text-slate-700 ";
            btnClasses += (hasEntryText || entryMood) ? "bg-slate-100 " : "hover:bg-slate-100 ";
            if (isToday) btnClasses += "border-2 border-indigo-500 ";
          }

          const MoodIconRender = entryMood && MOOD_ICONS[entryMood] ? MOOD_ICONS[entryMood].icon : null;
          const moodColor = entryMood && MOOD_ICONS[entryMood] ? MOOD_ICONS[entryMood].color : '';

          return (
            <button
              key={day}
              onClick={() => openEditor(viewYear, viewMonth, day)}
              className={btnClasses}
            >
              {MoodIconRender ? (
                <div className="flex flex-col items-center justify-center w-full h-full">
                   <MoodIconRender className={`w-6 h-6 mb-0.5 ${isSelected ? 'text-white' : moodColor}`} fill="currentColor" strokeWidth={1} />
                   <span className="text-[10px] leading-none font-bold opacity-80">{day}</span>
                </div>
              ) : (
                <span>{day}</span>
              )}
              
              <div className="absolute bottom-1.5 flex gap-1">
                {hasEntryText && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></span>
                )}
                {hasOccasion && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : (isHoliday ? 'bg-red-300' : 'bg-amber-400')}`}></span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {/* Info Box */}
        <div className="bg-blue-50 text-blue-800 rounded-2xl p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
          <p className="text-sm leading-relaxed">
            برای ثبت یادداشت یا کارهایی که انجام داده‌اید، کافیست روی روز مورد نظر در تقویم ضربه بزنید.
          </p>
        </div>

        {/* Note Editor Modal */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:items-center">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    یادداشت روز {selectedDate?.day} {persianMonths[selectedDate?.month - 1]}
                  </h3>
                  {(solarEvents[`${selectedDate?.month}-${selectedDate?.day}`] || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {solarEvents[`${selectedDate?.month}-${selectedDate?.day}`].map((ev, i) => (
                        <span key={i} className={`text-xs px-2.5 py-1 rounded-lg ${ev.isHoliday ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {ev.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-100 rounded-full shrink-0">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-600 mb-2 block">حال و هوای امروز:</label>
            <div className="flex flex-wrap gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 justify-center">
              {Object.entries(MOOD_ICONS).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = currentMood === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCurrentMood(isSelected ? null : key)}
                    className={`p-2 rounded-xl transition-all duration-200 flex flex-col items-center justify-center ${
                      isSelected 
                        ? 'bg-white ring-2 ring-indigo-500 scale-110 shadow-md' 
                        : 'hover:bg-slate-200 hover:scale-105 opacity-50 hover:opacity-100'
                    }`}
                    title={config.label}
                  >
                    <Icon className={`w-7 h-7 ${config.color}`} fill="currentColor" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="امروز چه کارهایی انجام دادی؟ چطور گذشت؟..."
            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all mb-4 text-sm leading-relaxed"
          ></textarea>
          
          <button 
            onClick={saveNote}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Check className="w-5 h-5" />
                ثبت یادداشت
              </button>
            </div>
          </div>
        )}

        {/* Nightly Reminder Modal */}
        {showNightReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <div className="bg-slate-800 text-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Moon className="w-8 h-8 text-yellow-300" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-slate-50">خسته نباشی! 🌙</h2>
              <p className="text-slate-300 mb-8 leading-relaxed">
                روز به پایان رسید. الان بهترین زمانه که کارهایی که امروز انجام دادی و دستاوردهات رو مرور کنی و بنویسی.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={acceptNightReminder}
                  className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30"
                >
                  بیا الان بنویسیم
                </button>
                <button 
                  onClick={() => setShowNightReminder(false)}
                  className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl font-medium transition-all"
                >
                  شاید بعداً
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


