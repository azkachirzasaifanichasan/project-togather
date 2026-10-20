import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIES: { name: string; slug: string; interests: string[] }[] = [
  {
    name: "Olahraga",
    slug: "olahraga",
    interests: ["Lari", "Futsal", "Panjat tebing", "Bulu tangkis", "Yoga"],
  },
  {
    name: "Seni & Kreatif",
    slug: "seni-kreatif",
    interests: ["Melukis", "Fotografi", "Ilustrasi & desain", "Film pendek"],
  },
  {
    name: "Teknologi",
    slug: "teknologi",
    interests: ["Pemrograman", "Desain UI/UX", "Robotika", "Data & AI"],
  },
  {
    name: "Literasi",
    slug: "literasi",
    interests: ["Menulis", "Membaca & diskusi buku", "Jurnalistik"],
  },
  {
    name: "Musik",
    slug: "musik",
    interests: ["Gitar akustik", "Band & pertunjukan", "Paduan suara"],
  },
  {
    name: "Kerajinan",
    slug: "kerajinan",
    interests: ["Merajut", "Menjahit", "Tanah liat", "Anyaman"],
  },
  {
    name: "Sosial & Lingkungan",
    slug: "sosial-lingkungan",
    interests: ["Relawan sosial", "Penghijauan", "Bank sampah"],
  },
  {
    name: "Bahasa",
    slug: "bahasa",
    interests: ["Bahasa Inggris", "Bahasa Jawa", "Bahasa Jepang", "Bahasa isyarat"],
  },
];

interface SeedCommunity {
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  lat?: number;
  lng?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  verifiedBy?: "team" | "owner";
  scheduleSlots: string;
  interests: string[];
  joinLink?: string;
  website?: string;
  ownerEmail?: string;
}

function dayFromNow(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function dayAgo(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const COMMUNITIES: SeedCommunity[] = [
  {
    name: "Lari Jogja Runners",
    slug: "lari-jogja-runners",
    description:
      "Komunitas lari santai untuk semua level. Kami rutin lari pagi keliling Alun-Alun Utara lalu sarapan bersama — tanpa tekanan kecepatan, yang penting konsisten dan saling menyemangati.",
    category: "olahraga",
    city: "Yogyakarta",
    lat: -7.807,
    lng: 110.3637,
    isVerified: true,
    verifiedBy: "team",
    scheduleSlots: "weekend-morning",
    interests: ["Lari"],
    joinLink: "https://instagram.com/larijogjarunners",
    ownerEmail: "demo@togather.id",
  },
  {
    name: "Futsal Sore Cik Di Tiro",
    slug: "futsal-sore-cik-di-tiro",
    description:
      "Kelompok futsal santai yang main rutin dua kali seminggu setelah jam kerja. Terbuka untuk level pemula sampai mahir — cukup bawa sepatu dan semangat.",
    category: "olahraga",
    city: "Yogyakarta",
    lat: -7.7823,
    lng: 110.3754,
    scheduleSlots: "weekday-evening",
    interests: ["Futsal"],
    joinLink: "https://instagram.com/futsalcikditiro",
  },
  {
    name: "Komunitas Panjat Tebing Yogyakarta",
    slug: "panjat-tebing-yogyakarta",
    description:
      "Wadah para pemanjat dinding dan tebing alam di sekitar Jogja. Rutin latihan teknik dan trip ke tebing sekitar setiap akhir pekan.",
    category: "olahraga",
    city: "Yogyakarta",
    lat: -7.7955,
    lng: 110.3694,
    isVerified: true,
    verifiedBy: "owner",
    scheduleSlots: "weekend-morning,weekend-afternoon",
    interests: ["Panjat tebing"],
    joinLink: "https://instagram.com/panjatjogja",
  },
  {
    name: "Sketsa Kota",
    slug: "sketsa-kota",
    description:
      "Komunitas menggambar dan sketsa urban. Setiap akhir pekan kami duduk di sudut kota dan menggambar suasana sekitar — dari belakang Malioboro sampai gang kampung.",
    category: "seni-kreatif",
    city: "Yogyakarta",
    lat: -7.7956,
    lng: 110.3657,
    isVerified: true,
    verifiedBy: "team",
    scheduleSlots: "weekend-afternoon",
    interests: ["Ilustrasi & desain", "Melukis"],
    joinLink: "https://instagram.com/sketsakota",
  },
  {
    name: "Klub Foto Malioboro",
    slug: "klub-foto-malioboro",
    description:
      "Pecinta fotografi jalanan dan dokumenter. Hunting foto bersama setiap Minggu pagi, lalu saling berbagi hasil dan kritik membangun.",
    category: "seni-kreatif",
    city: "Yogyakarta",
    lat: -7.7936,
    lng: 110.3666,
    scheduleSlots: "weekend-morning",
    interests: ["Fotografi"],
    joinLink: "https://instagram.com/klubfotomalioboro",
  },
  {
    name: "Sinema Kecil Jogja",
    slug: "sinema-kecil-jogja",
    description:
      "Komunitas penonton dan pembuat film pendek independen. Nobar film bersama dan bedah proses produksi setiap dua minggu sekali.",
    category: "seni-kreatif",
    city: "Yogyakarta",
    lat: -7.7825,
    lng: 110.375,
    isVerified: true,
    verifiedBy: "owner",
    scheduleSlots: "weekend-evening",
    interests: ["Film pendek", "Fotografi"],
    joinLink: "https://instagram.com/sinemakeciljogja",
  },
  {
    name: "Developer Circle Jogja",
    slug: "developer-circle-jogja",
    description:
      "Komunitas pengembang perangkat lunak lintas level. Meetup teknis bulanan, sesi berbagi pengalaman, dan proyek kolaborasi open source.",
    category: "teknologi",
    city: "Yogyakarta",
    lat: -7.7596,
    lng: 110.4094,
    isVerified: true,
    verifiedBy: "team",
    scheduleSlots: "weekday-evening",
    interests: ["Pemrograman", "Data & AI", "Desain UI/UX"],
    joinLink: "https://instagram.com/devcirclejogja",
    website: "https://devcirclejogja.id",
    ownerEmail: "owner2@togather.id",
  },
  {
    name: "Robotika Pelajar Jogja",
    slug: "robotika-pelajar-jogja",
    description:
      "Komunitas pelajar dan mahasiswa yang belajar merakit serta memprogram robot untuk lomba dan proyek edukasi.",
    category: "teknologi",
    city: "Yogyakarta",
    lat: -7.7761,
    lng: 110.3789,
    scheduleSlots: "weekend-afternoon",
    interests: ["Robotika", "Pemrograman"],
    joinLink: "https://instagram.com/robotikapelajarjogja",
  },
  {
    name: "Coder Nusantara",
    slug: "coder-nusantara",
    description:
      "Komunitas daring untuk belajar pemrograman bersama dari berbagai kota. Diskusi seputar karier, code review, dan tantangan ngoding mingguan.",
    category: "teknologi",
    city: "Online",
    isOnline: true,
    isVerified: true,
    verifiedBy: "owner",
    scheduleSlots: "weekday-evening,weekend-afternoon",
    interests: ["Pemrograman", "Data & AI"],
    joinLink: "https://instagram.com/codernusantara",
  },
  {
    name: "Buku & Kopi Jogja",
    slug: "buku-kopi-jogja",
    description:
      "Klub baca santai yang bertemu di kafe-kafe kecil. Tiap bulan kami memilih satu buku, lalu berdiskusi sambil ngopi.",
    category: "literasi",
    city: "Yogyakarta",
    lat: -7.7847,
    lng: 110.3759,
    isVerified: true,
    verifiedBy: "team",
    scheduleSlots: "weekend-morning",
    interests: ["Membaca & diskusi buku", "Menulis"],
    joinLink: "https://instagram.com/bukudankopijogja",
  },
  {
    name: "Pena Nusantara",
    slug: "pena-nusantara",
    description:
      "Komunitas menulis untuk saling mengasah naskah fiksi dan nonfiksi. Ada sesi bedah tulisan dan tantangan menulis harian.",
    category: "literasi",
    city: "Yogyakarta",
    lat: -7.795,
    lng: 110.369,
    scheduleSlots: "weekday-evening,weekend-afternoon",
    interests: ["Menulis", "Jurnalistik"],
    joinLink: "https://instagram.com/penanusantara",
  },
  {
    name: "Gitar Akustik Selatan",
    slug: "gitar-akustik-selatan",
    description:
      "Wadah bagi pemain gitar pemula dan mahir untuk latihan bareng, bedah chord, dan sesi akustik mingguan di ruang terbuka.",
    category: "musik",
    city: "Yogyakarta",
    lat: -7.815,
    lng: 110.397,
    isVerified: true,
    verifiedBy: "owner",
    scheduleSlots: "weekend-evening",
    interests: ["Gitar akustik"],
    joinLink: "https://instagram.com/gitarakustikselatan",
    ownerEmail: "owner@togather.id",
  },
  {
    name: "Paduan Suara Cakrawala",
    slug: "paduan-suara-cakrawala",
    description:
      "Komunitas paduan suara untuk mahasiswa dan umum. Latihan rutin tiap minggu, tampil di acara kampus dan ruang publik.",
    category: "musik",
    city: "Yogyakarta",
    lat: -7.777,
    lng: 110.377,
    scheduleSlots: "weekday-evening",
    interests: ["Paduan suara", "Band & pertunjukan"],
    joinLink: "https://instagram.com/pscakrawala",
  },
  {
    name: "Merajut Bareng Jogja",
    slug: "merajut-bareng-jogja",
    description:
      "Komunitas merajut dan merenda untuk segala usia. Belajar pola dasar sampai proyek rajut bersama sambil berbagi cerita.",
    category: "kerajinan",
    city: "Yogyakarta",
    lat: -7.797,
    lng: 110.368,
    isVerified: true,
    verifiedBy: "team",
    scheduleSlots: "weekend-afternoon",
    interests: ["Merajut", "Menjahit"],
    joinLink: "https://instagram.com/merajutbarengjogja",
    ownerEmail: "owner@togather.id",
  },
  {
    name: "Gerakan Hijau Kota",
    slug: "gerakan-hijau-kota",
    description:
      "Komunitas penghijauan dan perawatan ruang terbuka hijau. Rutin tanam, susur sungai, dan sosialisasi pengelolaan sampah.",
    category: "sosial-lingkungan",
    city: "Yogyakarta",
    lat: -7.7826,
    lng: 110.3779,
    isVerified: true,
    verifiedBy: "team",
    scheduleSlots: "weekend-morning",
    interests: ["Penghijauan", "Bank sampah"],
    joinLink: "https://instagram.com/gerakanhijaukota",
  },
  {
    name: "Relawan Sapa Warga",
    slug: "relawan-sapa-warga",
    description:
      "Relawan sosial yang rutin mengadakan bakti sosial, mentoring anak, dan bantuan edukasi untuk warga sekitar.",
    category: "sosial-lingkungan",
    city: "Yogyakarta",
    lat: -7.786,
    lng: 110.375,
    scheduleSlots: "weekend-morning,weekend-afternoon",
    interests: ["Relawan sosial"],
    joinLink: "https://instagram.com/relawansapawarga",
  },
  {
    name: "English Club Jogja",
    slug: "english-club-jogja",
    description:
      "Kelompok latihan percakapan bahasa Inggris yang santai dan bebas gengsi. Speaking, diskusi topik hangat, dan games mingguan.",
    category: "bahasa",
    city: "Yogyakarta",
    lat: -7.7807,
    lng: 110.3756,
    isVerified: true,
    verifiedBy: "owner",
    scheduleSlots: "weekday-evening",
    interests: ["Bahasa Inggris"],
    joinLink: "https://instagram.com/englishclubjogja",
  },
  {
    name: "Bahasa Isyarat Jogja",
    slug: "bahasa-isyarat-jogja",
    description:
      "Komunitas belajar bahasa isyarat untuk membangun masyarakat yang lebih inklusif. Kelas dasar dan praktik percakapan tiap pekan.",
    category: "bahasa",
    city: "Yogyakarta",
    lat: -7.783,
    lng: 110.374,
    scheduleSlots: "weekend-afternoon",
    interests: ["Bahasa isyarat"],
    joinLink: "https://instagram.com/bahasaisyaratjogja",
  },
];

const EVENT_SEEDS: {
  community: string;
  title: string;
  description: string;
  venueName: string;
  lat: number;
  lng: number;
  inDays: number;
  hour: number;
  capacity?: number;
}[] = [
  {
    community: "lari-jogja-runners",
    title: "Lari Pagi Alun-Alun Utara",
    description:
      "Lari santai 5K keliling alun-alun lalu sarapan gudeg bersama. Terbuka untuk semua level.",
    venueName: "Alun-Alun Utara",
    lat: -7.807,
    lng: 110.3637,
    inDays: 6,
    hour: 6,
    capacity: 40,
  },
  {
    community: "lari-jogja-runners",
    title: "Long Run Minggu ke Tugu",
    description: "Lari jarak sedang 8K rute Alun-Alun – Tugu Pal Putih dan kembali.",
    venueName: "Titik kumpul Alun-Alun Utara",
    lat: -7.807,
    lng: 110.3637,
    inDays: 13,
    hour: 6,
    capacity: 30,
  },
  {
    community: "developer-circle-jogja",
    title: "Meetup: Membangun API dengan TypeScript",
    description:
      "Sesi berbagi praktik membangun REST API yang aman dan teruji menggunakan TypeScript, plus sesi code review kolaboratif.",
    venueName: "Co-working space, Jl. Kaliurang KM 5",
    lat: -7.7596,
    lng: 110.4094,
    inDays: 3,
    hour: 19,
    capacity: 35,
  },
  {
    community: "developer-circle-jogja",
    title: "Ngoding Bareng & Open Source Day",
    description: "Hari kontribusi terbuka: pilih isu, pair programming, dan kirim pull request pertama.",
    venueName: "Daring (link dibagikan setelah daftar)",
    lat: -7.7596,
    lng: 110.4094,
    inDays: 10,
    hour: 10,
    capacity: 50,
  },
  {
    community: "sketsa-kota",
    title: "Sketsa Urban di Kawasan Kotabaru",
    description: "Duduk bersama menggambar fasad bangunan Kotabaru, lalu berbagi hasil.",
    venueName: "Depan Gereja Kotabaru",
    lat: -7.7867,
    lng: 110.3733,
    inDays: 4,
    hour: 8,
  },
  {
    community: "klub-foto-malioboro",
    title: "Hunting Foto Pasar Beringharjo",
    description: "Eksplorasi fotografi jujur di dalam pasar untuk mengasah komposisi dan storytelling.",
    venueName: "Pintu timur Pasar Beringharjo",
    lat: -7.7975,
    lng: 110.3662,
    inDays: 5,
    hour: 7,
  },
  {
    community: "buku-kopi-jogja",
    title: "Diskusi Buku Bulanan",
    description: "Bedah buku pilihan bulan ini sambil ngopi. Buku bisa dibaca dulu atau ikut menyimak.",
    venueName: "Kafe di kawasan Prawirotaman",
    lat: -7.821,
    lng: 110.365,
    inDays: 8,
    hour: 10,
    capacity: 20,
  },
  {
    community: "merajut-bareng-jogja",
    title: "Kelas Dasar Merajut",
    description: "Belajar membuat pola dasar dan menyelesaikan proyek kecil pertamamu.",
    venueName: "Ruang komunitas, Jl. Parangtritis",
    lat: -7.812,
    lng: 110.373,
    inDays: 2,
    hour: 13,
    capacity: 15,
  },
  {
    community: "gerakan-hijau-kota",
    title: "Aksi Tanam Pohon Jumat Berkah",
    description: "Menanam bibit pohon di tepi Sungai Code bersama warga dan relawan.",
    venueName: "Bantaran Sungai Code, Gondolayu",
    lat: -7.778,
    lng: 110.374,
    inDays: 1,
    hour: 7,
    capacity: 60,
  },
  {
    community: "english-club-jogja",
    title: "Speaking Night: Travel Stories",
    description: "Sesi percakapan bebas bertema cerita perjalanan, dipandu fasilitator.",
    venueName: "Kafe dekat Titik Nol",
    lat: -7.8014,
    lng: 110.3648,
    inDays: 4,
    hour: 19,
    capacity: 25,
  },
  {
    community: "gitar-akustik-selatan",
    title: "Akustik Malam Mingguan",
    description: "Latihan akustik bareng dan open mic kecil di ruang terbuka.",
    venueName: "Taman Bakung, Nitikan",
    lat: -7.8159,
    lng: 110.3971,
    inDays: 5,
    hour: 19,
  },
  {
    community: "panjat-tebing-yogyakarta",
    title: "Latihan Teknik Dinding",
    description: "Latihan teknik pemanjatan dinding untuk pemula dan menengah.",
    venueName: "Wall climbing, Jl. Bantul",
    lat: -7.81,
    lng: 110.36,
    inDays: 7,
    hour: 16,
    capacity: 12,
  },
];

const PLACE_SEEDS = [
  {
    community: "lari-jogja-runners",
    name: "Alun-Alun Utara",
    description: "Titik kumpul utama lari pagi, banyak lahan datar untuk pemanasan.",
    category: "Titik kumpul",
    lat: -7.807,
    lng: 110.3637,
  },
  {
    community: "lari-jogja-runners",
    name: "Jalur Lari Tugu–Malioboro",
    description: "Rute favorit long run yang relatif teduh di pagi hari.",
    category: "Rute",
    lat: -7.7829,
    lng: 110.367,
  },
  {
    community: "buku-kopi-jogja",
    name: "Kopi Prawiro",
    description: "Kafe tenang yang sering dipakai untuk diskusi buku bulanan.",
    category: "Tempat favorit",
    lat: -7.821,
    lng: 110.365,
  },
  {
    community: "developer-circle-jogja",
    name: "Ruang Kerja Kolaboratif",
    description: "Co-working space langganan meetup, ada proyektor dan internet kencang.",
    category: "Tempat favorit",
    lat: -7.7596,
    lng: 110.4094,
  },
];

const REVIEW_SEEDS = [
  { community: "lari-jogja-runners", name: "Adi Santoso", rating: 5, comment: "Ramah banget buat pemula, pace-nya santai. Minggu pertama langsung betah." },
  { community: "lari-jogja-runners", name: "Nadia Putri", rating: 4, comment: "Konsisten dan terorganisir. Kadang kaleksinya ramai, tapi seru." },
  { community: "buku-kopi-jogja", name: "Bayu Anggara", rating: 5, comment: "Diskusinya hidup, semua orang didengar. Bukan sekadar ngobrol." },
  { community: "developer-circle-jogja", name: "Melati Arum", rating: 5, comment: "Materinya praktis dan relevan dengan pekerjaan. Menambah jejaring juga." },
  { community: "merajut-bareng-jogja", name: "Sri Handayani", rating: 5, comment: "Sabarnya para mentor luar biasa. Dari nol sampai bisa bikin syal." },
  { community: "sketsa-kota", name: "Dimas Prakoso", rating: 4, comment: "Suasana santai dan inklusif, cocok menggambar tanpa tekanan." },
];

async function main() {
  console.log("Seeding database…");

  // Wipe in dependency order.
  await prisma.chatMessage.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.userConnection.deleteMany();
  await prisma.placeVote.deleteMany();
  await prisma.place.deleteMany();
  await prisma.review.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.communityInterest.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.community.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.category.deleteMany();

  const passwordHash = bcrypt.hashSync("togather123", 10);

  // Users.
  const demo = await prisma.user.create({
    data: {
      name: "Rina Mahendra",
      email: "demo@togather.id",
      passwordHash,
      city: "Yogyakarta",
      lat: -7.7971,
      lng: 110.3688,
      scheduleSlots: "weekend-morning,weekend-evening,weekday-evening",
      bio: "Baru pindah ke Jogja untuk kuliah. Lagi cari komunitas lari, fotografi, dan mengoding.",
    },
  });
  const owner = await prisma.user.create({
    data: {
      name: "Sari Wulandari",
      email: "owner@togather.id",
      passwordHash,
      city: "Yogyakarta",
      lat: -7.79,
      lng: 110.37,
      bio: "Pengurus komunitas merajut dan musik akustik.",
    },
  });
  const owner2 = await prisma.user.create({
    data: {
      name: "Bima Nugroho",
      email: "owner2@togather.id",
      passwordHash,
      city: "Yogyakarta",
      lat: -7.76,
      lng: 110.41,
      bio: "Pegiat teknologi dan pengurus komunitas developer.",
    },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Admin Togather",
      email: "admin@togather.id",
      passwordHash,
      role: "superadmin",
      city: "Yogyakarta",
    },
  });
  const member = await prisma.user.create({
    data: {
      name: "Adi Santoso",
      email: "adi@togather.id",
      passwordHash,
      city: "Yogyakarta",
      lat: -7.79,
      lng: 110.36,
    },
  });
  void admin;

  const ownerByEmail: Record<string, string> = {
    "demo@togather.id": demo.id,
    "owner@togather.id": owner.id,
    "owner2@togather.id": owner2.id,
  };

  // Categories + interests.
  const interestIdByName = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const category = await prisma.category.create({
      data: { name: cat.name, slug: cat.slug },
    });
    for (const interestName of cat.interests) {
      const interest = await prisma.interest.create({
        data: { name: interestName, categoryId: category.id },
      });
      interestIdByName.set(interestName, interest.id);
    }
  }
  const interestId = (name: string) => interestIdByName.get(name)!;

  // Demo user interests (drives recommendable signals).
  const demoInterests = ["Lari", "Fotografi", "Pemrograman", "Merajut"];
  for (const name of demoInterests) {
    await prisma.userInterest.create({
      data: { userId: demo.id, interestId: interestId(name) },
    });
  }

  // Communities.
  const communityIdBySlug = new Map<string, string>();
  for (const c of COMMUNITIES) {
    const community = await prisma.community.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        categoryId: (
          await prisma.category.findUniqueOrThrow({ where: { slug: c.category } })
        ).id,
        city: c.city,
        lat: c.lat ?? null,
        lng: c.lng ?? null,
        isOnline: c.isOnline ?? false,
        isVerified: c.isVerified ?? false,
        verifiedBy: c.verifiedBy ?? null,
        scheduleSlots: c.scheduleSlots,
        joinLink: c.joinLink,
        website: c.website,
        ownerId: c.ownerEmail ? ownerByEmail[c.ownerEmail] : null,
      },
    });
    communityIdBySlug.set(c.slug, community.id);

    for (const name of c.interests) {
      await prisma.communityInterest.create({
        data: { communityId: community.id, interestId: interestId(name) },
      });
    }

    // Owner is also an admin member of their community.
    if (c.ownerEmail && ownerByEmail[c.ownerEmail]) {
      await prisma.membership.create({
        data: {
          userId: ownerByEmail[c.ownerEmail],
          communityId: community.id,
          role: "admin",
          status: "active",
        },
      });
    }
  }

  // Demo user memberships.
  const demoMemberships = [
    "sketsa-kota",
    "developer-circle-jogja",
    "buku-kopi-jogja",
  ];
  for (const slug of demoMemberships) {
    await prisma.membership.create({
      data: {
        userId: demo.id,
        communityId: communityIdBySlug.get(slug)!,
        role: "member",
        status: "active",
      },
    });
  }

  // Events.
  const eventIdByKey = new Map<string, string>();
  for (const e of EVENT_SEEDS) {
    const startsAt = dayFromNow(e.inDays, e.hour);
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
    const event = await prisma.event.create({
      data: {
        communityId: communityIdBySlug.get(e.community)!,
        slug: e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        title: e.title,
        description: e.description,
        venueName: e.venueName,
        lat: e.lat,
        lng: e.lng,
        startsAt,
        endsAt,
        capacity: e.capacity ?? null,
      },
    });
    eventIdByKey.set(`${e.community}:${event.slug}`, event.id);
  }

  // A past event with attended registrations (feeds the "activity" signal).
  const pastEvent = await prisma.event.create({
    data: {
      communityId: communityIdBySlug.get("lari-jogja-runners")!,
      slug: "lari-jumat-berkah",
      title: "Lari Jumat Berkah",
      description: "Latihan rutin Jumat pagi yang sudah berjalan.",
      venueName: "Alun-Alun Utara",
      lat: -7.807,
      lng: 110.3637,
      startsAt: dayAgo(6, 6),
      endsAt: dayAgo(6, 8),
    },
  });

  // Demo user registered for a couple of upcoming events + attended the past one.
  const upcomingLari = eventIdByKey.get("lari-jogja-runners:lari-pagi-alun-alun-utara")!;
  const upcomingDev = eventIdByKey.get("developer-circle-jogja:meetup-membangun-api-dengan-typescript")!;
  await prisma.eventRegistration.create({
    data: { eventId: upcomingLari, userId: demo.id, status: "registered" },
  });
  await prisma.eventRegistration.create({
    data: { eventId: upcomingDev, userId: demo.id, status: "registered" },
  });
  await prisma.eventRegistration.create({
    data: { eventId: pastEvent.id, userId: demo.id, status: "attended" },
  });
  await prisma.eventRegistration.create({
    data: { eventId: pastEvent.id, userId: member.id, status: "attended" },
  });

  // Places.
  const placeIdByName = new Map<string, string>();
  for (const p of PLACE_SEEDS) {
    const place = await prisma.place.create({
      data: {
        communityId: communityIdBySlug.get(p.community)!,
        name: p.name,
        description: p.description,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        addedById: demo.id,
      },
    });
    placeIdByName.set(`${p.community}:${p.name}`, place.id);
  }
  await prisma.placeVote.create({
    data: {
      placeId: placeIdByName.get("lari-jogja-runners:Alun-Alun Utara")!,
      userId: demo.id,
      emoji: "🔥",
    },
  });

  // Reviews.
  for (const r of REVIEW_SEEDS) {
    const reviewer = await prisma.user.upsert({
      where: { email: `${r.name.toLowerCase().replace(/\s+/g, ".")}@togather.id` },
      update: {},
      create: {
        name: r.name,
        email: `${r.name.toLowerCase().replace(/\s+/g, ".")}@togather.id`,
        passwordHash,
        city: "Yogyakarta",
      },
    });
    await prisma.review.create({
      data: {
        communityId: communityIdBySlug.get(r.community)!,
        userId: reviewer.id,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }

  // Mutual connections (demo user ↔ a couple of known members/organizers).
  await prisma.userConnection.createMany({
    data: [
      { userId: demo.id, connectionId: member.id },
      { userId: demo.id, connectionId: owner.id },
    ],
  });
  // Give one connection a membership overlap so the mutual signal is visible.
  await prisma.membership.create({
    data: {
      userId: member.id,
      communityId: communityIdBySlug.get("buku-kopi-jogja")!,
      role: "member",
      status: "active",
    },
  });

  // Community chat messages (a few communities; others stay quiet to expose the health signal).
  const chatSeeds: { community: string; author: "demo" | "owner" | "member" | "owner2"; content: string; daysAgo: number }[] = [
    { community: "lari-jogja-runners", author: "demo", content: "Ada yang ikut lari pagi Minggu besok? Titik kumpul tetap di Alun-Alun Utara ya.", daysAgo: 1 },
    { community: "lari-jogja-runners", author: "member", content: "Aku ikut! Sekalian bawa temen satu, semoga pace-nya masih santai.", daysAgo: 1 },
    { community: "lari-jogja-runners", author: "demo", content: "Aman, kita tetap pace santai 5K. Sampai ketemu!", daysAgo: 0 },
    { community: "developer-circle-jogja", author: "owner2", content: "Materi meetup besok: REST API dengan TypeScript. Bawa laptop ya.", daysAgo: 2 },
    { community: "developer-circle-jogja", author: "demo", content: "Siap. Ada sesi code review juga kan? Aku mau bawa PR kecil.", daysAgo: 2 },
    { community: "buku-kopi-jogja", author: "member", content: "Buku bulan ini sudah pada mulai baca belum? Diskusi Sabtu depan ya.", daysAgo: 3 },
  ];
  const authorId: Record<"demo" | "owner" | "member" | "owner2", string> = {
    demo: demo.id,
    owner: owner.id,
    member: member.id,
    owner2: owner2.id,
  };
  for (const m of chatSeeds) {
    await prisma.chatMessage.create({
      data: {
        communityId: communityIdBySlug.get(m.community)!,
        authorId: authorId[m.author],
        content: m.content,
        createdAt: dayAgo(m.daysAgo, 18),
      },
    });
  }

  // A pending verification request (demo data) for a community not yet verified.
  await prisma.verificationRequest.create({
    data: {
      communityId: communityIdBySlug.get("futsal-sore-cik-di-tiro")!,
      requestedById: demo.id,
      message: "Mohon verifikasi komunitas futsal kami. Kami rutin bermain dua kali seminggu di Lapangan Cik Di Tiro.",
      link: "https://instagram.com/futsalcikditiro",
      status: "pending",
    },
  });

  console.log(`Seeded: ${COMMUNITIES.length} communities, ${EVENT_SEEDS.length + 1} events.`);
  console.log("Demo login    → demo@togather.id / togather123");
  console.log("Organizer     → owner@togather.id / togather123");
  console.log("Owner (tech)  → owner2@togather.id / togather123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });