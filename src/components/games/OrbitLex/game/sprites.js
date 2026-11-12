function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}
export async function loadSprites(base = "/sprites") {
  const b = base.replace(/\/$/, "");
  const [ship, coin, bolt, crystal, planet, platform, spike, checkpoint, flag] = await Promise.all([Promise.all([0, 1, 2, 3].map(i => loadImage(`${b}/ship-${i}.png`))), Promise.all([0, 1, 2, 3].map(i => loadImage(`${b}/coin-${i}.png`))), Promise.all([0, 1, 2, 3].map(i => loadImage(`${b}/bolt-${i}.png`))), Promise.all([0, 1, 2, 3].map(i => loadImage(`${b}/crystal-${i}.png`))), loadImage(`${b}/planet.png`), loadImage(`${b}/platform.png`), loadImage(`${b}/spike.png`), loadImage(`${b}/checkpoint.png`), loadImage(`${b}/flag.png`)]);
  return {
    ship,
    coin,
    bolt,
    crystal,
    planet,
    platform,
    spike,
    checkpoint,
    flag
  };
}