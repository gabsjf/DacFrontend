import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-grafico-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grafico-ranking.component.html',
  styleUrl: './grafico-ranking.component.scss'
})
export class GraficoRankingComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @Input({ required: true }) chartData!: ChartData<'bar'>;
  @Input({ required: true }) chartOptions!: ChartOptions<'bar'>;

  private chart?: Chart<'bar'>;

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
      type: 'bar',
      data: this.chartData,
      options: this.chartOptions
    });
  }
}