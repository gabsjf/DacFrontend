import { AfterViewInit, Component, ElementRef, OnInit, PLATFORM_ID, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Chart, ChartData } from 'chart.js';
import { DashboardService, FiltrosDashboard } from '../../core/services/dashboard.service';
import { firstValueFrom } from 'rxjs';

interface LinhaTabelaDashboard {
  id: string;
  escolaNome: string;
  municipioNome: string;
  ano: number;
  matriculaInicial: string;
  aprovados: string;
  reprovados: string;
  abandono: string;
  taxaAprovacao: string;
  taxaAbandono: string;
}

interface CardDashboardViewModel {
  titulo: string;
  valor: string;
  observacao: string;
  tonalidade: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('evolucaoCanvas') evolucaoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('rankingCanvas') rankingCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('distribuicaoCanvas') distribuicaoCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('percentualAprovacaoCanvas') percentualAprovacaoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('percentualReprovacaoCanvas') percentualReprovacaoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('taxaAbandonoCanvas') taxaAbandonoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('aprovadosCanvas') aprovadosCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('reprovadosCanvas') reprovadosCanvas?: ElementRef<HTMLCanvasElement>;

  private graficoEvolucaoInstance?: Chart<'line'>;
  private graficoRankingInstance?: Chart<'bar'>;
  private graficoDistribuicaoInstance?: Chart<'doughnut'>;

  private graficoPercentualAprovacaoInstance?: Chart<'line'>;
  private graficoPercentualReprovacaoInstance?: Chart<'line'>;
  private graficoTaxaAbandonoInstance?: Chart<'line'>;
  private graficoAprovadosInstance?: Chart<'bar'>;
  private graficoReprovadosInstance?: Chart<'bar'>;

  private viewPronto = false;

  readonly filtros = signal<FiltrosDashboard>({
    anoInicial: 'todos',
    anoFinal: 'todos',
    municipioId: 'todos',
    escolaId: 'todos',
    indicador: 'todos'
  });

  readonly anos = this.dashboardService.getAnos();
  readonly carregando = signal(true);

  // Dados carregados da API
  readonly municipios = signal<any[]>([]);
  readonly escolas = signal<any[]>([]);

  readonly indicadoresOpcoes = this.dashboardService.opcoesIndicador;

  readonly escolasFiltradas = computed(() => {
  const municipioId = this.filtros().municipioId;
  const todasEscolas = this.escolas();

  if (municipioId === 'todos') {
    return todasEscolas;
  }

  return todasEscolas.filter((escola) =>
    String(escola.municipioId) === String(municipioId)
  );
});

  // Observable que muda quando filtros mudam
  private readonly filtrosObservable = computed(() => this.filtros());

  // Signal com os dados filtrados
  readonly dadosFiltrados = signal<any[]>([]);

  readonly cards = signal<CardDashboardViewModel[]>([]);
  readonly tabela = signal<LinhaTabelaDashboard[]>([]);

  readonly semDados = computed(() => this.dadosFiltrados().length === 0);

  readonly graficoEvolucaoData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly graficoRankingData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly graficoDistribuicaoData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  readonly graficoPercentualAprovacaoData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly graficoPercentualReprovacaoData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly graficoTaxaAbandonoData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly graficoAprovadosData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly graficoReprovadosData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  private readonly carregarDadosEffect = effect(async () => {
    this.filtrosObservable();
    try {
      const dados = await firstValueFrom(
        this.dashboardService.getDadosFiltrados(this.filtros())
      );
      this.dadosFiltrados.set(dados);
      this.atualizarTabela();
      await this.carregarCards();
      await this.carregarGraficos();
      this.montarGraficosIndicadoresPercentuais();
      queueMicrotask(() => this.renderizarGraficos());
    } catch (erro) {
      console.error('Erro ao carregar dados filtrados:', erro);
    }
  });

  async ngOnInit(): Promise<void> {
    try {
      const [municipios, escolas] = await Promise.all([
        this.dashboardService.getMunicipios(),
        this.dashboardService.getEscolas()
      ]);
      this.municipios.set(municipios);
      this.escolas.set(escolas);
    } catch (erro) {
      console.error('Erro ao carregar dados iniciais:', erro);
    } finally {
      this.carregando.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.viewPronto = true;
    this.renderizarGraficos();
  }

  private async carregarCards(): Promise<void> {
    try {
      const cards = await this.dashboardService.getCards(this.dadosFiltrados());
      this.cards.set(cards);
    } catch (erro) {
      console.error('Erro ao carregar cards:', erro);
    }
  }

  private async carregarGraficos(): Promise<void> {
    if (this.semDados()) {
      return;
    }

    try {
      const [evolucao, ranking, distribuicao] = await Promise.all([
        this.dashboardService.getGraficoEvolucao(this.dadosFiltrados()),
        this.dashboardService.getGraficoRanking(this.dadosFiltrados()),
        this.dashboardService.getGraficoDistribuicao(this.dadosFiltrados())
      ]);
      this.graficoEvolucaoData.set(evolucao);
      this.graficoRankingData.set(ranking);
      this.graficoDistribuicaoData.set(distribuicao);
    } catch (erro) {
      console.error('Erro ao carregar gráficos:', erro);
    }
  }

  atualizarFiltros(filtros: FiltrosDashboard): void {
    this.filtros.set({
      ...filtros,
      escolaId:
        filtros.escolaId === 'todos' || filtros.municipioId === 'todos'
          ? filtros.escolaId
          : this.escolasFiltradas().some((escola) => String(escola.id) === String(filtros.escolaId))
            ? filtros.escolaId
            : 'todos'
    });
    this.atualizarTabela();
  }

  limparFiltros(): void {
    this.filtros.set({
      anoInicial: 'todos',
      anoFinal: 'todos',
      municipioId: 'todos',
      escolaId: 'todos',
      indicador: 'todos'
    });
    this.atualizarTabela();
  }

  private atualizarTabela(): void {
    const dados = this.dadosFiltrados();
    const tabela = this.dashboardService.ordenarTabela(dados).map((item) => {
      const is2026EmAndamento = item.ano === 2026 && item.aprovados === 0 && item.reprovados === 0 && item.abandono === 0;

      return {
        id: item.id,
        escolaNome: item.escolaNome,
        municipioNome: item.municipioNome,
        ano: item.ano,
        matriculaInicial: this.dashboardService.formatarNumero(item.matriculaInicial),
        aprovados: is2026EmAndamento ? 'Em apuração' : this.dashboardService.formatarNumero(item.aprovados),
        reprovados: is2026EmAndamento ? 'Em apuração' : this.dashboardService.formatarNumero(item.reprovados),
        abandono: is2026EmAndamento ? 'Em apuração' : this.dashboardService.formatarNumero(item.abandono),
        taxaAprovacao: is2026EmAndamento ? 'Em apuração' : `${this.dashboardService.formatarPercentual(item.taxaAprovacao)}%`,
        taxaAbandono: is2026EmAndamento ? 'Em apuração' : `${this.dashboardService.formatarPercentual(item.taxaAbandono)}%`
      };
    });
    this.tabela.set(tabela);
  }

  alterarAnoInicial(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    let novoAnoInicial: number | 'todos' = valor === 'todos' ? 'todos' : Number(valor);
    let novoAnoFinal: number | 'todos' = this.filtros().anoFinal;

    if (novoAnoInicial !== 'todos' && novoAnoFinal !== 'todos' && Number(novoAnoInicial) > Number(novoAnoFinal)) {
      novoAnoFinal = novoAnoInicial;
    }

    this.atualizarFiltros({
      ...this.filtros(),
      anoInicial: novoAnoInicial,
      anoFinal: novoAnoFinal
    });
  }

  alterarAnoFinal(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    let novoAnoFinal: number | 'todos' = valor === 'todos' ? 'todos' : Number(valor);
    let novoAnoInicial: number | 'todos' = this.filtros().anoInicial;

    if (novoAnoInicial !== 'todos' && novoAnoFinal !== 'todos' && Number(novoAnoInicial) > Number(novoAnoFinal)) {
      novoAnoInicial = novoAnoFinal;
    }

    this.atualizarFiltros({
      ...this.filtros(),
      anoInicial: novoAnoInicial,
      anoFinal: novoAnoFinal
    });
  }

 alterarMunicipio(event: Event): void {
  const valor = (event.target as HTMLSelectElement).value;

  this.atualizarFiltros({
    ...this.filtros(),
    municipioId: valor,
    escolaId: 'todos'
  });
}

  alterarEscola(event: Event): void {
  const valor = (event.target as HTMLSelectElement).value;

  console.log('Escola selecionada:', valor);

  this.atualizarFiltros({
    ...this.filtros(),
    escolaId: valor
  });
}

  alterarIndicador(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value as FiltrosDashboard['indicador'];
    this.atualizarFiltros({
      ...this.filtros(),
      indicador: valor
    });
  }

  private renderizarGraficos(): void {
    if (!this.viewPronto || this.semDados() || !isPlatformBrowser(this.platformId)) {
      this.graficoEvolucaoInstance?.destroy();
      this.graficoRankingInstance?.destroy();
      this.graficoDistribuicaoInstance?.destroy();

      this.graficoPercentualAprovacaoInstance?.destroy();
      this.graficoPercentualReprovacaoInstance?.destroy();
      this.graficoTaxaAbandonoInstance?.destroy();
      this.graficoAprovadosInstance?.destroy();
      this.graficoReprovadosInstance?.destroy();
      return;
    }

    this.renderizarGraficoLinha();
    this.renderizarGraficoBarras();
    this.renderizarGraficoRosca();
    
    this.renderizarGraficoPercentualAprovacao();
    this.renderizarGraficoPercentualReprovacao();
    this.renderizarGraficoTaxaAbandono();
    this.renderizarGraficoAprovados();
    this.renderizarGraficoReprovados();
  }

  private renderizarGraficoLinha(): void {
    const canvas = this.evolucaoCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      return;
    }

    this.graficoEvolucaoInstance?.destroy();
    const configuracao = this.graficoEvolucaoData();
    this.graficoEvolucaoInstance = new Chart(contexto, {
      type: 'line',
      data: configuracao,
      options: this.dashboardService.getGraficoEvolucaoOptions()
    });
  }

  private renderizarGraficoBarras(): void {
    const canvas = this.rankingCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      return;
    }

    this.graficoRankingInstance?.destroy();
    const configuracao = this.graficoRankingData();
    this.graficoRankingInstance = new Chart(contexto, {
      type: 'bar',
      data: configuracao,
      options: this.dashboardService.getGraficoRankingOptions()
    });
  }

  private renderizarGraficoRosca(): void {
    const canvas = this.distribuicaoCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      return;
    }

    this.graficoDistribuicaoInstance?.destroy();
    const configuracao = this.graficoDistribuicaoData();
    this.graficoDistribuicaoInstance = new Chart(contexto, {
      type: 'doughnut',
      data: configuracao,
      options: this.dashboardService.getGraficoDistribuicaoOptions()
    });
  }

  private montarGraficosIndicadoresPercentuais(): void {
    const dados = this.dadosFiltrados();

    const mapaAnos = new Map<number, {
      matriculaInicial: number;
      aprovados: number;
      reprovados: number;
      abandono: number;
    }>();

    dados.forEach((item) => {
      const agregado = mapaAnos.get(item.ano!) || { matriculaInicial: 0, aprovados: 0, reprovados: 0, abandono: 0 };
      agregado.matriculaInicial += item.matriculaInicial;
      agregado.aprovados += item.aprovados;
      agregado.reprovados += item.reprovados;
      agregado.abandono += item.abandono;
      mapaAnos.set(item.ano!, agregado);
    });

    const anosOrdenados = Array.from(mapaAnos.keys()).sort((a, b) => a - b);

    const labels = anosOrdenados.map(ano => ano === 2026 ? '2026*' : String(ano));
    const percentualAprovacao: (number | null)[] = [];
    const percentualReprovacao: (number | null)[] = [];
    const taxaAbandono: (number | null)[] = [];
    const aprovados: (number | null)[] = [];
    const reprovados: (number | null)[] = [];

    anosOrdenados.forEach((ano) => {
      const agregado = mapaAnos.get(ano)!;
      const is2026EmAndamento = ano === 2026 && agregado.aprovados === 0 && agregado.reprovados === 0 && agregado.abandono === 0;

      if (is2026EmAndamento) {
        percentualAprovacao.push(null);
        percentualReprovacao.push(null);
        taxaAbandono.push(null);
        aprovados.push(null);
        reprovados.push(null);
      } else {
        percentualAprovacao.push(agregado.matriculaInicial > 0 ? (agregado.aprovados / agregado.matriculaInicial) * 100 : 0);
        percentualReprovacao.push(agregado.matriculaInicial > 0 ? (agregado.reprovados / agregado.matriculaInicial) * 100 : 0);
        taxaAbandono.push(agregado.matriculaInicial > 0 ? (agregado.abandono / agregado.matriculaInicial) * 100 : 0);
        aprovados.push(agregado.aprovados);
        reprovados.push(agregado.reprovados);
      }
    });

    this.graficoPercentualAprovacaoData.set({
      labels,
      datasets: [{ label: 'Aprovação (%)', data: percentualAprovacao, spanGaps: false, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.2)', tension: 0.35, fill: true }]
    });

    this.graficoPercentualReprovacaoData.set({
      labels,
      datasets: [{ label: 'Reprovação (%)', data: percentualReprovacao, spanGaps: false, borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.2)', tension: 0.35, fill: true }]
    });

    this.graficoTaxaAbandonoData.set({
      labels,
      datasets: [{ label: 'Abandono (%)', data: taxaAbandono, spanGaps: false, borderColor: '#ea580c', backgroundColor: 'rgba(234, 88, 12, 0.2)', tension: 0.35, fill: true }]
    });

    this.graficoAprovadosData.set({
      labels,
      datasets: [{ label: 'Total Aprovados', data: aprovados, backgroundColor: '#2563eb' }]
    });

    this.graficoReprovadosData.set({
      labels,
      datasets: [{ label: 'Total Reprovados', data: reprovados, backgroundColor: '#9333ea' }]
    });
  }

  private renderizarGraficoPercentualAprovacao(): void {
    const canvas = this.percentualAprovacaoCanvas?.nativeElement;
    if (!canvas) return;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    this.graficoPercentualAprovacaoInstance?.destroy();
    this.graficoPercentualAprovacaoInstance = new Chart(contexto, {
      type: 'line',
      data: this.graficoPercentualAprovacaoData(),
      options: this.dashboardService.getGraficoEvolucaoOptions()
    });
  }

  private renderizarGraficoPercentualReprovacao(): void {
    const canvas = this.percentualReprovacaoCanvas?.nativeElement;
    if (!canvas) return;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    this.graficoPercentualReprovacaoInstance?.destroy();
    this.graficoPercentualReprovacaoInstance = new Chart(contexto, {
      type: 'line',
      data: this.graficoPercentualReprovacaoData(),
      options: this.dashboardService.getGraficoEvolucaoOptions()
    });
  }

  private renderizarGraficoTaxaAbandono(): void {
    const canvas = this.taxaAbandonoCanvas?.nativeElement;
    if (!canvas) return;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    this.graficoTaxaAbandonoInstance?.destroy();
    this.graficoTaxaAbandonoInstance = new Chart(contexto, {
      type: 'line',
      data: this.graficoTaxaAbandonoData(),
      options: this.dashboardService.getGraficoEvolucaoOptions()
    });
  }

  private renderizarGraficoAprovados(): void {
    const canvas = this.aprovadosCanvas?.nativeElement;
    if (!canvas) return;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    this.graficoAprovadosInstance?.destroy();
    this.graficoAprovadosInstance = new Chart(contexto, {
      type: 'bar',
      data: this.graficoAprovadosData(),
      options: this.dashboardService.getGraficoRankingOptions()
    });
  }

  private renderizarGraficoReprovados(): void {
    const canvas = this.reprovadosCanvas?.nativeElement;
    if (!canvas) return;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    this.graficoReprovadosInstance?.destroy();
    this.graficoReprovadosInstance = new Chart(contexto, {
      type: 'bar',
      data: this.graficoReprovadosData(),
      options: this.dashboardService.getGraficoRankingOptions()
    });
  }
}