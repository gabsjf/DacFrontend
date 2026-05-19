import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-grafico-distribuicao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grafico-distribuicao.component.html',
  styleUrl: './grafico-distribuicao.component.scss'
})
export class GraficoDistribuicaoComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) chartData!: ChartData<'doughnut'>;
  @Input({ required: true }) chartOptions!: ChartOptions<'doughnut'>;

  private chart?: Chart<'doughnut'>;

  ngAfterViewInit(): void {
    this.renderizar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] || changes['chartOptions']) {
      this.renderizar();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderizar(): void {
    const canvas = this.chartCanvas?.nativeElement;

    if (!canvas || !this.chartData) {
      return;
    }

    this.chart?.destroy();

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.chart = new Chart(context, {
      type: 'doughnut',
      data: this.chartData,
      options: this.chartOptions
    });
  }
}