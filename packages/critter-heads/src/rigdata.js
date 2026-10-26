// Skeleton data per character: shoulders, arm lengths, rest hands and named anchors.
// Coordinates are in the shared 240x300 character space (root-local, before body transforms).
// Anchors marked in HEAD_ANCHORS live in head space and follow the head (tilt, nod, lookAt).

export const HEAD_ANCHORS = new Set([
  "chin", "mouth", "cheekL", "cheekR", "headTop", "earL", "earR", "eyeL", "eyeR", "brow", "glasses",
]);

const RIGS = {
  fox: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [96, 162], shoulderR: [144, 162],
    restL: [72, 212], restR: [168, 212],
    upper: 29, fore: 29,
    anchors: {
      chin: [120, 151], mouth: [120, 131], cheekL: [84, 124], cheekR: [156, 124],
      headTop: [120, 54], earL: [76, 64], earR: [164, 64], eyeL: [90, 103], eyeR: [150, 103],
      brow: [120, 84], glasses: [120, 103],
      chest: [120, 180], belly: [120, 206], hipL: [97, 220], hipR: [143, 220],
    },
  },
  owl: {
    head: { pivot: [120, 160], pos: 0.75, rot: 0.75 },
    shoulderL: [74, 142], shoulderR: [166, 142],
    restL: [45, 204], restR: [195, 204],
    upper: 34, fore: 34,
    anchors: {
      chin: [120, 140], mouth: [120, 120], cheekL: [80, 126], cheekR: [160, 126],
      headTop: [120, 50], earL: [64, 44], earR: [176, 44], eyeL: [93, 103], eyeR: [147, 103],
      brow: [120, 80], glasses: [120, 104],
      chest: [120, 172], belly: [120, 200], hipL: [92, 214], hipR: [148, 214],
    },
  },
  cat: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [95, 160], shoulderR: [145, 160],
    restL: [65, 212], restR: [175, 212],
    upper: 30, fore: 30,
    anchors: {
      chin: [120, 149], mouth: [120, 131], cheekL: [84, 122], cheekR: [156, 122],
      headTop: [120, 58], earL: [80, 60], earR: [160, 60], eyeL: [92, 104], eyeR: [148, 104],
      brow: [120, 86], glasses: [120, 104],
      chest: [120, 178], belly: [120, 204], hipL: [96, 220], hipR: [144, 220],
    },
  },
  raccoon: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [90, 162], shoulderR: [150, 162],
    restL: [62, 212], restR: [178, 212],
    upper: 30, fore: 30,
    anchors: {
      chin: [120, 151], mouth: [120, 132], cheekL: [84, 124], cheekR: [156, 124],
      headTop: [120, 56], earL: [80, 62], earR: [160, 62], eyeL: [92, 104], eyeR: [148, 104],
      brow: [120, 86], glasses: [120, 104],
      chest: [120, 182], belly: [120, 208], hipL: [92, 222], hipR: [148, 222],
    },
  },
  panda: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [86, 158], shoulderR: [154, 158],
    restL: [56, 214], restR: [184, 214],
    upper: 33, fore: 32,
    anchors: {
      chin: [120, 150], mouth: [120, 131], cheekL: [82, 124], cheekR: [158, 124],
      headTop: [120, 52], earL: [78, 58], earR: [162, 58], eyeL: [92, 104], eyeR: [148, 104],
      brow: [120, 86], glasses: [120, 104],
      chest: [120, 184], belly: [120, 212], hipL: [88, 224], hipR: [152, 224],
    },
  },
  dog: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [95, 160], shoulderR: [145, 160],
    restL: [70, 212], restR: [170, 212],
    upper: 29, fore: 29,
    anchors: {
      chin: [120, 153], mouth: [120, 132], cheekL: [82, 126], cheekR: [158, 126],
      headTop: [120, 56], earL: [80, 40], earR: [160, 40], eyeL: [95, 102], eyeR: [145, 102],
      brow: [120, 82], glasses: [120, 102],
      chest: [120, 182], belly: [120, 206], hipL: [96, 222], hipR: [144, 222],
    },
  },
  bunny: {
    head: { pivot: [120, 148], pos: 1, rot: 1 },
    shoulderL: [97, 162], shoulderR: [143, 162],
    restL: [72, 212], restR: [168, 212],
    upper: 28, fore: 28,
    anchors: {
      chin: [120, 152], mouth: [120, 133], cheekL: [84, 128], cheekR: [156, 128],
      headTop: [120, 66], earL: [100, 30], earR: [140, 30], eyeL: [97, 108], eyeR: [143, 108],
      brow: [120, 90], glasses: [120, 108],
      chest: [120, 182], belly: [120, 206], hipL: [97, 222], hipR: [143, 222],
    },
  },
  bear: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [82, 158], shoulderR: [158, 158],
    restL: [52, 216], restR: [188, 216],
    upper: 33, fore: 33,
    anchors: {
      chin: [120, 154], mouth: [120, 133], cheekL: [80, 124], cheekR: [160, 124],
      headTop: [120, 52], earL: [72, 60], earR: [168, 60], eyeL: [99, 100], eyeR: [141, 100],
      brow: [120, 84], glasses: [120, 100],
      chest: [120, 184], belly: [120, 214], hipL: [86, 226], hipR: [154, 226],
    },
  },
  frog: {
    head: { pivot: [120, 148], pos: 1, rot: 1 },
    shoulderL: [92, 162], shoulderR: [148, 162],
    restL: [60, 214], restR: [180, 214],
    upper: 32, fore: 32,
    anchors: {
      chin: [120, 148], mouth: [120, 124], cheekL: [80, 116], cheekR: [160, 116],
      headTop: [120, 58], earL: [90, 62], earR: [150, 62], eyeL: [90, 80], eyeR: [150, 80],
      brow: [120, 56], glasses: [120, 80],
      chest: [120, 182], belly: [120, 206], hipL: [94, 222], hipR: [146, 222],
    },
  },
  otter: {
    head: { pivot: [120, 146], pos: 1, rot: 1 },
    shoulderL: [96, 164], shoulderR: [144, 164],
    restL: [68, 214], restR: [172, 214],
    upper: 30, fore: 30,
    anchors: {
      chin: [120, 148], mouth: [120, 134], cheekL: [86, 120], cheekR: [154, 120],
      headTop: [120, 58], earL: [78, 74], earR: [162, 74], eyeL: [97, 102], eyeR: [143, 102],
      brow: [120, 84], glasses: [120, 102],
      chest: [120, 182], belly: [120, 208], hipL: [98, 222], hipR: [142, 222], pendant: [120, 178],
    },
  },
};

export function getRig(characterId) {
  return RIGS[characterId] || RIGS.fox;
}

// Map a head-space point into root space with the head's current transform
// (translate(headX, headY) + rotate(headRot) about the head pivot, scaled per character).
export function headPoint(rig, pose, x, y) {
  const { pivot, pos, rot } = rig.head;
  const a = ((pose.headRot || 0) * rot * Math.PI) / 180;
  const dx = x - pivot[0];
  const dy = y - pivot[1];
  return [
    pivot[0] + dx * Math.cos(a) - dy * Math.sin(a) + (pose.headX || 0) * pos,
    pivot[1] + dx * Math.sin(a) + dy * Math.cos(a) + (pose.headY || 0) * pos,
  ];
}
