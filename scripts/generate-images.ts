import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT = '/home/z/my-project/public/images';
fs.mkdirSync(OUT, { recursive: true });

const STYLE = 'Professional editorial hospitality photography, warm inviting natural light, elegant boutique hotel in East Africa, sophisticated charcoal ivory and champagne gold palette, photorealistic, ultra detailed, high quality';

const IMAGES: Array<{ file: string; size: string; prompt: string }> = [
  { file: 'hero-exterior.jpg', size: '1344x768', prompt: `Grand elegant boutique hotel exterior at dusk, warm golden lights glowing from windows and entrance, manicured palm trees, deep blue twilight sky, tasteful modern African architecture with cream facade, ${STYLE}` },
  { file: 'hero-lobby.jpg', size: '1344x768', prompt: `Luxurious hotel lobby interior with double-height ceiling, warm brass chandeliers, ivory marble floor, navy velvet lounge chairs, champagne gold accents, fresh tropical flowers, ${STYLE}` },
  { file: 'hero-dining.jpg', size: '1344x768', prompt: `Elegant hotel restaurant dining room at golden hour, set tables with white linen and brass candle lanterns, large windows with tropical garden view, dark wood and rattan furniture, ${STYLE}` },
  { file: 'room-standard.jpg', size: '1344x768', prompt: `Cozy well-appointed standard hotel room, queen bed with crisp white linens and charcoal throw, warm bedside lamps, wooden headboard, ivory walls, large window with sheer curtains, ${STYLE}` },
  { file: 'room-deluxe.jpg', size: '1344x768', prompt: `Spacious deluxe hotel room with king bed, elegant navy accent wall behind upholstered headboard, champagne gold reading lamps, armchair by floor-to-ceiling window with city view, writing desk, ${STYLE}` },
  { file: 'room-executive.jpg', size: '1344x768', prompt: `Refined executive hotel suite with separate lounge area, king bed with layered ivory bedding, dark wood paneling, brass floor lamp, leather armchair, large windows with warm evening light, ${STYLE}` },
  { file: 'room-twin.jpg', size: '1344x768', prompt: `Bright twin bed hotel room, two neat single beds with white linens and gold accent cushions, warm wood furniture, reading lights, ivory walls with subtle African art print, garden view window, ${STYLE}` },
  { file: 'room-bathroom.jpg', size: '1344x768', prompt: `Elegant hotel bathroom with walk-in rain shower, ivory stone tiles, brass fixtures, backlit mirror, fluffy white towels, small potted plant, warm soft lighting, ${STYLE}` },
  { file: 'restaurant-interior.jpg', size: '1344x768', prompt: `Sophisticated hotel restaurant interior, intimate tables with white tablecloths and rattan chairs, hanging pendant lights with warm glow, dark navy feature wall, brass details, lush plants, ${STYLE}` },
  { file: 'dish-grilled-fish.jpg', size: '1024x1024', prompt: `Beautifully plated grilled tilapia fillet with coconut rice and grilled vegetables on ceramic plate, garnished with lime and herbs, dark wood table, restaurant food photography, soft natural light, appetizing, high quality` },
  { file: 'dish-breakfast.jpg', size: '1024x1024', prompt: `Hearty hotel breakfast plate with eggs, grilled tomatoes, toast and fresh tropical fruit, coffee cup beside, white linen tablecloth, morning sunlight, food photography, appetizing, high quality` },
  { file: 'dish-pilau.jpg', size: '1024x1024', prompt: `Aromatic East African beef pilau rice served in elegant ceramic bowl with fresh salad side, warm spices visible, dark rustic table, restaurant food photography, appetizing, high quality` },
  { file: 'dish-coffee.jpg', size: '1024x1024', prompt: `Artisan cappuccino in elegant ceramic cup with latte art, small plate of banana fritters, marble table top, warm cafe lighting, food and beverage photography, high quality` },
  { file: 'meeting-room.jpg', size: '1344x768', prompt: `Professional hotel conference room, long dark wood table with leather chairs, large presentation screen, recessed warm ceiling lights, navy feature wall with brass sconces, water glasses and notepads, ${STYLE}` },
  { file: 'meeting-boardroom.jpg', size: '1344x768', prompt: `Intimate executive boardroom, oval walnut table, eight high-back chairs, city view through large windows, minimalist elegance, warm lighting, small tropical plant centerpiece, ${STYLE}` },
  { file: 'common-terrace.jpg', size: '1344x768', prompt: `Hotel garden terrace lounge with wicker sofas, striped ivory cushions, shade umbrellas, lush tropical plants, string lights overhead, golden late afternoon light, ${STYLE}` },
  { file: 'about-reception.jpg', size: '1344x768', prompt: `Warm welcoming hotel reception desk with dark wood counter, brass lamps, staff bell, orchid arrangement, soft ivory walls, framed artwork, inviting professional hospitality atmosphere, ${STYLE}` },
  { file: 'gallery-corridor.jpg', size: '1344x768', prompt: `Elegant hotel corridor with warm wall sconces, ivory walls, dark wood doors with brass numbers, patterned carpet runner, soft perspective, ${STYLE}` },
  { file: 'gallery-poolside.jpg', size: '1344x768', prompt: `Serene small hotel courtyard pool at dusk, turquoise water reflecting warm lights, loungers with white towels, tropical plants, lanterns, peaceful upscale atmosphere, ${STYLE}` },
];

async function main() {
  const zai = await ZAI.create();
  for (const img of IMAGES) {
    const out = path.join(OUT, img.file);
    if (fs.existsSync(out) && fs.statSync(out).size > 20000) {
      console.log(`skip existing ${img.file}`);
      continue;
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await zai.images.generations.create({ prompt: img.prompt, size: img.size });
        const b64 = response.data?.[0]?.base64;
        if (!b64) throw new Error('no data');
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        console.log(`ok ${img.file}`);
        break;
      } catch (e: any) {
        console.error(`fail ${img.file} attempt ${attempt}: ${e.message}`);
        if (attempt === 3) console.error(`GAVE UP ${img.file}`);
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
  }
  console.log('ALL DONE');
}
main();
