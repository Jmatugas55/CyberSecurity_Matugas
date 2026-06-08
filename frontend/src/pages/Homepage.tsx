import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  HeartPulse,
  Lock,
  BellRing,
  CalendarDays,
  Activity,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  ArrowRight,
  Stethoscope,
  Database,
  UserCheck,
  Sun,
  Moon,
  Menu,
  Code2,
  FileText,
  GitBranch,
  Palette,
  SearchCheck,
  TestTube2,
} from "lucide-react";

/* =========================
   Data
========================= */

type TeamMember = {
  name: string;
  role: string;
  label: string;
  icon: React.ElementType;
  photoFile: string;
};

const teamPhotoModules = import.meta.glob("../assets/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

function getTeamPhoto(fileName: string) {
  return teamPhotoModules[`../assets/${fileName}`];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAvatarImage(member: TeamMember, level: "lead" | "second" | "support") {
  const initials = getInitials(member.name);
  const fontSize = level === "lead" ? 34 : level === "second" ? 28 : 24;
  const iconSize = level === "lead" ? 42 : level === "second" ? 34 : 30;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ccfbf1"/>
          <stop offset="48%" stop-color="#dbeafe"/>
          <stop offset="100%" stop-color="#99f6e4"/>
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#14b8a6"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f766e" flood-opacity="0.20"/>
        </filter>
      </defs>
      <rect width="320" height="320" rx="58" fill="url(#bg)"/>
      <circle cx="160" cy="125" r="${iconSize}" fill="url(#accent)" filter="url(#shadow)"/>
      <path d="M116 235c8-37 32-58 44-58s36 21 44 58" fill="none" stroke="#0f766e" stroke-width="16" stroke-linecap="round"/>
      <circle cx="160" cy="116" r="22" fill="#ffffff"/>
      <text x="160" y="284" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="800" fill="#0f766e">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const developer: TeamMember = {
  name: "Julito Matugas",
  role: "Developer",
  label: "Core Developer",
  icon: Code2,
  photoFile: "me.png",
};

const secondLevelMembers: TeamMember[] = [
  {
    name: "Mike Quijano",
    role: "Assistant Developer / System Support",
    label: "Technical Support",
    icon: GitBranch,
    photoFile: "mike-quijano.png",
  },
  {
    name: "Laurence Montil",
    role: "UI/UX and Documentation Support",
    label: "Design Support",
    icon: Palette,
    photoFile: "lawrence.jpg",
  },
];

const supportTeams: TeamMember[][] = [
  [
    {
      name: "Lebron James Sarra",
      role: "Documentation Support",
      label: "Project Support",
      icon: FileText,
      photoFile: "lebron.jpg",
    },
    {
      name: "Karl Pingcalan",
      role: "Testing Support",
      label: "Quality Support",
      icon: TestTube2,
      photoFile: "Karl.jpg",
    },
    {
      name: "Marwin Boong",
      role: "Research Support",
      label: "Project Support",
      icon: SearchCheck,
      photoFile: "marwin.png",
    },
  ],
  [
    {
      name: "Ijay Mangguinimba",
      role: "Data Gathering Support",
      label: "Project Support",
      icon: FileText,
      photoFile: "Ijay.jpg",
    },
    {
      name: "Shane Andoy",
      role: "System Evaluation Support",
      label: "Evaluation Support",
      icon: TestTube2,
      photoFile: "shane.jpg",
    },
    {
      name: "Cherry Havana",
      role: "Documentation and Review Support",
      label: "Project Support",
      icon: SearchCheck,
      photoFile: "cherry.png",
    },
  ],
];

const features = [
  {
    icon: Database,
    title: "Secure Patient Records",
    description:
      "Protect sensitive health information using secure data handling and access control.",
  },
  {
    icon: HeartPulse,
    title: "Doctor-Patient Portal",
    description:
      "Connect doctors and patients through a reliable digital healthcare platform.",
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity Monitoring",
    description:
      "Monitor system activity and detect suspicious behavior in real time.",
  },
  {
    icon: BellRing,
    title: "Real-Time Alerts",
    description:
      "Notify authorized users immediately about important security and health updates.",
  },
  {
    icon: CalendarDays,
    title: "Appointment Management",
    description:
      "Organize patient schedules, consultations, and hospital appointments efficiently.",
  },
  {
    icon: UserCheck,
    title: "Role-Based Access Control",
    description:
      "Allow doctors, cybersecurity staff, and patients to access only their permitted modules.",
  },
];

const stats = [
  { value: "500+", label: "Patients Served" },
  { value: "99.9%", label: "System Uptime" },
  { value: "50+", label: "Doctors Supported" },
  { value: "100%", label: "Secure Access Focus" },
];

const testimonials = [
  {
    quote:
      "The system helps us manage patient information securely and efficiently.",
    name: "Hospital Staff",
  },
  {
    quote:
      "It gives confidence that medical records are protected and properly accessed.",
    name: "Cybersecurity Officer",
  },
  {
    quote:
      "Appointments and health information are easier to manage in one platform.",
    name: "Patient User",
  },
];

/* =========================
   Animation
========================= */

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0 },
};

/* =========================
   Helper
========================= */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* =========================
   Theme Tokens
========================= */

type ThemeMode = "light" | "dark";

const getTheme = (mode: ThemeMode) => {
  const isDark = mode === "dark";

  return {
    isDark,

    page: isDark
      ? "bg-slate-950 text-white"
      : "bg-slate-50 text-slate-950",

    navbar: isDark
      ? "border-white/10 bg-slate-950/75 text-white"
      : "border-slate-200/80 bg-white/75 text-slate-950",

    navLink: isDark
      ? "text-slate-200 hover:text-teal-300"
      : "text-slate-700 hover:text-teal-700",

    sectionPrimary: isDark ? "bg-slate-950" : "bg-slate-50",
    sectionSecondary: isDark ? "bg-slate-900" : "bg-white",

    card: isDark
      ? "border-white/10 bg-white/[0.04] text-white hover:border-teal-300/40 hover:bg-white/[0.07]"
      : "border-slate-200 bg-white text-slate-950 shadow-slate-200/70 hover:border-teal-400/50 hover:bg-teal-50/40",

    glassCard: isDark
      ? "border-white/10 bg-white/10"
      : "border-slate-200 bg-white/80",

    innerCard: isDark ? "bg-slate-900/90" : "bg-white",

    miniCard: isDark ? "bg-slate-950/60" : "bg-slate-100",

    heading: isDark ? "text-white" : "text-slate-950",
    paragraph: isDark ? "text-slate-300" : "text-slate-600",
    muted: isDark ? "text-slate-400" : "text-slate-500",

    badge: isDark
      ? "border-teal-300/30 bg-white/5 text-teal-100"
      : "border-teal-200 bg-teal-50 text-teal-800",

    outlineButton: isDark
      ? "border-white/20 bg-white/10 text-white hover:border-teal-300/60 hover:bg-teal-400/10"
      : "border-slate-300 bg-white text-slate-800 hover:border-teal-500 hover:bg-teal-50",

    iconBox: isDark
      ? "bg-gradient-to-br from-teal-400/20 to-blue-500/20 text-teal-300"
      : "bg-gradient-to-br from-teal-100 to-blue-100 text-teal-700",

    floating: isDark
      ? "border-teal-300/30 bg-teal-300/10"
      : "border-teal-300/50 bg-teal-100/60",

    footer: isDark ? "bg-slate-900" : "bg-white",

    divider: isDark ? "border-white/10" : "border-slate-200",

    heroGlow: isDark
      ? "bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.22),transparent_35%)]"
      : "bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_38%)]",
  };
};

/* =========================
   Reusable Components
========================= */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-bold uppercase tracking-[0.3em] text-teal-500">
      {children}
    </p>
  );
}

function PrimaryButton({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-teal-500/25 transition hover:scale-105 hover:shadow-teal-500/40"
    >
      {children}
    </Link>
  );
}

function TeamNode({
  member,
  theme,
  level = "support",
  delay = 0,
}: {
  member: TeamMember;
  theme: ReturnType<typeof getTheme>;
  level?: "lead" | "second" | "support";
  delay?: number;
}) {
  const Icon = member.icon;
  const isLead = level === "lead";
  const isSecond = level === "second";
  const isSupport = level === "support";
  const photoSrc = getTeamPhoto(member.photoFile);
  const avatarSrc = photoSrc || getAvatarImage(member, level);

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay }}
      whileHover={{ y: -8 }}
      className={cn(
        "group relative mx-auto w-full overflow-visible rounded-[2rem] border shadow-xl transition duration-300",
        isLead ? "max-w-3xl p-8 text-left md:p-9" : isSecond ? "max-w-xl p-6 text-left" : "p-5 text-center",
        isLead
          ? theme.isDark
            ? "border-teal-300/60 bg-gradient-to-br from-teal-400/20 via-white/[0.07] to-blue-500/20 shadow-teal-500/20 hover:border-teal-200"
            : "border-teal-300 bg-gradient-to-br from-white via-teal-50 to-blue-50 shadow-teal-200/80 hover:border-teal-500"
          : theme.card
      )}
    >
      <div
        className={cn(
          "absolute right-5 top-5 rounded-full border px-3 py-1 text-xs font-bold",
          isLead
            ? "border-teal-300/60 bg-teal-500 text-white"
            : theme.badge
        )}
      >
        {member.label}
      </div>

      <div
        className={cn(
          "flex flex-col gap-6",
          isSupport ? "items-center pt-7" : "sm:flex-row sm:items-center"
        )}
      >
        <div
          className={cn(
            "relative z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 shadow-2xl transition duration-300 group-hover:-translate-y-5 group-hover:scale-125 group-hover:shadow-teal-500/30",
            isLead ? "h-40 w-40" : isSecond ? "h-32 w-32" : "h-28 w-28",
            theme.isDark
              ? "border-teal-300/40 bg-slate-950"
              : "border-teal-300 bg-white"
          )}
        >
          <img
            src={avatarSrc}
            alt={`${member.name} profile`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className={cn("min-w-0", isSupport ? "w-full px-1" : "pr-20 sm:pr-0")}>
          <div
            className={cn(
              "mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/25",
              isSupport && "mx-auto"
            )}
          >
            <Icon size={22} />
          </div>
          <h3
            className={cn(
              "font-black leading-tight",
              isLead ? "text-3xl md:text-4xl" : isSecond ? "text-2xl" : "text-xl",
              theme.heading
            )}
          >
            {member.name}
          </h3>
          <p className="mt-1 font-bold text-teal-500">{member.role}</p>
        </div>
      </div>
    </motion.article>
  );
}

function ConnectorLine({
  className,
  theme,
  direction = "down",
}: {
  className?: string;
  theme: ReturnType<typeof getTheme>;
  direction?: "down" | "left" | "right";
}) {
  const arrowPosition =
    direction === "down"
      ? "left-1/2 top-full -translate-x-1/2 border-x-[9px] border-t-[12px] border-x-transparent"
      : direction === "left"
      ? "right-full top-1/2 -translate-y-1/2 border-y-[9px] border-r-[12px] border-y-transparent"
      : "left-full top-1/2 -translate-y-1/2 border-y-[9px] border-l-[12px] border-y-transparent";
  const arrowColor =
    direction === "down"
      ? theme.isDark ? "border-t-teal-300" : "border-t-teal-600"
      : direction === "left"
      ? theme.isDark ? "border-r-teal-300" : "border-r-teal-600"
      : theme.isDark ? "border-l-teal-300" : "border-l-teal-600";

  return (
    <div
      className={cn(
        "pointer-events-none absolute hidden rounded-full md:block",
        theme.isDark
          ? "bg-gradient-to-b from-teal-300 to-blue-400 shadow-[0_0_18px_rgba(45,212,191,0.35)]"
          : "bg-gradient-to-b from-teal-600 to-blue-600 shadow-[0_0_16px_rgba(13,148,136,0.22)]",
        className
      )}
    >
      <span className={cn("absolute h-0 w-0", arrowPosition, arrowColor)} />
    </div>
  );
}

function TeamHierarchy({ theme }: { theme: ReturnType<typeof getTheme> }) {
  return (
    <div className="relative mt-16">
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-48 hidden h-[calc(100%-12rem)] w-[3px] -translate-x-1/2 rounded-full md:block",
          theme.isDark ? "bg-teal-300/25" : "bg-teal-500/35"
        )}
      />

      <div className="relative">
        <TeamNode member={developer} theme={theme} level="lead" />
      </div>

      <div className="relative mx-auto hidden h-16 max-w-4xl md:block">
        <ConnectorLine theme={theme} className="left-1/2 top-0 h-full w-[4px] -translate-x-1/2" />
        <div
          className={cn(
            "absolute left-1/4 right-1/4 top-full h-[4px] rounded-full",
            theme.isDark
              ? "bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-300 shadow-[0_0_18px_rgba(45,212,191,0.35)]"
              : "bg-gradient-to-r from-teal-600 via-blue-600 to-teal-600 shadow-[0_0_16px_rgba(13,148,136,0.22)]"
          )}
        />
      </div>

      <div className="mt-8 grid gap-8 md:mt-0 md:grid-cols-2">
        {secondLevelMembers.map((member, index) => (
          <div key={member.name} className="relative">
            <div
              className="absolute -top-8 left-1/2 hidden h-8 w-[4px] -translate-x-1/2 md:block"
            />
            <ConnectorLine theme={theme} className="-top-8 left-1/2 h-8 w-[4px] -translate-x-1/2" />
            <TeamNode member={member} theme={theme} level="second" delay={index * 0.08} />
          </div>
        ))}
      </div>

      <div className="relative mx-auto hidden h-14 max-w-5xl md:block">
        <ConnectorLine theme={theme} className="left-1/2 top-0 h-full w-[4px] -translate-x-1/2" />
        <div
          className={cn(
            "absolute left-[12.5%] right-[12.5%] top-full h-[4px] rounded-full",
            theme.isDark
              ? "bg-gradient-to-r from-blue-400 via-teal-300 to-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.3)]"
              : "bg-gradient-to-r from-blue-600 via-teal-600 to-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.2)]"
          )}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {supportTeams.map((group, groupIndex) => (
          <div key={groupIndex} className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div
              className="absolute -top-8 left-1/2 hidden h-8 w-[4px] -translate-x-1/2 md:block"
            />
            <ConnectorLine theme={theme} className="-top-8 left-1/2 h-8 w-[4px] -translate-x-1/2" />
            {group.map((member, index) => (
              <TeamNode
                key={member.name}
                member={member}
                theme={theme}
                delay={0.1 + (groupIndex * group.length + index) * 0.04}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   Main Component
========================= */

const Homepage: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  const toggleTheme = () => {
    setThemeMode((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div
      className={cn(
        "min-h-screen overflow-hidden transition-colors duration-500",
        theme.page
      )}
    >
      {/* Navbar */}
      <nav
        className={cn(
          "fixed left-0 top-0 z-50 w-full border-b backdrop-blur-xl transition-colors duration-500",
          theme.navbar
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-600 shadow-lg shadow-teal-500/20">
              <ShieldCheck className="text-white" size={25} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide">CyberHealth</h1>
              <p className="text-xs text-teal-500">Hospital Security System</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium lg:flex">
            {["Home", "About", "Services", "Team", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={cn("transition", theme.navLink)}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition hover:scale-105",
                theme.outlineButton
              )}
              aria-label="Toggle light and dark mode"
            >
              {theme.isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/login"
              className={cn(
                "hidden rounded-full border px-5 py-2 text-sm font-semibold transition sm:inline-flex",
                theme.outlineButton
              )}
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-teal-500 to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:scale-105"
            >
              Sign Up
            </Link>

            <button
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border lg:hidden",
                theme.outlineButton
              )}
              aria-label="Open mobile menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24"
      >
        <div className={cn("absolute inset-0", theme.heroGlow)} />

        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute right-10 top-32 hidden h-28 w-28 rounded-full border backdrop-blur-md lg:block",
            theme.floating
          )}
        />

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute bottom-24 left-10 hidden h-36 w-36 rounded-full border backdrop-blur-md lg:block",
            theme.floating
          )}
        />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.8 }}
          >
            <div
              className={cn(
                "mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur",
                theme.badge
              )}
            >
              <Lock size={16} />
              Secure Digital Healthcare Platform
            </div>

            <h1
              className={cn(
                "max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-6xl xl:text-7xl",
                theme.heading
              )}
            >
              Secure. Smart.
              <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Patient-Centered Care.
              </span>
            </h1>

            <p className={cn("mt-6 max-w-2xl text-lg leading-8", theme.paragraph)}>
              A modern hospital cybersecurity and health management system
              designed to protect patient data, improve healthcare workflows,
              and support doctors, patients, and cybersecurity staff.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <PrimaryButton to="/login">
                Patient Login
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </PrimaryButton>

              <Link
                to="/login"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full border px-7 py-4 font-bold backdrop-blur transition",
                  theme.outlineButton
                )}
              >
                Staff Login
                <ShieldCheck size={18} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative"
          >
            <div
              className={cn(
                "relative rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl",
                theme.glassCard
              )}
            >
              <div className={cn("rounded-[1.5rem] p-6", theme.innerCard)}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className={cn("text-sm", theme.muted)}>System Status</p>
                    <h3 className={cn("text-2xl font-bold", theme.heading)}>
                      Hospital Security Hub
                    </h3>
                  </div>

                  <div className={cn("rounded-full p-3", theme.iconBox)}>
                    <Activity size={26} />
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "Patient Records Protected",
                    "Cyber Threat Scan Active",
                    "Doctor Portal Online",
                    "Appointment Sync Running",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 25 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.15 }}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border p-4",
                        theme.card
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-teal-400 shadow-lg shadow-teal-400/60" />
                        <span className={cn("text-sm", theme.paragraph)}>
                          {item}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-teal-500">
                        ACTIVE
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className={cn("px-6 py-24", theme.sectionSecondary)}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <SectionLabel>About Us</SectionLabel>

            <h2 className={cn("text-4xl font-black leading-tight md:text-5xl", theme.heading)}>
              Built for trusted healthcare and stronger digital protection.
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className={cn(
              "rounded-[2rem] border p-8 shadow-xl backdrop-blur",
              theme.card
            )}
          >
            <p className={cn("leading-8", theme.paragraph)}>
              CyberHealth is designed to support hospitals by combining
              compassionate healthcare services with advanced cybersecurity
              practices. The system helps protect patient information, organize
              medical workflows, and provide secure access for patients, doctors,
              and cybersecurity staff.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={cn("rounded-2xl p-5", theme.miniCard)}>
                <Stethoscope className="mb-3 text-teal-500" />
                <h3 className={cn("font-bold", theme.heading)}>
                  Healthcare Mission
                </h3>
                <p className={cn("mt-2 text-sm", theme.muted)}>
                  Deliver efficient, accessible, and patient-centered digital
                  care.
                </p>
              </div>

              <div className={cn("rounded-2xl p-5", theme.miniCard)}>
                <Lock className="mb-3 text-blue-500" />
                <h3 className={cn("font-bold", theme.heading)}>
                  Security Vision
                </h3>
                <p className={cn("mt-2 text-sm", theme.muted)}>
                  Safeguard hospital data through secure and reliable system
                  access.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services / Features Section */}
      <section id="services" className={cn("px-6 py-24", theme.sectionPrimary)}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <SectionLabel>Services & Features</SectionLabel>

            <h2 className={cn("text-4xl font-black md:text-5xl", theme.heading)}>
              Everything a secure hospital system needs.
            </h2>

            <p className={cn("mt-5", theme.paragraph)}>
              Designed for hospital operations, patient care, and cybersecurity
              monitoring in one unified platform.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  whileHover={{ y: -10 }}
                  className={cn(
                    "group rounded-[2rem] border p-7 shadow-xl transition",
                    theme.card
                  )}
                >
                  <div
                    className={cn(
                      "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition group-hover:scale-110",
                      theme.iconBox
                    )}
                  >
                    <Icon size={34} />
                  </div>

                  <h3 className={cn("text-xl font-bold", theme.heading)}>
                    {feature.title}
                  </h3>

                  <p className={cn("mt-3 leading-7", theme.paragraph)}>
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats / Trust Bar */}
      <section className="bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-3xl bg-white/15 p-7 backdrop-blur"
            >
              <h3 className="text-4xl font-black">{stat.value}</h3>
              <p className="mt-2 font-medium text-teal-50">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Project Team Structure Section */}
      <section id="team" className={cn("px-6 py-24", theme.sectionSecondary)}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <SectionLabel>Project Team Structure</SectionLabel>

            <h2 className={cn("text-4xl font-black md:text-5xl", theme.heading)}>
              Meet the team behind the system.
            </h2>

            <p className={cn("mt-5 leading-8", theme.paragraph)}>
              Meet the team behind the system, organized according to their
              roles and project responsibilities.
            </p>
          </motion.div>

          <TeamHierarchy theme={theme} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={cn("px-6 py-24", theme.sectionPrimary)}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <SectionLabel>Testimonials</SectionLabel>

            <h2 className={cn("text-4xl font-black md:text-5xl", theme.heading)}>
              Trusted by healthcare users.
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.div
                key={item.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                className={cn("rounded-[2rem] border p-7", theme.card)}
              >
                <p className={cn("leading-8", theme.paragraph)}>
                  “{item.quote}”
                </p>

                <h3 className="mt-5 font-bold text-teal-500">{item.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Footer Section */}
      <footer
        id="contact"
        className={cn("px-6 py-16 transition-colors duration-500", theme.footer)}
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-600 text-white">
                <ShieldCheck />
              </div>

              <div>
                <h2 className={cn("text-xl font-black", theme.heading)}>
                  CyberHealth
                </h2>
                <p className="text-sm text-teal-500">
                  Hospital Cybersecurity System
                </p>
              </div>
            </div>

            <p className={cn("mt-5 max-w-md leading-7", theme.paragraph)}>
              A secure and modern platform for hospital data protection,
              healthcare management, and role-based digital access.
            </p>
          </div>

          <div>
            <h3 className={cn("mb-5 text-lg font-bold", theme.heading)}>
              Contact Information
            </h3>

            <div className={cn("space-y-4", theme.paragraph)}>
              <p className="flex items-center gap-3">
                <MapPin className="text-teal-500" size={20} />
                Agusan del Sur State University
              </p>

              <p className="flex items-center gap-3">
                <Mail className="text-teal-500" size={20} />
                @Adssu.edu.ph
              </p>

              <p className="flex items-center gap-3">
                <Phone className="text-teal-500" size={20} />
                +63 912 345 6789
              </p>
            </div>
          </div>

          <div>
            <h3 className={cn("mb-5 text-lg font-bold", theme.heading)}>
              Follow Us
            </h3>

            <div className="flex gap-4">
              {[Facebook, Twitter, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border text-teal-500 transition hover:scale-110 hover:bg-teal-500 hover:text-white",
                    theme.outlineButton
                  )}
                  aria-label="Social media link"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/login"
                className={cn(
                  "rounded-full border px-5 py-2 text-sm font-semibold transition",
                  theme.outlineButton
                )}
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-teal-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-teal-400"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mx-auto mt-12 max-w-7xl border-t pt-6 text-center text-sm",
            theme.divider,
            theme.muted
          )}
        >
          © {new Date().getFullYear()} CyberHealth Hospital System. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
