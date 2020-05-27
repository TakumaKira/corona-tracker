import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import { Observable, throwError } from 'rxjs';
import { first, tap } from 'rxjs/operators';
import { ISummary, ITotalCountry } from './interfaces';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('select', { static: false }) select: MatSelect;

  public summary$: Observable<ISummary>;
  public selectedCountry: string;
  private chartData: ChartData;
  private chart: Chart;
  public errorMessage: string;

  public apiBaseUrl = 'https://api.covid19api.com';
  public prevSelectedCountry: string;

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.getSummary();
  }

  private getSummary() {
    this.summary$ = this.http.get<ISummary>(`${this.apiBaseUrl}/summary`).pipe(
      first(),
      tap(
        () => {},
        (err) => this.handleSummaryLoadError(err)
      )
    );
  }

  private handleSummaryLoadError(error: HttpErrorResponse) {
    if (error.status === 429) {
      this.errorMessage = `Too Many Requests. Please try later.`;
    } else {
      this.errorMessage = `Something went wrong. Please try again`;
    }
    // Error from client or network.
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      // Error from server.
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    // Return error message.
    return throwError('Something bad happened; please try again later.');
  }

  public onSelectChange(selectedCountry: string) {
    this.http
      .get<ITotalCountry[]>(
        `${this.apiBaseUrl}/total/country/${selectedCountry}`
      )
      .pipe(
        first(),
        tap(
          (result) => {
            this.prevSelectedCountry = selectedCountry;
            this.setData(result);
          },
          (err) => {
            this.handleCountryDataLoadError(err);
          }
        )
      )
      .subscribe();
  }

  private setData(dataSets: ITotalCountry[]) {
    let chartIsReady: boolean;
    if (!!this.chartData) {
      chartIsReady = true;
    }
    const labels: string[] = [];
    const dataDeath: number[] = [];
    const dataRecovered: number[] = [];
    const dataConfirmedExceptDeathAndRecovered: number[] = [];
    dataSets.forEach((dataSet) => {
      labels.push(dataSet.Date.replace('T00:00:00Z', ''));
      dataDeath.push(dataSet.Deaths);
      dataRecovered.push(dataSet.Recovered);
      dataConfirmedExceptDeathAndRecovered.push(
        dataSet.Confirmed - dataSet.Deaths - dataSet.Recovered
      );
    });
    this.chartData = {
      labels,
      datasets: [
        {
          label: 'Deaths',
          backgroundColor: 'hsl(0, 60%, 45%)',
          data: dataDeath,
        },
        {
          label: 'Recovered',
          backgroundColor: 'hsl(240, 70%, 45%)',
          data: dataRecovered,
        },
        {
          label: 'Confirmed - (Death + Recovered)',
          backgroundColor: 'hsl(120, 80%, 30%)',
          data: dataConfirmedExceptDeathAndRecovered,
        },
      ],
    };
    if (!chartIsReady) {
      this.setupChart();
    } else {
      this.changeData();
    }
  }

  private setupChart() {
    Chart.defaults.global.defaultFontColor = 'hsl(0, 0%, 80%)';
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: this.chartData,
      options: {
        title: {
          display: false,
          text: '',
        },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        responsive: true,
        scales: {
          xAxes: [
            {
              stacked: true,
            },
          ],
          yAxes: [
            {
              stacked: true,
            },
          ],
        },
      },
    });
  }

  private changeData() {
    this.chart.data = this.chartData;
    this.chart.update();
  }

  private handleCountryDataLoadError(error: HttpErrorResponse) {
    this.select.value = this.prevSelectedCountry;
    console.log(error);
  }
}
