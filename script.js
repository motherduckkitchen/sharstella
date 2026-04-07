const ingredientsBody = document.getElementById('ingredientsBody');
const ingredientRowTemplate = document.getElementById('ingredientRowTemplate');
const fileLoader = document.getElementById('fileLoader');

const fields = {
  recipeName: document.getElementById('recipeName'),
  recipeType: document.getElementById('recipeType'),
  servings: document.getElementById('servings'),
  yieldUnit: document.getElementById('yieldUnit'),
  method: document.getElementById('method'),
  gstPercent: document.getElementById('gstPercent'),
  sellingPrice: document.getElementById('sellingPrice'),
  totalBatchCost: document.getElementById('totalBatchCost'),
  batchCostIncGst: document.getElementById('batchCostIncGst'),
  costPerServe: document.getElementById('costPerServe'),
  grossProfitPerServe: document.getElementById('grossProfitPerServe'),
  foodCostPercent: document.getElementById('foodCostPercent'),
  markupPercent: document.getElementById('markupPercent'),
  recipeStatus: document.getElementById('recipeStatus')
};

let recipeFolderHandle = null;
const STORAGE_KEY = 'stellarossa-costing-template';

function money(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function normaliseUnitValue(value, unit) {
  const amount = Number(value) || 0;
  switch (unit) {
    case 'kg': return amount * 1000;
    case 'l': return amount * 1000;
    default: return amount;
  }
}

function unitsCompatible(a, b) {
  const weight = ['g', 'kg'];
  const volume = ['ml', 'l'];
  if (a === b) return true;
  if (weight.includes(a) && weight.includes(b)) return true;
  if (volume.includes(a) && volume.includes(b)) return true;
  return false;
}

function getRowData(row) {
  const purchaseQty = row.querySelector('.qty-purchased').value;
  const purchaseUnit = row.querySelector('.purchase-unit').value;
  const costGoods = row.querySelector('.cost-goods').value;
  const qtyUsed = row.querySelector('.qty-used').value;
  const recipeUnit = row.querySelector('.recipe-unit').value;

  let rowCost = 0;
  if (unitsCompatible(purchaseUnit, recipeUnit)) {
    const purchased = normaliseUnitValue(purchaseQty, purchaseUnit);
    const used = normaliseUnitValue(qtyUsed, recipeUnit);
    const cost = Number(costGoods) || 0;
    if (purchased > 0) {
      rowCost = (used / purchased) * cost;
    }
  } else if ((Number(purchaseQty) || 0) > 0) {
    rowCost = ((Number(qtyUsed) || 0) / (Number(purchaseQty) || 1)) * (Number(costGoods) || 0);
  }

  return {
    ingredientName: row.querySelector('.ingredient-name').value,
    qtyPurchased: Number(purchaseQty) || 0,
    purchaseUnit,
    costGoods: Number(costGoods) || 0,
    qtyUsed: Number(qtyUsed) || 0,
    recipeUnit,
    rowCost
  };
}

function updateTotals() {
  const rows = [...ingredientsBody.querySelectorAll('tr')];
  const items = rows.map(getRowData);
  let total = 0;

  rows.forEach((row, index) => {
    const cost = items[index].rowCost;
    row.querySelector('.row-total').textContent = money(cost);
    total += cost;
  });

  const servings = Math.max(Number(fields.servings.value) || 1, 1);
  const gst = Number(fields.gstPercent.value) || 0;
  const sellingPrice = Number(fields.sellingPrice.value) || 0;

  const totalIncGst = total * (1 + gst / 100);
  const perServe = total / servings;
  const profit = sellingPrice - perServe;
  const foodCost = sellingPrice > 0 ? (perServe / sellingPrice) * 100 : 0;
  const markup = perServe > 0 ? ((sellingPrice - perServe) / perServe) * 100 : 0;

  fields.totalBatchCost.textContent = money(total);
  fields.batchCostIncGst.textContent = money(totalIncGst);
  fields.costPerServe.textContent = money(perServe);
  fields.grossProfitPerServe.textContent = money(profit);
  fields.foodCostPercent.textContent = `${foodCost.toFixed(2)}%`;
  fields.markupPercent.textContent = `${markup.toFixed(2)}%`;

  fields.recipeStatus.classList.remove('status-good', 'status-ok', 'status-bad');
  if (sellingPrice <= 0) {
    fields.recipeStatus.textContent = 'Needs Review';
    fields.recipeStatus.classList.add('status-ok');
  } else if (foodCost <= 30) {
    fields.recipeStatus.textContent = 'Good';
    fields.recipeStatus.classList.add('status-good');
  } else if (foodCost <= 40) {
    fields.recipeStatus.textContent = 'Check Price';
    fields.recipeStatus.classList.add('status-ok');
  } else {
    fields.recipeStatus.textContent = 'Too High';
    fields.recipeStatus.classList.add('status-bad');
  }

  saveToLocalStorage();
}

function addIngredientRow(data = {}) {
  const clone = ingredientRowTemplate.content.cloneNode(true);
  const row = clone.querySelector('tr');

  row.querySelector('.ingredient-name').value = data.ingredientName || '';
  row.querySelector('.qty-purchased').value = data.qtyPurchased ?? '';
  row.querySelector('.purchase-unit').value = data.purchaseUnit || 'g';
  row.querySelector('.cost-goods').value = data.costGoods ?? '';
  row.querySelector('.qty-used').value = data.qtyUsed ?? '';
  row.querySelector('.recipe-unit').value = data.recipeUnit || 'g';

  row.addEventListener('input', updateTotals);
  row.addEventListener('change', updateTotals);
  row.querySelector('.delete-row').addEventListener('click', () => {
    row.remove();
    if (!ingredientsBody.children.length) addIngredientRow();
    updateTotals();
  });

  ingredientsBody.appendChild(row);
  updateTotals();
}

function getRecipeData() {
  return {
    recipeName: fields.recipeName.value.trim(),
    recipeType: fields.recipeType.value,
    servings: Number(fields.servings.value) || 1,
    yieldUnit: fields.yieldUnit.value,
    method: fields.method.value,
    gstPercent: Number(fields.gstPercent.value) || 0,
    sellingPrice: Number(fields.sellingPrice.value) || 0,
    ingredients: [...ingredientsBody.querySelectorAll('tr')].map(getRowData),
    savedAt: new Date().toISOString()
  };
}

function fillRecipe(data) {
  fields.recipeName.value = data.recipeName || '';
  fields.recipeType.value = data.recipeType || 'Food';
  fields.servings.value = data.servings || 1;
  fields.yieldUnit.value = data.yieldUnit || 'serve';
  fields.method.value = data.method || '';
  fields.gstPercent.value = data.gstPercent ?? 10;
  fields.sellingPrice.value = data.sellingPrice ?? 0;

  ingredientsBody.innerHTML = '';
  if (Array.isArray(data.ingredients) && data.ingredients.length) {
    data.ingredients.forEach(addIngredientRow);
  } else {
    addIngredientRow();
  }
  updateTotals();
}

function safeFileName(name) {
  return (name || 'recipe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'recipe';
}

async function saveRecipeFile() {
  const recipe = getRecipeData();
  const fileName = `${safeFileName(recipe.recipeName || recipe.recipeType)}.json`;
  const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' });

  if (recipeFolderHandle) {
    try {
      const fileHandle = await recipeFolderHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      alert(`Recipe saved to selected folder as ${fileName}`);
      return;
    } catch (error) {
      console.error(error);
      alert('Could not save directly to the folder. Downloading file instead.');
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function chooseRecipeFolder() {
  if (!('showDirectoryPicker' in window)) {
    alert('Folder saving is not supported in this browser. The recipe button will still download files normally.');
    return;
  }

  try {
    recipeFolderHandle = await window.showDirectoryPicker();
    alert('Recipe folder selected. Recipe files can now save straight into that folder.');
  } catch (error) {
    console.log('Folder choice cancelled or failed', error);
  }
}

function clearForm() {
  if (!confirm('Clear this recipe and start a new one?')) return;
  localStorage.removeItem(STORAGE_KEY);
  fillRecipe({
    recipeName: '',
    recipeType: 'Food',
    servings: 1,
    yieldUnit: 'serve',
    method: '',
    gstPercent: 10,
    sellingPrice: 0,
    ingredients: [{}]
  });
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getRecipeData()));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    addIngredientRow();
    return;
  }

  try {
    fillRecipe(JSON.parse(saved));
  } catch {
    addIngredientRow();
  }
}

function loadFileIntoForm(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);
      fillRecipe(data);
    } catch {
      alert('That file could not be loaded. Please choose a recipe JSON file.');
    }
  };
  reader.readAsText(file);
}

document.getElementById('addIngredientBtn').addEventListener('click', () => addIngredientRow());
document.getElementById('printBtn').addEventListener('click', () => window.print());
document.getElementById('downloadBtn').addEventListener('click', saveRecipeFile);
document.getElementById('loadBtn').addEventListener('click', () => fileLoader.click());
document.getElementById('clearBtn').addEventListener('click', clearForm);
document.getElementById('chooseFolderBtn').addEventListener('click', chooseRecipeFolder);
document.getElementById('newRecipeBtn').addEventListener('click', clearForm);
fileLoader.addEventListener('change', event => loadFileIntoForm(event.target.files[0]));

Object.values(fields).forEach(field => {
  if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
    field.addEventListener('input', updateTotals);
    field.addEventListener('change', updateTotals);
  }
});

loadFromLocalStorage();
updateTotals();
