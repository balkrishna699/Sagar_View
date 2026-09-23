/**
 * Person 2 — Vertical Depth Profile Chart
 *
 * Adapted from Person 2's `person2-instruments` branch.
 * Renders depth-vs-variable scatter/line charts using Chart.js.
 *
 * Integration:
 *   - Listens to eventBus 'profileDataReady' (emitted by MarkerManager on click)
 *   - Also provides updateProfile(lat, lon, oceanData) for direct calls
 *   - Uses Person 1's dark ocean theme colors
 *
 * Chart layout (from Person 2's design):
 *   Y-axis: Depth (reversed — 0m at top, max depth at bottom)
 *   X-axes: Temperature (top), Salinity (bottom) — separate scales
 */

import Chart from 'chart.js/auto';
import { eventBus } from './eventBus.js';

export class ProfileChart {
  /**
   * @param {HTMLElement} container — parent container (canvas-container)
   */
  constructor(container) {
    this.chart = null;
    this.visible = false;

    // ── Create the profile panel DOM ──
    this.panel = document.createElement('div');
    this.panel.id = 'profile-panel';
    this.panel.className = 'profile-panel hidden';
    this.panel.innerHTML = `
      <div class="profile-header">
        <div>
          <h3 class="profile-title">Vertical Observation Profile</h3>
          <p class="profile-subtitle" id="profile-subtitle">
            Click an instrument marker to view depth profile
          </p>
        </div>
        <button class="profile-close-btn" id="profile-close-btn">×</button>
      </div>
      <div class="profile-chart-area">
        <canvas id="profile-canvas"></canvas>
      </div>
    `;
    container.appendChild(this.panel);

    // ── Close button ──
    this.panel.querySelector('#profile-close-btn')
      .addEventListener('click', () => this.hide());

    // ── Listen for profile events from MarkerManager ──
    eventBus.on('profileDataReady', ({ profile, markerId, markerType }) => {
      this.renderProfile(profile, markerId, markerType);
      this.show();
    });

    // ── Also listen for markerClicked to show panel ──
    eventBus.on('markerClicked', ({ lat, lon, type, id }) => {
      // Profile data will follow via profileDataReady event
      console.log(`📊 Profile chart: preparing for ${type} ${id}`);
    });
  }

  show() {
    this.panel.classList.remove('hidden');
    this.visible = true;
  }

  hide() {
    this.panel.classList.add('hidden');
    this.visible = false;
  }

  /**
   * Render a depth profile chart.
   *
   * @param {object} profile — { depths, temperature, salinity, lat, lon }
   * @param {string} markerId
   * @param {string} markerType
   */
  renderProfile(profile, markerId, markerType) {
    if (!profile?.depths?.length) return;

    const canvas = this.panel.querySelector('#profile-canvas');
    if (!canvas) return;

    // Update subtitle
    const subtitle = this.panel.querySelector('#profile-subtitle');
    if (subtitle) {
      subtitle.textContent = `Vertical profile near ${profile.lat.toFixed(2)}°N, ${profile.lon.toFixed(2)}°E`;
    }

    // Build chart data — Person 2's scatter format: x = variable, y = depth
    const temperatureData = [];
    const salinityData = [];
    const speedData = [];

    profile.depths.forEach((depth, i) => {
      if (profile.temperature[i] !== null) {
        temperatureData.push({ x: profile.temperature[i], y: depth });
      }
      if (profile.salinity[i] !== null) {
        salinityData.push({ x: profile.salinity[i], y: depth });
      }
      if (profile.currentSpeed && profile.currentSpeed[i] !== null) {
        speedData.push({ x: profile.currentSpeed[i], y: depth });
      }
    });

    // Destroy previous chart
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const maxDepth = Math.max(...profile.depths);

    // ── Chart.js config (adapted from Person 2's updateProfileChart) ──
    this.chart = new Chart(canvas, {
      type: 'scatter',

      data: {
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temperatureData,
            showLine: true,
            borderWidth: 2,
            borderColor: 'rgba(255, 107, 53, 0.9)',
            backgroundColor: 'rgba(255, 107, 53, 0.15)',
            pointRadius: 3,
            pointBackgroundColor: 'rgba(255, 107, 53, 0.8)',
            tension: 0.25,
            xAxisID: 'xTemperature',
          },
          {
            label: 'Salinity (PSU)',
            data: salinityData,
            showLine: true,
            borderWidth: 2,
            borderColor: 'rgba(77, 184, 255, 0.9)',
            backgroundColor: 'rgba(77, 184, 255, 0.15)',
            pointRadius: 3,
            pointBackgroundColor: 'rgba(77, 184, 255, 0.8)',
            tension: 0.25,
            xAxisID: 'xSalinity',
          },
          {
            label: 'Current Speed (m/s)',
            data: speedData,
            showLine: true,
            borderWidth: 2,
            borderColor: 'rgba(160, 196, 223, 0.9)',
            backgroundColor: 'rgba(160, 196, 223, 0.15)',
            pointRadius: 3,
            pointBackgroundColor: 'rgba(160, 196, 223, 0.8)',
            tension: 0.25,
            xAxisID: 'xSpeed',
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'nearest',
          intersect: false,
        },

        scales: {
          /*
           * TWO HORIZONTAL X AXES
           * (Person 2's design: separate scales for different variables)
           */
          xTemperature: {
            type: 'linear',
            position: 'top',
            title: {
              display: true,
              text: 'Temperature (°C)',
              color: '#ff6b35',
              font: { size: 11, family: 'Inter, sans-serif' },
            },
            ticks: { color: '#ff9b72' },
            grid: {
              drawOnChartArea: true,
              color: 'rgba(255, 107, 53, 0.08)',
            },
          },

          xSalinity: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Salinity (PSU)',
              color: '#4db8ff',
              font: { size: 11, family: 'Inter, sans-serif' },
            },
            ticks: { color: '#7ccbff' },
            grid: {
              drawOnChartArea: false,
            },
          },

          xSpeed: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Current Speed (m/s)',
              color: '#a0c4df',
              font: { size: 11, family: 'Inter, sans-serif' },
            },
            ticks: { color: '#a0c4df' },
            grid: {
              drawOnChartArea: false,
            },
          },

          /*
           * Y AXIS: Depth (reversed — 0m at top, max at bottom)
           * (Person 2's key design decision for oceanographic convention)
           */
          y: {
            type: 'linear',
            reverse: true,
            min: 0,
            max: maxDepth,
            title: {
              display: true,
              text: 'Depth (m)',
              color: '#a0c4df',
              font: { size: 11, family: 'Inter, sans-serif' },
            },
            ticks: {
              color: '#6ea8d4',
              stepSize: maxDepth > 1000 ? 500 : maxDepth > 200 ? 100 : 50,
            },
            grid: {
              color: 'rgba(160, 196, 223, 0.1)',
            },
          },
        },

        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#a0c4df',
              padding: 12,
              font: { size: 11, family: 'Inter, sans-serif' },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(10, 22, 40, 0.95)',
            borderColor: 'rgba(77, 184, 255, 0.3)',
            borderWidth: 1,
            titleColor: '#4db8ff',
            bodyColor: '#a0c4df',
            callbacks: {
              title: context => {
                if (!context.length) return '';
                return `Depth: ${context[0].parsed.y.toFixed(0)} m`;
              },
              label: context => {
                const label = context.dataset.label || '';
                return `${label}: ${context.parsed.x.toFixed(2)}`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * Direct profile update (can be called without events).
   * Person 2 can use this to programmatically show profiles.
   *
   * @param {number} lat
   * @param {number} lon
   * @param {object} oceanData — { grid, temperature, salinity }
   */
  updateProfile(lat, lon, oceanData) {
    if (!oceanData?.grid) return;

    const { grid, temperature, salinity } = oceanData;
    const latIdx = _findNearest(grid.lat, lat);
    const lonIdx = _findNearest(grid.lon, lon);

    const profile = {
      lat: grid.lat[latIdx],
      lon: grid.lon[lonIdx],
      depths: [...grid.depth],
      temperature: grid.depth.map((_, d) => temperature?.[d]?.[latIdx]?.[lonIdx] ?? null),
      salinity: grid.depth.map((_, d) => salinity?.[d]?.[latIdx]?.[lonIdx] ?? null),
      currentSpeed: grid.depth.map((_, d) => oceanData.currentSpeed?.[d]?.[latIdx]?.[lonIdx] ?? null),
    };

    this.renderProfile(profile, 'manual', 'manual');
    this.show();
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.panel.remove();
  }
}

function _findNearest(arr, value) {
  let minDist = Infinity;
  let best = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = Math.abs(arr[i] - value);
    if (d < minDist) { minDist = d; best = i; }
  }
  return best;
}
