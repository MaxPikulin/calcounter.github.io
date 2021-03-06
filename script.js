// global vars
const mainWindow = document.getElementById('mainWindow');
const addRowBtn = document.getElementById('addRowBtn');
const totalCaloriesDiv = document.getElementById('totalCalories');
const totalWeightDiv = document.getElementById('totalWeight');
const caloriesInCent = document.getElementById('caloriesInCent');
const resetBtn = document.getElementById('resetWindow');
const insertWeightsBtn = document.getElementById('insertWeights');
const liveSearchDiv = document.getElementsByClassName('liveSearch')[0];
let recipeObject = {
  rowNumber: 0
};
let totalAutoWeight = '';
let savedProducts = JSON.parse(localStorage.getItem('calcounter')).savedProducts || {};

function storeData() {
  // TODO: Store fields data in object and save it to localstorage.
  localStorage.setItem('currentRecipe', JSON.stringify(recipeObject));
}

function saveRecipeObject(parent, itemName, calories, weight, result) {
  // TODO: save changes to object that represent all fields.
  recipeObject['rowId'+parent.dataset.rownumber] = {
    id: parent.dataset.rownumber,
    itemName,
    calories,
    weight,
    result
  };
  storeData();
}

function fillData() {
  // TODO: fetch data from localstorage and generate proper set of fields.
  // if localStorage empty - add first row and return
  if (!localStorage.getItem('currentRecipe')) {
    addRowHandler();
    return;
  }
  recipeObject = JSON.parse(localStorage.getItem('currentRecipe'));
  for (let row in recipeObject) {
    if (!row.startsWith('rowId')) continue;
    composeRow(recipeObject[row]);
  }
  totalWeightDiv.value = recipeObject.customWeight || '';
  calculateTotal();
}

function calculateTotal() {
  // TODO: get all row results, calculate total.
  const allResults = Array.from(document.getElementsByClassName('result'));
  totalCaloriesDiv.textContent = (allResults.reduce((a, v) => a + (+v.textContent), 0)).toFixed(0) || '0';
  calculateInCent();
}

function calculateAutoWeight() {
  let allWeights = Array.from(document.getElementsByClassName('weight'));
  totalAutoWeight = (allWeights.reduce((a, v) => a + calculateField(v), 0)).toFixed(0) || '0';
  // console.log(totalWeightDiv.value == totalAutoWeight);
  if (totalWeightDiv.value == totalAutoWeight) {
    insertWeightsBtn.disabled = true;
  } else {
    insertWeightsBtn.disabled = false;
  }
}
function calculateTotalWeight() {
  let allWeights = Array.from(document.getElementsByClassName('weight'));
  totalWeightDiv.value = (allWeights.reduce((a, v) => a + calculateField(v), 0)).toFixed(0) || '0';
  calculateAutoWeight();
  calculateInCent();
}

function calculateInCent() {
  const result = (+totalCaloriesDiv.textContent / calculateField(totalWeightDiv)) * 100;
  caloriesInCent.textContent = ((isNaN(result) || result == 'Infinity') ? 0 : result).toFixed(0);
}

function weightHandler(e) {
  recipeObject.customWeight = e.target.value;
  storeData();
  calculateInCent();
  calculateAutoWeight();
}

// helper func just to get rid of event argument and send right rowNumber
function addRowHandler() {
  changeHandler(composeRow());
}

function keyHandler(e) {
  const target = e.target;
  if (e.which == 13) {
    if (target.classList.value.includes('weight') && target.parentElement.nextSibling) {
      target.parentElement.nextSibling.firstElementChild.focus();
    } else if (target.classList.value.includes('weight')) {
      addRowHandler();
    }
    target.nextSibling.focus();
  }
  if (e.which == 228)
    return;
  if (e.which == 8) return;
  const field = target.classList.value;
  const key = e.key || e.data;

  if ((field == 'calories' && !('0123456789.'.includes(key))) || ((field == 'weight' && !('0123456789-+*/.'.includes(key))))) {
    e.preventDefault();
    return false;
  }
}

// helper function that compose row and insert data if available
function composeRow(rowObj = {}) {
  const {
    id = '',
      itemName = '',
      calories = '',
      weight = '',
      result = ''
  } = rowObj;
  let row = document.createElement('div');
  row.innerHTML = ` <div class="rows" data-rownumber="${id || recipeObject.rowNumber++}"><input class="itemName" value="${itemName}"><input class="calories" value="${calories}"><input class="weight" value="${weight}"><div class="result">${result}</div><button class="deleteRowBtn">X</button></div>`;
  row = row.firstElementChild;
  mainWindow.appendChild(row);
  changeHandler(row);
  row.firstElementChild.focus();
  return row;
}

function changeHandler(e) {
  // TODO: handle all change events on mainform, pass needed references to other functions (saveRecipeObject...)


  const parent = e.target ?
    e.target.parentElement :
    e;
  const itemName = parent.getElementsByClassName('itemName')[0];
  const calories = parent.getElementsByClassName('calories')[0];
  const weight = parent.getElementsByClassName('weight')[0];
  const result = parent.getElementsByClassName('result')[0];
  // calculate result (+sign to convert string to int)
  const rowSum = +calculateField(calories) * +calculateField(weight) / 100;
  result.textContent = rowSum.toFixed(2);
  // result.textContent = rowSum > 0 ?
  //   rowSum.toFixed(2) :
  //   '';
  calculateTotal();
  calculateAutoWeight();
  // TODO: here maybe pass all elements or values to saveRecipeObject to store.
  saveRecipeObject(parent, itemName.value, calories.value, weight.value, result.textContent);
  if (itemName.value) {
    liveSearch(itemName);
  }
}

function clickHandler(e) {
  // if DELETE row
  if (e.target.classList.contains('deleteRowBtn')) {
    delete recipeObject['rowId'+e.target.parentElement.dataset.rownumber];
    storeData();
    e.target.parentElement.remove();
    calculateTotal();
  }
}

function calculateField(field, signs, numbers) {
  const fieldValue = field.value || field.textContent;
  if (!signs) {
    signs = fieldValue.replace(/[^-+*/]/g, '').split('');
    numbers = fieldValue.split(/[^\d.]/).map(v => v == '.' ? 0 : Number(v));
  }
  if (signs.length > 0 && numbers[numbers.length - 1] == '') {
    field.parentElement.classList.add('nudge');
    return numbers[0];
  } else {
    field.parentElement.classList.remove('nudge');
  }
  if (signs.length == 0) {
    return numbers[0];
  }
  let result = {
    '+': function(a, b) {
      return a + b;
    },
    '-': function(a, b) {
      return a - b;
    },
    '*': function(a, b) {
      return a * b;
    },
    '/': function(a, b) {
      return a / b;
    },
  }[signs.shift()](numbers.shift(), numbers.shift());
  if (signs.length) {
    numbers.unshift(result);
    return (calculateField(field, signs, numbers));

  } else {
    // console.log(result, signs, numbers);
    return result;
  }
}

function resetWindow() {
  localStorage.removeItem('currentRecipe');
  mainWindow.innerHTML = '';
  recipeObject = {
    rowNumber: 0
  };
  fillData();
}

// Test live search in product name field.
function liveSearch(search) {
  // console.log(search.value);
  let html = '';
  for (let item in savedProducts) {
    if (item.includes(search.value)) {
      console.log('Gotcha: ' + item);
      html += `<li>${item} ${savedProducts[item]}</li>`;
    }
  }
  liveSearchDiv.innerHTML = html;
}


// restore data from localStorage onload (or if empty, add new row)
fillData();

// event handlers
mainWindow.addEventListener('keydown', keyHandler, true);
mainWindow.addEventListener('paste', keyHandler, true);
mainWindow.addEventListener('click', clickHandler, true);
mainWindow.addEventListener('keyup', changeHandler, true);
mainWindow.addEventListener('change', changeHandler, true);
addRowBtn.addEventListener('click', addRowHandler);
resetBtn.addEventListener('click', resetWindow);
totalWeightDiv.addEventListener('keyup', weightHandler);
totalWeightDiv.addEventListener('change', weightHandler);
insertWeightsBtn.addEventListener('click', calculateTotalWeight);
