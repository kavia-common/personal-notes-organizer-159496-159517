import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent {
  query = '';
  private changes$ = new Subject<string>();

  @Output() search = new EventEmitter<string>();

  constructor() {
    this.changes$.pipe(debounceTime(200), distinctUntilChanged()).subscribe((q) => {
      this.search.emit(q);
    });
  }

  onInput() {
    this.changes$.next(this.query);
  }

  clear() {
    this.query = '';
    this.changes$.next(this.query);
  }
}
