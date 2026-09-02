import { createFileRoute } from "@tanstack/react-router";
import {
  Atom,
  Briefcase,
  Code2,
  FlaskConical,
  Languages,
  Sigma,
  Stethoscope,
  MessagesSquare,
} from "lucide-react";

import logo from "@/assets/study-assistant-logo.png";
import { StudyAssistant } from "@/components/study-assistant/StudyAssistant";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Assistant — AI Help for Every Academic Subject" },
      {
        name: "description",
        content:
          "Ask study questions in English, Urdu or Roman Urdu. Step-by-step explanations for CS, engineering, medical, business, maths and science subjects.",
      },
      { property: "og:title", content: "Study Assistant — AI Help for Every Academic Subject" },
      {
        property: "og:description",
        content:
          "Free AI study assistant for definitions, concepts, formulas, programming, assignments and exam preparation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUBJECTS = [
  { icon: Code2, title: "Computer Science & IT", text: "Programming, DSA, databases, AI & data science." },
  { icon: Atom, title: "Engineering & Physics", text: "Circuits, mechanics, thermodynamics, numericals." },
  { icon: Stethoscope, title: "Medical & Biology", text: "Anatomy, physiology, genetics, biochemistry." },
  { icon: Briefcase, title: "Business & Economics", text: "Accounting, finance, management, micro & macro." },
  { icon: Sigma, title: "Maths & Statistics", text: "Calculus, algebra, probability, step-by-step solutions." },
  { icon: FlaskConical, title: "Chemistry", text: "Reactions, organic chemistry, equations, lab concepts." },
  { icon: Languages, title: "English & Arts", text: "Grammar, essays, literature, history and humanities." },
  { icon: MessagesSquare, title: "Exam Preparation", text: "Revision plans, key points and practice questions." },
];

function Index() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="Study Assistant logo"
            width={512}
            height={512}
            className="size-10"
          />
          <span className="font-display text-lg font-semibold text-foreground">
            Study Assistant
          </span>
        </div>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          English · اردو · Roman Urdu
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="py-12 text-center sm:py-20">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
            <span className="size-1.5 rounded-full bg-accent" />
            AI-powered academic assistant
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
            Study help for every degree, subject and question
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Get clear, step-by-step explanations for definitions, concepts, formulas, programming
            problems, assignments and exam preparation — in English, Urdu or Roman Urdu.
          </p>
          <p className="mt-8 text-sm font-medium text-foreground">
            Tap the Study Assistant button at the bottom-right to start chatting.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((subject) => (
            <article
              key={subject.title}
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <subject.icon className="size-5 text-primary" />
              <h2 className="mt-3 font-display text-base font-semibold text-foreground">
                {subject.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{subject.text}</p>
            </article>
          ))}
        </section>
      </main>

      <StudyAssistant />
    </div>
  );
}
