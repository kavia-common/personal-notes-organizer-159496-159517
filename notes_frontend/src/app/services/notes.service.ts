import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, map, catchError, switchMap } from 'rxjs';
import { Note } from '../models/note.model';
import { getRuntimeEnv } from '../utils/runtime-config';

const STORAGE_KEY = 'notes_app_notes';
const API_BASE_URL = getRuntimeEnv('NOTES_API_BASE_URL', '');

/**
 * Utility to generate a reasonably unique ID using crypto.randomUUID if available.
 */
function generateId(): string {
  try {
    const g = (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined);
    if (g && typeof g.randomUUID === 'function') {
      return g.randomUUID();
    }
  } catch {
    // ignore
  }
  // Fallback if crypto.randomUUID is unavailable
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private http = inject(HttpClient);
  private useApi = API_BASE_URL && API_BASE_URL.trim().length > 0;

  private notesSubject = new BehaviorSubject<Note[]>([]);
  notes$ = this.notesSubject.asObservable();

  // Track selected note id using Angular signal for ergonomic state changes in components.
  selectedNoteId = signal<string | null>(null);

  constructor() {
    if (this.useApi) {
      this.refreshFromApi().subscribe(); // Initialize from API
    } else {
      this.loadFromStorage(); // Initialize from local storage
    }
  }

  private loadFromStorage(): void {
    const ls = (typeof globalThis !== 'undefined' && 'localStorage' in globalThis)
      ? ((globalThis as any).localStorage as Storage)
      : null;
    const raw = ls ? ls.getItem(STORAGE_KEY) : null;

    if (raw) {
      try {
        const parsed: Note[] = JSON.parse(raw);
        this.notesSubject.next(parsed);
      } catch {
        this.notesSubject.next([]);
      }
    } else {
      this.notesSubject.next([]);
    }
  }

  private saveToStorage(): void {
    const ls = (typeof globalThis !== 'undefined' && 'localStorage' in globalThis)
      ? ((globalThis as any).localStorage as Storage)
      : null;
    if (!ls) return;
    try {
      ls.setItem(STORAGE_KEY, JSON.stringify(this.notesSubject.getValue()));
    } catch {
      // ignore storage errors
    }
  }

  private apiList(): Observable<Note[]> {
    return this.http.get<Note[]>(`${API_BASE_URL}/notes`).pipe(
      catchError(() => of([]))
    );
  }

  private refreshFromApi(): Observable<Note[]> {
    if (!this.useApi) return of(this.notesSubject.getValue());
    return this.apiList().pipe(
      map((notes) => {
        this.notesSubject.next(notes);
        return notes;
      })
    );
  }

  // PUBLIC_INTERFACE
  /**
   * Returns an observable of notes filtered by query and tag.
   * @param query text to search in title/content
   * @param tag tag filter (optional). If null or empty, no tag filter applied.
   */
  getFilteredNotes(query: string, tag?: string | null): Observable<Note[]> {
    const q = query?.toLowerCase().trim() ?? '';
    const t = tag?.toLowerCase().trim();
    return this.notes$.pipe(
      map((notes) =>
        notes.filter((n) => {
          const matchesQuery =
            !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
          const matchesTag = !t || n.tags.some((tg) => tg.toLowerCase() === t);
          return matchesQuery && matchesTag;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      )
    );
  }

  // PUBLIC_INTERFACE
  /**
   * Returns a single note by id as observable that updates with state.
   */
  getNoteById(id: string | null): Observable<Note | null> {
    return this.notes$.pipe(map((arr) => (id ? arr.find((n) => n.id === id) ?? null : null)));
  }

  // PUBLIC_INTERFACE
  /**
   * Creates a new note, persists it (API or local), and sets it as selected.
   */
  createNote(partial?: Partial<Note>): Observable<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: generateId(),
      title: partial?.title ?? 'Untitled',
      content: partial?.content ?? '',
      tags: (partial?.tags ?? []).map((t) => t.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    };

    if (this.useApi) {
      return this.http.post<Note>(`${API_BASE_URL}/notes`, note).pipe(
        switchMap(() => this.refreshFromApi()),
        map(() => {
          this.selectedNoteId.set(note.id);
          return note;
        }),
        catchError(() => {
          // Fallback to local if API fails
          this.upsertLocal(note);
          return of(note);
        })
      );
    } else {
      this.upsertLocal(note);
      this.selectedNoteId.set(note.id);
      return of(note);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Updates an existing note, persists it (API or local).
   */
  updateNote(note: Note): Observable<Note> {
    const updated: Note = {
      ...note,
      updatedAt: new Date().toISOString(),
      tags: (note.tags ?? []).map((t) => t.trim()).filter(Boolean),
    };
    if (this.useApi) {
      return this.http.put<Note>(`${API_BASE_URL}/notes/${encodeURIComponent(updated.id)}`, updated).pipe(
        switchMap(() => this.refreshFromApi()),
        map(() => updated),
        catchError(() => {
          // Fallback to local if API fails
          this.upsertLocal(updated);
          return of(updated);
        })
      );
    } else {
      this.upsertLocal(updated);
      return of(updated);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Deletes a note by id, and clears selection if it was selected.
   */
  deleteNote(id: string): Observable<boolean> {
    if (this.useApi) {
      return this.http.delete<void>(`${API_BASE_URL}/notes/${encodeURIComponent(id)}`).pipe(
        switchMap(() => this.refreshFromApi()),
        map(() => {
          if (this.selectedNoteId() === id) {
            this.selectedNoteId.set(null);
          }
          return true;
        }),
        catchError(() => {
          // Fallback to local if API fails
          this.deleteLocal(id);
          if (this.selectedNoteId() === id) this.selectedNoteId.set(null);
          return of(true);
        })
      );
    } else {
      this.deleteLocal(id);
      if (this.selectedNoteId() === id) this.selectedNoteId.set(null);
      return of(true);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Returns a unique, sorted list of tags across all notes.
   */
  getAllTags(): Observable<string[]> {
    return this.notes$.pipe(
      map((notes) => Array.from(new Set(notes.flatMap((n) => n.tags))).sort((a, b) => a.localeCompare(b)))
    );
  }

  private upsertLocal(note: Note): void {
    const arr = this.notesSubject.getValue();
    const idx = arr.findIndex((n) => n.id === note.id);
    if (idx >= 0) arr[idx] = note;
    else arr.unshift(note);
    this.notesSubject.next([...arr]);
    this.saveToStorage();
  }

  private deleteLocal(id: string): void {
    const arr = this.notesSubject.getValue().filter((n) => n.id !== id);
    this.notesSubject.next(arr);
    this.saveToStorage();
  }
}
