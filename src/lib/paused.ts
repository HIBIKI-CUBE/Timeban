import { writable, type Writable } from 'svelte/store';

export const paused: Writable<boolean> = writable();
