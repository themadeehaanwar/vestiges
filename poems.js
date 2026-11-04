/* =========================================================
   EDIT ME — this is the only file you need to touch.
   Poems are listed NEWEST first. To add a poem:
   1. put its images in /img  (e.g. myPoem-1.webp, myPoem-2.webp)
   2. copy one block below, change id/title/slides/mood
   ---------------------------------------------------------
   mood.fx options (mix freely):
     butterflies, moths, petals, flowers, dust, stars, rain,
     embers, bubbles, sparkles, stains, fog, clouds, rays, scratches,
     blooms (tap to grow big flowers that wilt)
   mood.flower: "ixora" for ixora clusters · mood.petal: "floret"
   mood.flyColors: butterfly wing colours · mood.drowsy: slow sleepy blinks
   mood.sound options:
     ocean, rain, wind, vinyl, heartbeat, chimes, night, fire, drone, room, sleep
   mood.grunge: 0 (clean) → 1 (full grunge, flicker, grain)
   mood.note: the explanation shown under "the note" (leave "" to hide)
   ========================================================= */

const SITE = {
  name: "Madeeha A.",
  tagline: "poems, moodboards & everything that was too much to keep inside",
  email: "themadeehaanwar@gmail.com",
  phone: "7595868655",
};

const POEMS = [
  {
    id: "pebbles", title: "Pebbles", date: "Sep 2026",
    slides: ["pebbles-1"],
    mood: { bg: "#0a2440", accent: "#9fd4ff", fx: ["bubbles", "rays", "sparkles"], colors: ["#e8f6ff", "#9fd4ff"], grunge: 0, sound: "ocean" },
    note: "",
  },
  {
    id: "enormity", title: "Enormity", date: "Aug 2026",
    slides: ["enormity-1", "enormity-2", "enormity-3", "enormity-4", "enormity-5"],
    mood: { bg: "#0d0908", accent: "#b3121b", fx: ["dust", "stains", "scratches", "moths"], colors: ["#7a0d12", "#3a2a22"], stain: "#6e0b10", grunge: 1, sound: "heartbeat" },
    note: "",
  },
  {
    id: "kiwi", title: "Kiwi", date: "Jul 2026",
    slides: ["kiwi-1"],
    mood: { bg: "#bcd99c", accent: "#5f8f3a", fx: ["butterflies", "flowers", "petals"], colors: ["#ffffff", "#e6f5c8", "#cfe8a8"], grunge: 0, sound: "vinyl" },
    note: "",
  },
  {
    id: "intimacies", title: "Intimacies", date: "May 2026",
    slides: ["intimacies-1"],
    mood: { bg: "#cdb994", accent: "#8a2a1c", fx: ["dust", "stains", "petals"], colors: ["#9b2d20", "#e9dcc0"], stain: "#7a5a2e", grunge: 0.25, sound: "vinyl" },
    note: "",
  },
  {
    id: "ixora", title: "Ixora", date: "May 2026",
    slides: ["ixora-1"],
    mood: { bg: "#f08a3a", accent: "#ffd27a", fx: ["flowers", "petals", "butterflies", "rays"], flower: "ixora", petal: "floret", colors: ["#ff3b1f", "#ff5a2c", "#ff7a35"], flyColors: ["#ffb347", "#ffd27a"], grunge: 0, sound: "wind" },
    note: "",
  },
  {
    id: "theology", title: "A Theology of You", date: "Dec 2025",
    slides: ["theology-1", "theology-2", "theology-3", "theology-4", "theology-5", "theology-6"],
    mood: { bg: "#f4f1ea", accent: "#9a7b2f", fx: ["dust", "sparkles"], colors: ["#c9a14a", "#e8d39a"], grunge: 0, sound: "room" },
    note: "",
  },
  {
    id: "pastelpink", title: "Pastel Pink", date: "Nov 2025",
    slides: ["pastelpink-1"],
    mood: { bg: "#f7c9dc", accent: "#e0568c", fx: ["clouds", "sparkles", "petals", "butterflies"], colors: ["#ffffff", "#ffd1e3", "#ff9ec4"], flyColors: ["#ff8fbf", "#f59cc8", "#e86fa6", "#ffb3d6"], grunge: 0, sound: "chimes" },
    note: "",
  },
  {
    id: "flowers", title: "Flowers", date: "May 2025",
    slides: ["flowers-1"],
    mood: { bg: "#d9b8e6", accent: "#8b4fa6", fx: ["blooms", "petals", "butterflies"], colors: ["#f2a7c9", "#e88fb8", "#c99be0", "#f6d4e8"], flyColors: ["#b57ad1", "#f2a7c9"], grunge: 0, sound: "wind" },
    note: "Sometimes, love sits too long in your chest with nowhere to go.\n\nThe ache of withheld tenderness grows heavier like the slow rot of something beautiful that stayed too long in your hands.",
  },
  {
    id: "belching", title: "belching", date: "Apr 2025",
    slides: ["belching-1"],
    mood: { bg: "#1b140c", accent: "#c9a66b", fx: ["dust", "moths", "stains", "scratches"], colors: ["#6b4a2a", "#c9a66b"], stain: "#4a2f14", grunge: 0.8, sound: "drone" },
    note: "",
  },
  {
    id: "shutter", title: "Shutter", date: "Apr 2025",
    slides: ["shutter-1"],
    mood: { bg: "#151515", accent: "#bbbbbb", fx: ["dust", "fog"], colors: ["#cccccc", "#777777"], grunge: 0.4, drowsy: true, sound: "sleep" },
    note: "",
  },
  {
    id: "yellowcanvas", title: "Yellow Canvas", date: "Apr 2025",
    slides: ["yellowcanvas-1"],
    mood: { bg: "#e9d27a", accent: "#8a6d12", fx: ["dust", "rays", "stains"], colors: ["#fff3b0", "#d9b440"], stain: "#a3842a", grunge: 0.35, sound: "wind" },
    note: "This is a collection of moments I've witnessed - of my grandmother slowly aging. Starting with the moment that set me up for a truth unfolding which I was not ready to witness.\n\nFrom the first painful visual of my grandmother that I cannot shake from my memory. She lay on the patient canvas stretched out, yet paradoxically shrunken. Her empty eyes fixated in mine as her sons and paramedics blurred into my vision turning into nothing more than looming vertical shapes which now I can only recall as \"pillars\" with the whole world around her as large as life threatening to collapse.\n\nHer eyes, as if hollow and finally refusing to recognise me. I see her eyes getting lost behind layers of almost glass - like cataract - greyer every time I visit her. Her skin loose, flesh disappearing, as her body becomes less a vessel for life and more an encasing shell.\n\nWhen she came back from the hospital, I remember her frail bony fingers hugging her face trying desperately to hold her pain. Her body shrunken evermore, dissolving into the smallest of chairs - dissolving under the lightest of sheets.",
  },
  {
    id: "wraith", title: "Wraith", date: "Mar 2025",
    slides: ["wraith-1"],
    mood: { bg: "#1e2a30", accent: "#a9c3cf", fx: ["fog", "dust", "moths", "scratches"], colors: ["#a9c3cf", "#556670"], grunge: 0.7, sound: "wind" },
    note: "",
  },
  {
    id: "spectre", title: "Spectre", date: "Mar 2025",
    slides: ["spectre-1"],
    mood: { bg: "#27313a", accent: "#c7d3dc", fx: ["fog", "rain"], colors: ["#c7d3dc", "#7f8e99"], grunge: 0.6, sound: "rain" },
    note: "",
  },
  {
    id: "constellations", title: "constellations", date: "Feb 2025",
    slides: ["constellations-1"],
    mood: { bg: "#050507", accent: "#ffffff", fx: ["stars", "sparkles", "dust"], colors: ["#ffffff", "#d8d8ff"], grunge: 0.3, sound: "night" },
    note: "In Constellations, love is not merely an emotion—it is an unshakable force, vast and luminous, like the universe itself. The beloved is celestial, their very presence bending reality, shifting the fabric of existence as they move. The poem does not focus on longing, transformation, or self-reflection; rather, it stands as an ode to them, to the breathtaking enormity of their being.\n\nThe self is rendered small—not just in feeling, but in form. There is no capitalisation of ‘i,’ no attempt to elevate the speaker beside the beloved. The poem exists as an unbroken stream of admiration, a testament to the boundless gravity of their presence.",
  },
  {
    id: "sugar", title: "sugar", date: "Feb 2025",
    slides: ["sugar-1"],
    mood: { bg: "#2b4f8f", accent: "#cfe0ff", fx: ["sparkles", "petals", "bubbles"], colors: ["#ffffff", "#bcd3ff", "#6f95e0"], grunge: 0, sound: "rain" },
    note: "Sugar is a poem about the lingering presence of someone who has left, yet refuses to fade. It explores how certain people remain woven into our thoughts, even when we have consciously moved on. Though time passes, though life continues, they reappear—quietly at first, then more persistently, lingering like static, like a spectre that refuses to be exorcised.\n\nThe poem does not end with release. The spectre does not leave. Instead, it lingers, as certain memories do—persistent and unshakable, appearing when least expected.",
  },
  {
    id: "soulcrush", title: "soulcrush", date: "Oct 2024",
    slides: ["soulcrush-1", "soulcrush-2", "soulcrush-3", "soulcrush-4", "soulcrush-5", "soulcrush-6", "soulcrush-7", "soulcrush-8"],
    mood: { bg: "#e8630f", accent: "#ffd166", fx: ["embers", "butterflies", "petals", "rays"], colors: ["#ffcf3f", "#ff7b22", "#c4230e"], grunge: 0, sound: "fire" },
    note: "Soulcrush is a poem of absolute, all-encompassing devotion—of a love so intense that it transcends the boundaries of self. It is not about fear, loss, or longing from a distance; it is about presence. The title itself merges the idea of a romantic crush with something deeper—a fascination not with the body or the mind alone, but with the soul.\n\nWhile Soulcrush was being written, I Wanna Be Yours by Arctic Monkeys played in the background—a song that lingers on the mundane as a way of expressing devotion. That fixation on the smallest, most ordinary details found its way into this poem.\n\nThe love in Soulcrush is not about holding, possessing, or even belonging to one another. It is about becoming.",
  },
  {
    id: "lovedeluge", title: "Love Deluge", date: "Nov 2022",
    slides: ["lovedeluge-1"],
    mood: { bg: "#7fa8d6", accent: "#e8f1ff", fx: ["rain", "bubbles", "petals"], colors: ["#ffffff", "#cfe0f5", "#3d6fb0"], grunge: 0, sound: "rain" },
    note: "Love Deluge is an exploration of love as something overwhelming—something that consumes rather than nurtures. Instead of a gentle affection, this love is a force of nature, relentless and inescapable, drawing its subject in like a tide and refusing to let go. Water imagery dominates the poem, not as a symbol of purity or renewal, but as something engulfing, even dangerous.\n\nThis theme of suffocating love closely echoes Miriam in D. H. Lawrence’s Sons and Lovers. Love, when too consuming, ceases to be a gift and becomes a cage.",
  },
];
