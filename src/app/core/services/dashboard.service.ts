import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Escola } from '../models/escola.model';
import { IndicadorEducacional } from '../models/indicador-educacional.model';
import { Municipio } from '../models/municipio.model';
import { API_CONFIG } from '../config/api.config';

export type FiltroIndicador =
  | 'todos'
  | 'taxaAprovacao'
  | 'taxaAbandono'
  | 'matriculaInicial'
  | 'aprovados'
  | 'reprovados'
  | 'abandono';

export interface FiltrosDashboard {
  anoInicial: number | 'todos';
  anoFinal: number | 'todos';
  municipioId: string | 'todos';
  escolaId: string | 'todos';
  indicador: FiltroIndicador;
}

export interface ResumoDashboard {
  totalEscolas: number;
  totalMunicipios: number;
  mediaAprovacao: number;
  mediaAbandono: number;
  totalMatriculas: number;
}

export interface CardDashboard {
  titulo: string;
  valor: string;
  observacao: string;
  tonalidade: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_CONFIG.baseUrl}/api`;

  private readonly formatterNumero = new Intl.NumberFormat('pt-BR');
  private readonly formatterPercentual = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  private readonly anos = Array.from({ length: 9 }, (_, index) => 2018 + index);

  readonly opcoesIndicador: Array<{ valor: FiltroIndicador; label: string }> = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'taxaAprovacao', label: 'Taxa de aprovação' },
    { valor: 'taxaAbandono', label: 'Taxa de abandono' },
    { valor: 'matriculaInicial', label: 'Matrícula inicial' },
    { valor: 'aprovados', label: 'Aprovados' },
    { valor: 'reprovados', label: 'Reprovados' },
    { valor: 'abandono', label: 'Abandono' }
  ];

  getAnos(): number[] {
    return [...this.anos];
  }

  async getMunicipios(): Promise<Municipio[]> {
    return firstValueFrom(this.http.get<Municipio[]>(`${this.apiUrl}/municipios`));
  }

  async getEscolas(): Promise<Escola[]> {
    return firstValueFrom(this.http.get<Escola[]>(`${this.apiUrl}/escolas`));
  }

  async getDadosMockados(): Promise<IndicadorEducacional[]> {
    return firstValueFrom(
      this.http.get<IndicadorEducacional[]>(`${this.apiUrl}/indicadores`)
    );
  }

  async getCards(dados: IndicadorEducacional[]): Promise<CardDashboard[]> {
    let matriculaInicial = 0;
    let aprovados = 0;
    let reprovados = 0;
    let abandono = 0;

    dados.forEach((item) => {
      matriculaInicial += item.matriculaInicial;
      aprovados += item.aprovados;
      reprovados += item.reprovados;
      abandono += item.abandono;
    });

    return [
      {
        titulo: 'Matrículas',
        valor: this.formatarNumero(matriculaInicial),
        observacao: 'Total no período',
        tonalidade: 'primary'
      },
      {
        titulo: 'Aprovados',
        valor: this.formatarNumero(aprovados),
        observacao: 'Total no período',
        tonalidade: 'success'
      },
      {
        titulo: 'Reprovados',
        valor: this.formatarNumero(reprovados),
        observacao: 'Total no período',
        tonalidade: 'danger'
      },
      {
        titulo: 'Abandono',
        valor: this.formatarNumero(abandono),
        observacao: 'Total no período',
        tonalidade: 'warning'
      }
    ];
  }

  getDadosFiltrados(filtros: FiltrosDashboard): Observable<IndicadorEducacional[]> {
  console.log('Filtros enviados:', filtros);

  return this.http.get<any[]>(`${this.apiUrl}/indicadores`, {
    params: this.construirParams(filtros)
  }).pipe(
    map((dados: any[]) => {
      console.log('Dados recebidos da API:', dados);

      let processados = dados.map((item: any): IndicadorEducacional => {
        const matriculaInicial = Number(item.matriculaInicial) || 0;
        const aprovados = Number(item.aprovados) || 0;
        const abandono = Number(item.abandono) || 0;

        const taxaAprovacao =
          matriculaInicial > 0 ? (aprovados / matriculaInicial) * 100 : 0;

        const taxaAbandono =
          matriculaInicial > 0 ? (abandono / matriculaInicial) * 100 : 0;

        return {
          id: item.id ?? `${item.ano}-${item.municipioId}-${item.escolaId}`,

          ano: Number(item.ano) || 0,

          municipioId: item.municipioId ?? '',
          municipioNome: item.municipio ?? '',

          escolaId: item.escolaId ?? '',
          escolaNome: item.escola ?? '',

          matriculaInicial,
          aprovados,
          reprovados: Number(item.reprovados) || 0,
          abandono,

          taxaAprovacao,
          taxaAbandono
        };
      });

      if (filtros.anoInicial !== 'todos') {
        const minAno = Number(filtros.anoInicial);
        processados = processados.filter(item => item.ano >= minAno);
      }

      if (filtros.anoFinal !== 'todos') {
        const maxAno = Number(filtros.anoFinal);
        processados = processados.filter(item => item.ano <= maxAno);
      }

      return processados;
    })
  );
}
  getResumo(dados: IndicadorEducacional[]): Promise<ResumoDashboard> {
    return firstValueFrom(
      this.http.get<ResumoDashboard>(`${this.apiUrl}/dashboard/resumo`, {
        params: this.construirParams({})
      })
    );
  }

 getGraficoEvolucao(dados: IndicadorEducacional[]): Promise<ChartData<'line'>> {
  return firstValueFrom(
    this.http.get<any[]>(`${this.apiUrl}/dashboard/grafico-evolucao`).pipe(
      map((resultado) => ({
        labels: resultado.map((item) => item.ano.toString()),
        datasets: [
          {
            label: 'Evolução histórica',
            data: resultado.map((item) => Number(item.valor) || 0),
            borderColor: '#2563eb',
             backgroundColor: 'rgba(37, 99, 235, 0.2)',

            tension: 0.35,
            fill: true
          }
        ]
      }))
    )
  );
}

  getGraficoEvolucaoOptions(): ChartOptions<'line'> {
    return this.criarOpcoesComuns('line');
  }

  getGraficoRanking(dados: IndicadorEducacional[]): Promise<ChartData<'bar'>> {
  return firstValueFrom(
    this.http.get<any[]>(`${this.apiUrl}/dashboard/grafico-ranking`).pipe(
      map((resultado) => ({
        labels: resultado.slice(0, 10).map((item) => item.nome),
        datasets: [
          {
            label: 'Ranking municipal',
            data: resultado.slice(0, 10).map((item) => Number(item.valor) || 0),
            backgroundColor: '#16a34a'
          }
        ]
      }))
    )
  );
}

  getGraficoRankingOptions(): ChartOptions<'bar'> {
    return this.criarOpcoesComuns('bar');
  }

  getGraficoDistribuicao(dados: IndicadorEducacional[]): Promise<ChartData<'doughnut'>> {
  return firstValueFrom(
    this.http.get<any[]>(`${this.apiUrl}/dashboard/grafico-distribuicao`).pipe(
      map((resultado) => ({
        labels: resultado.slice(0, 6).map((item) => item.categoria),
        datasets: [
          {
            label: 'Distribuição',
            data: resultado.slice(0, 6).map((item) => Number(item.valor) || 0),
             backgroundColor: [
      '#2563eb',
      '#16a34a',
      '#dc2626',
      '#ca8a04',
      '#9333ea',
      '#0891b2'
    ]
          }
        ]
      }))
    )
  );
}

  getGraficoDistribuicaoOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };
  }

  ordenarTabela(dados: IndicadorEducacional[]): IndicadorEducacional[] {
  return [...dados].sort((a, b) => {

    if (a.ano !== b.ano) {
      return (b.ano ?? 0) - (a.ano ?? 0);
    }

    const municipioA = (a.municipioNome ?? '').toString();
    const municipioB = (b.municipioNome ?? '').toString();

    if (municipioA !== municipioB) {
      return municipioA.localeCompare(municipioB, 'pt-BR');
    }

    const escolaA = (a.escolaNome ?? '').toString();
    const escolaB = (b.escolaNome ?? '').toString();

    return escolaA.localeCompare(escolaB, 'pt-BR');
  });
}

  formatarNumero(valor: number): string {
    return this.formatterNumero.format(valor);
  }

  formatarPercentual(valor: number): string {
    return this.formatterPercentual.format(valor);
  }

  calcularTaxaAprovacao(aprovados: number, matriculaInicial: number): number {
    if (matriculaInicial === 0) {
      return 0;
    }

    return (aprovados / matriculaInicial) * 100;
  }

  calcularTaxaAbandono(abandono: number, matriculaInicial: number): number {
    if (matriculaInicial === 0) {
      return 0;
    }

    return (abandono / matriculaInicial) * 100;
  }

  private construirParams(filtros: Partial<FiltrosDashboard>): any {
    const params: any = {};

    if (filtros.anoInicial && filtros.anoInicial !== 'todos') {
      params['anoInicial'] = filtros.anoInicial;
    }

    if (filtros.anoFinal && filtros.anoFinal !== 'todos') {
      params['anoFinal'] = filtros.anoFinal;
    }

    if (filtros.municipioId && filtros.municipioId !== 'todos') {
      params['municipioId'] = filtros.municipioId;
    }

    if (filtros.escolaId && filtros.escolaId !== 'todos') {
      params['escolaId'] = filtros.escolaId;
    }

    return params;
  }

  private criarOpcoesComuns(tipo: ChartType): ChartOptions<any> {
    const isBarra = tipo === 'bar';

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: isBarra
        ? {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(31, 91, 122, 0.12)'
              }
            }
          }
        : {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(31, 91, 122, 0.12)'
              }
            }
          },
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          enabled: true
        }
      }
    };
  }
}