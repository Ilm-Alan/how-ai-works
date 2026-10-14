export type PartId = "basics" | "language-models" | "training" | "building" | "frontier";

export interface Part {
  id: PartId;
  title: string;
}

/** Mounts the lab into `root`. Return a cleanup function if the lab starts timers, workers, or listeners outside `root`. */
export type MountLab = (root: HTMLElement) => void | (() => void);

export interface Lab {
  title: string;
  mount: MountLab;
}

export interface Question {
  q: string;
  choices: string[];
  /** Index into `choices`. */
  answer: number;
  /** One or two sentences shown after answering. */
  why: string;
}

export interface Source {
  label: string;
  url: string;
}

export interface Lesson {
  slug: string;
  title: string;
  part: PartId;
  /** Markdown. A paragraph containing only `{{lab}}` marks where the lab renders; otherwise it renders after the body. */
  body: string;
  lab: Lab;
  quiz: Question[];
  sources: Source[];
}
