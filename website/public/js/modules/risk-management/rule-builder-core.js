/**
 * SolarBot Risk Automation Rule Builder - Core Functionality
 * Handles basic rule creation, editing, and management
 */

class RuleBuilderCore {
  // Singleton pattern
  static instance = null;
  
  constructor() {
    if (RuleBuilderCore.instance) {
      return RuleBuilderCore.instance;
    }
    
    RuleBuilderCore.instance = this;
    
    this.api = window.solarbotApi;
    this.automationCore = new AutomationCore();
    this.ruleTemplates = window.RuleTemplates;
    this.currentRule = null;
    this.isEditMode = false;
  }
  
  /**
   * Initialize the rule builder
   */
  async initialize() {
    try {
      // Initialize the automation core if not already done
      if (!this.automationCore.initialized) {
        await this.automationCore.initialize();
      }
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Load existing rules
      await this.loadRules();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize rule builder:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Set up event handlers for UI interactions
   */
  setupEventHandlers() {
    // Create rule button
    const createRuleBtn = document.getElementById('create-rule-btn');
    const createFirstRuleBtn = document.getElementById('create-first-rule-btn');
    
    if (createRuleBtn) {
      createRuleBtn.addEventListener('click', () => this.openRuleModal());
    }
    
    if (createFirstRuleBtn) {
      createFirstRuleBtn.addEventListener('click', () => this.openRuleModal());
    }
    
    // Rule search
    const ruleSearch = document.getElementById('rule-search');
    if (ruleSearch) {
      ruleSearch.addEventListener('input', () => this.filterRules(ruleSearch.value));
    }
    
    // Rule filter
    const ruleFilter = document.getElementById('rule-filter');
    if (ruleFilter) {
      ruleFilter.addEventListener('change', () => this.applyRuleFilter(ruleFilter.value));
    }
    
    // Import/Export buttons
    const importRulesBtn = document.getElementById('import-rules-btn');
    const exportRulesBtn = document.getElementById('export-rules-btn');
    
    if (importRulesBtn) {
      importRulesBtn.addEventListener('click', () => this.importRules());
    }
    
    if (exportRulesBtn) {
      exportRulesBtn.addEventListener('click', () => this.exportRules());
    }
    
    // Modal close button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => this.closeRuleModal());
    }
    
    // Cancel button in form
    const cancelRuleBtn = document.getElementById('cancel-rule-btn');
    if (cancelRuleBtn) {
      cancelRuleBtn.addEventListener('click', () => this.closeRuleModal());
    }
    
    // Rule form submission
    const ruleForm = document.getElementById('rule-form');
    if (ruleForm) {
      ruleForm.addEventListener('submit', (event) => {
        event.preventDefault();
        this.saveRule();
      });
    }
    
    // Rule active toggle in form
    const ruleActiveToggle = document.getElementById('rule-active');
    const ruleStatusLabel = document.getElementById('rule-status-label');
    
    if (ruleActiveToggle && ruleStatusLabel) {
      ruleActiveToggle.addEventListener('change', () => {
        ruleStatusLabel.textContent = ruleActiveToggle.checked ? 'Active' : 'Inactive';
      });
    }
  }
  
  /**
   * Load rules from the server and render them
   */
  async loadRules() {
    try {
      // Load rules via the automation core
      const rules = await this.automationCore.loadRules();
      
      // Render the rules
      this.renderRules(rules);
      
      return { success: true, rules };
    } catch (error) {
      console.error('Failed to load rules:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Render rules in the rules list
   */
  renderRules(rules) {
    const rulesList = document.getElementById('rules-list');
    
    if (!rulesList) return;
    
    // Clear existing content
    rulesList.innerHTML = '';
    
    if (!rules || rules.length === 0) {
      // Show empty state
      rulesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-robot"></i>
          </div>
          <h3>No Automation Rules Yet</h3>
          <p>Create your first rule to automate risk management decisions</p>
          <button id="create-first-rule-btn" class="primary-button">
            <i class="fas fa-plus"></i> Create Rule
          </button>
        </div>
      `;
      
      // Re-attach event handler for the new button
      const createFirstRuleBtn = document.getElementById('create-first-rule-btn');
      if (createFirstRuleBtn) {
        createFirstRuleBtn.addEventListener('click', () => this.openRuleModal());
      }
      
      return;
    }
    
    // Render each rule
    rules.forEach(rule => {
      const ruleCard = this.createRuleCard(rule);
      rulesList.appendChild(ruleCard);
    });
  }
  
  /**
   * Create a rule card element
   */
  createRuleCard(rule) {
    const ruleCard = document.createElement('div');
    ruleCard.className = `rule-card ${rule.active ? 'active' : 'inactive'}`;
    ruleCard.dataset.ruleId = rule.id;
    
    // Format last triggered date
    let lastTriggeredText = 'Never triggered';
    if (rule.lastTriggered) {
      const lastTriggered = new Date(rule.lastTriggered);
      lastTriggeredText = `Last triggered: ${lastTriggered.toLocaleString()}`;
    }
    
    // Format priority label
    let priorityLabel = 'Medium';
    let priorityClass = 'medium';
    
    if (rule.priority === 1) {
      priorityLabel = 'High';
      priorityClass = 'high';
    } else if (rule.priority === 3) {
      priorityLabel = 'Low';
      priorityClass = 'low';
    }
    
    ruleCard.innerHTML = `
      <div class="rule-icon">
        <i class="fas fa-robot"></i>
      </div>
      <div class="rule-content">
        <div class="rule-header">
          <h4 class="rule-name">${rule.name}</h4>
          <span class="rule-priority ${priorityClass}">${priorityLabel}</span>
        </div>
        <p class="rule-description">${rule.description || ''}</p>
        <div class="rule-meta">
          ${rule.executionLimit ? `Limit: ${rule.executionLimit.limit} per ${rule.executionLimit.type}` : 'No execution limit'}
        </div>
      </div>
      <div class="rule-last-triggered">
        ${lastTriggeredText}
      </div>
      <div class="rule-actions">
        <label class="rule-toggle">
          <input type="checkbox" class="rule-active-toggle" ${rule.active ? 'checked' : ''}>
          <span class="rule-toggle-slider"></span>
        </label>
        <button class="icon-button edit-rule-btn" title="Edit Rule">
          <i class="fas fa-edit"></i>
        </button>
        <button class="icon-button delete-rule-btn" title="Delete Rule">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    // Add event handlers
    const activeToggle = ruleCard.querySelector('.rule-active-toggle');
    const editBtn = ruleCard.querySelector('.edit-rule-btn');
    const deleteBtn = ruleCard.querySelector('.delete-rule-btn');
    
    if (activeToggle) {
      activeToggle.addEventListener('change', () => {
        this.toggleRuleActive(rule.id, activeToggle.checked);
      });
    }
    
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.editRule(rule.id);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteRule(rule.id);
      });
    }
    
    return ruleCard;
  }
  
  /**
   * Open the rule creation/edit modal
   */
  openRuleModal(rule = null) {
    const modal = document.getElementById('rule-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalTitle) return;
    
    this.isEditMode = !!rule;
    this.currentRule = rule;
    
    // Set modal title
    modalTitle.textContent = rule ? 'Edit Automation Rule' : 'Create Automation Rule';
    
    // Reset the form
    this.resetRuleForm();
    
    // Fill form with rule data if editing
    if (rule) {
      this.fillRuleForm(rule);
    }
    
    // Show the modal
    modal.classList.add('active');
  }
  
  /**
   * Close the rule modal
   */
  closeRuleModal() {
    const modal = document.getElementById('rule-modal');
    
    if (!modal) return;
    
    // Hide the modal
    modal.classList.remove('active');
    
    // Reset state
    this.isEditMode = false;
    this.currentRule = null;
  }
  
  /**
   * Reset the rule form to default values
   */
  resetRuleForm() {
    const ruleForm = document.getElementById('rule-form');
    
    if (!ruleForm) return;
    
    // Reset form fields
    ruleForm.reset();
    
    // Reset condition and action sections
    // For phase 1, we're using a simplified approach
    const conditionsList = document.querySelector('.conditions-list');
    if (conditionsList) {
      // Keep just the first empty condition
      const firstCondition = conditionsList.querySelector('.condition-item');
      if (firstCondition) {
        conditionsList.innerHTML = '';
        conditionsList.appendChild(firstCondition);
        
        // Reset the condition type
        const conditionTypeSelect = firstCondition.querySelector('.condition-type-select');
        if (conditionTypeSelect) {
          conditionTypeSelect.value = '';
        }
        
        // Reset parameters
        const parametersDiv = firstCondition.querySelector('.condition-parameters');
        if (parametersDiv) {
          parametersDiv.innerHTML = '<div class="placeholder-message">Select a condition type to continue</div>';
        }
      }
    }
    
    const actionsList = document.querySelector('.actions-list');
    if (actionsList) {
      // Keep just the first empty action
      const firstAction = actionsList.querySelector('.action-item');
      if (firstAction) {
        actionsList.innerHTML = '';
        actionsList.appendChild(firstAction);
        
        // Reset the action type
        const actionTypeSelect = firstAction.querySelector('.action-type-select');
        if (actionTypeSelect) {
          actionTypeSelect.value = '';
        }
        
        // Reset parameters
        const parametersDiv = firstAction.querySelector('.action-parameters');
        if (parametersDiv) {
          parametersDiv.innerHTML = '<div class="placeholder-message">Select an action type to continue</div>';
        }
      }
    }
  }
  
  /**
   * Fill the rule form with data from an existing rule
   */
  fillRuleForm(rule) {
    // Basic information
    const ruleName = document.getElementById('rule-name');
    const ruleDescription = document.getElementById('rule-description');
    const rulePriority = document.getElementById('rule-priority');
    const ruleActive = document.getElementById('rule-active');
    const ruleStatusLabel = document.getElementById('rule-status-label');
    
    if (ruleName) ruleName.value = rule.name;
    if (ruleDescription) ruleDescription.value = rule.description || '';
    if (rulePriority) rulePriority.value = rule.priority;
    if (ruleActive) {
      ruleActive.checked = rule.active;
      if (ruleStatusLabel) {
        ruleStatusLabel.textContent = rule.active ? 'Active' : 'Inactive';
      }
    }
    
    // Execution limits
    const executionLimitType = document.getElementById('execution-limit-type');
    const executionLimitValue = document.getElementById('execution-limit-value');
    
    if (executionLimitType && executionLimitValue && rule.executionLimit) {
      executionLimitType.value = rule.executionLimit.type;
      executionLimitValue.value = rule.executionLimit.limit;
    }
    
    // For phase 1, we're using a simplified approach for conditions and actions
    // In phase 2, we will implement full condition and action building
    
    // For now, we'll just show a message that editing conditions and actions
    // will be available in a future update
    const conditionsBuilder = document.getElementById('conditions-builder');
    const actionsBuilder = document.getElementById('actions-builder');
    
    if (conditionsBuilder) {
      conditionsBuilder.innerHTML = `
        <div class="simplified-view">
          <p>This rule has ${rule.conditions.length} condition(s).</p>
          <p class="note">Advanced condition editing will be available in a future update.</p>
        </div>
      `;
    }
    
    if (actionsBuilder) {
      actionsBuilder.innerHTML = `
        <div class="simplified-view">
          <p>This rule has ${rule.actions.length} action(s).</p>
          <p class="note">Advanced action editing will be available in a future update.</p>
        </div>
      `;
    }
  }
  
  /**
   * Save a rule (create new or update existing)
   */
  async saveRule() {
    try {
      // For phase 1, we're implementing a simplified approach
      // that only allows creating/editing basic rule properties
      
      // Get form values
      const ruleName = document.getElementById('rule-name').value;
      const ruleDescription = document.getElementById('rule-description').value;
      const rulePriority = parseInt(document.getElementById('rule-priority').value, 10);
      const ruleActive = document.getElementById('rule-active').checked;
      
      // Execution limits
      const executionLimitType = document.getElementById('execution-limit-type').value;
      const executionLimitValue = parseInt(document.getElementById('execution-limit-value').value, 10);
      
      let executionLimit = null;
      if (executionLimitType !== 'none') {
        executionLimit = {
          type: executionLimitType,
          limit: executionLimitValue
        };
      }
      
      if (this.isEditMode && this.currentRule) {
        // Update existing rule
        const updates = {
          name: ruleName,
          description: ruleDescription,
          priority: rulePriority,
          active: ruleActive,
          executionLimit: executionLimit
        };
        
        const result = await this.automationCore.updateRule(this.currentRule.id, updates);
        
        if (result.success) {
          this.showAlert(`Rule "${ruleName}" updated successfully`, 'success');
          this.closeRuleModal();
          this.loadRules(); // Refresh the list
        } else {
          this.showAlert(`Failed to update rule: ${result.error}`, 'error');
        }
      } else {
        // Create a new rule with default condition and action
        // In phase 2, we'll implement the full condition and action builder
        const newRule = {
          name: ruleName,
          description: ruleDescription,
          priority: rulePriority,
          active: ruleActive,
          executionLimit: executionLimit,
          // Default placeholder condition and action
          conditions: [
            {
              type: 'dailyLoss',
              parameter: 'percentage',
              operator: 'greaterThan',
              value: 2.0
            }
          ],
          actions: [
            {
              type: 'sendAlert',
              message: 'Rule triggered: ' + ruleName,
              type: 'warning'
            }
          ]
        };
        
        const result = await this.automationCore.addRule(newRule);
        
        if (result.success) {
          this.showAlert(`Rule "${ruleName}" created successfully`, 'success');
          this.closeRuleModal();
          this.loadRules(); // Refresh the list
        } else {
          this.showAlert(`Failed to create rule: ${result.error}`, 'error');
        }
      }
      
    } catch (error) {
      console.error('Error saving rule:', error);
      this.showAlert(`Error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Toggle a rule's active state
   */
  async toggleRuleActive(ruleId, active) {
    try {
      const result = await this.automationCore.updateRule(ruleId, { active });
      
      if (result.success) {
        const status = active ? 'activated' : 'deactivated';
        this.showAlert(`Rule ${status} successfully`, 'success');
      } else {
        this.showAlert(`Failed to update rule: ${result.error}`, 'error');
        // Revert the toggle
        const toggle = document.querySelector(`.rule-card[data-rule-id="${ruleId}"] .rule-active-toggle`);
        if (toggle) {
          toggle.checked = !active;
        }
      }
    } catch (error) {
      console.error('Error toggling rule active state:', error);
      this.showAlert(`Error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Edit an existing rule
   */
  async editRule(ruleId) {
    try {
      // Find the rule in the loaded rules
      const rule = this.automationCore.rules.find(r => r.id === ruleId);
      
      if (!rule) {
        throw new Error(`Rule with ID ${ruleId} not found`);
      }
      
      // Open the modal with the rule data
      this.openRuleModal(rule);
      
    } catch (error) {
      console.error('Error editing rule:', error);
      this.showAlert(`Error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Delete a rule
   */
  async deleteRule(ruleId) {
    try {
      // Confirm deletion
      if (!confirm('Are you sure you want to delete this rule?')) {
        return;
      }
      
      const result = await this.automationCore.deleteRule(ruleId);
      
      if (result.success) {
        this.showAlert('Rule deleted successfully', 'success');
        this.loadRules(); // Refresh the list
      } else {
        this.showAlert(`Failed to delete rule: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      this.showAlert(`Error: ${error.message}`, 'error');
    }
  }
  
  /**
   * Filter rules by search term
   */
  filterRules(searchTerm) {
    if (!searchTerm) {
      // Reset to show all rules
      const ruleCards = document.querySelectorAll('.rule-card');
      ruleCards.forEach(card => {
        card.style.display = '';
      });
      return;
    }
    
    // Convert to lowercase for case-insensitive comparison
    const term = searchTerm.toLowerCase();
    
    // Filter rule cards
    const ruleCards = document.querySelectorAll('.rule-card');
    ruleCards.forEach(card => {
      const ruleName = card.querySelector('.rule-name').textContent.toLowerCase();
      const ruleDescription = card.querySelector('.rule-description').textContent.toLowerCase();
      
      if (ruleName.includes(term) || ruleDescription.includes(term)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }
  
  /**
   * Apply filter to rules list
   */
  applyRuleFilter(filterValue) {
    const ruleCards = document.querySelectorAll('.rule-card');
    
    ruleCards.forEach(card => {
      switch (filterValue) {
        case 'active':
          card.style.display = card.classList.contains('active') ? '' : 'none';
          break;
        case 'inactive':
          card.style.display = card.classList.contains('inactive') ? '' : 'none';
          break;
        case 'triggered':
          const lastTriggered = card.querySelector('.rule-last-triggered').textContent;
          card.style.display = lastTriggered !== 'Never triggered' ? '' : 'none';
          break;
        case 'all':
        default:
          card.style.display = '';
          break;
      }
    });
  }
  
  /**
   * Import rules from a JSON file
   */
  importRules() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const rules = JSON.parse(e.target.result);
            
            // Validate the imported rules
            if (!Array.isArray(rules)) {
              throw new Error('Invalid import format. Expected an array of rules.');
            }
            
            // Import each rule
            let importedCount = 0;
            for (const rule of rules) {
              // Validate each rule
              if (!this.automationCore.validateRule(rule)) {
                console.warn('Skipping invalid rule:', rule);
                continue;
              }
              
              // Generate a new ID to avoid conflicts
              rule.id = 'rule_' + Date.now() + '_' + importedCount;
              rule.createdAt = new Date().toISOString();
              rule.lastTriggered = null;
              
              // Add the rule
              const result = await this.automationCore.addRule(rule);
              
              if (result.success) {
                importedCount++;
              }
            }
            
            this.showAlert(`Imported ${importedCount} rules successfully`, 'success');
            this.loadRules(); // Refresh the list
            
          } catch (error) {
            console.error('Error parsing imported rules:', error);
            this.showAlert(`Import failed: ${error.message}`, 'error');
          }
        };
        
        reader.readAsText(file);
        
      } catch (error) {
        console.error('Error importing rules:', error);
        this.showAlert(`Import failed: ${error.message}`, 'error');
      }
    });
    
    // Trigger the file input click
    fileInput.click();
  }
  
  /**
   * Export rules to a JSON file
   */
  exportRules() {
    try {
      // Get the rules to export
      const rules = this.automationCore.rules;
      
      if (!rules || rules.length === 0) {
        this.showAlert('No rules to export', 'warning');
        return;
      }
      
      // Convert to JSON
      const rulesJson = JSON.stringify(rules, null, 2);
      
      // Create download link
      const blob = new Blob([rulesJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      
      downloadLink.href = url;
      downloadLink.download = `solarbot_rules_${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      this.showAlert(`Exported ${rules.length} rules`, 'success');
      
    } catch (error) {
      console.error('Error exporting rules:', error);
      this.showAlert(`Export failed: ${error.message}`, 'error');
    }
  }
  
  /**
   * Create a rule from a template
   */
  createRuleFromTemplate(templateId) {
    if (!this.ruleTemplates) return;
    
    const template = this.ruleTemplates.getTemplate(templateId);
    
    if (!template) {
      this.showAlert(`Template "${templateId}" not found`, 'error');
      return;
    }
    
    // Open the rule modal with the template data
    this.openRuleModal(template);
  }
  
  /**
   * Show an alert message
   */
  showAlert(message, type = 'info') {
    const alertEvent = new CustomEvent('solarbot-alert', {
      detail: {
        message: message,
        type: type, // 'info', 'warning', 'error', 'success'
        duration: 5000 // milliseconds
      }
    });
    
    window.dispatchEvent(alertEvent);
  }
}

// Create singleton instance
window.RuleBuilder = new RuleBuilderCore();

/**
 * Initialize the rule builder when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.RuleBuilder) {
    window.RuleBuilder.initialize();
  }
});
