/**
 * The scroll storyboard as data. Each stage is a complete pose of the rig. The timeline
 * moves between them, and scrollTimeline.js decides where on the page each one lands.
 *
 * c* camera position     t* camera look-at     d* disc position
 * rx/rz disc tilt        spin disc rotation    opacity scene dim over the page
 * halo lamp glow behind the disc               dust particle visibility
 * parallax pointer influence                   float idle movement
 * key key-light strength                       rim cool rim-light strength
 * room baked back room visibility              tapes cassette visibility
 * stack 0 = tapes loose, 1 = gathered in a stack beside the playlists
 *
 * Stage names are historical: "chronicles" lands on the shayari chapter and "shayari" on
 * the Time Machine. scrollTimeline.js holds the mapping from stage to page anchor.
 *
 * The hero stages must match the captured posters. Recapture them if a hero value changes.
 */
const TURN = Math.PI * 2

const hero = {
  cx: 0, cy: 1.8, cz: 4.4,
  tx: 0, ty: 0, tz: 0,
  spin: 0, opacity: 1, halo: 0, dust: 0.6, parallax: 1, float: 1, key: 1, rim: 1,
  // The room and tapes are absent at the hero, so the captured posters stay exact.
  room: 0, tapes: 0, stack: 0
}

const DESKTOP = {
  hero: { ...hero, dx: 1.48, dy: 0.15, dz: -0.2, rx: 0.52, rz: -0.16 },
  // First scroll: the camera leans in towards the record and it starts to turn.
  approach: {
    cx: 0.65, cy: 1.3, cz: 3.25, tx: 1.05, ty: 0.02, tz: -0.1,
    dx: 1.55, dy: 0.05, dz: -0.2, rx: 0.6, rz: -0.12,
    spin: TURN * 0.45, opacity: 0.8, halo: 0.55, dust: 0.8, parallax: 0.6, float: 0.25, key: 1
  },
  // Counter: past the record's edge, low and close, so it reads as a large dark form at the side.
  counter: {
    cx: 2.15, cy: 0.42, cz: 2.75, tx: 0.45, ty: 0.02, tz: -0.25,
    dx: 1.65, dy: -0.05, dz: -0.45, rx: 0.34, rz: -0.08,
    spin: TURN * 0.85, opacity: 0.5, halo: 0.8, dust: 1, parallax: 0.35, float: 0, key: 0.95
  },
  // Chronicles and shayari: a slow drift with the record pushed out to the right gutter.
  chronicles: {
    cx: 1.25, cy: 1.05, cz: 4.2, tx: -0.2, ty: -0.05, tz: -0.2,
    dx: 2.25, dy: 0.3, dz: -0.75, rx: 0.5, rz: -0.14,
    spin: TURN * 1.3, opacity: 0.42, halo: 0.6, dust: 0.9, parallax: 0.25, float: 0, key: 0.85
  },
  shayari: {
    cx: 0.55, cy: 1.35, cz: 4.5, tx: -0.45, ty: -0.1, tz: -0.2,
    dx: 2.45, dy: -0.25, dz: -0.85, rx: 0.56, rz: -0.1,
    spin: TURN * 1.75, opacity: 0.34, halo: 0.45, dust: 0.75, parallax: 0.2, float: 0, key: 0.8
  },
  // Cassette game: the tapes are the subject, so the record waits low in the gutter.
  rewind: {
    cx: 0.1, cy: 1.42, cz: 4.65, tx: -0.48, ty: -0.12, tz: -0.2,
    dx: 2.48, dy: -0.5, dz: -0.82, rx: 0.59, rz: -0.08,
    spin: TURN * 1.9, opacity: 0.28, halo: 0.38, dust: 0.9, parallax: 0.18, float: 0, key: 0.78
  },
  // Playlists: settled and dim, so the cards carry the screen.
  playlist: {
    cx: -0.3, cy: 1.5, cz: 4.8, tx: -0.5, ty: -0.15, tz: -0.2,
    dx: 2.5, dy: -0.75, dz: -0.8, rx: 0.62, rz: -0.06,
    spin: TURN * 2.05, opacity: 0.24, halo: 0.3, dust: 0.5, parallax: 0.15, float: 0, key: 0.75
  },
  // Story and community: lifting back into view as the camera starts to retreat.
  story: {
    cx: 0.1, cy: 1.75, cz: 5.1, tx: 0.1, ty: 0, tz: -0.1,
    dx: 2.1, dy: -0.2, dz: -0.55, rx: 0.56, rz: -0.12,
    spin: TURN * 2.35, opacity: 0.42, halo: 0.45, dust: 0.65, parallax: 0.3, float: 0, key: 0.9
  },
  // Final: pulled back and at rest above the footer, deliberately not at the hero angle.
  final: {
    cx: 0.2, cy: 2.2, cz: 5.6, tx: 0.2, ty: 0.25, tz: 0,
    dx: 1.75, dy: 0.65, dz: -0.3, rx: 0.68, rz: -0.2,
    spin: TURN * 2.6, opacity: 0.72, halo: 0.75, dust: 0.8, parallax: 0.4, float: 0.3, key: 1
  }
}

// Portrait layouts have no gutters: content covers the full width, so the record stays
// centred, inside the screen, and much dimmer behind reading sections.
function portrait(dy) {
  return {
    hero: { ...hero, dx: 0, dy, dz: -0.32, rx: 0.4, rz: -0.08 },
    approach: {
      cx: 0, cy: 1.72, cz: 4.3, tx: 0, ty: 0.12, tz: 0,
      dx: 0, dy: dy - 0.1, dz: -0.25, rx: 0.48, rz: -0.05,
      spin: TURN * 0.45, opacity: 0.88, halo: 0.5, dust: 0.8, parallax: 0, float: 0.25, key: 1
    },
    counter: {
      cx: 0.7, cy: 1.1, cz: 4.1, tx: 0.1, ty: 0.15, tz: 0,
      dx: 0.05, dy: dy - 0.2, dz: -0.3, rx: 0.42, rz: -0.08,
      spin: TURN * 0.85, opacity: 0.34, halo: 0.6, dust: 1, parallax: 0, float: 0, key: 0.95
    },
    chronicles: {
      cx: 0.35, cy: 1.45, cz: 4.5, tx: 0, ty: 0.05, tz: 0,
      dx: 0, dy: dy - 0.42, dz: -0.35, rx: 0.5, rz: -0.06,
      spin: TURN * 1.3, opacity: 0.22, halo: 0.45, dust: 0.8, parallax: 0, float: 0, key: 0.85
    },
    shayari: {
      cx: -0.3, cy: 1.6, cz: 4.6, tx: 0, ty: 0, tz: 0,
      dx: 0, dy: dy - 0.55, dz: -0.35, rx: 0.54, rz: -0.04,
      spin: TURN * 1.75, opacity: 0.18, halo: 0.35, dust: 0.65, parallax: 0, float: 0, key: 0.8
    },
    rewind: {
      cx: -0.15, cy: 1.65, cz: 4.7, tx: 0, ty: 0, tz: 0,
      dx: 0, dy: dy - 0.62, dz: -0.35, rx: 0.56, rz: -0.03,
      spin: TURN * 1.9, opacity: 0.16, halo: 0.3, dust: 0.75, parallax: 0, float: 0, key: 0.78
    },
    playlist: {
      cx: 0, cy: 1.7, cz: 4.8, tx: 0, ty: 0, tz: 0,
      dx: 0, dy: dy - 0.7, dz: -0.35, rx: 0.58, rz: -0.02,
      spin: TURN * 2.05, opacity: 0.14, halo: 0.25, dust: 0.45, parallax: 0, float: 0, key: 0.75
    },
    story: {
      cx: 0, cy: 1.8, cz: 4.9, tx: 0, ty: 0.05, tz: 0,
      dx: 0, dy: dy - 0.45, dz: -0.3, rx: 0.52, rz: -0.05,
      spin: TURN * 2.35, opacity: 0.22, halo: 0.35, dust: 0.55, parallax: 0, float: 0, key: 0.9
    },
    final: {
      cx: 0, cy: 2.05, cz: 5.2, tx: 0, ty: 0.3, tz: 0,
      dx: 0, dy: dy + 0.04, dz: -0.25, rx: 0.56, rz: -0.1,
      spin: TURN * 2.6, opacity: 0.55, halo: 0.6, dust: 0.7, parallax: 0, float: 0.25, key: 1
    }
  }
}

// The cool rim light separates the disc's edge at the hero angle. At the low angles later in
// the story it would tint the whole record blue, away from the amber palette.
const RIM_BY_STAGE = { approach: 0.7, counter: 0.15, chronicles: 0.25, shayari: 0.25, rewind: 0.25, playlist: 0.25, story: 0.4, final: 0.5 }

// P2: the back room fades in behind the record as the camera moves in, and the tapes come
// out in the chronicles, then gather into a stack for the playlists.
const ROOM_AND_TAPES = {
  desktop: {
    approach: { room: 0.45, tapes: 0, stack: 0 },
    counter: { room: 0.85, tapes: 0.35, stack: 0 },
    chronicles: { room: 0.75, tapes: 1, stack: 0 },
    shayari: { room: 0.7, tapes: 1, stack: 0 },
    rewind: { room: 0.72, tapes: 1, stack: 0.12 },
    playlist: { room: 0.8, tapes: 1, stack: 1 },
    story: { room: 0.7, tapes: 0.85, stack: 1 },
    final: { room: 0.85, tapes: 0.7, stack: 1 }
  },
  portrait: {
    approach: { room: 0.4, tapes: 0, stack: 0 },
    counter: { room: 0.7, tapes: 0.3, stack: 0 },
    chronicles: { room: 0.6, tapes: 0.9, stack: 0 },
    shayari: { room: 0.55, tapes: 0.9, stack: 0 },
    rewind: { room: 0.58, tapes: 1, stack: 0.12 },
    playlist: { room: 0.6, tapes: 1, stack: 1 },
    story: { room: 0.55, tapes: 0.8, stack: 1 },
    final: { room: 0.7, tapes: 0.6, stack: 1 }
  }
}

function withRim(stages, extras) {
  const result = {}
  for (const [name, pose] of Object.entries(stages)) {
    result[name] = { ...pose, rim: RIM_BY_STAGE[name] ?? pose.rim, ...extras[name] }
  }
  return result
}

// Atlas row order in make_cassette_labels.mjs, matched to playlist ids in data/playlists.js.
export const TAPE_PLAYLISTS = ['90s', 'dard-e-dil', 'mahfil', 'barish-aur-yaadein', 'raat-ka-nasha']

// Tape poses in screen space: x and y are fractions of the half-view (-1 to 1), depth is
// the distance from the camera. Loose poses also carry [tilt, yaw, roll].
// Desktop content covers the middle ~82% of the width, so the tapes stay beyond |x| 0.84.
const DESKTOP_TAPES = {
  scale: 0.55,
  loose: [
    [-0.9, 0.55, 7.5, -0.18, 0.35, 0.1],
    [-0.92, -0.2, 9, 0.15, 0.25, -0.15],
    [0.91, 0.62, 8.5, -0.12, -0.4, 0.08],
    [-0.89, -0.72, 8, 0.22, 0.2, 0.2],
    // Kept above the docked player rail, which covers the lower right.
    [0.92, -0.08, 9.5, -0.18, -0.3, -0.1]
  ],
  pile: { x: -0.9, y: -0.6, depth: 8, step: 0.075, lean: 0.95, yaw: 0.3, slide: 0.05 }
}

// Portrait content covers the whole width, so tapes sit high and small, above the
// reading line, and the scene behind them is already dimmed.
const PORTRAIT_TAPES = {
  scale: 0.42,
  loose: [
    [-0.68, 0.78, 8, -0.18, 0.35, 0.1],
    [0.7, 0.72, 9, 0.15, -0.3, -0.12],
    [-0.25, 0.86, 10, 0.2, 0.2, 0.15],
    [0.3, 0.84, 9.5, -0.2, -0.25, -0.08],
    [0.0, 0.7, 11, 0.1, 0.1, 0.05]
  ],
  pile: { x: 0.55, y: 0.6, depth: 9, step: 0.06, lean: 0.95, yaw: -0.25, slide: -0.08 }
}

export const LAYOUTS = {
  // textFadeShare: how far through the hero the text has gone. In portrait the text starts
  // below the disc and scrolls up over it, so it has to be gone sooner.
  desktop: { scale: 1.05, textFadeShare: 0.62, tapes: DESKTOP_TAPES, stages: withRim(DESKTOP, ROOM_AND_TAPES.desktop) },
  tablet: { scale: 0.72, textFadeShare: 0.3, tapes: PORTRAIT_TAPES, stages: withRim(portrait(0.68), ROOM_AND_TAPES.portrait) },
  phone: { scale: 0.54, textFadeShare: 0.3, tapes: PORTRAIT_TAPES, stages: withRim(portrait(0.62), ROOM_AND_TAPES.portrait) }
}

// Match the poster breakpoints in VinylHero.css.
export function getLayoutName(aspect) {
  if (aspect < 13 / 20) return 'phone'
  return aspect < 26 / 25 ? 'tablet' : 'desktop'
}

export const INITIAL_CAMERA = { position: [hero.cx, hero.cy, hero.cz], fov: 42 }
