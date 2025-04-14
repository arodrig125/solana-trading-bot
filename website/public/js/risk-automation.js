/**
 * Risk Automation UI Component
 * Handles the risk automation rule management interface
 */

// Ensure user is authenticated
auth.requireAuthentication();

// Initialize modals
const ruleModal = new bootstrap.Modal(document.getElementById('ruleModal'));
const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));

// DOM elements
const walletSelector = document.getElementById('walletSelector');
const rulesList = document.getElementById('rulesList');
const noRulesMessage = document.getElementById('noRulesMessage');
const conditionsContainer = document.getElementById('conditionsContainer');
const actionsContainer = document.getElementById('actionsContainer');

// Current wallet and rules state
let currentWallets = [];
let currentRules = [];
let editingRuleId = null;

// Condition and action templates
const conditionTypes = [
  { id: 'account_balance', name: 'Account Balance', dataType: 'number' },
  { id: 'daily_pnl', name: 'Daily Profit/Loss', dataType: 'number' },
  { id: 'drawdown', name: 'Current Drawdown', dataType: 'percent' },
  { id: 'win_rate', name: 'Overall Win Rate', dataType: 'percent' },
  { id: 'win_streak', name: 'Current Win Streak', dataType: 'number' },
  { id: 'loss_streak', name: 'Current Loss Streak', dataType: 'number' },
  { id: 'price_change', name: 'Price Change', dataType: 'percent', requiresAsset: true, requiresTimeframe: true },
  { id: 'volatility', name: 'Volatility', dataType: 'percent', requiresAsset: true, requiresTimeframe: true },
];

const operators = [
  { id: 'gt', name: '>', applicableTypes: ['number', 'percent'] },
  { id: 'gte', name: '≥', applicableTypes: ['number', 'percent'] },
  { id: 'lt', name: '<', applicableTypes: ['number', 'percent'] },
  { id: 'lte', name: '≤', applicableTypes: ['number', 'percent'] },
  { id: 'eq', name: '=', applicableTypes: ['number', 'percent', 'string'] },
  { id: 'neq', name: '≠', applicableTypes: ['number', 'percent', 'string'] },
];

const actionTypes = [
  { id: 'adjust_position_size', name: 'Adjust Position Size' },
  { id: 'send_alert', name: 'Send Alert' },
  { id: 'pause_trading', name: 'Pause Trading' },
  { id: 'resume_trading', name: 'Resume Trading' },
];

const timeframes = [
  { id: '1h', name: '1 Hour' },
  { id: '1d', name: '1 Day' },
];

const assets = [
  { id: 'SOL/USD', name: 'SOL/USD' },
  { id: 'BTC/USD', name: 'BTC/USD' },
];

/**
 * Initialize the page
 */
async function init() {
  try {
    // Load components
    await Promise.all([
      loadSidebar(),
      loadTopNav(),
      loadWallets(),
    ]);
    
    // Setup event listeners
    setupEventListeners();
    
    // Load rules for selected wallet
    await loadRules();
    
  } catch (error) {
    console.error('Failed to initialize risk automation page:', error);
    showErrorToast('Failed to load risk automation data');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Wallet selector change
  walletSelector.addEventListener('change', loadRules);
  
  // Rule creation buttons
  document.getElementById('createRuleBtn').addEventListener('click', () => openCreateRuleModal());
  document.getElementById('createFirstRuleBtn').addEventListener('click', () => openCreateRuleModal());
  
  // Rule form buttons
  document.getElementById('addConditionBtn').addEventListener('click', addCondition);
  document.getElementById('addActionBtn').addEventListener('click', addAction);
  document.getElementById('saveRuleBtn').addEventListener('click', saveRule);
  
  // Evaluate rules button
  document.getElementById('evaluateRulesBtn').addEventListener('click', evaluateRules);
}

/**
 * Load wallets from API
 */
async function loadWallets() {
  try {
    const response = await window.solarbotApi.getWallets();
    currentWallets = response.wallets || [];
    
    // Clear existing options
    walletSelector.innerHTML = '';
    
    // Add default option for all wallets
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Wallets';
    walletSelector.appendChild(defaultOption);
    
    // Add wallet options
    currentWallets.forEach(wallet => {
      const option = document.createElement('option');
      option.value = wallet.id;
      option.textContent = wallet.name || wallet.address.substring(0, 8) + '...';
      walletSelector.appendChild(option);
    });
    
  } catch (error) {
    console.error('Failed to load wallets:', error);
    showErrorToast('Failed to load wallets');
  }
}

/**
 * Load rules for the selected wallet
 */
async function loadRules() {
  try {
    const walletId = walletSelector.value;
    const response = await window.solarbotApi.getRules(walletId);
    currentRules = response.rules || [];
    
    // Clear the rules list
    rulesList.innerHTML = '';
    
    // Show no rules message if empty
    if (currentRules.length === 0) {
      noRulesMessage.style.display = 'block';
      rulesList.style.display = 'none';
      return;
    }
    
    // Hide no rules message and show rules
    noRulesMessage.style.display = 'none';
    rulesList.style.display = 'block';
    
    // Render each rule
    currentRules.forEach(rule => {
      const ruleCard = createRuleCard(rule);
      rulesList.appendChild(ruleCard);
    });
    
  } catch (error) {
    console.error('Failed to load rules:', error);
    showErrorToast('Failed to load automation rules');
  }
}

/**
 * Create a rule card element
 */
function createRuleCard(rule) {
  const card = document.createElement('div');
  card.className = 'card rule-card mb-3';
  card.dataset.ruleId = rule.id;
  
  // Create card header with rule name and status
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header d-flex align-items-center';
  
  const ruleName = document.createElement('h5');
  ruleName.className = 'mb-0 flex-grow-1';
  ruleName.textContent = rule.name;
  
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge ms-2 ${rule.active ? 'bg-success' : 'bg-secondary'}`;
  statusBadge.textContent = rule.active ? 'Active' : 'Inactive';
  
  cardHeader.appendChild(ruleName);
  cardHeader.appendChild(statusBadge);
  
  // Create card body with conditions and actions summary
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  // Conditions section
  const conditionsTitle = document.createElement('h6');
  conditionsTitle.textContent = 'Conditions';
  conditionsTitle.className = 'card-subtitle mb-2';
  
  const conditionsList = document.createElement('ul');
  conditionsList.className = 'list-unstyled text-muted small';
  rule.conditions.forEach(condition => {
    const conditionItem = document.createElement('li');
    conditionItem.className = 'mb-1';
    
    // Format condition text based on type
    let conditionText = '';
    const conditionType = conditionTypes.find(t => t.id === condition.type);
    if (conditionType) {
      if (condition.type === 'price_change' || condition.type === 'volatility') {
        conditionText = `${conditionType.name} (${condition.asset}, ${condition.timeframe}) ${getOperatorSymbol(condition.operator)} ${condition.value}${condition.valueType === 'percent' ? '%' : ''}`;
      } else {
        conditionText = `${conditionType.name} ${getOperatorSymbol(condition.operator)} ${condition.value}${condition.valueType === 'percent' ? '%' : ''}`;
      }
    } else {
      conditionText = JSON.stringify(condition);
    }
    
    conditionItem.textContent = conditionText;
    conditionsList.appendChild(conditionItem);
  });
  
  // Actions section
  const actionsTitle = document.createElement('h6');
  actionsTitle.textContent = 'Actions';
  actionsTitle.className = 'card-subtitle mb-2 mt-3';
  
  const actionsList = document.createElement('ul');
  actionsList.className = 'list-unstyled text-muted small';
  rule.actions.forEach(action => {
    const actionItem = document.createElement('li');
    actionItem.className = 'mb-1';
    
    // Format action text based on type
    let actionText = '';
    if (action.type === 'adjust_position_size') {
      actionText = `Adjust Position Size to ${action.value}${action.valueType === 'percent' ? '%' : ''}`;
    } else if (action.type === 'send_alert') {
      actionText = `Send Alert: ${action.message || 'Rule triggered'}`;
    } else if (action.type === 'pause_trading') {
      actionText = 'Pause Trading';
    } else if (action.type === 'resume_trading') {
      actionText = 'Resume Trading';
    } else {
      actionText = JSON.stringify(action);
    }
    
    actionItem.textContent = actionText;
    actionsList.appendChild(actionItem);
  });
  
  // Last triggered info
  let lastTriggeredText = 'Never triggered';
  if (rule.lastTriggered) {
    const lastTriggeredDate = new Date(rule.lastTriggered);
    lastTriggeredText = `Last triggered: ${lastTriggeredDate.toLocaleString()}`;
  }
  const lastTriggered = document.createElement('div');
  lastTriggered.className = 'text-muted small mt-3';
  lastTriggered.textContent = lastTriggeredText;
  
  // Card footer with action buttons
  const cardFooter = document.createElement('div');
  cardFooter.className = 'card-footer d-flex justify-content-end';
  
  // View history button
  const historyBtn = document.createElement('button');
  historyBtn.className = 'btn btn-sm btn-outline-secondary me-2';
  historyBtn.innerHTML = '<i class="fas fa-history"></i> History';
  historyBtn.addEventListener('click', () => viewRuleHistory(rule.id));
  
  // Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-outline-primary me-2';
  editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
  editBtn.addEventListener('click', () => openEditRuleModal(rule));
  
  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.addEventListener('click', () => deleteRule(rule.id));
  
  // Assemble card
  cardFooter.appendChild(historyBtn);
  cardFooter.appendChild(editBtn);
  cardFooter.appendChild(deleteBtn);
  
  cardBody.appendChild(conditionsTitle);
  cardBody.appendChild(conditionsList);
  cardBody.appendChild(actionsTitle);
  cardBody.appendChild(actionsList);
  cardBody.appendChild(lastTriggered);
  
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  card.appendChild(cardFooter);
  
  return card;
}

/**
 * Get operator symbol by operator ID
 */
function getOperatorSymbol(operatorId) {
  const op = operators.find(o => o.id === operatorId);
  return op ? op.name : operatorId;
}

/**
 * Open modal for creating a new rule
 */
function openCreateRuleModal() {
  // Reset form
  document.getElementById('ruleId').value = '';
  document.getElementById('ruleName').value = '';
  document.getElementById('ruleActive').checked = true;
  document.getElementById('limitType').value = '';
  document.getElementById('limitCount').value = '1';
  
  // Clear conditions and actions
  conditionsContainer.innerHTML = '';
  actionsContainer.innerHTML = '';
  
  // Add initial condition and action
  addCondition();
  addAction();
  
  // Update modal title
  document.getElementById('ruleModalTitle').textContent = 'Create Automation Rule';
  
  // Show modal
  ruleModal.show();
}

/**
 * Open modal for editing an existing rule
 */
function openEditRuleModal(rule) {
  // Set editing rule ID
  editingRuleId = rule.id;
  
  // Populate form fields
  document.getElementById('ruleId').value = rule.id;
  document.getElementById('ruleName').value = rule.name;
  document.getElementById('ruleActive').checked = rule.active;
  
  // Set execution limits
  if (rule.executionLimit) {
    document.getElementById('limitType').value = rule.executionLimit.type || '';
    document.getElementById('limitCount').value = rule.executionLimit.limit || '1';
  } else {
    document.getElementById('limitType').value = '';
    document.getElementById('limitCount').value = '1';
  }
  
  // Clear conditions and actions
  conditionsContainer.innerHTML = '';
  actionsContainer.innerHTML = '';
  
  // Add conditions
  if (rule.conditions && rule.conditions.length > 0) {
    rule.conditions.forEach(condition => {
      addCondition(condition);
    });
  } else {
    addCondition();
  }
  
  // Add actions
  if (rule.actions && rule.actions.length > 0) {
    rule.actions.forEach(action => {
      addAction(action);
    });
  } else {
    addAction();
  }
  
  // Update modal title
  document.getElementById('ruleModalTitle').textContent = 'Edit Automation Rule';
  
  // Show modal
  ruleModal.show();
}

/**
 * Add a new condition to the form
 */
function addCondition(existingCondition = null) {
  const conditionId = 'condition_' + Date.now() + Math.floor(Math.random() * 1000);
  const conditionDiv = document.createElement('div');
  conditionDiv.className = 'condition-item mb-3 p-3 border rounded';
  conditionDiv.dataset.id = conditionId;
  
  // Create condition form
  const typeRow = document.createElement('div');
  typeRow.className = 'row mb-2';
  
  // Type selector
  const typeCol = document.createElement('div');
  typeCol.className = 'col-md-6';
  const typeLabel = document.createElement('label');
  typeLabel.className = 'form-label';
  typeLabel.textContent = 'Condition Type';
  const typeSelect = document.createElement('select');
  typeSelect.className = 'form-select condition-type';
  typeSelect.dataset.id = conditionId;
  typeSelect.addEventListener('change', (e) => handleConditionTypeChange(e.target));
  
  // Add condition type options
  conditionTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    typeSelect.appendChild(option);
  });
  
  typeCol.appendChild(typeLabel);
  typeCol.appendChild(typeSelect);
  typeRow.appendChild(typeCol);
  
  // Operator selector
  const operatorCol = document.createElement('div');
  operatorCol.className = 'col-md-6';
  const operatorLabel = document.createElement('label');
  operatorLabel.className = 'form-label';
  operatorLabel.textContent = 'Operator';
  const operatorSelect = document.createElement('select');
  operatorSelect.className = 'form-select condition-operator';
  operatorSelect.dataset.id = conditionId;
  
  // Placeholder for operators, will be filled based on the condition type
  operatorCol.appendChild(operatorLabel);
  operatorCol.appendChild(operatorSelect);
  typeRow.appendChild(operatorCol);
  
  conditionDiv.appendChild(typeRow);
  
  // Value row
  const valueRow = document.createElement('div');
  valueRow.className = 'row mb-2';
  
  // Asset selector (hidden by default, shown for specific condition types)
  const assetCol = document.createElement('div');
  assetCol.className = 'col-md-4 asset-container';
  assetCol.style.display = 'none';
  const assetLabel = document.createElement('label');
  assetLabel.className = 'form-label';
  assetLabel.textContent = 'Asset';
  const assetSelect = document.createElement('select');
  assetSelect.className = 'form-select condition-asset';
  assetSelect.dataset.id = conditionId;
  
  // Add asset options
  assets.forEach(asset => {
    const option = document.createElement('option');
    option.value = asset.id;
    option.textContent = asset.name;
    assetSelect.appendChild(option);
  });
  
  assetCol.appendChild(assetLabel);
  assetCol.appendChild(assetSelect);
  valueRow.appendChild(assetCol);
  
  // Timeframe selector (hidden by default, shown for specific condition types)
  const timeframeCol = document.createElement('div');
  timeframeCol.className = 'col-md-4 timeframe-container';
  timeframeCol.style.display = 'none';
  const timeframeLabel = document.createElement('label');
  timeframeLabel.className = 'form-label';
  timeframeLabel.textContent = 'Timeframe';
  const timeframeSelect = document.createElement('select');
  timeframeSelect.className = 'form-select condition-timeframe';
  timeframeSelect.dataset.id = conditionId;
  
  // Add timeframe options
  timeframes.forEach(timeframe => {
    const option = document.createElement('option');
    option.value = timeframe.id;
    option.textContent = timeframe.name;
    timeframeSelect.appendChild(option);
  });
  
  timeframeCol.appendChild(timeframeLabel);
  timeframeCol.appendChild(timeframeSelect);
  valueRow.appendChild(timeframeCol);
  
  // Value field
  const valueCol = document.createElement('div');
  valueCol.className = 'col-md-4';
  const valueLabel = document.createElement('label');
  valueLabel.className = 'form-label';
  valueLabel.textContent = 'Value';
  const valueInput = document.createElement('input');
  valueInput.type = 'number';
  valueInput.className = 'form-control condition-value';
  valueInput.dataset.id = conditionId;
  valueInput.step = '0.01';
  
  valueCol.appendChild(valueLabel);
  valueCol.appendChild(valueInput);
  valueRow.appendChild(valueCol);
  
  conditionDiv.appendChild(valueRow);
  
  // Remove button
  const removeButtonRow = document.createElement('div');
  removeButtonRow.className = 'row mt-2';
  const removeButtonCol = document.createElement('div');
  removeButtonCol.className = 'col-12 text-end';
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'btn btn-sm btn-outline-danger';
  removeButton.innerHTML = '<i class="fas fa-trash"></i> Remove';
  removeButton.addEventListener('click', () => conditionDiv.remove());
  
  removeButtonCol.appendChild(removeButton);
  removeButtonRow.appendChild(removeButtonCol);
  conditionDiv.appendChild(removeButtonRow);
  
  // Add to container
  conditionsContainer.appendChild(conditionDiv);
  
  // Initialize selects
  if (existingCondition) {
    typeSelect.value = existingCondition.type || conditionTypes[0].id;
    handleConditionTypeChange(typeSelect);
    
    // Set operator
    const operatorSelectElement = conditionDiv.querySelector('.condition-operator');
    if (operatorSelectElement) {
      operatorSelectElement.value = existingCondition.operator || '';
    }
    
    // Set asset and timeframe if applicable
    if (existingCondition.asset) {
      const assetSelectElement = conditionDiv.querySelector('.condition-asset');
      if (assetSelectElement) {
        assetSelectElement.value = existingCondition.asset;
      }
    }
    
    if (existingCondition.timeframe) {
      const timeframeSelectElement = conditionDiv.querySelector('.condition-timeframe');
      if (timeframeSelectElement) {
        timeframeSelectElement.value = existingCondition.timeframe;
      }
    }
    
    // Set value
    const valueInputElement = conditionDiv.querySelector('.condition-value');
    if (valueInputElement && existingCondition.value !== undefined) {
      valueInputElement.value = existingCondition.value;
    }
  } else {
    // Initialize with defaults
    typeSelect.value = conditionTypes[0].id;
    handleConditionTypeChange(typeSelect);
  }
}

/**
 * Handle condition type change and update form elements
 */
function handleConditionTypeChange(selectElement) {
  const conditionId = selectElement.dataset.id;
  const conditionDiv = document.querySelector(`.condition-item[data-id="${conditionId}"]`);
  const selectedType = selectElement.value;
  const conditionType = conditionTypes.find(t => t.id === selectedType);
  
  if (!conditionType) return;
  
  // Get related elements
  const operatorSelect = conditionDiv.querySelector('.condition-operator');
  const assetContainer = conditionDiv.querySelector('.asset-container');
  const timeframeContainer = conditionDiv.querySelector('.timeframe-container');
  
  // Clear operator options
  operatorSelect.innerHTML = '';
  
  // Add applicable operators
  operators
    .filter(op => op.applicableTypes.includes(conditionType.dataType))
    .forEach(op => {
      const option = document.createElement('option');
      option.value = op.id;
      option.textContent = op.name;
      operatorSelect.appendChild(option);
    });
  
  // Show/hide asset and timeframe selectors
  assetContainer.style.display = conditionType.requiresAsset ? 'block' : 'none';
  timeframeContainer.style.display = conditionType.requiresTimeframe ? 'block' : 'none';
}

/**
 * Add a new action to the form
 */
function addAction(existingAction = null) {
  const actionId = 'action_' + Date.now() + Math.floor(Math.random() * 1000);
  const actionDiv = document.createElement('div');
  actionDiv.className = 'action-item mb-3 p-3 border rounded';
  actionDiv.dataset.id = actionId;
  
  // Create action form
  const typeRow = document.createElement('div');
  typeRow.className = 'row mb-2';
  
  // Type selector
  const typeCol = document.createElement('div');
  typeCol.className = 'col-md-12';
  const typeLabel = document.createElement('label');
  typeLabel.className = 'form-label';
  typeLabel.textContent = 'Action Type';
  const typeSelect = document.createElement('select');
  typeSelect.className = 'form-select action-type';
  typeSelect.dataset.id = actionId;
  typeSelect.addEventListener('change', (e) => handleActionTypeChange(e.target));
  
  // Add action type options
  actionTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    typeSelect.appendChild(option);
  });
  
  typeCol.appendChild(typeLabel);
  typeCol.appendChild(typeSelect);
  typeRow.appendChild(typeCol);
  actionDiv.appendChild(typeRow);
  
  // Value row - only shown for certain action types
  const valueRow = document.createElement('div');
  valueRow.className = 'row mb-2 action-value-container';
  valueRow.style.display = 'none'; // Hidden by default
  
  // Value field
  const valueCol = document.createElement('div');
  valueCol.className = 'col-md-6';
  const valueLabel = document.createElement('label');
  valueLabel.className = 'form-label';
  valueLabel.textContent = 'Value';
  const valueInput = document.createElement('input');
  valueInput.type = 'number';
  valueInput.className = 'form-control action-value';
  valueInput.dataset.id = actionId;
  valueInput.step = '0.01';
  
  valueCol.appendChild(valueLabel);
  valueCol.appendChild(valueInput);
  valueRow.appendChild(valueCol);
  
  // Value type selector
  const valueTypeCol = document.createElement('div');
  valueTypeCol.className = 'col-md-6';
  const valueTypeLabel = document.createElement('label');
  valueTypeLabel.className = 'form-label';
  valueTypeLabel.textContent = 'Value Type';
  const valueTypeSelect = document.createElement('select');
  valueTypeSelect.className = 'form-select action-value-type';
  valueTypeSelect.dataset.id = actionId;
  
  // Add value type options
  const option1 = document.createElement('option');
  option1.value = 'percent';
  option1.textContent = 'Percent';
  valueTypeSelect.appendChild(option1);
  
  const option2 = document.createElement('option');
  option2.value = 'absolute';
  option2.textContent = 'Absolute Value';
  valueTypeSelect.appendChild(option2);
  
  valueTypeCol.appendChild(valueTypeLabel);
  valueTypeCol.appendChild(valueTypeSelect);
  valueRow.appendChild(valueTypeCol);
  
  actionDiv.appendChild(valueRow);
  
  // Message row - only shown for send_alert action type
  const messageRow = document.createElement('div');
  messageRow.className = 'row mb-2 action-message-container';
  messageRow.style.display = 'none'; // Hidden by default
  
  // Message field
  const messageCol = document.createElement('div');
  messageCol.className = 'col-md-12';
  const messageLabel = document.createElement('label');
  messageLabel.className = 'form-label';
  messageLabel.textContent = 'Alert Message';
  const messageInput = document.createElement('textarea');
  messageInput.className = 'form-control action-message';
  messageInput.dataset.id = actionId;
  messageInput.rows = 2;
  
  messageCol.appendChild(messageLabel);
  messageCol.appendChild(messageInput);
  messageRow.appendChild(messageCol);
  
  actionDiv.appendChild(messageRow);
  
  // Remove button
  const removeButtonRow = document.createElement('div');
  removeButtonRow.className = 'row mt-2';
  const removeButtonCol = document.createElement('div');
  removeButtonCol.className = 'col-12 text-end';
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'btn btn-sm btn-outline-danger';
  removeButton.innerHTML = '<i class="fas fa-trash"></i> Remove';
  removeButton.addEventListener('click', () => actionDiv.remove());
  
  removeButtonCol.appendChild(removeButton);
  removeButtonRow.appendChild(removeButtonCol);
  actionDiv.appendChild(removeButtonRow);
  
  // Add to container
  actionsContainer.appendChild(actionDiv);
  
  // Initialize selects
  if (existingAction) {
    typeSelect.value = existingAction.type || actionTypes[0].id;
    handleActionTypeChange(typeSelect);
    
    // Set value and value type if applicable
    if (existingAction.type === 'adjust_position_size') {
      const valueInputElement = actionDiv.querySelector('.action-value');
      if (valueInputElement && existingAction.value !== undefined) {
        valueInputElement.value = existingAction.value;
      }
      
      const valueTypeSelectElement = actionDiv.querySelector('.action-value-type');
      if (valueTypeSelectElement && existingAction.valueType) {
        valueTypeSelectElement.value = existingAction.valueType;
      }
    }
    
    // Set message if applicable
    if (existingAction.type === 'send_alert') {
      const messageInputElement = actionDiv.querySelector('.action-message');
      if (messageInputElement && existingAction.message) {
        messageInputElement.value = existingAction.message;
      }
    }
  } else {
    // Initialize with defaults
    typeSelect.value = actionTypes[0].id;
    handleActionTypeChange(typeSelect);
  }
}

/**
 * Handle action type change and update form elements
 */
function handleActionTypeChange(selectElement) {
  const actionId = selectElement.dataset.id;
  const actionDiv = document.querySelector(`.action-item[data-id="${actionId}"]`);
  const selectedType = selectElement.value;
  
  // Get related containers
  const valueContainer = actionDiv.querySelector('.action-value-container');
  const messageContainer = actionDiv.querySelector('.action-message-container');
  
  // Show/hide based on action type
  if (selectedType === 'adjust_position_size') {
    valueContainer.style.display = 'flex';
    messageContainer.style.display = 'none';
  } else if (selectedType === 'send_alert') {
    valueContainer.style.display = 'none';
    messageContainer.style.display = 'flex';
  } else {
    valueContainer.style.display = 'none';
    messageContainer.style.display = 'none';
  }
}

/**
 * Save rule (create or update)
 */
async function saveRule() {
  try {
    // Get base rule data
    const ruleId = document.getElementById('ruleId').value;
    const ruleName = document.getElementById('ruleName').value.trim();
    const ruleActive = document.getElementById('ruleActive').checked;
    const limitType = document.getElementById('limitType').value;
    const limitCount = parseInt(document.getElementById('limitCount').value, 10);
    
    // Validate rule name
    if (!ruleName) {
      alert('Rule name is required');
      return;
    }
    
    // Collect conditions
    const conditions = [];
    document.querySelectorAll('.condition-item').forEach(conditionDiv => {
      const conditionId = conditionDiv.dataset.id;
      const type = conditionDiv.querySelector(`.condition-type[data-id="${conditionId}"]`).value;
      const operator = conditionDiv.querySelector(`.condition-operator[data-id="${conditionId}"]`).value;
      const value = parseFloat(conditionDiv.querySelector(`.condition-value[data-id="${conditionId}"]`).value);
      
      // Create condition object
      const condition = {
        type,
        operator,
        value,
        valueType: 'absolute', // Default
      };
      
      // Get condition type definition
      const conditionType = conditionTypes.find(t => t.id === type);
      if (conditionType) {
        condition.valueType = conditionType.dataType;
        
        // Add asset and timeframe if required
        if (conditionType.requiresAsset) {
          const assetSelect = conditionDiv.querySelector(`.condition-asset[data-id="${conditionId}"]`);
          condition.asset = assetSelect ? assetSelect.value : assets[0].id;
        }
        
        if (conditionType.requiresTimeframe) {
          const timeframeSelect = conditionDiv.querySelector(`.condition-timeframe[data-id="${conditionId}"]`);
          condition.timeframe = timeframeSelect ? timeframeSelect.value : timeframes[0].id;
        }
      }
      
      conditions.push(condition);
    });
    
    // Validate conditions
    if (conditions.length === 0) {
      alert('At least one condition is required');
      return;
    }
    
    // Collect actions
    const actions = [];
    document.querySelectorAll('.action-item').forEach(actionDiv => {
      const actionId = actionDiv.dataset.id;
      const type = actionDiv.querySelector(`.action-type[data-id="${actionId}"]`).value;
      
      // Create action object
      const action = { type };
      
      // Add type-specific fields
      if (type === 'adjust_position_size') {
        const valueInput = actionDiv.querySelector(`.action-value[data-id="${actionId}"]`);
        const valueTypeSelect = actionDiv.querySelector(`.action-value-type[data-id="${actionId}"]`);
        
        action.value = parseFloat(valueInput.value);
        action.valueType = valueTypeSelect.value;
      } else if (type === 'send_alert') {
        const messageInput = actionDiv.querySelector(`.action-message[data-id="${actionId}"]`);
        action.message = messageInput.value.trim();
      }
      
      actions.push(action);
    });
    
    // Validate actions
    if (actions.length === 0) {
      alert('At least one action is required');
      return;
    }
    
    // Create rule object
    const rule = {
      name: ruleName,
      active: ruleActive,
      conditions,
      actions,
      walletId: walletSelector.value || undefined,
    };
    
    // Add execution limit if specified
    if (limitType) {
      rule.executionLimit = {
        type: limitType,
        limit: limitCount
      };
    }
    
    // Save rule (create or update)
    let response;
    if (ruleId) {
      // Update existing rule
      response = await window.solarbotApi.updateRule(ruleId, rule);
      if (response.success) {
        showSuccessToast('Rule updated successfully');
      }
    } else {
      // Create new rule
      response = await window.solarbotApi.createRule(rule);
      if (response.success) {
        showSuccessToast('Rule created successfully');
      }
    }
    
    // Close modal and reload rules
    ruleModal.hide();
    await loadRules();
    
  } catch (error) {
    console.error('Error saving rule:', error);
    showErrorToast('Failed to save rule');
  }
}

/**
 * Delete a rule
 */
async function deleteRule(ruleId) {
  if (!confirm('Are you sure you want to delete this rule?')) {
    return;
  }
  
  try {
    const response = await window.solarbotApi.deleteRule(ruleId);
    
    if (response.success) {
      showSuccessToast('Rule deleted successfully');
      await loadRules();
    } else {
      showErrorToast('Failed to delete rule');
    }
  } catch (error) {
    console.error('Error deleting rule:', error);
    showErrorToast('Failed to delete rule');
  }
}

/**
 * Evaluate rules for the selected wallet
 */
async function evaluateRules() {
  try {
    const walletId = walletSelector.value;
    const evaluateBtn = document.getElementById('evaluateRulesBtn');
    
    // Disable button during evaluation
    evaluateBtn.disabled = true;
    evaluateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Evaluating...';
    
    const response = await window.solarbotApi.evaluateRules(walletId);
    
    // Re-enable button
    evaluateBtn.disabled = false;
    evaluateBtn.innerHTML = '<i class="fas fa-play"></i> Evaluate Rules';
    
    if (response.success) {
      const triggeredCount = response.triggeredRules ? response.triggeredRules.length : 0;
      showSuccessToast(`Evaluation complete. ${triggeredCount} rules triggered.`);
      
      // Reload rules to show updated last triggered info
      await loadRules();
    } else {
      showErrorToast('Rule evaluation failed');
    }
  } catch (error) {
    console.error('Error evaluating rules:', error);
    showErrorToast('Failed to evaluate rules');
    
    // Re-enable button
    const evaluateBtn = document.getElementById('evaluateRulesBtn');
    evaluateBtn.disabled = false;
    evaluateBtn.innerHTML = '<i class="fas fa-play"></i> Evaluate Rules';
  }
}

/**
 * View rule execution history
 */
async function viewRuleHistory(ruleId) {
  try {
    const response = await window.solarbotApi.getRuleHistory(ruleId);
    const historyTableBody = document.getElementById('historyTableBody');
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    
    // Clear existing data
    historyTableBody.innerHTML = '';
    
    const history = response.history || [];
    
    if (history.length === 0) {
      noHistoryMessage.style.display = 'block';
      historyTableBody.parentElement.style.display = 'none';
    } else {
      noHistoryMessage.style.display = 'none';
      historyTableBody.parentElement.style.display = 'table';
      
      // Add history rows
      history.forEach(execution => {
        const row = document.createElement('tr');
        
        // Date & Time
        const dateCell = document.createElement('td');
        const date = new Date(execution.timestamp);
        dateCell.textContent = date.toLocaleString();
        row.appendChild(dateCell);
        
        // Result
        const resultCell = document.createElement('td');
        resultCell.innerHTML = execution.success
          ? '<span class="badge bg-success">Success</span>'
          : '<span class="badge bg-danger">Failed</span>';
        row.appendChild(resultCell);
        
        // Account Balance
        const balanceCell = document.createElement('td');
        balanceCell.textContent = execution.contextSnapshot?.accountBalance || 'N/A';
        row.appendChild(balanceCell);
        
        // Daily PnL
        const pnlCell = document.createElement('td');
        if (execution.contextSnapshot?.dailyPnL !== undefined) {
          const pnl = execution.contextSnapshot.dailyPnL;
          pnlCell.textContent = `${pnl > 0 ? '+' : ''}${pnl}`;
          pnlCell.className = pnl >= 0 ? 'text-success' : 'text-danger';
        } else {
          pnlCell.textContent = 'N/A';
        }
        row.appendChild(pnlCell);
        
        historyTableBody.appendChild(row);
      });
    }
    
    // Show history modal
    historyModal.show();
    
  } catch (error) {
    console.error('Error loading rule history:', error);
    showErrorToast('Failed to load rule execution history');
  }
}

/**
 * Show success toast notification
 */
function showSuccessToast(message) {
  // You can implement a toast notification system here
  // For simplicity, we'll just use an alert for now
  alert(message);
}

/**
 * Show error toast notification
 */
function showErrorToast(message) {
  // You can implement a toast notification system here
  // For simplicity, we'll just use an alert for now
  alert('Error: ' + message);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', init);
