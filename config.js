/* ==========================================================
   GAME CONFIG — edit this file to change names, dates, URLs
   ========================================================== */
window.GAME_CONFIG = {
  // Paste your Google Apps Script Web App URL here after deploying backend/Code.gs
  // e.g. "https://script.google.com/macros/s/AKfycbwv2n56cB7JoDxPLDoC49fmXXwikY0KBBGtGqObQ3b6wshdjJ6Pkb75mZ71HAlU7Hlo3g/exec"
  SUBMIT_URL: "",

  // Set true while testing to unlock every puzzle regardless of date
  DEV_UNLOCK_ALL: true,

  // The 24 suspects. `id` must stay 1–24 (the backend validates this).
  // Rename freely — the name is what shows on the board and in the results sheet.
  CHIPS: [
    { id: 1,  name: "Doc Chip",          img: "assets/chips/chip-01.png" },
    { id: 2,  name: "Pirate Chip",       img: "assets/chips/chip-02.png" },
    { id: 3,  name: "Prospector Chip",   img: "assets/chips/chip-03.png" },
    { id: 4,  name: "Cashier Chip",     img: "assets/chips/chip-04.png" },
    { id: 5,  name: "Stone Chip",        img: "assets/chips/chip-05.png" },
    { id: 6,  name: "Cowpoke Chip",      img: "assets/chips/chip-06.png" },
    { id: 7,  name: "Coach Chip",      img: "assets/chips/chip-07.png" },
    { id: 8,  name: "Elf Chip",          img: "assets/chips/chip-08.png" },
    { id: 9,  name: "Chippy",    img: "assets/chips/chip-09.png" },
    { id: 10, name: "Workout Chip",      img: "assets/chips/chip-10.png" },
    { id: 11, name: "Explorer Chip",     img: "assets/chips/chip-11.png" },
    { id: 12, name: "Dealer Chip",       img: "assets/chips/chip-12.png" },
    { id: 13, name: "Sergeant Chip",     img: "assets/chips/chip-13.png" },
    { id: 14, name: "Foreman Chip",      img: "assets/chips/chip-14.png" },
    { id: 15, name: "Chipeneeezer Scrooge",       img: "assets/chips/chip-15.png" },
    { id: 16, name: "Robo Chip",         img: "assets/chips/chip-16.png" },
    { id: 17, name: "Space Ranger Chip", img: "assets/chips/chip-17.png" },
    { id: 18, name: "Salesman Chip",    img: "assets/chips/chip-18.png" },
    { id: 19, name: "Professor Chip",    img: "assets/chips/chip-19.png" },
    { id: 20, name: "Noir Chip",         img: "assets/chips/chip-20.png" },
    { id: 21, name: "Zen Chip",          img: "assets/chips/chip-21.png" },
    { id: 22, name: "Cuckoo Chip",        img: "assets/chips/chip-22.png" },
    { id: 23, name: "Reindeer Chip",     img: "assets/chips/chip-23.png" },
    { id: 24, name: "Santa Chip",        img: "assets/chips/chip-24.png" }
  ],

  // Puzzles on the computer. `unlock` is a local date (YYYY-MM-DD); the file unlocks at midnight.
  // Later: set `url` to a puzzle page (e.g. "puzzles/puzzle-1.html") and it will open in the viewer.
  PUZZLES: [
    { id: 1, title: "Case File #1", subtitle: "Code Crackers", unlock: "2026-11-30", url: "puzzles/case-1/index.html" },
    { id: 2, title: "Case File #2", subtitle: "Synonym Cookies", unlock: "2026-12-07", url: "puzzles/case-2/index.html" },
    { id: 3, title: "Case File #3", subtitle: "Return to Sender", unlock: "2026-12-14", url: "puzzles/case-3/index.html" },
    { id: 4, title: "Case File #4", subtitle: "Quite the ADVENT-ure", unlock: "2026-12-21", url: "https://skywardharmony.com/adventhome", external: true }
  ]
};
