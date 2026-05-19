import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { bootstrapApplication } from '@angular/platform-browser';

import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController
} from 'chart.js';

import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localePt);

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController
);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));