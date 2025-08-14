import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() tags: string[] = [];
  @Input() activeTag: string | null = null;

  @Output() createNote = new EventEmitter<void>();
  @Output() selectTag = new EventEmitter<string | null>();

  protected expanded = signal<boolean>(true);

  // PUBLIC_INTERFACE
  /** Toggle the visibility of the tag list */
  toggle() {
    this.expanded.set(!this.expanded());
  }

  // PUBLIC_INTERFACE
  /** Emit creation event */
  onCreate() {
    this.createNote.emit();
  }

  // PUBLIC_INTERFACE
  /** Emit tag selection filter */
  onSelectTag(tag: string | null) {
    this.selectTag.emit(tag);
  }
}
