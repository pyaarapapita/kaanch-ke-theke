export const DEFAULT_PLAYLIST_ID = '90s';

export const PLAYLISTS = [
  {
    id: '90s',
    name: '90s की बोतल',
    description: 'आज कुछ पुराना सुनते हैं — ९० के दौर के सदाबहार नग़मे।',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: 'PLDol6WidI4Uo',
    songs: [
      {
        id: 'song-90s-001',
        title: 'Kya Hua Tera Wada',
        artist: 'Mohammed Rafi',
        youtubeId: 'B-d3j4o2_54'
      },
      {
        id: 'song-90s-002',
        title: 'Main Zindagi Ka Saath Nibhata Chala Gaya',
        artist: 'Mohammed Rafi',
        youtubeId: 'W8-n8x1_RRE'
      },
      {
        id: 'song-90s-003',
        title: 'Mujhko Peena Hai Peene Do',
        artist: 'Mohd Aziz',
        youtubeId: 'Ax5jPATJM1A'
      },
      {
        id: 'song-90s-004',
        title: 'Yeh Jo Mohabbat Hai',
        artist: 'Kishore Kumar',
        youtubeId: 'TFgodv_aaYo'
      },
      {
        id: 'song-90s-005',
        title: 'Barsaat Ke Mausam Mein',
        artist: 'Kumar Sanu, Roop Kumar Rathod',
        youtubeId: 'c6F8YDsS7CI'
      },
      {
        id: 'song-90s-006',
        title: 'Mujhe Peene Ka Shauk Nahi',
        artist: 'Alka Yagnik',
        youtubeId: 'gDGO5DXqcYI'
      },
      {
        id: 'song-90s-007',
        title: 'Peele Peele O Morey Raja',
        artist: 'Tirangaa',
        youtubeId: 'EDBiqdb84rM'
      },
      {
        id: 'song-90s-008',
        title: 'Aapka Kya Hoga (Dhanno)',
        artist: 'Mika Singh, Sunidhi Chauhan',
        youtubeId: 'F9Aha2-uTso'
      },
      {
        id: 'song-90s-009',
        title: 'Do Ghut Mujhe Bhi Pila De',
        artist: 'RD Burman',
        youtubeId: 'UANG8_P224w'
      }
    ]
  },
  {
    id: 'dard-e-dil',
    name: 'दर्द-ए-दिल',
    description: 'टूटे दिल और बीती यादों के नाम एक ख़ामोश शाम।',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  },
  {
    id: 'mahfil',
    name: 'महफ़िल',
    description: 'ग़ज़लों और पुराने तराने की एक सुहानी बैठक।',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  },
  {
    id: 'barish-aur-yaadein',
    name: 'बारिश और यादें',
    description: 'बूंदों की टिप-टिप और पुराने बॉलीवुड मानसून ट्रैक्स।',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  },
  {
    id: 'raat-ka-nasha',
    name: 'रात का नशा',
    description: 'आधी रात की तन्हाई और मदहोश कर देने वाले विंटेज क्लासिक्स।',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  }
];

export const getPlaylistById = (id) => PLAYLISTS.find((p) => p.id === id) || PLAYLISTS[0];
