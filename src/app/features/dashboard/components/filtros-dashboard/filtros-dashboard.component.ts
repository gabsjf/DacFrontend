import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Escola } from '../../../../core/models/escola.model';
import { Municipio } from '../../../../core/models/municipio.model';
import { FiltroIndicador, FiltrosDashboard } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-filtros-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filtros-dashboard.component.html',
  styleUrl: './filtros-dashboard.component.scss'
})
export class FiltrosDashboardComponent {
  @Input({ required: true }) filtros!: FiltrosDashboard;
  @Input({ required: true }) anos: number[] = [];
  @Input({ required: true }) municipios: Municipio[] = [];
  @Input({ required: true }) escolas: Escola[] = [];
  @Input({ required: true }) indicadores: Array<{ valor: FiltroIndicador; label: string }> = [];

  @Output() filtrosChange = new EventEmitter<FiltrosDashboard>();

  protected alterarAnoInicial(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    let novoAnoInicial: number | 'todos' = valor === 'todos' ? 'todos' : Number(valor);
    let novoAnoFinal: number | 'todos' = this.filtros.anoFinal;

    if (novoAnoInicial !== 'todos' && novoAnoFinal !== 'todos' && Number(novoAnoInicial) > Number(novoAnoFinal)) {
      novoAnoFinal = novoAnoInicial;
    }

    this.emitir({ 
      anoInicial: novoAnoInicial,
      anoFinal: novoAnoFinal
    });
  }

  protected alterarAnoFinal(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    let novoAnoFinal: number | 'todos' = valor === 'todos' ? 'todos' : Number(valor);
    let novoAnoInicial: number | 'todos' = this.filtros.anoInicial;

    if (novoAnoInicial !== 'todos' && novoAnoFinal !== 'todos' && Number(novoAnoInicial) > Number(novoAnoFinal)) {
      novoAnoInicial = novoAnoFinal;
    }

    this.emitir({ 
      anoInicial: novoAnoInicial,
      anoFinal: novoAnoFinal
    });
  }

  protected alterarMunicipio(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.emitir({ municipioId: valor, escolaId: 'todos' });
  }

  protected alterarEscola(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.emitir({ escolaId: valor });
  }

  protected alterarIndicador(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value as FiltroIndicador;
    this.emitir({ indicador: valor });
  }

  protected limpar(): void {
    this.emitir({
      anoInicial: 'todos',
      anoFinal: 'todos',
      municipioId: 'todos',
      escolaId: 'todos',
      indicador: 'todos'
    });
  }

  private emitir(partial: Partial<FiltrosDashboard>): void {
    this.filtrosChange.emit({
      ...this.filtros,
      ...partial
    });
  }
}