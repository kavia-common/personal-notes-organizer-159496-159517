import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css'
})
export class NoteListComponent {
  @Input() notes: Note[] = [];
  @Input() selectedId: string | null = null;

  @Output() select = new EventEmitter<string>();

  // PUBLIC_INTERFACE
  /** Emit selection for the clicked note id */
  onSelect(id: string) {
    this.select.emit(id);
  }
}
