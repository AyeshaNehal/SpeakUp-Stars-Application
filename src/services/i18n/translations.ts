/**
 * CHILD ACCESSIBILITY & MULTILINGUAL NOTE (Rule 1, Rule 6):
 * - Multilingual Dictionary for English, Urdu, Arabic, Hindi, and Spanish.
 * - Supports RTL layouts for Urdu & Arabic.
 * - Simple, child-friendly terminology across all 5 languages.
 */

export type SupportedLanguage = 'en' | 'ur' | 'ar' | 'hi' | 'es';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', flag: '🇵🇰' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.wheel': 'Topic Wheel',
    'nav.games': 'Mini-Games',
    'nav.speak': 'Speak!',
    'nav.feedback': 'Star Feedback',
    'nav.rewards': 'My Rewards',
    'nav.profile': 'My Profile',
    'nav.parent': 'Parents',

    // Common
    'app.title': 'SpeakUp Stars',
    'app.welcome': 'Welcome back, {name}! Ready to speak?',
    'btn.start': 'Start Speaking',
    'btn.spin': 'Spin the Wheel!',
    'btn.play': 'Play Game',
    'btn.pause': 'Pause',
    'btn.resume': 'Resume',
    'btn.back': 'Back',
    'btn.next': 'Next',
    'btn.done': 'Done!',
    'btn.close': 'Close',
    'btn.replay': 'Play Again',

    // Wheel of the Day & Seasonal
    'wheel.title': 'Spin the Topic Wheel',
    'wheel.today': 'Wheel of the Day ⭐',
    'wheel.bonus': '+15 Bonus Stars!',
    'wheel.season': 'Seasonal Event',
    'wheel.ready': 'Ready to speak about this?',
    'wheel.spinPrompt': 'Press Space or Tap to Spin!',

    // Accessibility
    'a11y.title': 'Accessibility & Polish',
    'a11y.dyslexia': 'Dyslexia-Friendly Font',
    'a11y.dyslexiaDesc': 'Uses weighted letters and extra spacing for easy reading.',
    'a11y.contrast': 'High-Contrast Mode',
    'a11y.contrastDesc': 'Sharp borders and maximum contrast for low-vision.',
    'a11y.colorblind': 'Color-Blind Mode',
    'a11y.textScale': 'Text Size',
    'a11y.speechSpeed': 'Speech Read-Aloud Speed',
    'a11y.captions': 'Show Subtitles & Captions',
    'a11y.reducedMotion': 'Reduced Motion',
    'a11y.soundEffects': 'Sound Effects',
    'a11y.calmMode': 'Calm Sound Mode',
    'a11y.calmModeDesc': 'Softer tones and quieter effects.',

    // Screen Time
    'screentime.reminder': 'Great job speaking today! Time to take a sip of water and rest your voice! 🥤',
    'screentime.rest': 'Rest Voice 🌙',
    'screentime.continue': 'Continue 5m',

    // Volcano Game
    'game.volcano.title': 'Volume Volcano',
    'game.volcano.tagline': 'Power the volcano with your steady, brave voice!',

    // Legal, Privacy & Terms
    'nav.privacy': 'Parent Privacy Policy',
    'nav.kidsPrivacy': "Kid's Privacy",
    'nav.terms': 'Terms of Use',
    'nav.storageNotice': 'Storage Notice',
    'reconsent.title': 'Privacy Policy & Terms Update',
    'reconsent.badge': 'Version {version}',
    'reconsent.message': 'We updated our Privacy Policy and Terms of Use. Please review key protections and confirm agreement to continue.',
    'reconsent.btnAgree': 'I Understand & Agree',
    'reconsent.btnReview': 'Read Full Policy',
    'kids.heroTitle': "Sparky's Super Safe Privacy Guide! 🛡️",
    'kids.heroSubtitle': 'See how Sparky keeps your voice, words, and secrets 100% safe!',
    'kids.readAloud': 'Hear Sparky Read Aloud 🔊',
    'kids.reading': 'Sparky is Speaking... 🎙️',
    'kids.stopAudio': 'Stop Reading ⏹️',
    'footer.coppa': 'COPPA & GDPR-K Privacy First • 100% On-Device Voice Processing • Zero Ads',
    'footer.rights': 'All rights reserved. Designed with love and child-first safety.',
  },

  ur: {
    // Nav
    'nav.home': 'ہوم',
    'nav.wheel': 'موضوعات کا پہیہ',
    'nav.games': 'چھوٹے کھیل',
    'nav.speak': 'بولیں!',
    'nav.feedback': 'ستارہ فیڈ بیک',
    'nav.rewards': 'میرے انعامات',
    'nav.profile': 'میرا پروفائل',
    'nav.parent': 'والدین',

    // Common
    'app.title': 'اسپیک اپ اسٹارز',
    'app.welcome': 'خوش آمدید، {name}! کیا آپ بولنے کے لیے تیار ہیں؟',
    'btn.start': 'بولنا شروع کریں',
    'btn.spin': 'پہیہ گھمائیں!',
    'btn.play': 'کھیلیں',
    'btn.pause': 'روکیں',
    'btn.resume': 'جاری رکھیں',
    'btn.back': 'واپس',
    'btn.next': 'اگلا',
    'btn.done': 'مکمل!',
    'btn.close': 'بند کریں',
    'btn.replay': 'دوبارہ کھیلیں',

    // Wheel of the Day & Seasonal
    'wheel.title': 'موضوعات کا جادوئی پہیہ گھمائیں',
    'wheel.today': 'آج کا خاص پہیہ ⭐',
    'wheel.bonus': '+15 اضافی ستارے!',
    'wheel.season': 'موسمی سرگرمی',
    'wheel.ready': 'کیا آپ اس موضوع پر بولنے کے لیے تیار ہیں؟',
    'wheel.spinPrompt': 'گھمانے کے لیے بٹن دبائیں!',

    // Accessibility
    'a11y.title': 'آسان رسائی اور ترتیبات',
    'a11y.dyslexia': 'آسان پڑھنے والا فونٹ',
    'a11y.dyslexiaDesc': 'پڑھنے میں آسانی کے لیے واضح اور کشادہ حروف۔',
    'a11y.contrast': 'زیادہ واضح رنگ (ہائی کنٹراسٹ)',
    'a11y.contrastDesc': 'کمزور نظر کے لیے گہرے اور واضح بارڈرز۔',
    'a11y.colorblind': 'رنگوں کے لیے محفوظ موڈ',
    'a11y.textScale': 'حروف کا سائز',
    'a11y.speechSpeed': 'بولنے کی رفتار',
    'a11y.captions': 'سب ٹائٹلز دکھائیں',
    'a11y.reducedMotion': 'کم حرکت (سست اینیمیشن)',
    'a11y.soundEffects': 'آواز کے اثرات',
    'a11y.calmMode': 'پرسکون آواز موڈ',
    'a11y.calmModeDesc': 'مدہم اور آرام دہ آوازیں۔',

    // Screen Time
    'screentime.reminder': 'بہت خوب! اب تھوڑا پانی پی لیں اور اپنی آواز کو آرام دیں! 🥤',
    'screentime.rest': 'آواز کو آرام دیں 🌙',
    'screentime.continue': 'مزید 5 منٹ',

    // Volcano Game
    'game.volcano.title': 'والیوم کا آتش فشاں',
    'game.volcano.tagline': 'اپنی پراعتماد آواز سے آتش فشاں کو روشن کریں!',

    // Legal, Privacy & Terms
    'nav.privacy': 'والدین کی پرائیویسی پالیسی',
    'nav.kidsPrivacy': 'بچوں کی پرائیویسی',
    'nav.terms': 'شرائط اور اصول',
    'nav.storageNotice': 'اسٹوریج کا نوٹس',
    'reconsent.title': 'پرائیویسی پالیسی میں تبدیلی',
    'reconsent.badge': 'ورژن {version}',
    'reconsent.message': 'ہم نے اپنی پرائیویسی پالیسی اور شرائط کو اپ ڈیٹ کیا ہے۔ براہ کرم نئی ترامیم کا جائزہ لیں اور جاری رکھنے کے لیے تصدیق کریں۔',
    'reconsent.btnAgree': 'میں سمجھ گیا اور متفق ہوں',
    'reconsent.btnReview': 'مکمل پالیسی پڑھیں',
    'kids.heroTitle': 'اسپارکی کا پرائیویسی رہنما! 🛡️',
    'kids.heroSubtitle': 'دیکھیں اسپارکی آپ کی آواز اور رازوں کی کیسے حفاظت کرتا ہے!',
    'kids.readAloud': 'اسپارکی کی آواز میں سنیں 🔊',
    'kids.reading': 'اسپارکی پڑھ رہا ہے... 🎙️',
    'kids.stopAudio': 'روکیں ⏹️',
    'footer.coppa': 'کوپا اور جی ڈی پی آر کے قوانین کے عین مطابق • اشتہارات سے مکمل پاک',
    'footer.rights': 'تمام حقوق محفوظ ہیں۔ بچوں کے تحفظ اور مسکراہٹ کے ساتھ تیار کردہ۔',
  },

  ar: {
    // Nav
    'nav.home': 'الرئيسية',
    'nav.wheel': 'عجلة المواضيع',
    'nav.games': 'الألعاب',
    'nav.speak': 'تحدث الآن!',
    'nav.feedback': 'تقييم النجوم',
    'nav.rewards': 'مكافآتي',
    'nav.profile': 'ملفي الشخصي',
    'nav.parent': 'الوالدان',

    // Common
    'app.title': 'سبيك أب ستارز',
    'app.welcome': 'مرحباً بعودتك، {name}! هل أنت مستعد للتحدث؟',
    'btn.start': 'ابدأ التحدث',
    'btn.spin': 'أدر العجلة!',
    'btn.play': 'العب الآن',
    'btn.pause': 'إيقاف مؤقت',
    'btn.resume': 'استئناف',
    'btn.back': 'رجوع',
    'btn.next': 'التالي',
    'btn.done': 'تم بنجاح!',
    'btn.close': 'إغلاق',
    'btn.replay': 'إعادة اللعب',

    // Wheel of the Day & Seasonal
    'wheel.title': 'أدر عجلة المواضيع السحرية',
    'wheel.today': 'عجلة اليوم المميزة ⭐',
    'wheel.bonus': '+15 نجوم إضافية!',
    'wheel.season': 'فعالية الموسم',
    'wheel.ready': 'هل أنت مستعد للتحدث عن هذا الموضوع؟',
    'wheel.spinPrompt': 'المس أو اضغط للتدوير!',

    // Accessibility
    'a11y.title': 'سهولة الاستخدام والإعدادات',
    'a11y.dyslexia': 'خط مريح للقراءة',
    'a11y.dyslexiaDesc': 'حروف واضحة ومتباعدة لتسهيل القراءة للأطفال.',
    'a11y.contrast': 'تباين ألوان عالي',
    'a11y.contrastDesc': 'حدود قوية وواضحة لضعاف البصر.',
    'a11y.colorblind': 'نمط عمى الألوان',
    'a11y.textScale': 'حجم النص',
    'a11y.speechSpeed': 'سرعة القراءة الصوتية',
    'a11y.captions': 'إظهار النصوص التوضيحية',
    'a11y.reducedMotion': 'تقليل الحركة والاهتزاز',
    'a11y.soundEffects': 'المؤثرات الصوتية',
    'a11y.calmMode': 'نمط الأصوات الهادئة',
    'a11y.calmModeDesc': 'نغمات ناعمة وغير صاخبة.',

    // Screen Time
    'screentime.reminder': 'أحسنت صنعاً! حان وقت شرب الماء وإراحة صوتك الجميل! 🥤',
    'screentime.rest': 'إراحة الصوت 🌙',
    'screentime.continue': 'متابعة 5 دقائق',

    // Volcano Game
    'game.volcano.title': 'بركان الصوت',
    'game.volcano.tagline': 'أطلق طاقة البركان بصوتك الواثق والقوي!',

    // Legal, Privacy & Terms
    'nav.privacy': 'سياسة خصوصية الوالدين',
    'nav.kidsPrivacy': 'خصوصية الأطفال',
    'nav.terms': 'شروط الاستخدام',
    'nav.storageNotice': 'إشعار التخزين',
    'reconsent.title': 'تحديث سياسة الخصوصية',
    'reconsent.badge': 'الإصدار {version}',
    'reconsent.message': 'قمنا بتحديث سياسة الخصوصية وشروط الاستخدام. يُرجى مراجعة التحديثات وتأكيد موافقتك للمتابعة.',
    'reconsent.btnAgree': 'أفهم وأوافق',
    'reconsent.btnReview': 'قراءة السياسة كاملة',
    'kids.heroTitle': 'دليل سباركي للخصوصية والأمان! 🛡️',
    'kids.heroSubtitle': 'تعرف على كيفية حماية سباركي لصوتك وأسرارك بأمان تام!',
    'kids.readAloud': 'استمع إلى سباركي بصوت عالٍ 🔊',
    'kids.reading': 'سباركي يقرأ الآن... 🎙️',
    'kids.stopAudio': 'إيقاف ⏹️',
    'footer.coppa': 'متوافق مع معايير COPPA و GDPR-K • معالجة صوتية على الجهاز فقط • بدون إعلانات',
    'footer.rights': 'جميع الحقوق محفوظة. صُمم بحب من أجل سلامة وسعادة الأطفال.',
  },

  hi: {
    // Nav
    'nav.home': 'होम',
    'nav.wheel': 'विषय पहिया',
    'nav.games': 'मिनी गेम्स',
    'nav.speak': 'बोलें!',
    'nav.feedback': 'स्टार फीडबैक',
    'nav.rewards': 'मेरे इनाम',
    'nav.profile': 'मेरी प्रोफ़ाइल',
    'nav.parent': 'अभिभावक',

    // Common
    'app.title': 'स्पीकअप स्टार्स',
    'app.welcome': 'स्वागत है, {name}! क्या आप बोलने के लिए तैयार हैं?',
    'btn.start': 'बोलना शुरू करें',
    'btn.spin': 'पहिया घुमाएं!',
    'btn.play': 'खेलें',
    'btn.pause': 'रोकें',
    'btn.resume': 'जारी रखें',
    'btn.back': 'पीछे',
    'btn.next': 'आगे',
    'btn.done': 'हो गया!',
    'btn.close': 'बंद करें',
    'btn.replay': 'फिर से खेलें',

    // Wheel of the Day & Seasonal
    'wheel.title': 'मजेदार विषय पहिया घुमाएं',
    'wheel.today': 'आज का खास पहिया ⭐',
    'wheel.bonus': '+15 बोनस सितारे!',
    'wheel.season': 'मौसमी उत्सव',
    'wheel.ready': 'क्या आप इस विषय पर बोलने के लिए तैयार हैं?',
    'wheel.spinPrompt': 'पहिया घुमाने के लिए टैप करें!',

    // Accessibility
    'a11y.title': 'सुलभता और सेटिंग्स',
    'a11y.dyslexia': 'पढ़ने में आसान फ़ॉन्ट',
    'a11y.dyslexiaDesc': 'बच्चों के पढ़ने के लिए स्पष्ट और बड़े अक्षर।',
    'a11y.contrast': 'हाई-कंट्रास्ट मोड',
    'a11y.contrastDesc': 'स्पष्ट सीमाएं और गहरा कंट्रास्ट।',
    'a11y.colorblind': 'कलर-ब्लाइंड सेफ मोड',
    'a11y.textScale': 'टेक्स्ट का आकार',
    'a11y.speechSpeed': 'बोलने की गति',
    'a11y.captions': 'सबटाइटल दिखाएं',
    'a11y.reducedMotion': 'धीमी गति (कम एनीमेशन)',
    'a11y.soundEffects': 'ध्वनि प्रभाव',
    'a11y.calmMode': 'शांत ध्वनि मोड',
    'a11y.calmModeDesc': 'मधुर और सौम्य आवाज़ें।',

    // Screen Time
    'screentime.reminder': 'बहुत बढ़िया! थोड़ा पानी पिएं और अपनी आवाज़ को आराम दें! 🥤',
    'screentime.rest': 'आवाज़ को आराम दें 🌙',
    'screentime.continue': '5 मिनट और',

    // Volcano Game
    'game.volcano.title': 'वॉल्यूम ज्वालामुखी',
    'game.volcano.tagline': 'अपनी स्थिर और बुलंद आवाज़ से ज्वालामुखी को जगाएं!',

    // Legal, Privacy & Terms
    'nav.privacy': 'अभिभावक गोपनीयता नीति',
    'nav.kidsPrivacy': 'बच्चों की गोपनीयता',
    'nav.terms': 'उपयोग की शर्तें',
    'nav.storageNotice': 'संग्रहण सूचना',
    'reconsent.title': 'गोपनीयता नीति अपडेट',
    'reconsent.badge': 'संस्करण {version}',
    'reconsent.message': 'हमने अपनी गोपनीयता नीति और उपयोग की शर्तों को अपडेट किया है। कृपया मुख्य सुरक्षा उपायों की समीक्षा करें और सहमति दें।',
    'reconsent.btnAgree': 'मैं समझ गया और सहमत हूँ',
    'reconsent.btnReview': 'पूरी नीति पढ़ें',
    'kids.heroTitle': 'स्पार्की का सुपर सुरक्षित गोपनीयता गाइड! 🛡️',
    'kids.heroSubtitle': 'देखें स्पार्की आपकी आवाज़ और बातों को कैसे सुरक्षित रखता है!',
    'kids.readAloud': 'स्पार्की की आवाज़ में सुनें 🔊',
    'kids.reading': 'स्पार्की पढ़ रहा है... 🎙️',
    'kids.stopAudio': 'रोकें ⏹️',
    'footer.coppa': 'COPPA एवं GDPR-K अनुपालित • डिवाइस पर ही ऑडियो प्रोसेसिंग • कोई विज्ञापन नहीं',
    'footer.rights': 'सर्वाधिकार सुरक्षित। बच्चों की सुरक्षा और खुशी के लिए समर्पित।',
  },

  es: {
    // Nav
    'nav.home': 'Inicio',
    'nav.wheel': 'Ruleta de Temas',
    'nav.games': 'Minijuegos',
    'nav.speak': '¡Habla Ya!',
    'nav.feedback': 'Estrellas',
    'nav.rewards': 'Mis Premios',
    'nav.profile': 'Mi Perfil',
    'nav.parent': 'Padres',

    // Common
    'app.title': 'SpeakUp Stars',
    'app.welcome': '¡Hola de nuevo, {name}! ¿Listo para hablar?',
    'btn.start': 'Empezar a Hablar',
    'btn.spin': '¡Girar la Ruleta!',
    'btn.play': 'Jugar Ahora',
    'btn.pause': 'Pausa',
    'btn.resume': 'Reanudar',
    'btn.back': 'Atrás',
    'btn.next': 'Siguiente',
    'btn.done': '¡Listo!',
    'btn.close': 'Cerrar',
    'btn.replay': 'Jugar Otra Vez',

    // Wheel of the Day & Seasonal
    'wheel.title': 'Gira la Ruleta Mágica',
    'wheel.today': 'Ruleta del Día ⭐',
    'wheel.bonus': '¡+15 Estrellas de Bono!',
    'wheel.season': 'Evento de Temporada',
    'wheel.ready': '¿Listo para hablar de este tema?',
    'wheel.spinPrompt': '¡Toca o pulsa Espacio para girar!',

    // Accessibility
    'a11y.title': 'Accesibilidad y Ajustes',
    'a11y.dyslexia': 'Fuente para Dislexia',
    'a11y.dyslexiaDesc': 'Letras ponderadas y espaciadas para facilitar la lectura.',
    'a11y.contrast': 'Alto Contraste',
    'a11y.contrastDesc': 'Bordes oscuros y contraste máximo para mejor visibilidad.',
    'a11y.colorblind': 'Modo Daltónico',
    'a11y.textScale': 'Tamaño del Texto',
    'a11y.speechSpeed': 'Velocidad de Lectura en Voz Alta',
    'a11y.captions': 'Mostrar Subtítulos',
    'a11y.reducedMotion': 'Movimiento Reducido',
    'a11y.soundEffects': 'Efectos de Sonido',
    'a11y.calmMode': 'Modo de Sonido Calmado',
    'a11y.calmModeDesc': 'Tonos suaves y efectos relajantes.',

    // Screen Time
    'screentime.reminder': '¡Fantástico trabajo! ¡Hora de beber agua y descansar la voz! 🥤',
    'screentime.rest': 'Descansar Voz 🌙',
    'screentime.continue': 'Seguir 5m',

    // Volcano Game
    'game.volcano.title': 'Volcán de Volumen',
    'game.volcano.tagline': '¡Enciende el volcán con tu voz firme y valiente!',

    // Legal, Privacy & Terms
    'nav.privacy': 'Política de Privacidad para Padres',
    'nav.kidsPrivacy': 'Privacidad para Niños',
    'nav.terms': 'Términos de Uso',
    'nav.storageNotice': 'Aviso de Almacenamiento',
    'reconsent.title': 'Actualización de Política de Privacidad',
    'reconsent.badge': 'Versión {version}',
    'reconsent.message': 'Hemos actualizado nuestra Política de Privacidad y Términos de Uso. Revisa las protecciones clave y confirma tu acuerdo.',
    'reconsent.btnAgree': 'Entiendo y Acepto',
    'reconsent.btnReview': 'Leer Política Completa',
    'kids.heroTitle': '¡Guía Súper Segura de Privacidad de Sparky! 🛡️',
    'kids.heroSubtitle': '¡Descubre cómo Sparky cuida tu voz, palabras y secretos con total seguridad!',
    'kids.readAloud': 'Escuchar a Sparky en Voz Alta 🔊',
    'kids.reading': 'Sparky está leyendo... 🎙️',
    'kids.stopAudio': 'Detener Lectura ⏹️',
    'footer.coppa': 'Cumple con COPPA y GDPR-K • Procesamiento de audio 100% en dispositivo • Cero Anuncios',
    'footer.rights': 'Todos los derechos reservados. Diseñado con amor y seguridad infantil.',
  },
};
