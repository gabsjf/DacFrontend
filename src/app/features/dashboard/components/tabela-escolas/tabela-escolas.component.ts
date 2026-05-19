import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IndicadorEducacional } from '../../../../core/models/indicador-educacional.model';

@Component({
  selector: 'app-tabela-escolas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabela-escolas.component.html',
  styleUrl: './tabela-escolas.component.scss'
})
export class TabelaEscolasComponent {
  @Input({ required: true }) escolas: IndicadorEducacional[] = [];
}