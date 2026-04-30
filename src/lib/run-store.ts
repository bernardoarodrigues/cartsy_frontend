"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type RunState = {
  runId: string | null;
  setRunId: (id: string | null) => void;
};

export const useRunStore = create<RunState>()(
  persist(
    (set) => ({
      runId: null,
      setRunId: (id) => set({ runId: id }),
    }),
    { name: "cartsy-run" },
  ),
);
