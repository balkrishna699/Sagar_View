import { setState, getState, getAvailableOptions } from './sceneState.js';

/**
 * Variable + colormap selector.
 *
 * This is the missing UI piece for a pipeline that already exists:
 * setState({ currentVariable }) / setState({ currentColormap }) already
 * causes sceneState.js to emit 'colorbarChanged', which dashboardBridge.js
 * already consumes to re-render the volume and update the Colorbar.
 * No new event, state, or render logic is introduced here.
 */
export class VariableSelector {
  constructor(container) {
    const { variables, colormaps, variableUnits } = getAvailableOptions();
    const { currentVariable, currentColormap } = getState();

    const panel = document.createElement('div');
    panel.className = 'ctrl-panel';
    panel.style.cssText = 'top: 52px; left: 252px; min-width: 190px;';
    panel.innerHTML = `
      <label>Variable</label>
      <select id="variableSelect" class="dash-select" style="margin-bottom: 12px;">
        ${variables.map(v => `
          <option value="${v}" ${v === currentVariable ? 'selected' : ''}>
            ${v.charAt(0).toUpperCase() + v.slice(1)}${variableUnits[v] ? ` (${variableUnits[v]})` : ''}
          </option>`).join('')}
      </select>

      <label>Colormap</label>
      <select id="colormapSelect" class="dash-select">
        ${colormaps.map(c => `
          <option value="${c}" ${c === currentColormap ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
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
