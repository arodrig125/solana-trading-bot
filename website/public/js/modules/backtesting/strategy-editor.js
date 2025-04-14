/**
 * SolarBot Strategy Editor
 * Code editor for creating and modifying trading strategies
 */

class StrategyEditor {
  constructor() {
    this.editor = null;
    this.currentStrategy = null;
    this.templateLibrary = {};
    this.unsavedChanges = false;
    this.backtestingCore = window.backtestingUI ? window.backtestingUI.core : new BacktestingCore();
    
    // DOM elements
    this.containers = {
      editorContainer: document.getElementById('strategy-editor-container'),
      parameterPanel: document.getElementById('strategy-parameters'),
      templateSelector: document.getElementById('strategy-template-selector'),
      saveButton: document.getElementById('save-strategy-btn'),
      testButton: document.getElementById('test-strategy-btn'),
      messageContainer: document.getElementById('strategy-messages')
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the strategy editor
   */
  async initialize() {
    try {
      // Initialize the Monaco editor if available
      if (window.monaco && this.containers.editorContainer) {
        this.initializeMonacoEditor();
      } else {
        // Fallback to a basic textarea
        this.initializeBasicEditor();
      }
      
      // Load strategy templates
      await this.loadStrategyTemplates();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load the default template
      this.loadDefaultTemplate();
    } catch (error) {
      console.error('Failed to initialize strategy editor:', error);
      this.showMessage('Failed to initialize strategy editor. Please try again.', 'error');
    }
  }
  
  /**
   * Initialize Monaco editor (advanced code editor)
   */
  initializeMonacoEditor() {
    // Monaco editor configuration
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    });
    
    // Add custom completions for trading strategy context
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: () => {
        const suggestions = [{
          label: 'data',
          kind: monaco.languages.CompletionItemKind.Variable,
          documentation: 'Historical market data array',
          insertText: 'data'
        }, {
          label: 'parameters',
          kind: monaco.languages.CompletionItemKind.Variable,
          documentation: 'Strategy parameters object',
          insertText: 'parameters'
        }, {
          label: 'utils',
          kind: monaco.languages.CompletionItemKind.Variable,
          documentation: 'Utility functions for technical analysis',
          insertText: 'utils'
        }];
        
        return { suggestions };
      }
    });
    
    // Create the editor
    this.editor = monaco.editor.create(this.containers.editorContainer, {
      value: '// Your trading strategy code here\n',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: true
      },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      tabSize: 2
    });
    
    // Set up change tracking
    this.editor.onDidChangeModelContent(() => {
      this.unsavedChanges = true;
      this.validateCode();
    });
  }
  
  /**
   * Initialize basic textarea editor (fallback)
   */
  initializeBasicEditor() {
    // Create a simple textarea for code editing
    const textarea = document.createElement('textarea');
    textarea.className = 'basic-code-editor';
    textarea.rows = 20;
    textarea.spellcheck = false;
    textarea.placeholder = '// Your trading strategy code here';
    
    // Apply basic styling
    textarea.style.width = '100%';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    textarea.style.padding = '10px';
    textarea.style.border = '1px solid #ccc';
    textarea.style.borderRadius = '4px';
    textarea.style.backgroundColor = '#282c34';
    textarea.style.color = '#abb2bf';
    
    this.containers.editorContainer.appendChild(textarea);
    this.editor = textarea;
    
    // Set up change tracking
    textarea.addEventListener('input', () => {
      this.unsavedChanges = true;
      // Basic validation - we can't do much with a textarea
      if (textarea.value.trim().length === 0) {
        this.showMessage('Strategy code cannot be empty', 'error');
      } else {
        this.hideMessage();
      }
    });
  }
  
  /**
   * Load strategy templates from API
   */
  async loadStrategyTemplates() {
    try {
      const templates = await this.backtestingCore.loadStrategyTemplates();
      
      // Store templates
      templates.forEach(template => {
        this.templateLibrary[template.id] = template;
      });
      
      // Update template selector
      this.renderTemplateSelector(templates);
      
      return templates;
    } catch (error) {
      console.error('Failed to load strategy templates:', error);
      this.showMessage('Failed to load strategy templates', 'error');
      return [];
    }
  }
  
  /**
   * Render template selector dropdown
   */
  renderTemplateSelector(templates) {
    if (!this.containers.templateSelector) return;
    
    let html = '<option value="">Select a template</option>';
    
    templates.forEach(template => {
      html += `<option value="${template.id}">${template.name}</option>`;
    });
    
    this.containers.templateSelector.innerHTML = html;
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Template selector
    if (this.containers.templateSelector) {
      this.containers.templateSelector.addEventListener('change', (e) => {
        const templateId = e.target.value;
        if (templateId) {
          this.loadTemplate(templateId);
        }
      });
    }
    
    // Save button
    if (this.containers.saveButton) {
      this.containers.saveButton.addEventListener('click', () => {
        this.saveStrategy();
      });
    }
    
    // Test button
    if (this.containers.testButton) {
      this.containers.testButton.addEventListener('click', () => {
        this.testStrategy();
      });
    }
    
    // Set up unsaved changes warning
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }
  
  /**
   * Load the default template
   */
  loadDefaultTemplate() {
    // Find a simple default template
    const defaultTemplate = Object.values(this.templateLibrary).find(t => t.name.toLowerCase().includes('simple') || t.name.toLowerCase().includes('basic'));
    
    if (defaultTemplate) {
      this.loadTemplate(defaultTemplate.id);
    } else if (Object.keys(this.templateLibrary).length > 0) {
      // Just load the first one
      this.loadTemplate(Object.keys(this.templateLibrary)[0]);
    }
  }
  
  /**
   * Load a specific template
   */
  async loadTemplate(templateId) {
    try {
      if (this.unsavedChanges) {
        const confirmed = confirm('You have unsaved changes. Are you sure you want to load a new template?');
        if (!confirmed) return;
      }
      
      const template = this.templateLibrary[templateId];
      
      if (!template) {
        // Try to load it from the backend
        await this.backtestingCore.loadStrategy(templateId);
        // Check if it was loaded successfully
        if (this.backtestingCore.strategies[templateId]) {
          const loadedStrategy = this.backtestingCore.strategies[templateId];
          this.templateLibrary[templateId] = loadedStrategy;
          this.setEditorContent(loadedStrategy.code);
          this.renderParameterPanel(loadedStrategy.parameters);
          this.currentStrategy = loadedStrategy;
          this.unsavedChanges = false;
          this.showMessage(`Loaded strategy: ${loadedStrategy.name}`, 'success');
        }
      } else {
        // Template exists in library
        this.setEditorContent(template.code);
        this.renderParameterPanel(template.parameters);
        this.currentStrategy = template;
        this.unsavedChanges = false;
        this.showMessage(`Loaded template: ${template.name}`, 'success');
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      this.showMessage(`Failed to load template: ${error.message}`, 'error');
    }
  }
  
  /**
   * Set editor content based on the editor type
   */
  setEditorContent(content) {
    if (!this.editor) return;
    
    if (typeof this.editor.setValue === 'function') {
      // Monaco editor
      this.editor.setValue(content);
    } else {
      // Basic textarea
      this.editor.value = content;
    }
  }
  
  /**
   * Get editor content based on the editor type
   */
  getEditorContent() {
    if (!this.editor) return '';
    
    if (typeof this.editor.getValue === 'function') {
      // Monaco editor
      return this.editor.getValue();
    } else {
      // Basic textarea
      return this.editor.value;
    }
  }
  
  /**
   * Render parameter panel for the strategy
   */
  renderParameterPanel(parameters) {
    if (!this.containers.parameterPanel) return;
    
    if (!parameters || parameters.length === 0) {
      this.containers.parameterPanel.innerHTML = '<div class="empty-state">No parameters for this strategy</div>';
      return;
    }
    
    let html = '<div class="strategy-parameters-list">';
    
    parameters.forEach(param => {
      let inputHtml = '';
      
      switch (param.type) {
        case 'number':
          inputHtml = `
            <input type="number" 
              id="param-${param.id}" 
              name="${param.id}" 
              value="${param.default}" 
              min="${param.min || ''}" 
              max="${param.max || ''}" 
              step="${param.step || 1}">
          `;
          break;
          
        case 'boolean':
          inputHtml = `
            <input type="checkbox" 
              id="param-${param.id}" 
              name="${param.id}" 
              ${param.default ? 'checked' : ''}>
          `;
          break;
          
        case 'select':
          inputHtml = `
            <select id="param-${param.id}" name="${param.id}">
              ${param.options.map(option => 
                `<option value="${option.value}" ${option.value === param.default ? 'selected' : ''}>${option.label}</option>`
              ).join('')}
            </select>
          `;
          break;
          
        case 'string':
        default:
          inputHtml = `
            <input type="text" 
              id="param-${param.id}" 
              name="${param.id}" 
              value="${param.default || ''}">
          `;
          break;
      }
      
      html += `
        <div class="parameter-item">
          <label for="param-${param.id}">${param.name}</label>
          ${inputHtml}
          <div class="parameter-description">${param.description || ''}</div>
        </div>
      `;
    });
    
    html += '</div>';
    
    this.containers.parameterPanel.innerHTML = html;
    
    // Add event listeners for parameter changes
    parameters.forEach(param => {
      const input = document.getElementById(`param-${param.id}`);
      if (input) {
        input.addEventListener('change', (e) => {
          this.updateParameterValue(param.id, param.type, e.target);
        });
      }
    });
  }
  
  /**
   * Update a parameter value
   */
  updateParameterValue(parameterId, paramType, input) {
    if (!this.currentStrategy || !this.currentStrategy.parameters) return;
    
    // Find the parameter in the current strategy
    const parameter = this.currentStrategy.parameters.find(p => p.id === parameterId);
    if (!parameter) return;
    
    // Update the value based on the input type
    switch (paramType) {
      case 'number':
        parameter.default = parseFloat(input.value);
        break;
        
      case 'boolean':
        parameter.default = input.checked;
        break;
        
      case 'select':
      case 'string':
      default:
        parameter.default = input.value;
        break;
    }
    
    // Mark as having unsaved changes
    this.unsavedChanges = true;
  }
  
  /**
   * Validate the strategy code
   */
  validateCode() {
    const code = this.getEditorContent();
    
    if (!code || code.trim().length === 0) {
      this.showMessage('Strategy code cannot be empty', 'error');
      return false;
    }
    
    try {
      // Try to create a function from the code
      new Function('data', 'parameters', 'utils', code);
      this.hideMessage();
      return true;
    } catch (error) {
      this.showMessage(`Syntax error: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Save the current strategy
   */
  async saveStrategy() {
    try {
      if (!this.validateCode()) {
        return;
      }
      
      // Show a name input dialog
      const strategyName = prompt('Enter a name for your strategy:', this.currentStrategy ? this.currentStrategy.name : '');
      
      if (!strategyName) return; // User cancelled
      
      const strategyCode = this.getEditorContent();
      
      // Prepare parameters from current strategy
      const parameters = this.currentStrategy ? [...this.currentStrategy.parameters] : [];
      
      // Save to API
      const response = await this.backtestingCore.api.request('/backtesting/save-strategy', {
        method: 'POST',
        body: JSON.stringify({
          id: this.currentStrategy ? this.currentStrategy.id : null,
          name: strategyName,
          code: strategyCode,
          parameters: parameters
        })
      });
      
      if (response.success) {
        // Update the current strategy
        this.currentStrategy = response.strategy;
        this.templateLibrary[response.strategy.id] = response.strategy;
        
        // Update the template selector
        if (this.containers.templateSelector) {
          const option = this.containers.templateSelector.querySelector(`option[value="${response.strategy.id}"]`);
          
          if (option) {
            option.textContent = strategyName;
          } else {
            const newOption = document.createElement('option');
            newOption.value = response.strategy.id;
            newOption.textContent = strategyName;
            newOption.selected = true;
            this.containers.templateSelector.appendChild(newOption);
          }
        }
        
        this.unsavedChanges = false;
        this.showMessage(`Strategy "${strategyName}" saved successfully`, 'success');
      } else {
        throw new Error(response.message || 'Failed to save strategy');
      }
    } catch (error) {
      console.error('Failed to save strategy:', error);
      this.showMessage(`Failed to save strategy: ${error.message}`, 'error');
    }
  }
  
  /**
   * Test the current strategy with sample data
   */
  async testStrategy() {
    try {
      if (!this.validateCode()) {
        return;
      }
      
      this.showMessage('Running strategy test...', 'info');
      
      const strategyCode = this.getEditorContent();
      
      // Get parameter values from UI
      const parameterValues = {};
      
      if (this.currentStrategy && this.currentStrategy.parameters) {
        this.currentStrategy.parameters.forEach(param => {
          parameterValues[param.id] = param.default;
        });
      }
      
      // Send to API for testing with sample data
      const response = await this.backtestingCore.api.request('/backtesting/test-strategy', {
        method: 'POST',
        body: JSON.stringify({
          code: strategyCode,
          parameters: parameterValues
        })
      });
      
      if (response.success) {
        // Show test results
        this.showTestResults(response.results);
      } else {
        throw new Error(response.message || 'Strategy test failed');
      }
    } catch (error) {
      console.error('Strategy test failed:', error);
      this.showMessage(`Strategy test failed: ${error.message}`, 'error');
    }
  }
  
  /**
   * Show test results
   */
  showTestResults(results) {
    // Create a modal dialog for test results
    const modal = document.createElement('div');
    modal.className = 'test-results-modal';
    modal.innerHTML = `
      <div class="test-results-content">
        <div class="test-results-header">
          <h3>Strategy Test Results</h3>
          <button class="close-btn">&times;</button>
        </div>
        <div class="test-results-body">
          <div class="test-summary">
            <div class="test-metric">
              <div class="metric-name">Signals Generated</div>
              <div class="metric-value">${results.signals.length}</div>
            </div>
            <div class="test-metric">
              <div class="metric-name">Average Profit</div>
              <div class="metric-value ${results.averageProfit >= 0 ? 'positive' : 'negative'}">
                ${results.averageProfit >= 0 ? '+' : ''}${results.averageProfit.toFixed(2)}%
              </div>
            </div>
            <div class="test-metric">
              <div class="metric-name">Win Rate</div>
              <div class="metric-value">${results.winRate.toFixed(2)}%</div>
            </div>
          </div>
          
          <div class="test-signals">
            <h4>Signal Details</h4>
            <table class="signals-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Pair</th>
                  <th>Price</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody>
                ${results.signals.map(signal => `
                  <tr>
                    <td>${new Date(signal.timestamp).toLocaleString()}</td>
                    <td>${signal.type}</td>
                    <td>${signal.pair}</td>
                    <td>${signal.price.toFixed(6)}</td>
                    <td class="${signal.direction === 'buy' ? 'buy' : 'sell'}">↑ Buy</td>
                  </tr>
                `).join('')}
                ${results.signals.length === 0 ? '<tr><td colspan="5">No signals generated</td></tr>' : ''}
              </tbody>
            </table>
          </div>
          
          <div class="test-message">
            ${results.message || 'Strategy testing completed successfully.'}
          </div>
        </div>
        <div class="test-results-footer">
          <button class="btn btn-primary close-modal-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners to close buttons
    const closeButtons = modal.querySelectorAll('.close-btn, .close-modal-btn');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
    
    // Show the modal
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Clear the info message
    this.hideMessage();
  }
  
  /**
   * Show a message in the message container
   */
  showMessage(message, type = 'info') {
    if (!this.containers.messageContainer) return;
    
    this.containers.messageContainer.innerHTML = `
      <div class="message message-${type}">
        <div class="message-content">${message}</div>
        ${type !== 'info' ? '<button class="close-message-btn">&times;</button>' : ''}
      </div>
    `;
    
    this.containers.messageContainer.style.display = 'block';
    
    // Add close button functionality
    const closeButton = this.containers.messageContainer.querySelector('.close-message-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hideMessage();
      });
    }
    
    // Auto-hide info messages after 5 seconds
    if (type === 'info' || type === 'success') {
      setTimeout(() => {
        this.hideMessage();
      }, 5000);
    }
  }
  
  /**
   * Hide the message container
   */
  hideMessage() {
    if (!this.containers.messageContainer) return;
    this.containers.messageContainer.style.display = 'none';
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('strategy-editor-container')) {
    window.strategyEditor = new StrategyEditor();
  }
});
