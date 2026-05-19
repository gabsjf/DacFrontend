import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) descricao = '';
  @Input() acao = 'Voltar';
  @Output() acaoClick = new EventEmitter<void>();
}