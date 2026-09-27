export type LanguageCode = "hi" | "en" | "mr" | "gu" | "bn" | "ta";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  shortLabel: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "hi",
    label: "हिंदी",
    shortLabel: "HI",
    speechLocale: "hi-IN",
  },
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    speechLocale: "en-IN",
  },
  {
    code: "mr",
    label: "मराठी",
    shortLabel: "MR",
    speechLocale: "mr-IN",
  },
  {
    code: "gu",
    label: "ગુજરાતી",
    shortLabel: "GU",
    speechLocale: "gu-IN",
  },
  {
    code: "bn",
    label: "বাংলা",
    shortLabel: "BN",
    speechLocale: "bn-IN",
  },
  {
    code: "ta",
    label: "தமிழ்",
    shortLabel: "TA",
    speechLocale: "ta-IN",
  },
];

export interface JoinTranslations {
  homeNav: string;
  pageTitle: string;
  pageSubtitle: string;
  staffViewBtn: string;
  easyViewBtn: string;
  emergencySosBadge: string;
  emergencySosHeader: string;
  emergencySosSub: string;
  emergencySosBtn: string;
  voiceIntakeBadge: string;
  voiceIntakeHeader: string;
  voiceIntakeSub: string;
  voiceIntakeBtn: string;
  step1Badge: string;
  step1Header: string;
  step1Sub: string;
  tapToSpeak: string;
  listening: string;
  speechNotDetected: string;
  step2Badge: string;
  step2Header: string;
  step3Badge: string;
  step3Header: string;
  patientNamePlaceholder: string;
  relSelf: string;
  relFamily: string;
  relChild: string;
  relElderly: string;
  submitBtn: string;
  submittingBtn: string;
  severityEmergency: string;
  severityUrgent: string;
  severityStandard: string;
  errorSelectDept: string;
  errorSelectSymptom: string;
  audioEmergencyAlert: string;
  audioTokenGen: string;
}

export const JOIN_TRANSLATIONS: Record<LanguageCode, JoinTranslations> = {
  hi: {
    homeNav: "मुख्य पृष्ठ",
    pageTitle: "अस्पताल टोकन व ओपीडी जांच",
    pageSubtitle: "बिना कतार में खड़े रहे तुरंत टोकन प्राप्त करें",
    staffViewBtn: "डॉक्टर फॉर्म",
    easyViewBtn: "सरल मोड",
    emergencySosBadge: "तत्काल सहायता",
    emergencySosHeader: "सीने में तेज दर्द, सांस न आना, भारी खून?",
    emergencySosSub: "फॉर्म भरने की जरूरत नहीं है - तुरंत 1-क्लिक में आपातकालीन नंबर पाएं।",
    emergencySosBtn: "1-क्लिक इमरजेंसी सहायता (SOS)",
    voiceIntakeBadge: "बोलकर टोकन लें",
    voiceIntakeHeader: "माइक पर बोलें - टोकन और डॉक्टर जांच की जानकारी तुरंत पाएं",
    voiceIntakeSub: "अपनी परेशानी बोलकर बताएं। सिस्टम अपने आप सही विभाग और टोकन तय करेगा।",
    voiceIntakeBtn: "बोलकर टोकन लें",
    step1Badge: "कदम 1",
    step1Header: "माइक दबाकर बोलें",
    step1Sub: "माइक दबाकर अपनी परेशानी या बीमारी बताएं",
    tapToSpeak: "बोलने के लिए दबाएं",
    listening: "सुन रहे हैं... साफ बोलें",
    speechNotDetected: "आवाज सुनाई नहीं दी। कृपया दोबारा माइक दबाएं।",
    step2Badge: "कदम 2",
    step2Header: "या नीचे अपनी तकलीफ के चित्र पर टैप करें",
    step3Badge: "कदम 3",
    step3Header: "मरीज़ का नाम (वैकल्पिक)",
    patientNamePlaceholder: "मरीज़ का नाम लिखें",
    relSelf: "स्वयं",
    relFamily: "परिवार का सदस्य",
    relChild: "शिशु / बच्चा",
    relElderly: "बुजुर्ग माता-पिता",
    submitBtn: "टोकन प्राप्त करें",
    submittingBtn: "टोकन तैयार हो रहा है...",
    severityEmergency: "अति आवश्यक (आपातकाल)",
    severityUrgent: "तत्काल सहायता",
    severityStandard: "सामान्य ओपीडी",
    errorSelectDept: "कृपया अस्पताल विभाग या श्रेणी चुनें।",
    errorSelectSymptom: "कृपया चित्र पर टैप करें या बोलकर बताएं।",
    audioEmergencyAlert: "आपातकाल दर्ज किया गया। कृपया सीधे इमरजेंसी वार्ड में जाएं।",
    audioTokenGen: "आपका टोकन तैयार किया जा रहा है।",
  },
  en: {
    homeNav: "Home",
    pageTitle: "Hospital OPD Intake & Token",
    pageSubtitle: "Fast accessible pass without standing in physical queues",
    staffViewBtn: "Staff View",
    easyViewBtn: "Easy Mode",
    emergencySosBadge: "Immediate Priority",
    emergencySosHeader: "Severe chest pain, breathlessness, heavy bleeding?",
    emergencySosSub: "No form needed - get immediate priority pass in 1 tap.",
    emergencySosBtn: "1-Tap Emergency Assistance (SOS)",
    voiceIntakeBadge: "Voice Intake",
    voiceIntakeHeader: "Speak symptoms to receive instant token and care guidance",
    voiceIntakeSub: "Describe symptoms in plain words. System routes directly to right department.",
    voiceIntakeBtn: "Voice Token Intake",
    step1Badge: "Step 1",
    step1Header: "Tap Mic and Speak",
    step1Sub: "Speak symptoms clearly into the microphone",
    tapToSpeak: "Tap to Speak",
    listening: "Listening... Speak clearly",
    speechNotDetected: "Voice not heard. Please tap the mic again.",
    step2Badge: "Step 2",
    step2Header: "Or select your symptom picture below",
    step3Badge: "Step 3",
    step3Header: "Patient Name (Optional)",
    patientNamePlaceholder: "Enter patient name",
    relSelf: "Self",
    relFamily: "Family Member",
    relChild: "Child",
    relElderly: "Elderly Parent",
    submitBtn: "Get OPD Token",
    submittingBtn: "Generating Token...",
    severityEmergency: "Emergency Priority",
    severityUrgent: "Urgent Priority",
    severityStandard: "Routine OPD",
    errorSelectDept: "Please select department or category.",
    errorSelectSymptom: "Please tap a symptom picture or speak.",
    audioEmergencyAlert: "Emergency recorded. Please proceed directly to Emergency Ward.",
    audioTokenGen: "Your token is being generated.",
  },
  mr: {
    homeNav: "मुख्य पान",
    pageTitle: "रुग्णालय टोकन व तपासणी",
    pageSubtitle: "रांगेत उभे न राहता त्वरित टोकन मिळवा",
    staffViewBtn: "कर्मचारी दृश्य",
    easyViewBtn: "सोपा मोड",
    emergencySosBadge: "तातडीची मदत",
    emergencySosHeader: "छातीत तीव्र वेदना, श्वास घेण्यास त्रास, जास्त रक्तस्त्राव?",
    emergencySosSub: "फॉर्म भरण्याची गरज नाही - त्वरित 1-क्लिकमध्ये आपत्कालीन नंबर मिळवा.",
    emergencySosBtn: "1-क्लिक आपत्कालीन मदत (SOS)",
    voiceIntakeBadge: "बोलून टोकन घ्या",
    voiceIntakeHeader: "माईकवर बोला - टोकन आणि तपासणी माहिती त्वरित मिळवा",
    voiceIntakeSub: "तुमची लक्षणे बोलून सांगा. योग्य विभागाचा टोकन त्वरित जारी केला जाईल.",
    voiceIntakeBtn: "बोलून टोकन घ्या",
    step1Badge: "पायरी 1",
    step1Header: "माईक दाबून बोला",
    step1Sub: "माईक दाबून आपला त्रास किंवा लक्षणे सांगा",
    tapToSpeak: "बोलण्यासाठी दाबा",
    listening: "ऐकत आहे... स्पष्ट बोला",
    speechNotDetected: "आवाज आला नाही. कृपया पुन्हा माईक दाबा.",
    step2Badge: "पायरी 2",
    step2Header: "किंवा खालील लक्षणाच्या चित्रावर टॅप करा",
    step3Badge: "पायरी 3",
    step3Header: "रुग्णाचे नाव (पर्यायी)",
    patientNamePlaceholder: "रुग्णाचे नाव लिहा",
    relSelf: "स्वतः",
    relFamily: "कुटुंबातील सदस्य",
    relChild: "लहान मूल",
    relElderly: "वृद्ध पालक",
    submitBtn: "टोकन मिळवा",
    submittingBtn: "टोकन तयार होत आहे...",
    severityEmergency: "अति आवश्यक (आणीबाणी)",
    severityUrgent: "तातडीची मदत",
    severityStandard: "नियमित ओपीडी",
    errorSelectDept: "कृपया रुग्णालय विभाग निवडा.",
    errorSelectSymptom: "कृपया चित्रावर टॅप करा किंवा बोलून सांगा.",
    audioEmergencyAlert: "आपत्कालीन नोंद झाली आहे. कृपया थेट आपत्कालीन कक्षात जा.",
    audioTokenGen: "आपले टोकन तयार केले जात आहे.",
  },
  gu: {
    homeNav: "મુખ્ય પૃષ્ઠ",
    pageTitle: "હોસ્પિટલ ટોકન અને ઓપીડી તપાસ",
    pageSubtitle: "લાઈનમાં ઊભા રહ્યા વિના તરત જ ટોકન મેળવો",
    staffViewBtn: "સ્ટાફ વ્યૂ",
    easyViewBtn: "સરળ મોડ",
    emergencySosBadge: "તાત્કાલિક સહાય",
    emergencySosHeader: "છાતીમાં તીવ્ર દુખાવો, શ્વાસ લેવામાં તકલીફ, ભારે રક્તસ્ત્રાવ?",
    emergencySosSub: "ફોર્મ ભરવાની જરૂર નથી - ફક્ત 1-ક્લિકમાં ઇમરજન્સી નંબર મેળવો.",
    emergencySosBtn: "1-ક્લિક ઇમરજન્સી સહાય (SOS)",
    voiceIntakeBadge: "બોલીને ટોકન મેળવો",
    voiceIntakeHeader: "માઇક પર બોલો - ટોકન અને ડૉક્ટર તપાસની માહિતી તરત મેળવો",
    voiceIntakeSub: "તમારી તકલીફ બોલીને જણાવો. સિસ્ટમ યોગ્ય વિભાગમાં ટોકન ફાળવશે.",
    voiceIntakeBtn: "બોલીને ટોકન મેળવો",
    step1Badge: "પગલું 1",
    step1Header: "માઇક દબાવીને બોલો",
    step1Sub: "માઇક દબાવીને તમારી તકલીફ જણાવો",
    tapToSpeak: "બોલવા માટે દબાવો",
    listening: "સાંભળી રહ્યા છીએ... સ્પષ્ટ બોલો",
    speechNotDetected: "અવાજ સંભળાયો નથી. કૃપા કરીને ફરી માઇક દબાવો.",
    step2Badge: "પગલું 2",
    step2Header: "અથવા નીચે આપેલા લક્ષણ ચિત્ર પર ટેપ કરો",
    step3Badge: "પગલું 3",
    step3Header: "દર્દીનું નામ (વૈકલ્પિક)",
    patientNamePlaceholder: "દર્દીનું નામ લખો",
    relSelf: "પોતે",
    relFamily: "પરિવારના સભ્ય",
    relChild: "બાળક",
    relElderly: "વૃદ્ધ માતા-પિતા",
    submitBtn: "ટોકન મેળવો",
    submittingBtn: "ટોકન તૈયાર થઈ રહ્યું છે...",
    severityEmergency: "અતિ મહત્વનું (ઇમરજન્સી)",
    severityUrgent: "તાત્કાલિક સહાય",
    severityStandard: "સામાન્ય ઓપીડી",
    errorSelectDept: "કૃપા કરીને હોસ્પિટલ વિભાગ પસંદ કરો.",
    errorSelectSymptom: "કૃપા કરીને ચિત્ર પર ટેપ કરો અથવા બોલીને જણાવો.",
    audioEmergencyAlert: "ઇમરજન્સી નોંધાઈ ગઈ છે. કૃપા કરીને સીધા ઇમરજન્સી વોર્ડમાં જાઓ.",
    audioTokenGen: "તમારું ટોકન તૈયાર થઈ રહ્યું છે.",
  },
  bn: {
    homeNav: "মূল পাতা",
    pageTitle: "হাসপাতাল টোকেন ও ওপিডি পরীক্ষা",
    pageSubtitle: "লাইনে দাঁড়িয়ে না থেকে দ্রুত টোকেন সংগ্রহ করুন",
    staffViewBtn: "স্টাফ ভিউ",
    easyViewBtn: "সহজ মোড",
    emergencySosBadge: "জরুরি সহায়তা",
    emergencySosHeader: "বুকে তীব্র ব্যথা, শ্বাসকষ্ট, অতিরিক্ত রক্তপাত?",
    emergencySosSub: "ফর্ম পূরণের প্রয়োজন নেই - 1-ক্লিকে জরুরি নম্বর পান।",
    emergencySosBtn: "1-ক্লিক জরুরি সাহায্য (SOS)",
    voiceIntakeBadge: "বলে টোকেন নিন",
    voiceIntakeHeader: "মাইকে বলুন - টোকেন এবং ডাক্তারের নির্দেশিকা সাথে সাথে পান",
    voiceIntakeSub: "নিজের সমস্যা মুখে বলুন। সিস্টেম সঠিক বিভাগে টোকেন নির্ধারণ করবে।",
    voiceIntakeBtn: "বলে টোকেন নিন",
    step1Badge: "ধাপ 1",
    step1Header: "মাইক চেপে বলুন",
    step1Sub: "মাইক চেপে আপনার শারীরিক সমস্যা বলুন",
    tapToSpeak: "বলতে চাপুন",
    listening: "শুনছি... স্পষ্ট বলুন",
    speechNotDetected: "শব্দ শোনা যায়নি। দয়া করে আবার মাইক চাপুন।",
    step2Badge: "ধাপ 2",
    step2Header: "অথবা নিচের লক্ষণ ছবিতে চাপুন",
    step3Badge: "ধাপ 3",
    step3Header: "রোগীর নাম (ঐচ্ছিক)",
    patientNamePlaceholder: "রোগীর নাম লিখুন",
    relSelf: "নিজে",
    relFamily: "পরিবারের সদস্য",
    relChild: "শিশু",
    relElderly: "বৃদ্ধ অভিভাবক",
    submitBtn: "টোকেন নিন",
    submittingBtn: "টোকেন প্রস্তুত হচ্ছে...",
    severityEmergency: "জরুরি (ইমার্জেন্সি)",
    severityUrgent: "দ্রুত সহায়তা",
    severityStandard: "সাধারণ ওপিডি",
    errorSelectDept: "দয়া করে হাসপাতাল বিভাগ নির্বাচন করুন।",
    errorSelectSymptom: "দয়া করে ছবিতে চাপুন অথবা মুখে বলুন।",
    audioEmergencyAlert: "জরুরি অবস্থা নথিভুক্ত হয়েছে। সরাসরি জরুরি বিভাগে যান।",
    audioTokenGen: "আপনার টোকেন তৈরি করা হচ্ছে।",
  },
  ta: {
    homeNav: "முகப்பு",
    pageTitle: "மருத்துவமனை டோக்கன் மற்றும் OPD பதிவு",
    pageSubtitle: "வரிசையில் நிற்காமல் உடனுக்குடன் டோக்கன் பெறுங்கள்",
    staffViewBtn: "பணியாளர் பார்வை",
    easyViewBtn: "எளிய முறை",
    emergencySosBadge: "உடனடி உதவி",
    emergencySosHeader: "கடுமையான நெஞ்சு வலி, மூச்சுத்திணறல், அதிக இரத்தப்போக்கா?",
    emergencySosSub: "படிவம் தேவையில்லை - உடனடியாக அவசர டோக்கன் பெறலாம்.",
    emergencySosBtn: "1-கிளிக் அவசர உதவி (SOS)",
    voiceIntakeBadge: "பேசி டோக்கன் பெற",
    voiceIntakeHeader: "மைக்கில் பேசவும் - டோக்கன் மற்றும் மருத்துவ வழிகாட்டல் உடனே கிடைக்கும்",
    voiceIntakeSub: "உங்கள் அறிகுறிகளை பேசவும். தானாகவே சரியான துறைக்கு டோக்கன் வழங்கப்படும்.",
    voiceIntakeBtn: "பேசி டோக்கன் பெற",
    step1Badge: "படி 1",
    step1Header: "மைக்கை அழுத்தி பேசவும்",
    step1Sub: "மைக்கை அழுத்தி உங்கள் உபாதைகளை தெளிவாக கூறவும்",
    tapToSpeak: "பேச அழுத்தவும்",
    listening: "கேட்கிறது... தெளிவாக பேசவும்",
    speechNotDetected: "குரல் கேட்கவில்லை. மீண்டும் மைக்கை அழுத்தவும்.",
    step2Badge: "படி 2",
    step2Header: "அல்லது கீழே உள்ள அறிகுறி படத்தை தொடவும்",
    step3Badge: "படி 3",
    step3Header: "நோயாளி பெயர் (விருப்பத்திற்குரியது)",
    patientNamePlaceholder: "நோயாளி பெயரை உள்ளிடவும்",
    relSelf: "சுய",
    relFamily: "குடும்ப உறுப்பினர்",
    relChild: "குழந்தை",
    relElderly: "முதிய பெற்றோர்",
    submitBtn: "டோக்கன் பெறுக",
    submittingBtn: "டோக்கன் தயாராகிறது...",
    severityEmergency: "அவசரம் (Emergency)",
    severityUrgent: "உடனடி உதவி",
    severityStandard: "வழக்கமான OPD",
    errorSelectDept: "தயவுசெய்து மருத்துவமனை துறையை தேர்வு செய்யவும்.",
    errorSelectSymptom: "படத்தைத் தொடவும் அல்லது பேசி கூறவும்.",
    audioEmergencyAlert: "அவசர நிலை பதிவானது. நேரடியாக அவசர சிகிச்சைப் பிரிவிற்கு செல்லவும்.",
    audioTokenGen: "உங்கள் டோக்கன் தயாராகி வருகிறது.",
  },
};

export interface SymptomCardTranslation {
  id: string;
  title: string;
  sub: string;
}

export const PICTORIAL_CARD_TRANSLATIONS: Record<LanguageCode, Record<string, { title: string; sub: string }>> = {
  hi: {
    "chest-pain": {
      title: "छाती में तेज दर्द",
      sub: "सीने में दबाव, बाएं हाथ में दर्द, घबराहट",
    },
    "breathing-trouble": {
      title: "सांस लेने में तकलीफ",
      sub: "दम फूलना, हांफना, सांस न आना",
    },
    "severe-bleeding": {
      title: "गंभीर चोट या खून बहना",
      sub: "दुर्घटना, कट लगना, गहरा घाव",
    },
    "pregnancy-labour": {
      title: "प्रसव / गर्भावस्था",
      sub: "डिलीवरी दर्द, गर्भावस्था में परेशानी",
    },
    "sick-baby": {
      title: "शिशु या बच्चा बीमार",
      sub: "बच्चा रो रहा है, दूध नहीं पी रहा, तेज बुखार",
    },
    "high-fever": {
      title: "तेज बुखार व चक्कर",
      sub: "कांपना, शरीर में दर्द, चक्कर आकर गिरना",
    },
    "general-consult": {
      title: "सामान्य डॉक्टर जांच",
      sub: "दवा लिखवाना, पुरानी बीमारी, चेकअप",
    },
  },
  en: {
    "chest-pain": {
      title: "Severe Chest Pain",
      sub: "Pressure, sweating, radiating arm pain",
    },
    "breathing-trouble": {
      title: "Difficulty Breathing",
      sub: "Shortness of breath, wheezing, gasp",
    },
    "severe-bleeding": {
      title: "Severe Bleeding & Injury",
      sub: "Accident, deep wound, acute trauma",
    },
    "pregnancy-labour": {
      title: "Labour Pain & Pregnancy",
      sub: "Contractions, maternal distress",
    },
    "sick-baby": {
      title: "Sick Infant / Child",
      sub: "Crying, refusal to feed, high fever",
    },
    "high-fever": {
      title: "High Fever & Dizziness",
      sub: "Chills, extreme weakness, fainting",
    },
    "general-consult": {
      title: "General Consultation",
      sub: "Prescriptions, routine checkup, reports",
    },
  },
  mr: {
    "chest-pain": {
      title: "छातीत तीव्र वेदना",
      sub: "छातीवर दबाव, घाम, डाव्या हातात वेदना",
    },
    "breathing-trouble": {
      title: "श्वास घेण्यास त्रास",
      sub: "दम लागणे, धाप लागणे, श्वास न येणे",
    },
    "severe-bleeding": {
      title: "गंभीर दुखापत किंवा रक्तस्त्राव",
      sub: "अपघात, खोल जखम, तीव्र रक्तस्त्राव",
    },
    "pregnancy-labour": {
      title: "प्रसूती वेदना आणि गरोदरपण",
      sub: "प्रसूती कळा, गरोदरपणातील अस्वस्थता",
    },
    "sick-baby": {
      title: "लहान मूल किंवा बाळ आजारी",
      sub: "मूल रडत आहे, दूध पीत नाही, तीव्र ताप",
    },
    "high-fever": {
      title: "तीव्र ताप आणि चक्कर",
      sub: "थंडी वाजणे, अंगदुखी, चक्कर येणे",
    },
    "general-consult": {
      title: "सामान्य डॉक्टर तपासणी",
      sub: "औषधोपचार, जुने आजार, नियमित चेकअप",
    },
  },
  gu: {
    "chest-pain": {
      title: "છાતીમાં તીવ્ર દુખાવો",
      sub: "છાતીમાં દબાણ, પરસેવો, હાથમાં દુખાવો",
    },
    "breathing-trouble": {
      title: "શ્વાસ લેવામાં તકલીફ",
      sub: "શ્વાસ ચડવો, હાંફ ચડવો, ગૂંગળામણ",
    },
    "severe-bleeding": {
      title: "ગંભીર ઈજા અથવા રક્તસ્ત્રાવ",
      sub: "અકસ્માત, ઊંડો ઘા, ભારે રક્તસ્ત્રાવ",
    },
    "pregnancy-labour": {
      title: "પ્રસૂતિની પીડા અને ગર્ભાવસ્થા",
      sub: "ડિલિવરીનો દુખાવો, ગર્ભાવસ્થામાં તકલીફ",
    },
    "sick-baby": {
      title: "નાનું બાળક બીમાર",
      sub: "બાળક રડે છે, દૂધ પીતું નથી, તાવ",
    },
    "high-fever": {
      title: "તીવ્ર તાવ અને ચક્કર",
      sub: "ધ્રુજારી, શરીરમાં દુખાવો, ચક્કર આવવા",
    },
    "general-consult": {
      title: "સામાન્ય ડૉક્ટર તપાસ",
      sub: "દવાઓ લખાવવી, જૂની બીમારી, ચેકઅપ",
    },
  },
  bn: {
    "chest-pain": {
      title: "বুকে তীব্র ব্যথা",
      sub: "বুকে চাপ, অতিরিক্ত ঘাম, হাতে ব্যথা",
    },
    "breathing-trouble": {
      title: "শ্বাসকষ্ট",
      sub: "দম বন্ধ হওয়া, হাঁপ ধরা, অস্বস্তি",
    },
    "severe-bleeding": {
      title: "গুরুতর আঘাত বা রক্তপাত",
      sub: "দুর্ঘটনা, গভীর ক্ষত, অতিরিক্ত রক্তপাত",
    },
    "pregnancy-labour": {
      title: "প্রসব বেদনা ও গর্ভাবস্থা",
      sub: "প্রসব যন্ত্রণা, শারীরিক অসুস্থতা",
    },
    "sick-baby": {
      title: "অসুস্থ শিশু বা বাচ্চা",
      sub: "শিশু কাঁদছে, দুধ খাচ্ছে না, তীব্র জ্বর",
    },
    "high-fever": {
      title: "তীব্র জ্বর ও মাথা ঘোরা",
      sub: "কাঁপুনী, শরীরে ব্যথা, দুর্বলতা",
    },
    "general-consult": {
      title: "সাধারণ ডাক্তার দেখানো",
      sub: "ওষুধ নেওয়া, পুরনো রোগ, রুটিন চেকআপ",
    },
  },
  ta: {
    "chest-pain": {
      title: "கடுமையான நெஞ்சு வலி",
      sub: "நெஞ்சில் அழுத்தம், அதிக வியர்வை, கை வலி",
    },
    "breathing-trouble": {
      title: "மூச்சுத்திணறல்",
      sub: "மூச்சு வாங்குதல், இரைப்பு, மூச்சடைப்பு",
    },
    "severe-bleeding": {
      title: "கடுமையான காயம் அல்லது இரத்தப்போக்கு",
      sub: "விபத்து, ஆழமான வெட்டுக் காயம்",
    },
    "pregnancy-labour": {
      title: "பிரசவ வலி மற்றும் கர்ப்பம்",
      sub: "பிரசவ வலி, கர்ப்பகால உபாதைகள்",
    },
    "sick-baby": {
      title: "நோய்வாய்ப்பட்ட குழந்தை",
      sub: "அழுகை, பால் குடிக்க மறுத்தல், காய்ச்சல்",
    },
    "high-fever": {
      title: "அதிக காய்ச்சல் மற்றும் தலைச்சுற்றல்",
      sub: "குளிர் நடுக்கம், உடல் வலி, மயக்கம்",
    },
    "general-consult": {
      title: "பொது மருத்துவர் ஆலோசனை",
      sub: "மருந்துச் சீட்டு, பழைய நோய், வழக்கமான பரிசோதனை",
    },
  },
};

// Ticket Mobile Pass Translations (Phase 2 & Phase 3)
export interface TicketTranslations {
  twistBannerTitle: string;
  twistBannerText: string;
  twistBannerDismiss: string;
  jitStage1Title: string;
  jitStage1Desc: string;
  jitStage2Title: string;
  jitStage2Desc: string;
  jitStage3Title: string;
  jitStage3Desc: string;
  audioTurnNotice: string;
  audioMute: string;
  audioTest: string;
  emergencySosBtn: string;
  cancelPassBtn: string;
}

export const TICKET_TRANSLATIONS: Record<LanguageCode, TicketTranslations> = {
  hi: {
    twistBannerTitle: "लाइव कतार समायोजन",
    twistBannerText: "गंभीर आपातकालीन मरीज को प्राथमिकता दी गई (+5 मिनट)। कृपया सहयोग करें।",
    twistBannerDismiss: "समझ गया",
    jitStage1Title: "आराम से बाहर बैठें",
    jitStage1Desc: "पर्याप्त समय है। आप कैफेटेरिया या परिसर में बैठ सकते हैं।",
    jitStage2Title: "ओपीडी हॉल की ओर आएं",
    jitStage2Desc: "आपका नंबर निकट है। कृपया ओपीडी कक्ष के पास पहुंचें।",
    jitStage3Title: "डॉक्टर के कमरे के बाहर रहें",
    jitStage3Desc: "आप कतार में अगले हैं! कृपया केबिन द्वार पर तैयार रहें।",
    audioTurnNotice: "आवाज चालू",
    audioMute: "मूक",
    audioTest: "टेस्ट",
    emergencySosBtn: "🚨 आपातकाल / गंभीर तकलीफ (Report Emergency SOS)",
    cancelPassBtn: "पास रद्द करें (Cancel Pass)",
  },
  en: {
    twistBannerTitle: "Live Queue Adjustment",
    twistBannerText: "An acute emergency case was admitted ahead (+5 mins). Thank you for your patience.",
    twistBannerDismiss: "Dismiss",
    jitStage1Title: "Safe to Wait Outside",
    jitStage1Desc: "Plenty of time. Safe to wait in cafeteria, gardens, or lounge.",
    jitStage2Title: "Head to OPD Hall",
    jitStage2Desc: "Your turn is approaching. Please move towards OPD waiting area.",
    jitStage3Title: "At Doctor Door",
    jitStage3Desc: "You are next in line! Please wait right outside doctor cabin.",
    audioTurnNotice: "Audio ON",
    audioMute: "Muted",
    audioTest: "Test",
    emergencySosBtn: "🚨 Report Emergency SOS / Deterioration",
    cancelPassBtn: "Cancel My Care Pass",
  },
  mr: {
    twistBannerTitle: "थेट रांग समायोजन",
    twistBannerText: "तातडीच्या रुग्णाला प्राधान्य देण्यात आले (+5 मिनिटे). सहकार्याबद्दल धन्यवाद.",
    twistBannerDismiss: "समजले",
    jitStage1Title: "आरामात बाहेर थांबा",
    jitStage1Desc: "पुरेसा वेळ आहे. कॅन्टीन किंवा परिसरात थांबणे सुरक्षित आहे.",
    jitStage2Title: "ओपीडी हॉलकडे या",
    jitStage2Desc: "तुमचा नंबर जवळ आला आहे. कृपया ओपीडी कक्षाजवळ या.",
    jitStage3Title: "डॉक्टरांच्या दाराजवळ थांबा",
    jitStage3Desc: "तुम्ही रांगेत पुढील आहात! कृपया केबिनच्या दाराजवळ तयार राहा.",
    audioTurnNotice: "आवाज चालू",
    audioMute: "शांत",
    audioTest: "चाचणी",
    emergencySosBtn: "🚨 आपत्कालीन स्थिती / त्रास वाढला (Report Emergency SOS)",
    cancelPassBtn: "पास रद्द करा (Cancel Pass)",
  },
  gu: {
    twistBannerTitle: "લાઇવ કતાર ગોઠવણ",
    twistBannerText: "ઇમરજન્સી દર્દીને અગ્રતા આપવામાં આવી (+5 મિનિટ). ધીરજ બદલ આભાર.",
    twistBannerDismiss: "સમજાયું",
    jitStage1Title: "આરામથી બહાર બેસો",
    jitStage1Desc: "પૂરતો સમય છે. કેન્ટીન અથવા બગીચામાં બેસવું સુરક્ષિત છે.",
    jitStage2Title: "ઓપીડી હોલ તરફ આવો",
    jitStage2Desc: "તમારો વારો નજીક છે. કૃપા કરીને ઓપીડી રૂમ પાસે પહોંચો.",
    jitStage3Title: "ડૉક્ટરના દરવાજા પાસે રહો",
    jitStage3Desc: "તમે લાઈનમાં હવે પછીના છો! કેબિન પાસે તૈયાર રહો.",
    audioTurnNotice: "અવાજ ચાલુ",
    audioMute: "શાંત",
    audioTest: "ટેસ્ટ",
    emergencySosBtn: "🚨 ઇમરજન્સી / તકલીફ વધી (Report Emergency SOS)",
    cancelPassBtn: "પાસ રદ કરો (Cancel Pass)",
  },
  bn: {
    twistBannerTitle: "লাইভ লাইন সমন্বয়",
    twistBannerText: "জরুরি রোগীকে অগ্রাধিকার দেওয়া হয়েছে (+5 মিনিট)। আপনার ধৈর্যের জন্য ধন্যবাদ।",
    twistBannerDismiss: "বুঝেছি",
    jitStage1Title: "নিরাপদে বাইরে অপেক্ষা করুন",
    jitStage1Desc: "যথেষ্ট সময় আছে। ক্যাফেটেরিয়া বা বাইরে অপেক্ষা করতে পারেন।",
    jitStage2Title: "ওপিডি হলের দিকে আসুন",
    jitStage2Desc: "আপনার পালা নিকটবর্তী। দয়া করে ওপিডি রুমের কাছে যান।",
    jitStage3Title: "ডাক্তারের দরজার সামনে থাকুন",
    jitStage3Desc: "আপনিই পরবর্তী! দয়া করে কেবিনের দরজায় প্রস্তুত থাকুন।",
    audioTurnNotice: "শব্দ চালু",
    audioMute: "নিঃশব্দ",
    audioTest: "পরীক্ষা",
    emergencySosBtn: "🚨 জরুরি অবস্থা / তীব্র সমস্যা (Report Emergency SOS)",
    cancelPassBtn: "পাস বাতিল করুন (Cancel Pass)",
  },
  ta: {
    twistBannerTitle: "நேரலை வரிசை சீரமைப்பு",
    twistBannerText: "அவசர நோயாளிக்கு முன்னுரிமை அளிக்கப்பட்டது (+5 நிமிடம்). உங்கள் பொறுமைக்கு நன்றி.",
    twistBannerDismiss: "சரி",
    jitStage1Title: "வெளியே காத்திருக்கலாம்",
    jitStage1Desc: "போதிய நேரம் உள்ளது. கேண்டீன் அல்லது வெளியில் காத்திருக்கலாம்.",
    jitStage2Title: "OPD காத்திருப்பு அறைக்கு வரவும்",
    jitStage2Desc: "உங்கள் முறை நெருங்குகிறது. தயவுசெய்து அறைக்கு அருகில் வரவும்.",
    jitStage3Title: "மருத்துவர் அறை வாசலில் நிற்கவும்",
    jitStage3Desc: "அடுத்து நீங்கள்தான்! கதவு அருகே தயாராக இருக்கவும்.",
    audioTurnNotice: "ஒலி இயக்கம்",
    audioMute: "அமைதி",
    audioTest: "சோதனை",
    emergencySosBtn: "🚨 அவசர நிலை / உடல்நலக்குறைவு (Report Emergency SOS)",
    cancelPassBtn: "பாஸை ரத்து செய் (Cancel Pass)",
  },
};
