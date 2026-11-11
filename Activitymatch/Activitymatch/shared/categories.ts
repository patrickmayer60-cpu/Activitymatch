// Stable stored values: translating labels never changes filters or statistics.
export const CATEGORIES = [
  "Laufen", "Rennrad", "Gravelbike", "Mountainbike", "Radfahren", "Inlineskaten", "Skateboard", "Schwimmen", "Triathlon",
  "Wandern", "Spazierengehen", "Fitness", "Krafttraining", "Yoga", "Pilates", "Tennis", "Padel", "Badminton",
  "Fußball", "Volleyball", "Basketball", "Klettern", "Bouldern", "Wintersport", "Wassersport",
  "Outdoor", "Gaming", "Musik", "Kunst", "Sonstiges",
] as const;
export const SPORT_CATEGORIES: readonly string[] = CATEGORIES.filter(c=>!["Outdoor","Gaming","Musik","Kunst","Spazierengehen","Sonstiges"].includes(c));
