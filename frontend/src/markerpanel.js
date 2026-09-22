import { eventBus } from './eventBus.js';

/**
 * Marker detail panel.
 *
 * raycasting.js already emits 'markerClicked' (location/type/id) and
 * 'profileDataReady' (depth-vs-variable profile at that point) — this panel
 * only displays that already-computed data. No new events, no new data
 * fetching, no duplicate of Person 2's raycasting logic.
 */
export class MarkerPanel {
  constructor(container) {
    this.panel = document.createElement('div');
    this.panel.className = 'ctrl-panel';
    this.panel.style.cssText = 'bottom: 90px; right: 16px; min-width: 260px; max-width: 300px; display: none;';
    container.appendChild(this.panel);

    eventBus.on('markerClicked', (data) => this._renderHeader(data));
    eventBus.on('profileDataReady', ({ profile }) => this._renderProfile(profile));
  }

  _renderHeader({ lat, lon, depth, type, id }) {
    this.panel.style.display = 'block';
    this.panel.innerHTML = `
      <label>${(type || 'observation').toUpperCase()} — ${id || ''}</label>
      <div style="font-size: 12px; line-height: 1.7; color: #c8dae8;">
        Lat: ${lat.toFixed(3)}°N &nbsp; Lon: ${lon.toFixed(3)}°E<br/>
        Depth: ${depth} m
      </div>
      <div id="profileArea" style="margin-top: 10px; color: #5a7a94; font-size: 11px;">
        Loading vertical profile…
      </div>
    `;
  }

  _renderProfile(profile) {
    const area = this.panel.querySelector('#profileArea');
    if (!area || !profile) return;

    const { depths, temperature } = profile;
    const vals = temperature.filter((v) => v != null);
    if (vals.length < 2) {
      area.textContent = 'No profile data at this point.';
      return;
    }

    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const maxD = Math.max(...depths);

    area.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 260;
    canvas.height = 90;
    area.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#4db8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    depths.forEach((d, i) => {
      const t = temperature[i];
      if (t == null) return;
      const x = maxD === 0 ? 0 : (d / maxD) * canvas.width;
      const y = maxV === minV
        ? canvas.height / 2
        : canvas.height - ((t - minV) / (maxV - minV)) * canvas.height;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    const label = document.createElement('div');
    label.style.cssText = 'font-size: 10px; color: #5a7a94; margin-top: 4px;';
    label.textContent = `Temperature profile, 0–${maxD}m (${minV.toFixed(1)}–${maxV.toFixed(1)}°C)`;
    area.appendChild(label);
  }
}
