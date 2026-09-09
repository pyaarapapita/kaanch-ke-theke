export const DEFAULT_PLAYLIST_ID = '90s';

export const PLAYLISTS = [
  {
    id: '90s',
    name: '90s की बोतल',
    description: 'आज कुछ पुराना सुनते हैं।',
    background: '/backgrounds/theka-bg.png',
    youtubePlaylistId: 'PLDol6WidI4Uo',
    songs: [
      {
        id: 'song-90s-001',
        title: 'Kya Hua Tera Wada',
        artist: 'Mohammed Rafi',
        youtubeId: ''
      },
      {
        id: 'song-90s-002',
        title: 'Main Zindagi Ka Saath Nibhata Chala Gaya',
        artist: 'Mohammed Rafi',
        youtubeId: ''
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
      },
      {
        id: 'song-90s-010',
        title: 'Pandit Ji Mere Marne Ke Baad',
        artist: 'Unknown',
        youtubeId: ''
      }
    ]
  }
];

export const getPlaylistById = (id) => {
  return PLAYLISTS.find((p) => p.id === id) || PLAYLISTS[0];
};
