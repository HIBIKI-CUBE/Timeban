import { writable, type Writable } from 'svelte/store';

export const communicating: Writable<boolean> = writable();
