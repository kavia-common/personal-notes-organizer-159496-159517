import { Component, effect, signal, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NoteListComponent } from './components/note-list/note-list.component';
import { NoteEditorComponent } from './components/note-editor/note-editor.component';
import { NotesService } from './services/notes.service';
import { Note } from './models/note.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, SidebarComponent, NoteListComponent, NoteEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Top-level state
  query = signal<string>('');
  activeTag = signal<string | null>(null);

  // Selected note id lives in the service as a signal to share across components if needed
  selectedId!: WritableSignal<string | null>;

  // Derived data
  filteredNotes = signal<Note[]>([]);
  selectedNote = signal<Note | null>(null);
  allTags = signal<string[]>([]);

  // Use injection at field level to avoid "unused constructor param" lint issue
  notesSvc = inject(NotesService);

  constructor() {
    // Initialize service-provided signal after DI is available
    this.selectedId = this.notesSvc.selectedNoteId as WritableSignal<string | null>;
    // Keep filtered notes in sync
    effect(() => {
      const q = this.query();
      const t = this.activeTag();
      this.notesSvc.getFilteredNotes(q, t).subscribe((notes) => this.filteredNotes.set(notes));
    });

    // Keep selected note in sync
    effect(() => {
      this.notesSvc.getNoteById(this.selectedId()).subscribe((n) => this.selectedNote.set(n));
    });

    // Load tags
    this.notesSvc.getAllTags().subscribe((tags) => this.allTags.set(tags));
  }

  // PUBLIC_INTERFACE
  /** Handler for search input from SearchBarComponent */
  onSearch(q: string) {
    this.query.set(q);
  }

  // PUBLIC_INTERFACE
  /** Handler for New Note button, creates and selects a note */
  onCreateNote() {
    this.notesSvc.createNote({ title: 'Untitled', content: '' }).subscribe();
  }

  // PUBLIC_INTERFACE
  /** Handler for tag selection from SidebarComponent */
  onSelectTag(tag: string | null) {
    this.activeTag.set(tag);
  }

  // PUBLIC_INTERFACE
  /** Handler for selecting a note from list */
  onSelectNote(id: string) {
    this.selectedId.set(id);
  }

  // PUBLIC_INTERFACE
  /** Save handler from NoteEditorComponent */
  onSave(note: Note) {
    this.notesSvc.updateNote(note).subscribe();
  }

  // PUBLIC_INTERFACE
  /** Delete handler from NoteEditorComponent */
  onDelete(id: string) {
    this.notesSvc.deleteNote(id).subscribe(() => {
      // After deletion, try select the latest available note (if any)
      const next = this.filteredNotes()[0]?.id ?? null;
      this.selectedId.set(next);
    });
  }
}
