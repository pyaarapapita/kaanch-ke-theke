export const DEFAULT_PLAYLIST_ID = '90s';

export const PLAYLISTS = [
  {
    id: '90s',
    name: '90s Ki Botal 🍾',
    description: 'Purani yaadein, late night mood aur 90s ke iconic bangers.',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: 'PLDol6WidI4Uo',
    songs: [
      {
        id: 'song-90s-001',
        title: 'Kya Hua Tera Wada',
        artist: 'Mohammed Rafi',
        youtubeId: 'cIVkYSm7Orw'
      },
      {
        id: 'song-90s-002',
        title: 'Main Zindagi Ka Saath Nibhata Chala Gaya',
        artist: 'Mohammed Rafi',
        youtubeId: '8xLGdI9_jak'
      },
      {
        id: 'song-90s-003',
        title: 'Mujhko Peena Hai Peene Do',
        artist: 'Mohd Aziz',
        youtubeId: 'ZDsneGdOdaQ'
      },
      {
        id: 'song-90s-004',
        title: 'Yeh Jo Mohabbat Hai',
        artist: 'Kishore Kumar',
        youtubeId: '5-lRnMrz6Ok'
      },
      {
        id: 'song-90s-005',
        title: 'Barsaat Ke Mausam Mein',
        artist: 'Kumar Sanu, Roop Kumar Rathod',
        youtubeId: 'Q_cq8__k--M'
      },
      {
        id: 'song-90s-006',
        title: 'Mujhe Peene Ka Shauk Nahi',
        artist: 'Alka Yagnik',
        youtubeId: '7DgiWQSN-jQ'
      },
      {
        id: 'song-90s-007',
        title: 'Peele Peele O Morey Raja',
        artist: 'Tirangaa',
        youtubeId: 'ZAK8L8jQSeQ'
      },
      {
        id: 'song-90s-008',
        title: 'Aapka Kya Hoga (Dhanno)',
        artist: 'Mika Singh, Sunidhi Chauhan',
        youtubeId: 'gcVbtUGLDNk'
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
    name: 'Dard-e-Dil Vibe 💔',
    description: 'Sip, regret & repeat — toote dil waalon ka dedicated corner.',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  },
  {
    id: 'mahfil',
    name: 'Ghazal & Mahfil 🌙',
    description: 'Retro ghazals aur shaam ki peaceful baithak.',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  },
  {
    id: 'barish-aur-yaadein',
    name: 'Monsoon Memories 🌧️',
    description: 'Baarish ki tip-tip aur iconic retro monsoon tracks.',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  },
  {
    id: 'raat-ka-nasha',
    name: 'Midnight Nasha 🌌',
    description: 'Aadhi raat ki tanhai aur madhosh vintage hits.',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: '',
    isUpcoming: true,
    songs: []
  }
];

export const getPlaylistById = (id) => PLAYLISTS.find((p) => p.id === id) || PLAYLISTS[0];
