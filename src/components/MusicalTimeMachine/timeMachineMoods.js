/**
 * timeMachineMoods.js
 * Curated nostalgic moods for "The Musical Time Machine" feature in Kaanch Ke Theke.
 * Each mood maps to a verified, existing playlist route and track.
 */

export const TIME_MACHINE_MOODS = [
  {
    id: 'purani-mohabbat',
    titleHindi: 'पुरानी मोहब्बत',
    titleEnglish: 'Old Romance',
    icon: '💌',
    playlistId: '90s',
    playlistName: '90s Ki Botal 🍾',
    eraBadge: '70s-90s क्लासिक रोमांस',
    tagline: 'पहला ख़त, हल्की सी मुस्कुराहट और हवा में तैरती पुरानी मोहब्बत की सदा।',
    description:
      'वो दौर जब प्यार मोबाइल स्क्रीन पर नहीं, बल्कि डायरियों के सूखे गुलाब और आँखों के इशारों में महकता था। किशोर दा, लता दीदी और कुमार सानू के वो सदाबहार तराने जो आज भी दिल के तार छेड़ देते हैं।',
    accentColor: '#c45d65',
    glowColor: 'rgba(196, 93, 101, 0.4)',
    highlightSong: 'Yeh Jo Mohabbat Hai',
    highlightArtist: 'किशोर कुमार',
    suggestedYoutubeId: '16pz4wFVc_w'
  },
  {
    id: 'dard-e-dil',
    titleHindi: 'दर्द-ए-दिल',
    titleEnglish: 'Heartbreak & Melancholy',
    icon: '💔',
    playlistId: 'dard-e-dil',
    playlistName: 'Dard-e-Dil Vibe 💔',
    eraBadge: 'टूटे दिल की तन्हाई',
    tagline: 'काँच का आधा भरा गिलास, आँखों में तैरती बीती यादें और सिगरेट का ख़ामोश धुआँ।',
    description:
      'जब कोई अपना बेगाना हो जाए, तो दर्द को दबाने के बजाय इन पुराने नगमों में बह जाने दीजिए। मुकेश, मोहम्मद अज़ीज़ और कुमार सत्यम के दर्द भरे सुर जो दिल के ज़ख़्मों पर मरहम का काम करते हैं।',
    accentColor: '#b83b3b',
    glowColor: 'rgba(184, 59, 59, 0.4)',
    highlightSong: 'Main Na Bhoolunga (Sad)',
    highlightArtist: 'लता मंगेशकर & मुकेश',
    suggestedYoutubeId: '1N0ZFQOHr-4'
  },
  {
    id: 'mahfil',
    titleHindi: 'महफ़िल',
    titleEnglish: 'Late-Night Ghazal & Gathering',
    icon: '🌙',
    playlistId: 'mahfil',
    playlistName: 'Ghazal & Mahfil 🌙',
    eraBadge: 'शाम-ए-ग़ज़ल व सुहानी बैठक',
    tagline: 'काँच के गिलासों की खनक, जलती लालटेन और जगजीत सिंह का अमर सोज़।',
    description:
      'देर रात की ख़ास महफ़िल जहाँ शायरी सांस लेती है और हर घूंट में सुकून उतरता है। ग़ुलाम अली, मेहदी हसन और जगजीत सिंह के वो शाहकार जो तन्हा शाम को भी एक यादगार बैठक बना देते हैं।',
    accentColor: '#d4af37',
    glowColor: 'rgba(212, 175, 55, 0.4)',
    highlightSong: 'Chupke Chupke Raat Din',
    highlightArtist: 'ग़ुलाम अली',
    suggestedYoutubeId: 'ipLEPP34-w4'
  },
  {
    id: 'barish-aur-yaadein',
    titleHindi: 'बारिश और यादें',
    titleEnglish: 'Rainy Nostalgia',
    icon: '🌧️',
    playlistId: 'barish-aur-yaadein',
    playlistName: 'Monsoon Memories 🌧️',
    eraBadge: 'भीगी शाम और पुरानी धुन',
    tagline: 'खिड़की पर गिरती बूँदें, मिट्टी की सोंधी ख़ुशबू और कुल्हड़ वाली चाय।',
    description:
      'सावन की रिमझिम फुहारों के संग पुराने बॉलीवुड के वो भीगे नग़मे, जो मन में एक अजीब सी कसक और पुरानी मुलाक़ातों की बारिश जगा देते हैं।',
    accentColor: '#3d858e',
    glowColor: 'rgba(61, 133, 142, 0.4)',
    highlightSong: 'Barsaat Ke Mausam Mein',
    highlightArtist: 'कुमार सानू',
    suggestedYoutubeId: 'ER7RoDTT2_4'
  },
  {
    id: 'raat-ka-nasha',
    titleHindi: 'रात का नशा',
    titleEnglish: 'Midnight Vintage Nasha',
    icon: '🌌',
    playlistId: 'raat-ka-nasha',
    playlistName: 'Midnight Nasha 🌌',
    eraBadge: 'आधी रात की मदहोशी',
    tagline: 'आधी रात का सन्नाटा, दूर बजता पुराना ट्रांजिस्टर और मदहोश विंटेज क्लासिक्स।',
    description:
      'जब दुनिया सो जाती है, तब ठेके का असली सुरूर जागता है। पुरानी मखमली आवाज़ें और वो जादूई धुनें जो आपको वक्त की सीमाओं से परे ले जाती हैं।',
    accentColor: '#7b4b94',
    glowColor: 'rgba(123, 75, 148, 0.4)',
    highlightSong: 'Pile Pile O Meri',
    highlightArtist: 'मोहम्मद अज़ीज़',
    suggestedYoutubeId: '9xap3GD7Vvw'
  },
  {
    id: '90s-ki-botal',
    titleHindi: '90s की बोतल',
    titleEnglish: 'Classic 90s Hits',
    icon: '🍾',
    playlistId: '90s',
    playlistName: '90s Ki Botal 🍾',
    eraBadge: 'वॉकमैन व कैसेट का दौर',
    tagline: 'पेंसिल से कैसेट लपेटना, ऑटो-रिवर्स वॉकमैन और 90s के तूफ़ानी हिट्स।',
    description:
      'वो दौर जब कुमार सानू, अलका याग्निक और उदित नारायण की आवाज़ हर नुक्कड़, पान की गुमटी और रेडियो पर गूँजती थी। 90s के सदाबहार नग़मों का असली सुरूर।',
    accentColor: '#e09f3e',
    glowColor: 'rgba(224, 159, 62, 0.4)',
    highlightSong: 'Apni To Jaise Taise',
    highlightArtist: 'किशोर कुमार',
    suggestedYoutubeId: 'vVXM_8kptDg'
  }
];
