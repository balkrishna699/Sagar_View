import { setState, getState } from './sceneState.js';
import { getColormapNames } from './colormaps.js';

/**
 * Variable + colormap selector.
 * Cherry-picked from Person 3's PR and updated to match new UI styles.
 */
export class VariableSelector {
  constructor(container) {
    const variables = ['temperature', 'salinity'];
    const colormaps = getColormapNames();
    const { currentVariable, currentColormap } = getState();

    const panel = document.createElement('div');
    panel.className = 'ctrl-panel';
    // Positioned below TimeControls
    panel.style.cssText = 'top: 190px; left: 16px; min-width: 200px; display: flex; flex-direction: column; gap: 12px;';
    panel.innerHTML = `
      <div>
        <label style="display:block; margin-bottom: 4px;">VARIABLE</label>
        <select id="variableSelect" class="dash-select">
          ${variables.map(v => `
            <option value="${v}" ${v === currentVariable ? 'selected' : ''}>
              ${v.charAt(0).toUpperCase() + v.slice(1)}
            </option>`).join('')}
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom: 4px;">COLORMAP</label>
        <select id="colormapSelect" class="dash-select">
          ${colormaps.map(c => `
            <option value="${c}" ${c === currentColormap ? 'selected' : ''}>${c.toUpperCase()}</option>`).join('')}
        </select>
      </div>
    `;
    container.appendChild(panel);

    panel.querySelector('#variableSelect').addEventListener('change', (e) => {
      setState({ currentVariable: e.target.value });
    });

    panel.querySelector('#colormapSelect').addEventListener('change', (e) => {
      setState({ currentColormap: e.target.value });
    });
  }
}
