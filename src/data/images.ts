/**
 * Demo imagery from Unsplash (free to use under the Unsplash License:
 * https://unsplash.com/license). People pictured are stock-photo models and are
 * NOT the fictional therapists or clients described on this site.
 * Swap these for the clinic's own photography before going live.
 */
const u = (id: string, w = 1200, h?: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}${h ? `&h=${h}` : ''}`

export const images = {
  heroChild: u('1503454537195-1dcabb73ffb9', 1100, 1300),
  heroPlay: u('1515488042361-ee00e0ddd4e4', 600, 600),
  guidedWriting: u('1544776193-352d25ca82cd', 1200, 1000),
  drawingHands: u('1596464716127-f2a82984de30', 900, 900),
  paintPlay: u('1560421683-6856ea585c78', 900, 900),
  boyWriting: u('1560785496-3c9d27877182', 900, 900),
  playroom: u('1567746455504-cb3213f8f5b8', 1200, 900),
  remoteChild: u('1610484826917-0f101a7bf7f4', 1200, 900),
  familyHome: u('1581952976147-5a2d15560349', 1200, 900),
  toyCamera: u('1516627145497-ae6968895b74', 1200, 900),
  playDough: u('1564429238817-393bd4286b2d', 1200, 900),
  familyOutdoors: u('1609220136736-443140cffec6', 1200, 1000),
  kidsSmiling: u('1607453998774-d533f65dac99', 1200, 900),
  sprinklerJoy: u('1489710437720-ebb67ec84dd2', 1600, 1000),
  toysFlatlay: u('1545558014-8692077e9b5c', 900, 900),
  therapistSofia: u('1567532939604-b6b5b0db2604', 800, 900),
  therapistJulien: u('1507003211169-0a1dd7228f2d', 800, 900),
  therapistLeah: u('1580489944761-15a19d654956', 800, 900),
  therapistRosa: u('1573497019940-1c28c88b4f3e', 800, 900),
} as const
