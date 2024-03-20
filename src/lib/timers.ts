import { writable, type Writable } from 'svelte/store';

interface Timer {
  started_at: Date;
  duration: number;
  sessionOffset: number;
}

export const timers: Writable<Timer[]> = writable([]);
