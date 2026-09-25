// 11 cấp độ Stockfish 19 từ 800 đến 3200+ Elo
// Sử dụng các option chuẩn UCI: Skill Level (0 - 20), UCI_LimitStrength, UCI_Elo, movetime
export const BOTS = [
  {
    id: 'bot1',
    name: 'Stockfish Level 1',
    title: 'Mầm non',
    titleEn: 'Beginner',
    elo: 800,
    skillLevel: 0,
    depth: 1,
    movetime: 200,
    randomChance: 0.5,
    tier: 'beginner',
    desc: 'Cấp độ cho người mới bắt đầu học chơi cờ',
    descEn: 'Entry level for players new to chess'
  },
  {
    id: 'bot2',
    name: 'Stockfish Level 2',
    title: 'Tập sự',
    titleEn: 'Novice',
    elo: 1000,
    skillLevel: 1,
    depth: 2,
    movetime: 250,
    randomChance: 0.3,
    tier: 'beginner',
    desc: 'Biết các luật cờ cơ bản và nước đi đơn giản',
    descEn: 'Knows basic rules and simple piece movements'
  },
  {
    id: 'bot3',
    name: 'Stockfish Level 3',
    title: 'Phong trào',
    titleEn: 'Casual',
    elo: 1200,
    skillLevel: 3,
    depth: 3,
    movetime: 300,
    randomChance: 0.2,
    tier: 'beginner',
    desc: 'Kỳ thủ cờ phong trào, thích tấn công nhanh',
    descEn: 'Casual player who loves quick attacking play'
  },
  {
    id: 'bot4',
    name: 'Stockfish Level 4',
    title: 'Trung cấp',
    titleEn: 'Intermediate',
    elo: 1400,
    skillLevel: 5,
    depth: 4,
    movetime: 350,
    randomChance: 0.1,
    tier: 'intermediate',
    desc: 'Nắm vững khai cuộc cơ bản và chiến thuật phối hợp',
    descEn: 'Solid grasp of fundamental tactics and openings'
  },
  {
    id: 'bot5',
    name: 'Stockfish Level 5',
    title: 'Kỳ thủ CLB',
    titleEn: 'Club Player',
    elo: 1600,
    skillLevel: 7,
    depth: 5,
    movetime: 400,
    randomChance: 0.05,
    tier: 'intermediate',
    desc: 'Đấu thủ câu lạc bộ, thế cờ chặt chẽ',
    descEn: 'Club level with disciplined positional play'
  },
  {
    id: 'bot6',
    name: 'Stockfish Level 6',
    title: 'Cao thủ CLB',
    titleEn: 'Club Master',
    elo: 1800,
    skillLevel: 10,
    depth: 6,
    movetime: 500,
    randomChance: 0,
    tier: 'intermediate',
    desc: 'Kỳ thủ kinh nghiệm, ít khi mắc sai lầm sơ đẳng',
    descEn: 'Experienced club player, rarely makes blunders'
  },
  {
    id: 'bot7',
    name: 'Stockfish Level 7',
    title: 'Chuyên nghiệp',
    titleEn: 'Tournament Pro',
    elo: 2000,
    skillLevel: 12,
    depth: 8,
    movetime: 600,
    randomChance: 0,
    tier: 'advanced',
    desc: 'Trình độ vận động viên cờ vua chuyên nghiệp',
    descEn: 'Tournament athlete strength with deep calculation'
  },
  {
    id: 'bot8',
    name: 'Stockfish Level 8',
    title: 'Kiện tướng CM',
    titleEn: 'Candidate Master',
    elo: 2200,
    skillLevel: 14,
    depth: 10,
    movetime: 700,
    randomChance: 0,
    tier: 'advanced',
    desc: 'Ứng cử viên kiện tướng (Candidate Master)',
    descEn: 'Candidate Master (CM) level with sharp tactical vision'
  },
  {
    id: 'bot9',
    name: 'Stockfish Level 9',
    title: 'Kiện tướng FM',
    titleEn: 'FIDE Master',
    elo: 2400,
    skillLevel: 16,
    depth: 12,
    movetime: 800,
    randomChance: 0,
    tier: 'advanced',
    desc: 'Kiện tướng FIDE, tính toán nước sâu và hiểm hóc',
    descEn: 'FIDE Master (FM) finding complex combinations'
  },
  {
    id: 'bot10',
    name: 'Stockfish Level 10',
    title: 'Đại kiện tướng GM',
    titleEn: 'Grandmaster',
    elo: 2600,
    skillLevel: 18,
    depth: 14,
    movetime: 1000,
    randomChance: 0,
    tier: 'master',
    desc: 'Đại kiện tướng quốc tế (Grandmaster)',
    descEn: 'International Grandmaster (GM) level prowess'
  },
  {
    id: 'bot11',
    name: 'Stockfish 19 MAX',
    title: 'Vô địch Thế giới',
    titleEn: 'World Champion',
    elo: 3200,
    skillLevel: 20,
    depth: 18,
    movetime: 1200,
    randomChance: 0,
    tier: 'master',
    desc: 'Sức mạnh tối đa của mạng nơ-ron Stockfish 19 NNUE',
    descEn: 'Peak strength of Stockfish 19 NNUE neural network'
  }
]

export const DEFAULT_BOT_ID = 'bot5'

export function getBot(id) {
  return BOTS.find((b) => b.id === id) || BOTS.find((b) => b.id === DEFAULT_BOT_ID)
}
