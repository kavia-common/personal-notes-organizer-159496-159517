import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css'
})
export class NoteEditorComponent implements OnChanges {
  @Input() note: Note | null = null;

  @Output() save = new EventEmitter<Note>();
  @Output() remove = new EventEmitter<string>();

  title = '';
  content = '';
  tagsInput = '';
  tags: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note']) {
      this.title = this.note?.title ?? '';
      this.content = this.note?.content ?? '';
      this.tags = [...(this.note?.tags ?? [])];
      this.tagsInput = '';
    }
  }

  // PUBLIC_INTERFACE
  /** Parse the tags input into the tags array */
  applyTags() {
    if (!this.tagsInput.trim()) return;
    const incoming = this.tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    this.tags = Array.from(new Set([...this.tags, ...incoming]));
    this.tagsInput = '';
  }

  // PUBLIC_INTERFACE
  /** Remove a tag from the current note tags */
  removeTag(tag: string) {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  // PUBLIC_INTERFACE
  /** Emit save with updated note content */
  onSave() {
    if (!this.note) return;
    const updated: Note = {
      ...this.note,
      title: this.title.trim() || 'Untitled',
      content: this.content,
      tags: this.tags.map((t) => t.trim()).filter(Boolean),
      // updatedAt is set by service
      updatedAt: this.note.updatedAt,
    };
    this.save.emit(updated);
  }

  // PUBLIC_INTERFACE
  /** Emit delete for current note id */
  onDelete() {
    if (this.note) {
      this.remove.emit(this.note.id);
    }
  }
}
