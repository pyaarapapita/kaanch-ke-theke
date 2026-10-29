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
        title: 'Yeh Jo Mohabbat Hai',
        artist: 'Kishore Kumar',
        youtubeId: '16pz4wFVc_w'
      },
      {
        id: 'song-90s-002',
        title: 'Barsaat Ke Mausam Mein',
        artist: 'Kumar Sanu',
        youtubeId: 'ER7RoDTT2_4'
      },
      {
        id: 'song-90s-003',
        title: 'Pile Pile O Meri',
        artist: 'Mohammad Aziz',
        youtubeId: '9xap3GD7Vvw'
      },
      {
        id: 'song-90s-004',
        title: 'Apni To Jaise Taise',
        artist: 'Kishore Kumar',
        youtubeId: 'vVXM_8kptDg'
      },
      {
        id: 'song-90s-005',
        title: 'Main Na Bhoolunga (Sad)',
        artist: 'Lata Mangeshkar, Mukesh',
        youtubeId: '1N0ZFQOHr-4'
      },
      {
        id: 'song-90s-006',
        title: 'Kya Hua Tera Vada',
        artist: 'Mohammed Rafi',
        youtubeId: 'OnomKR46aP4'
      },
      {
        id: 'song-90s-007',
        title: 'Main Zindagi Ka Saath Nibhata Chala Gaya',
        artist: 'Mohammed Rafi',
        youtubeId: 'xnaqXjeYYE8'
      },
      {
        id: 'song-90s-008',
        title: 'Duniya Bananewale',
        artist: 'Mukesh',
        youtubeId: 'b4nDex-MQNc'
      },
      {
        id: 'song-90s-009',
        title: 'Mujhko Pina Hai Peene Do',
        artist: 'Mohammad Aziz',
        youtubeId: 'yPTP8P-y_Oo'
      },
      {
        id: 'song-90s-010',
        title: 'खामोश लब हैं झुकी निगाहें',
        artist: 'कुमार सत्यम',
        youtubeId: 'vY7vYX0ITOQ'
      },
      {
        id: 'song-90s-011',
        title: 'Khamosh Lab Hai Jhuki Hai Palkein',
        artist: 'Mehdi Hassan Style',
        youtubeId: 'z3uynSFb1VM'
      },
      {
        id: 'song-90s-012',
        title: 'Pehli Pehli Baar Mohabbat Ki Hai',
        artist: 'Kumar Sanu, Alka Yagnik',
        youtubeId: 'LMrgv7bRLQM'
      },
      {
        id: 'song-90s-013',
        title: 'Main Na Bhoolunga (Happy)',
        artist: 'Lata Mangeshkar, Mukesh',
        youtubeId: 'Xqtr77stwKo'
      },
      {
        id: 'song-90s-014',
        title: 'Chupke Chupke Raat Din Aansoon Bahana',
        artist: 'Ghulam Ali',
        youtubeId: 'ipLEPP34-w4'
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

export const getPlaylistById = (id, playlistsList = PLAYLISTS) =>
  playlistsList.find((p) => p.id === id) || null;
