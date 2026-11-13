// Copy and structure for the homepage chapters. Ids here are also the scroll anchors that
// Experience/scrollTimeline.js measures, so renaming one means updating it there too.

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

export function toDevanagari(value) {
  return String(value).replace(/\d/g, (digit) => DEVANAGARI_DIGITS[Number(digit)])
}

export const CHAPTERS = [
  { id: 'chapter-counter', label: 'काउण्टर' },
  { id: 'chapter-shayari', label: 'शायरी' },
  { id: 'chapter-machine', label: 'टाइम मशीन' },
  { id: 'chapter-rewind', label: 'रील लपेटो' },
  { id: 'chapter-moods', label: 'महफ़िलें' },
  { id: 'chapter-story', label: 'कहानी' }
]

export const SHAYARI_COLLECTION = [
  {
    id: 'ghalib-1',
    sher: 'हज़ारों ख़्वाहिशें ऐसी कि हर ख़्वाहिश पे दम निकले,\nबहुत निकले मिरे अरमाँ लेकिन फिर भी कम निकले।',
    poet: 'मिर्ज़ा ग़ालिब',
    era: 'क्लासिक ग़ज़ल दौर',
    context: 'गायन: जगजीत सिंह • अमर नज़्म'
  },
  {
    id: 'sahir-1',
    sher: 'मैं ज़िंदगी का साथ निभाता चला गया,\nहर फ़िक्र को धुएँ में उड़ाता चला गया।',
    poet: 'साहिर लुधियानवी',
    era: 'हम दोनों (1961)',
    context: 'गायन: मुहम्मद रफ़ी • संगीत: जयदेव'
  },
  {
    id: 'gulzar-1',
    sher: 'आँखों में जल रहा है क्यूँ बुझता नहीं धुआँ,\nउठता है दिल से दर्द कि रुकता नहीं धुआँ।',
    poet: 'गुलज़ार',
    era: 'माचिस (1996)',
    context: 'गायन: सुरेश वाडेकर • संगीत: विशाल भारद्वाज'
  },
  {
    id: 'fakir-1',
    sher: 'ये दौलत भी ले लो, ये शोहरत भी ले लो,\nभले छीन लो मुझसे मेरी जवानी...\nमगर मुझको लौटा दो बचपन का सावन,\nवो काग़ज़ की कश्ती, वो बारिश का पानी।',
    poet: 'सुदर्शन फ़ाकिर',
    era: 'आज (1982)',
    context: 'गायन: जगजीत सिंह & चित्रा सिंह'
  },
  {
    id: 'shailendra-1',
    sher: 'गाता रहे मेरा दिल, तू ही मेरी मंज़िल,\nकहीं बीतें ना ये रातें, कहीं बीतें ना ये दिन।',
    poet: 'शैलेंद्र',
    era: 'गाइड (1965)',
    context: 'गायन: किशोर कुमार & लता मंगेशकर • संगीत: एस. डी. बर्मन'
  },
  {
    id: 'sahir-2',
    sher: 'कभी कभी मेरे दिल में ख़याल आता है,\nकि जैसे तुझको बनाया गया है मेरे लिए।',
    poet: 'साहिर लुधियानवी',
    era: 'कभी कभी (1976)',
    context: 'गायन: मुकेश • संगीत: खय्याम'
  },
  {
    id: 'hasrat-1',
    sher: 'चुपके चुपके रात दिन आँसू बहाना याद है,\nहमको अब तक आशिक़ी का वो ज़माना याद है।',
    poet: 'हसरत मोहानी',
    era: 'निकाह (1982)',
    context: 'गायन: ग़ुलाम अली • क्लासिक तराना'
  },
  {
    id: 'bakshi-1',
    sher: 'ज़िंदगी के सफ़र में गुज़र जाते हैं जो मक़ाम,\nवो फिर नहीं आते, वो फिर नहीं आते।',
    poet: 'आनंद बक्षी',
    era: 'आप की कसम (1974)',
    context: 'गायन: किशोर कुमार • संगीत: आर. डी. बर्मन'
  }
]

// Hindi copy for each playlist id in data/playlists.js. Whether a mood is playable comes
// from the playlist itself, so this list never has to be kept in step with it.
export const MOOD_COPY = {
  '90s': {
    title: '90s की बोतल',
    tagline: 'वॉकमैन व कैसेट का दौर',
    desc: 'पेंसिल से रील लपेटना, ऑटो-रिवर्स कैसेट और देर रात छत पर बजता ट्रांजिस्टर।'
  },
  mahfil: {
    title: 'काँच के जाम व ग़ज़ल',
    tagline: 'धीमी रात की महफ़िल',
    desc: 'जगजीत सिंह का सोज़, जलती लालटेन और काँच के गिलासों में उतरता सुकून।'
  },
  'barish-aur-yaadein': {
    title: 'रिमझिम बारिश',
    tagline: 'भीगी शाम और पुरानी धुन',
    desc: 'खिड़की पर गिरती बूँदें, कुल्हड़ वाली चाय और किशोर दा के भीगे नग़मे।'
  },
  'dard-e-dil': {
    title: 'दर्द-ए-दिल',
    tagline: 'तन्हाई और पुराना अफ़साना',
    desc: 'टूटे दिलों की दास्तान और रफ़ी साहब के वो नग़मे जो सीधा रूह में उतर जाएँ।'
  },
  'raat-ka-nasha': {
    title: 'आधी रात का नशा',
    tagline: 'तन्हाई और मदहोश धुनें',
    desc: 'आधी रात की ख़ामोशी, धीमी रौशनी और वो नग़मे जो नींद से पहले आख़िरी साथी बनते हैं।'
  }
}
