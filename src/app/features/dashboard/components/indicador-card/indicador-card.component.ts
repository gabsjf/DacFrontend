import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-indicador-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './indicador-card.component.html',
  styleUrl: './indicador-card.component.scss'
})
export class IndicadorCardComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) valor = '';
  @Input({ required: true }) observacao = '';
  @Input() tonalidade: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
}