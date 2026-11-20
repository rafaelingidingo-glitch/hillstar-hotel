"use client";

import { ReactNode } from "react";
import { navigate } from "@/lib/site-hooks";
import { ArrowRight } from "lucide-react";

export function Eyebrow({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "navy" }) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-brand ${
        tone === "gold" ? "text-gold-600" : "text-navy-700"
      }`}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={`${align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}`}>
      {eyebrow && (
        <Eyebrow tone={dark ? "gold" : "gold"}>{eyebrow}</Eyebrow>
      )}
      <h2
        className={`mt-3 font-display text-3xl md:text-[2.6rem] leading-[1.15] ${
          dark ? "text-ivory" : "text-navy-900"
        }`}
      >
        {title}
      </h2>
      {intro && (
        <p className={`mt-4 text-[15px] leading-relaxed ${dark ? "text-ivory/70" : "text-muted-foreground"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 bg-gold-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-navy-950 transition-all duration-200 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  dark?: boolean;
}) {
  const cls = `inline-flex items-center justify-center gap-2 border px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
    dark
      ? "border-ivory/40 text-ivory hover:bg-ivory hover:text-navy-950"
      : "border-navy-900/30 text-navy-900 hover:bg-navy-900 hover:text-ivory"
  } ${className}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function TextLink({ label, path }: { label: string; path: string }) {
  return (
    <button
      onClick={() => navigate(path)}
      className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-700 hover:text-gold-600 transition-colors"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  );
}

export function PageHero({
  image,
  eyebrow,
  title,
  intro,
  children,
}: {
  image: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative h-[46vh] min-h-[380px] max-h-[560px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center kenburns"
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label={title}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/75 via-navy-950/45 to-navy-950/80" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-brand text-gold-400 fade-up">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl md:text-5xl leading-tight text-ivory text-shadow-hero fade-up fade-up-delay-1">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ivory/85 fade-up fade-up-delay-2">
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
