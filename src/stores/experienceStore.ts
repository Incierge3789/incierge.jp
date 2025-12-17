import { atom } from 'nanostores';
import type { Persona } from '../lib/experience/generateScheduleEmail';

export const personaAtom = atom<Persona>('tax_accountant');
export const rateAtom = atom<number>(6000);
export const countAtom = atom<number>(20);
